import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Animated, Dimensions, Platform, Image, ImageBackground } from 'react-native';
import { Card, Button, FAB, Avatar, Divider } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { useTask } from '../../context/TaskContext';
import { MaterialCommunityIcons, MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { Task, Meeting, UserRole, TaskStatus, TaskPriority } from '../../types/index';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { ThemedContainer } from '@/components/ThemedContainer';
import Colors from '@/constants/Colors';
import { TaskSummary } from '@/components/tasks/TaskSummary';
import { TeamSummary } from '@/components/team/TeamSummary';
import RecentChats from '@/components/home/RecentChats';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';

// Временные данные сотрудников для демо
const DEMO_EMPLOYEES = [
  { 
    id: '1', 
    name: 'Иванов Иван', 
    position: 'Руководитель проекта', 
    avatarUrl: 'https://ui-avatars.com/api/?name=Ivan+Ivanov&background=0D8ABC&color=fff',
    isOnline: true,
    activeTasks: 5,
    projects: 2,
    efficiency: '89%'
  },
  { 
    id: '2', 
    name: 'Петрова Елена', 
    position: 'Ведущий дизайнер', 
    avatarUrl: 'https://ui-avatars.com/api/?name=Elena+Petrova&background=2E7D32&color=fff',
    isOnline: true,
    activeTasks: 3,
    projects: 4,
    efficiency: '94%'
  },
  { 
    id: '3', 
    name: 'Сидоров Алексей', 
    position: 'Разработчик', 
    avatarUrl: 'https://ui-avatars.com/api/?name=Alexey+Sidorov&background=C62828&color=fff',
    isOnline: false,
    activeTasks: 7,
    projects: 1,
    efficiency: '78%'
  },
];

// Временные примеры митингов
const DEMO_MEETINGS: Meeting[] = [
  {
    id: '1',
    title: 'Обсуждение нового проекта',
    description: 'Встреча команды для обсуждения стратегии разработки нового проекта',
    startTime: new Date(Date.now() + 86400000), // завтра
    endTime: new Date(Date.now() + 86400000 + 7200000), // завтра + 2 часа
    organizer: '2',
    participants: ['1', '2', '3'],
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: '2',
    title: 'Ежедневный статус-митинг',
    description: 'Короткая встреча для обсуждения текущего прогресса задач',
    startTime: new Date(Date.now() + 3600000), // через час
    endTime: new Date(Date.now() + 3600000 + 1800000), // через час + 30 минут
    organizer: '2',
    participants: ['2', '3'],
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 43200000),
  },
];

// Функция для создания волнистого фона
const renderWavyBackground = (isDark: boolean) => {
  return (
    <View style={styles.backgroundContainer}>
      <LinearGradient 
        colors={isDark 
          ? ['#191932', '#0D0D14', '#0D0D11'] 
          : ['#f0f4ff', '#f0f4fd', '#f8f9ff']}
        style={styles.meshBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[
          styles.wavyPattern, 
          { backgroundColor: isDark ? 'rgba(30, 30, 40, 0.3)' : 'rgba(255, 255, 255, 0.25)' }
        ]} />
      </LinearGradient>
    </View>
  );
};

// Главный компонент экрана
export default function HomeScreen() {
  const { user } = useAuth();
  const { tasks, refreshTasks } = useTask();
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { isDark } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { width, height } = Dimensions.get('window');
  
  // Состояние для эффекта пульсации
  const [pulseAnim] = useState(new Animated.Value(0));
  const [isAddButtonPressed, setIsAddButtonPressed] = useState(false);

  // Анимации для элементов
  const fadeAnims = {
    header: useRef(new Animated.Value(0)).current,
    content: useRef(new Animated.Value(0)).current,
    fab: useRef(new Animated.Value(0)).current
  };

  const scaleAnims = {
    header: useRef(new Animated.Value(0.95)).current,
    content: useRef(new Animated.Value(0.95)).current,
    fab: useRef(new Animated.Value(0.6)).current
  };

  // Анимация пульсации
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true
        })
      ])
    );
    
    pulse.start();
    
    return () => pulse.stop();
  }, []);

  // Анимация при скролле
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [Platform.OS === 'ios' ? 150 : 130, Platform.OS === 'ios' ? 90 : 80],
    extrapolate: 'clamp'
  });

  const headerTitleSize = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [28, 22],
    extrapolate: 'clamp'
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [1, 0.8, 0],
    extrapolate: 'clamp'
  });

  const dateOpacity = scrollY.interpolate({
    inputRange: [0, 40, 70],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp'
  });
  
  // Параллакс эффект для фона
  const backgroundTranslateY = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [0, -100],
    extrapolate: 'clamp'
  });

  // Анимация появления элементов
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnims.header, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnims.header, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(fadeAnims.content, {
        toValue: 1,
        duration: 1000,
        delay: 300,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnims.content, {
        toValue: 1,
        duration: 1000,
        delay: 300,
        useNativeDriver: true
      }),
      Animated.timing(fadeAnims.fab, {
        toValue: 1,
        duration: 600,
        delay: 800,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnims.fab, {
        toValue: 1,
        duration: 800,
        delay: 800,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  useEffect(() => {
    loadData();
  }, [tasks]);

  const loadData = () => {
    // Загрузка встреч остается без изменений
    
    // Загружаем задачи из контекста
    let userTasks = [...tasks];
    
    // Фильтруем задачи для обычного пользователя
    if (user?.role === UserRole.EMPLOYEE) {
      userTasks = userTasks.filter(task => task.assignedTo === user.id);
    }
    
    // Получаем 3 актуальные задачи (не выполненные и не отмененные)
    const activeTasks = userTasks.filter(
      task => task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED
    );
    
    // Сортируем по сроку (ближайшие сначала)
    activeTasks.sort((a, b) => {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
    
    setUpcomingTasks(activeTasks.slice(0, 3));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTasks();
    // Обновление встреч остается без изменений
    setRefreshing(false);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd MMMM', { locale: ru });
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'HH:mm', { locale: ru });
  };

  const handleViewMeeting = (meetingId: string) => {
    router.push({
      pathname: '/(tabs)/meetings',
      params: { meetingId }
    });
  };

  const handleViewTask = (taskId: string) => {
    router.push({
      pathname: '/(tabs)/tasks',
      params: { taskId }
    });
  };

  const handleAddTask = () => {
    // Анимация нажатия
    setIsAddButtonPressed(true);
    setTimeout(() => {
      setIsAddButtonPressed(false);
      router.push('/(tabs)/tasks/create');
    }, 300);
  };

  const navigateToChats = () => {
    router.push('/(tabs)/chat/');
  };

  const navigateTo = (route: string) => {
    router.push(route);
  };

  // Пульсирующая тень для FAB
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2]
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0]
  });

  return (
    <ThemedContainer style={[styles.container, {backgroundColor: isDark ? '#0D0D11' : '#f0f4fd'}]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Анимированный фон */}
      <Animated.View 
        style={[
          styles.backgroundContainer,
          {
            transform: [{ translateY: backgroundTranslateY }]
          }
        ]}
      >
        {renderWavyBackground(isDark)}
      </Animated.View>
      
      {/* Анимированная шапка */}
      <Animated.View 
        style={[
          styles.headerContainer, 
          { 
            height: headerHeight,
            backgroundColor: isDark ? 'rgba(20, 20, 28, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          }
        ]}
      >
        <BlurView
          intensity={isDark ? 40 : 50}
          tint={isDark ? 'dark' : 'light'}
          style={styles.blurView}
        >
          <LinearGradient
            colors={isDark 
              ? ['rgba(97, 97, 255, 0.2)', 'rgba(79, 70, 229, 0.05)'] 
              : ['rgba(97, 97, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animated.View 
              style={[
                styles.headerContent,
                {
                  opacity: fadeAnims.header,
                  transform: [{ scale: scaleAnims.header }]
                }
              ]}
            >
              <View style={styles.headerMain}>
                <View>
                  <Animated.Text 
                    style={[
                      styles.headerTitle, 
                      { 
                        color: isDark ? '#FFFFFF' : '#1E293B',
                        fontSize: headerTitleSize
                      }
                    ]}
                  >
                    Рабочая панель
                  </Animated.Text>
                  <Animated.Text 
                    style={[
                      styles.headerDate, 
                      { 
                        color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(30, 41, 59, 0.7)',
                        opacity: dateOpacity
                      }
                    ]}
                  >
                    {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </Animated.Text>
                </View>

                <TouchableOpacity 
                  onPress={() => navigateTo('/profile')}
                  style={styles.avatarContainer}
                >
                  {user?.avatarUrl ? (
                    <Avatar.Image 
                      source={{ uri: user.avatarUrl }} 
                      size={48} 
                      style={styles.avatar}
                    />
                  ) : (
                    <Avatar.Text 
                      label={user?.name?.substring(0, 2) || 'U'} 
                      size={48} 
                      style={styles.avatar}
                      color="#FFF"
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                  )}
                  
                  {/* Индикатор онлайн-статуса */}
                  <View style={styles.statusIndicator} />
                </TouchableOpacity>
              </View>
              
              {/* Время в правом верхнем углу */}
              <Animated.Text 
                style={[
                  styles.headerTime,
                  {
                    opacity: dateOpacity,
                    color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 41, 59, 0.9)',
                  }
                ]}
              >
                {format(new Date(), 'HH:mm', { locale: ru })}
              </Animated.Text>
            </Animated.View>
          </LinearGradient>
        </BlurView>
      </Animated.View>

      {/* Основной контент */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <Animated.View 
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnims.content,
              transform: [{ scale: scaleAnims.content }]
            }
          ]}
        >
          {/* Секция задач */}
          <Animated.View
            style={[
              styles.sectionWrapper,
              {
                opacity: fadeAnims.content,
                transform: [{ scale: scaleAnims.content }]
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <LinearGradient
                  colors={isDark ? ['#4F46E5', '#6366F1'] : ['#6366F1', '#818CF8']}
                  style={styles.iconBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialIcons name="assignment" size={18} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
                  Задачи
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => navigateTo('/(tabs)/tasks')}
              >
                <Text style={[styles.viewAllText, { color: isDark ? '#818CF8' : '#4F46E5' }]}>
                  Все задачи
                </Text>
                <MaterialIcons name="chevron-right" size={16} color={isDark ? '#818CF8' : '#4F46E5'} />
              </TouchableOpacity>
            </View>
            
            <View style={[
              styles.sectionCard,
              { 
                backgroundColor: isDark ? 'rgba(30, 30, 40, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                borderColor: isDark ? 'rgba(80, 70, 229, 0.2)' : 'rgba(99, 102, 241, 0.2)'
              }
            ]}>
              <BlurView
                intensity={isDark ? 20 : 40}
                tint={isDark ? 'dark' : 'light'}
                style={styles.blurView}
              >
                <View style={styles.glassContent}>
                  <TaskSummary tasks={upcomingTasks} onViewTask={handleViewTask} />
                </View>
              </BlurView>
            </View>
          </Animated.View>
          
          {/* Секция команды */}
          <Animated.View
            style={[
              styles.sectionWrapper,
              {
                opacity: fadeAnims.content,
                transform: [{ scale: scaleAnims.content }]
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <LinearGradient
                  colors={isDark ? ['#059669', '#10B981'] : ['#10B981', '#34D399']}
                  style={styles.iconBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialIcons name="people" size={18} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
                  Команда
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => navigateTo('/(tabs)/employees')}
              >
                <Text style={[styles.viewAllText, { color: isDark ? '#10B981' : '#059669' }]}>
                  Все сотрудники
                </Text>
                <MaterialIcons name="chevron-right" size={16} color={isDark ? '#10B981' : '#059669'} />
              </TouchableOpacity>
            </View>
            
            <View style={[
              styles.sectionCard,
              { 
                backgroundColor: isDark ? 'rgba(30, 30, 40, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                borderColor: isDark ? 'rgba(5, 150, 105, 0.2)' : 'rgba(16, 185, 129, 0.2)'
              }
            ]}>
              <BlurView
                intensity={isDark ? 20 : 40}
                tint={isDark ? 'dark' : 'light'}
                style={styles.blurView}
              >
                <View style={styles.glassContent}>
                  <TeamSummary employees={DEMO_EMPLOYEES} />
                </View>
              </BlurView>
            </View>
          </Animated.View>
          
          {/* Секция чатов */}
          <Animated.View
            style={[
              styles.sectionWrapper,
              {
                opacity: fadeAnims.content,
                transform: [{ scale: scaleAnims.content }]
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <LinearGradient
                  colors={isDark ? ['#DB2777', '#EC4899'] : ['#EC4899', '#F472B6']}
                  style={styles.iconBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialIcons name="chat" size={18} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
                  Сообщения
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={navigateToChats}
              >
                <Text style={[styles.viewAllText, { color: isDark ? '#EC4899' : '#DB2777' }]}>
                  Все сообщения
                </Text>
                <MaterialIcons name="chevron-right" size={16} color={isDark ? '#EC4899' : '#DB2777'} />
              </TouchableOpacity>
            </View>
            
            <View style={[
              styles.sectionCard,
              { 
                backgroundColor: isDark ? 'rgba(30, 30, 40, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                borderColor: isDark ? 'rgba(219, 39, 119, 0.2)' : 'rgba(236, 72, 153, 0.2)'
              }
            ]}>
              <BlurView
                intensity={isDark ? 20 : 40}
                tint={isDark ? 'dark' : 'light'}
                style={styles.blurView}
              >
                <View style={styles.glassContent}>
                  <RecentChats onPress={navigateToChats} />
                </View>
              </BlurView>
            </View>
          </Animated.View>
        </Animated.View>
      </Animated.ScrollView>

      {/* Плавающая кнопка для добавления задачи */}
      <Animated.View
        style={[
          styles.floatingButtonContainer,
          {
            opacity: fadeAnims.fab,
            transform: [{ scale: scaleAnims.fab }]
          }
        ]}
      >
        {/* Пульсирующий эффект */}
        <Animated.View
          style={[
            styles.pulseShadow,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity
            }
          ]}
        />
        
        <TouchableOpacity
          style={[
            styles.addButton,
            isAddButtonPressed && styles.addButtonPressed
          ]}
          onPress={handleAddTask}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#4F46E5', '#6366F1', '#818CF8']}
            style={styles.addButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="plus" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </ThemedContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    height: Dimensions.get('window').height * 1.2,
  },
  meshBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wavyPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  headerContainer: {
    width: '100%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 10,
  },
  blurView: {
    flex: 1,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  headerMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerTime: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 36,
    right: 20,
    fontSize: 16,
    fontWeight: '600',
  },
  avatarContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: {
    backgroundColor: '#4F46E5',
  },
  statusIndicator: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFF',
    bottom: 0,
    right: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  contentContainer: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sectionWrapper: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  sectionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  glassContent: {
    flex: 1,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseShadow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F46E5',
  },
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  addButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
