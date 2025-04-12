import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Animated } from 'react-native';
import { Card, Button, FAB, Avatar } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { useTask } from '../../context/TaskContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Task, Meeting, UserRole, TaskStatus, TaskPriority } from '../../types/index';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { ThemedContainer } from '@/components/ThemedContainer';
import { Colors } from '@/constants/Colors';
import { TaskSummary } from '@/components/tasks/TaskSummary';
import { TeamSummary } from '@/components/team/TeamSummary';
import { RecentChats } from '@/components/home/RecentChats';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';

// Временные данные сотрудников для демо
const DEMO_EMPLOYEES = [
  { id: '1', name: 'Иванов Иван', position: 'Руководитель проекта', avatarUrl: 'https://ui-avatars.com/api/?name=Ivan+Ivanov&background=0D8ABC&color=fff' },
  { id: '2', name: 'Петрова Елена', position: 'Ведущий дизайнер', avatarUrl: 'https://ui-avatars.com/api/?name=Elena+Petrova&background=2E7D32&color=fff' },
  { id: '3', name: 'Сидоров Алексей', position: 'Разработчик', avatarUrl: 'https://ui-avatars.com/api/?name=Alexey+Sidorov&background=C62828&color=fff' },
  { id: '4', name: 'Козлова Мария', position: 'Тестировщик', avatarUrl: 'https://ui-avatars.com/api/?name=Maria+Kozlova&background=6A1B9A&color=fff' },
  { id: '5', name: 'Николаев Дмитрий', position: 'Бизнес-аналитик', avatarUrl: 'https://ui-avatars.com/api/?name=Dmitry+Nikolaev&background=00695C&color=fff' },
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

export default function HomeScreen() {
  const { user } = useAuth();
  const { tasks, refreshTasks } = useTask();
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { isDark } = useTheme();

  // Анимированные значения для элементов
  const [fadeAnims] = useState({
    header: new Animated.Value(0),
    welcomeCard: new Animated.Value(0),
    taskSummary: new Animated.Value(0),
    teamSummary: new Animated.Value(0),
    recentChats: new Animated.Value(0)
  });

  // Анимация появления элементов
  useEffect(() => {
    const animations = Object.values(fadeAnims).map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: 100 * index,
        useNativeDriver: true
      })
    );
    
    Animated.stagger(100, animations).start();
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
    router.push('/(tabs)/tasks/create');
  };

  const handleGoToMeetings = () => {
    router.push('/(tabs)/meetings');
  };

  const handleGoToTasks = () => {
    router.push('/(tabs)/tasks');
  };

  const handleGoToProfile = () => {
    router.push('/(tabs)/profile');
  };

  // Функция для получения данных сотрудника по ID
  const getEmployeeById = (employeeId: string) => {
    return DEMO_EMPLOYEES.find(employee => employee.id === employeeId) || 
      { id: employeeId, name: 'Неизвестный сотрудник', position: 'Не указана', avatarUrl: 'https://ui-avatars.com/api/?name=Unknown&background=9E9E9E&color=fff' };
  };

  const navigateTo = (route: string) => {
    router.push(route);
  };

  return (
    <ThemedContainer style={[styles.container, {backgroundColor: isDark ? '#1c1c1e' : '#f8f8fa'}]}>
      <Animated.View style={{opacity: fadeAnims.header}}>
        <LinearGradient
          colors={isDark ? ['#2c2c2e', '#1c1c1e'] : ['#ffffff', '#f8f8fa']}
          style={styles.header}
        >
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, {color: isDark ? '#ffffff' : '#000000'}]}>
              Рабочая панель
            </Text>
            <Text style={[styles.headerSubtitle, {color: isDark ? '#9a9a9a' : '#666666'}]}>
              {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigateTo('/profile')}
          >
            <LinearGradient
              colors={isDark ? ['#3a3a3c', '#2c2c2e'] : ['#ffffff', '#f2f2f7']}
              style={styles.profileButtonGradient}
            >
              <FontAwesome name="user" size={18} color={isDark ? '#ffffff' : '#000000'} />
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.cardContainer, 
            {
              opacity: fadeAnims.welcomeCard,
              transform: [{
                translateY: fadeAnims.welcomeCard.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }]
            }
          ]}
        >
          <LinearGradient
            colors={isDark ? ['#0a84ff', '#0066cc'] : ['#007aff', '#0062cc']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.welcomeCard}
          >
            <View>
              <Text style={styles.welcomeCardTitle}>
                Привет, {user?.name || 'Пользователь'}!
              </Text>
              <Text style={styles.welcomeCardSubtitle}>
                {user?.position || 'Добро пожаловать'}
              </Text>
            </View>
            <View style={styles.welcomeCardStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>7</Text>
                <Text style={styles.statLabel}>активных задач</Text>
              </View>
              <View style={styles.statDivider}></View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>85%</Text>
                <Text style={styles.statLabel}>эффективность</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.sectionContainer,
            {
              opacity: fadeAnims.taskSummary,
              transform: [{
                translateY: fadeAnims.taskSummary.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <LinearGradient
                colors={isDark ? ['#ff9500', '#ff6000'] : ['#ff9500', '#ff6000']}
                style={styles.sectionIcon}
              >
                <FontAwesome name="tasks" size={18} color="#ffffff" />
              </LinearGradient>
              <Text style={[styles.sectionTitle, {color: isDark ? '#ffffff' : '#000000'}]}>
                Задачи
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigateTo('/tasks')}
              style={styles.seeAllButton}
            >
              <Text style={[styles.seeAllText, {color: isDark ? '#0a84ff' : '#007aff'}]}>
                Все задачи
              </Text>
              <FontAwesome name="angle-right" size={16} color={isDark ? '#0a84ff' : '#007aff'} />
            </TouchableOpacity>
          </View>
          <TaskSummary />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.sectionContainer,
            {
              opacity: fadeAnims.teamSummary,
              transform: [{
                translateY: fadeAnims.teamSummary.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <LinearGradient
                colors={isDark ? ['#5e5ce6', '#4b49b7'] : ['#5e5ce6', '#4b49b7']}
                style={styles.sectionIcon}
              >
                <FontAwesome name="users" size={18} color="#ffffff" />
              </LinearGradient>
              <Text style={[styles.sectionTitle, {color: isDark ? '#ffffff' : '#000000'}]}>
                Команда
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigateTo('/team')}
              style={styles.seeAllButton}
            >
              <Text style={[styles.seeAllText, {color: isDark ? '#0a84ff' : '#007aff'}]}>
                Все сотрудники
              </Text>
              <FontAwesome name="angle-right" size={16} color={isDark ? '#0a84ff' : '#007aff'} />
            </TouchableOpacity>
          </View>
          <TeamSummary />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.sectionContainer,
            {
              opacity: fadeAnims.recentChats,
              transform: [{
                translateY: fadeAnims.recentChats.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <LinearGradient
                colors={isDark ? ['#4cd964', '#30ad4b'] : ['#34c759', '#248a3d']}
                style={styles.sectionIcon}
              >
                <FontAwesome name="comments" size={18} color="#ffffff" />
              </LinearGradient>
              <Text style={[styles.sectionTitle, {color: isDark ? '#ffffff' : '#000000'}]}>
                Недавние чаты
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigateTo('/chat')}
              style={styles.seeAllButton}
            >
              <Text style={[styles.seeAllText, {color: isDark ? '#0a84ff' : '#007aff'}]}>
                Все чаты
              </Text>
              <FontAwesome name="angle-right" size={16} color={isDark ? '#0a84ff' : '#007aff'} />
            </TouchableOpacity>
          </View>
          <RecentChats />
        </Animated.View>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleAddTask}
        label="Новая задача"
      />
    </ThemedContainer>
  );
}

// Вспомогательные функции для стилей задач
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case TaskPriority.LOW:
      return '#28a745';
    case TaskPriority.MEDIUM:
      return '#ffc107';
    case TaskPriority.HIGH:
      return '#fd7e14';
    case TaskPriority.URGENT:
      return '#dc3545';
    default:
      return '#6c757d';
  }
};

const getStatusText = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.ASSIGNED:
      return 'Назначена';
    case TaskStatus.IN_PROGRESS:
      return 'В процессе';
    case TaskStatus.COMPLETED:
      return 'Выполнена';
    case TaskStatus.CANCELLED:
      return 'Отменена';
    default:
      return '';
  }
};

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.ASSIGNED:
      return '#6c757d';
    case TaskStatus.IN_PROGRESS:
      return '#fd7e14';
    case TaskStatus.COMPLETED:
      return '#28a745';
    case TaskStatus.CANCELLED:
      return '#dc3545';
    default:
      return '#6c757d';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  profileButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  cardContainer: {
    padding: 16,
  },
  welcomeCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomeCardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  welcomeCardSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  welcomeCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80,
    backgroundColor: '#1E88E5',
  },
});
