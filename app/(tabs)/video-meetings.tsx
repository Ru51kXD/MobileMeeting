import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, Image, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedContainer } from '@/components/ThemedContainer';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { FAB, Badge, Button, Searchbar, Dialog, Portal, TextInput, Checkbox, IconButton, Divider, Chip } from 'react-native-paper';
import { router } from 'expo-router';
import { Meeting, User, UserRole } from '../../types/index';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function VideoMeetingsScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Состояние для управления диалогом редактирования
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [editedMeeting, setEditedMeeting] = useState<Partial<Meeting>>({});
  
  // Состояние для управления диалогом создания
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [newMeeting, setNewMeeting] = useState<Partial<Meeting>>({
    title: '',
    description: '',
    startTime: new Date(Date.now() + 1000 * 60 * 60), // Через 1 час
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 2), // Через 2 часа
    participants: user ? [user.id] : [],
    organizer: user?.id || ''
  });
  
  // Состояния для выбора даты и времени
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  // Тестовые данные о встречах
  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: '1',
      title: 'Еженедельное совещание команды',
      description: 'Обсуждение текущих задач и планов на неделю',
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 2), // Через 2 часа
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 3), // Через 3 часа
      organizer: '1',
      participants: ['1', '2', '3'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Встреча с заказчиком',
      description: 'Демонстрация прогресса по проекту',
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 24), // Через 1 день
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 25), // Через 1 день и 1 час
      organizer: '2',
      participants: ['1', '2'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      title: 'Мозговой штурм по новому проекту',
      description: 'Разработка концепции и планирование архитектуры',
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 48), // Через 2 дня
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 50), // Через 2 дня и 2 часа
      organizer: '1',
      participants: ['1', '3'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '4',
      title: 'Обзор завершенного спринта',
      description: 'Ретроспектива последнего спринта и планирование следующего',
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 дня назад
      endTime: new Date(Date.now() - 1000 * 60 * 60 * 47), // 2 дня назад + 1 час
      organizer: '1',
      participants: ['1', '2', '3'],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    },
    {
      id: '5',
      title: 'Интервью с кандидатом',
      description: 'Собеседование на должность разработчика',
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 день назад
      endTime: new Date(Date.now() - 1000 * 60 * 60 * 23), // 1 день назад + 1 час
      organizer: '2',
      participants: ['1', '2'],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },
  ]);
  
  // Пользователи для демонстрации
  const demoUsers: Record<string, User> = {
    '1': {
      id: '1',
      email: 'admin@company.com',
      name: 'Админ Системы',
      role: UserRole.ADMIN,
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
    },
    '2': {
      id: '2',
      email: 'manager@company.com',
      name: 'Менеджер Проектов',
      role: UserRole.MANAGER,
      department: 'Разработка',
      avatarUrl: 'https://i.pravatar.cc/150?img=2',
    },
    '3': {
      id: '3',
      email: 'employee@company.com',
      name: 'Сотрудник Компании',
      role: UserRole.EMPLOYEE,
      department: 'Разработка',
      position: 'Разработчик',
      avatarUrl: 'https://i.pravatar.cc/150?img=3',
    },
  };
  
  // Анимация появления при загрузке
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Фильтрация встреч по поиску и выбранной вкладке
  const getFilteredMeetings = () => {
    const now = new Date();
    
    let filtered = meetings;
    
    // Фильтрация по вкладке
    if (activeTab === 'upcoming') {
      filtered = filtered.filter(meeting => new Date(meeting.startTime) > now);
    } else if (activeTab === 'past') {
      filtered = filtered.filter(meeting => new Date(meeting.startTime) < now);
    }
    
    // Фильтрация по строке поиска
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(meeting => 
        meeting.title.toLowerCase().includes(query) || 
        (meeting.description && meeting.description.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  };

  // Сортировка встреч по дате начала
  const sortMeetings = (meetings: Meeting[]) => {
    return [...meetings].sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  };
  
  const filteredMeetings = sortMeetings(getFilteredMeetings());
  
  // Функция для присоединения к встрече
  const handleJoinMeeting = (meeting: Meeting) => {
    Alert.alert(
      'Присоединение к встрече',
      `Вы хотите присоединиться к встрече "${meeting.title}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Присоединиться', 
          onPress: () => {
            // Переходим на экран видеоконференции, передавая необходимые параметры
            router.push({
              pathname: '/meeting-room',
              params: { 
                meetingId: meeting.id,
                meetingTitle: meeting.title,
                organizer: meeting.organizer
              }
            });
          } 
        }
      ]
    );
  };
  
  // Функция для создания новой встречи
  const handleCreateMeeting = () => {
    // Сбрасываем данные новой встречи
    setNewMeeting({
      title: '',
      description: '',
      startTime: new Date(Date.now() + 1000 * 60 * 60), // Через 1 час
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 2), // Через 2 часа
      participants: user ? [user.id] : [],
      organizer: user?.id || ''
    });
    setCreateDialogVisible(true);
  };
  
  // Функция для сохранения новой встречи
  const handleSaveNewMeeting = () => {
    if (!newMeeting.title) {
      Alert.alert('Ошибка', 'Название встречи не может быть пустым');
      return;
    }
    
    // Проверка времени начала и окончания
    if (newMeeting.startTime && newMeeting.endTime && 
        newMeeting.startTime > newMeeting.endTime) {
      Alert.alert('Ошибка', 'Время начала должно быть раньше времени окончания');
      return;
    }
    
    // Создаем новую встречу
    const createdMeeting: Meeting = {
      id: Date.now().toString(), // Генерируем ID
      title: newMeeting.title || 'Новая встреча',
      description: newMeeting.description || '',
      startTime: newMeeting.startTime || new Date(),
      endTime: newMeeting.endTime || new Date(Date.now() + 1000 * 60 * 60),
      organizer: newMeeting.organizer || user?.id || '',
      participants: newMeeting.participants || [user?.id || ''],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Добавляем в массив встреч
    setMeetings([...meetings, createdMeeting]);
    setCreateDialogVisible(false);
    
    Alert.alert('Успешно', 'Встреча создана');
  };
  
  // Функция для открытия диалога редактирования
  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setEditedMeeting({
      title: meeting.title,
      description: meeting.description,
      startTime: new Date(meeting.startTime),
      endTime: new Date(meeting.endTime),
    });
    setEditDialogVisible(true);
  };

  // Функция для обновления встречи
  const handleUpdateMeeting = () => {
    if (!selectedMeeting || !editedMeeting.title) {
      Alert.alert('Ошибка', 'Название встречи не может быть пустым');
      return;
    }
    
    // Проверка времени начала и окончания
    if (editedMeeting.startTime && editedMeeting.endTime && 
        editedMeeting.startTime > editedMeeting.endTime) {
      Alert.alert('Ошибка', 'Время начала должно быть раньше времени окончания');
      return;
    }
    
    // Обновляем встречу в массиве
    const updatedMeetings = meetings.map(meeting => 
      meeting.id === selectedMeeting.id 
        ? { 
            ...meeting, 
            ...editedMeeting, 
            updatedAt: new Date() 
          } 
        : meeting
    );
    
    setMeetings(updatedMeetings);
    setEditDialogVisible(false);
    setSelectedMeeting(null);
    
    Alert.alert('Успешно', 'Встреча обновлена');
  };
  
  // Функции для обработки выбора даты и времени
  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const currentStartTime = editedMeeting.startTime || new Date();
      const newStartTime = new Date(selectedDate);
      newStartTime.setHours(currentStartTime.getHours(), currentStartTime.getMinutes());
      
      setEditedMeeting({
        ...editedMeeting,
        startTime: newStartTime
      });
    }
  };
  
  const handleStartTimeChange = (event, selectedTime) => {
    setShowStartTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const currentStartTime = editedMeeting.startTime || new Date();
      const newStartTime = new Date(currentStartTime);
      newStartTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      
      setEditedMeeting({
        ...editedMeeting,
        startTime: newStartTime
      });
    }
  };
  
  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const currentEndTime = editedMeeting.endTime || new Date();
      const newEndTime = new Date(selectedDate);
      newEndTime.setHours(currentEndTime.getHours(), currentEndTime.getMinutes());
      
      setEditedMeeting({
        ...editedMeeting,
        endTime: newEndTime
      });
    }
  };
  
  const handleEndTimeChange = (event, selectedTime) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const currentEndTime = editedMeeting.endTime || new Date();
      const newEndTime = new Date(currentEndTime);
      newEndTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      
      setEditedMeeting({
        ...editedMeeting,
        endTime: newEndTime
      });
    }
  };
  
  // Форматирование даты для отображения
  const formatMeetingTime = (date: Date | string) => {
    const meetingDate = new Date(date);
    return meetingDate.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Форматирование даты для отображения
  const formatMeetingDate = (date: Date | string) => {
    const meetingDate = new Date(date);
    return meetingDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Форматирование времени для кнопок выбора
  const formatTimeForButton = (date: Date | string | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };
  
  // Форматирование даты для кнопок выбора
  const formatDateForButton = (date: Date | string | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Проверка, сегодня ли встреча
  const isMeetingToday = (date: Date | string) => {
    const meetingDate = new Date(date);
    const today = new Date();
    return meetingDate.getDate() === today.getDate() &&
      meetingDate.getMonth() === today.getMonth() &&
      meetingDate.getFullYear() === today.getFullYear();
  };
  
  // Проверка, прошла ли встреча
  const isPastMeeting = (date: Date | string) => {
    const meetingDate = new Date(date);
    const now = new Date();
    return meetingDate < now;
  };
  
  // Получение имени организатора
  const getOrganizerName = (organizerId: string) => {
    return demoUsers[organizerId]?.name || 'Неизвестный организатор';
  };
  
  // Получение списка участников
  const getParticipantNames = (participantIds: string[]) => {
    return participantIds.map(id => demoUsers[id]?.name || 'Неизвестный участник');
  };
  
  // Получение статуса встречи
  const getMeetingStatus = (meeting: Meeting) => {
    const now = new Date();
    const startTime = new Date(meeting.startTime);
    const endTime = new Date(meeting.endTime);
    
    if (now > endTime) {
      return { status: 'ended', label: 'Завершена', color: '#8e8e93' };
    } else if (now >= startTime && now <= endTime) {
      return { status: 'active', label: 'Активна', color: '#30d158' };
    } else {
      // Проверка, начнется ли встреча в течение 30 минут
      const timeDiff = startTime.getTime() - now.getTime();
      const minutesDiff = Math.floor(timeDiff / (1000 * 60));
      
      if (minutesDiff <= 30) {
        return { status: 'soon', label: 'Скоро начнется', color: '#ff9500' };
      } else {
        return { status: 'scheduled', label: 'Запланирована', color: '#007aff' };
      }
    }
  };
  
  // Функция для отмены встречи
  const handleCancelMeeting = (meeting: Meeting) => {
    Alert.alert(
      'Отмена встречи',
      `Вы уверены, что хотите отменить встречу "${meeting.title}"?`,
      [
        { text: 'Нет', style: 'cancel' },
        { 
          text: 'Да, отменить', 
          style: 'destructive',
          onPress: () => {
            // Удаляем встречу из массива
            const updatedMeetings = meetings.filter(m => m.id !== meeting.id);
            setMeetings(updatedMeetings);
            Alert.alert('Успешно', 'Встреча отменена');
          } 
        }
      ]
    );
  };
  
  if (!user) {
    return (
      <ThemedContainer style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <Text style={{color: isDark ? '#ffffff' : '#000000', fontSize: 18}}>
          Пожалуйста, авторизуйтесь для доступа к встречам
        </Text>
        <TouchableOpacity 
          style={[styles.button, {marginTop: 20}]} 
          onPress={() => router.replace('/login')}
        >
          <LinearGradient
            colors={isDark ? ['#0a84ff', '#0066cc'] : ['#007aff', '#0062cc']}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>Войти</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ThemedContainer>
    );
  }

  return (
    <ThemedContainer style={styles.container}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={isDark ? ['#2c2c2e', '#1c1c1e'] : ['#ffffff', '#f8f8fa']}
          style={styles.headerGradient}
        >
          <Text style={[styles.headerTitle, {color: isDark ? '#ffffff' : '#000000'}]}>
            Встречи
          </Text>
          
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Поиск встреч"
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={[styles.searchBar, {backgroundColor: isDark ? '#3a3a3c' : '#f2f2f7'}]}
              inputStyle={{color: isDark ? '#ffffff' : '#000000'}}
              iconColor={isDark ? '#ffffff' : '#000000'}
              placeholderTextColor={isDark ? '#8e8e93' : '#8e8e93'}
            />
          </View>
          
          <View style={styles.tabs}>
            <TouchableOpacity 
              style={[
                styles.tab, 
                activeTab === 'upcoming' && styles.activeTab,
                activeTab === 'upcoming' && {backgroundColor: isDark ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 122, 255, 0.1)'}
              ]} 
              onPress={() => setActiveTab('upcoming')}
            >
              <Text style={[
                styles.tabText, 
                activeTab === 'upcoming' && styles.activeTabText,
                {color: activeTab === 'upcoming' ? (isDark ? '#0a84ff' : '#007aff') : (isDark ? '#8e8e93' : '#8e8e93')}
              ]}>
                Предстоящие
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.tab, 
                activeTab === 'past' && styles.activeTab,
                activeTab === 'past' && {backgroundColor: isDark ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 122, 255, 0.1)'}
              ]} 
              onPress={() => setActiveTab('past')}
            >
              <Text style={[
                styles.tabText, 
                activeTab === 'past' && styles.activeTabText,
                {color: activeTab === 'past' ? (isDark ? '#0a84ff' : '#007aff') : (isDark ? '#8e8e93' : '#8e8e93')}
              ]}>
                Прошедшие
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.tab, 
                activeTab === 'all' && styles.activeTab,
                activeTab === 'all' && {backgroundColor: isDark ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 122, 255, 0.1)'}
              ]} 
              onPress={() => setActiveTab('all')}
            >
              <Text style={[
                styles.tabText, 
                activeTab === 'all' && styles.activeTabText,
                {color: activeTab === 'all' ? (isDark ? '#0a84ff' : '#007aff') : (isDark ? '#8e8e93' : '#8e8e93')}
              ]}>
                Все
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredMeetings.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="calendar-times-o" size={60} color={isDark ? '#8e8e93' : '#8e8e93'} />
            <Text style={[styles.emptyText, {color: isDark ? '#ffffff' : '#000000'}]}>
              {searchQuery ? 'Нет встреч, соответствующих поиску' : 'Нет запланированных встреч'}
            </Text>
          </View>
        ) : (
          filteredMeetings.map((meeting, index) => {
            const meetingStatus = getMeetingStatus(meeting);
            
            return (
              <Animated.View 
                key={meeting.id}
                style={[
                  styles.meetingCard,
                  {backgroundColor: isDark ? '#2c2c2e' : '#ffffff'},
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        })
                      }
                    ]
                  }
                ]}
              >
                <View style={styles.meetingHeader}>
                  <View style={styles.meetingTimeContainer}>
                    <View style={[styles.statusBadge, {backgroundColor: meetingStatus.color}]}>
                      <Text style={styles.statusText}>{meetingStatus.label}</Text>
                    </View>
                    <Text style={[styles.meetingDate, {color: isDark ? '#ffffff' : '#000000'}]}>
                      {isMeetingToday(meeting.startTime) ? 'Сегодня' : formatMeetingDate(meeting.startTime)}
                    </Text>
                    <Text style={[styles.meetingTime, {color: isDark ? '#ff375f' : '#ff2d55'}]}>
                      {formatMeetingTime(meeting.startTime)} - {formatMeetingTime(meeting.endTime)}
                    </Text>
                  </View>
                  
                  {!isPastMeeting(meeting.endTime) && (
                    <TouchableOpacity 
                      style={styles.joinMeetingButton} 
                      onPress={() => handleJoinMeeting(meeting)}
                    >
                      <LinearGradient
                        colors={isDark ? ['#ff375f', '#cc2e4c'] : ['#ff375f', '#cc2e4c']}
                        style={styles.joinMeetingGradient}
                      >
                        <Text style={styles.joinMeetingText}>Присоединиться</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
                
                <Text style={[styles.meetingTitle, {color: isDark ? '#ffffff' : '#000000'}]}>
                  {meeting.title}
                </Text>
                
                {meeting.description && (
                  <Text style={[styles.meetingDescription, {color: isDark ? '#8e8e93' : '#666666'}]}>
                    {meeting.description}
                  </Text>
                )}
                
                <View style={[styles.organizerRow, {borderBottomColor: isDark ? 'rgba(142, 142, 147, 0.1)' : 'rgba(142, 142, 147, 0.2)'}]}>
                  <Text style={[styles.organizerLabel, {color: isDark ? '#8e8e93' : '#666666'}]}>
                    Организатор:
                  </Text>
                  <Text style={[styles.organizerName, {color: isDark ? '#ffffff' : '#000000'}]}>
                    {getOrganizerName(meeting.organizer)}
                  </Text>
                </View>
                
                <View style={styles.participantsSection}>
                  <Text style={[styles.participantsTitle, {color: isDark ? '#8e8e93' : '#666666'}]}>
                    Участники ({meeting.participants.length}):
                  </Text>
                  
                  <View style={styles.participantsList}>
                    {meeting.participants.map((participantId) => (
                      <View key={participantId} style={styles.participantItem}>
                        <Image 
                          source={{ uri: demoUsers[participantId]?.avatarUrl || 'https://ui-avatars.com/api/?name=User' }} 
                          style={styles.participantAvatar} 
                        />
                        <Text style={[styles.participantName, {color: isDark ? '#ffffff' : '#000000'}]}>
                          {demoUsers[participantId]?.name || 'Неизвестный участник'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                
                {!isPastMeeting(meeting.endTime) && (
                  <View style={styles.actionButtons}>
                    <Button 
                      icon="calendar-edit" 
                      mode="outlined" 
                      style={[styles.actionButton, {borderColor: isDark ? '#8e8e93' : '#8e8e93'}]}
                      textColor={isDark ? '#8e8e93' : '#8e8e93'}
                      onPress={() => handleEditMeeting(meeting)}
                    >
                      Изменить
                    </Button>
                    
                    <Button 
                      icon="calendar-remove" 
                      mode="outlined" 
                      style={[styles.actionButton, {borderColor: isDark ? '#ff3b30' : '#ff3b30'}]}
                      textColor={isDark ? '#ff3b30' : '#ff3b30'}
                      onPress={() => handleCancelMeeting(meeting)}
                    >
                      Отменить
                    </Button>
                  </View>
                )}
              </Animated.View>
            );
          })
        )}
      </ScrollView>
      
      <FAB
        icon="plus"
        style={[styles.fab, {backgroundColor: isDark ? '#ff375f' : '#ff375f'}]}
        onPress={handleCreateMeeting}
        color="#ffffff"
      />
      
      {/* Диалог редактирования встречи */}
      <Portal>
        <Dialog 
          visible={editDialogVisible} 
          onDismiss={() => setEditDialogVisible(false)}
          style={{backgroundColor: isDark ? '#1c1c1e' : '#ffffff'}}
        >
          <Dialog.Title style={{color: isDark ? '#ffffff' : '#000000'}}>Редактирование встречи</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Название встречи"
              value={editedMeeting.title || ''}
              onChangeText={text => setEditedMeeting({...editedMeeting, title: text})}
              style={[styles.input, {backgroundColor: isDark ? '#2c2c2e' : '#f2f2f7'}]}
              mode="outlined"
              outlineColor={isDark ? '#3a3a3c' : '#e1e1e1'}
              activeOutlineColor={isDark ? '#ff375f' : '#ff375f'}
              textColor={isDark ? '#ffffff' : '#000000'}
            />
            
            <TextInput
              label="Описание"
              value={editedMeeting.description || ''}
              onChangeText={text => setEditedMeeting({...editedMeeting, description: text})}
              style={[styles.input, {backgroundColor: isDark ? '#2c2c2e' : '#f2f2f7', marginTop: 12}]}
              mode="outlined"
              outlineColor={isDark ? '#3a3a3c' : '#e1e1e1'}
              activeOutlineColor={isDark ? '#ff375f' : '#ff375f'}
              textColor={isDark ? '#ffffff' : '#000000'}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.dateSection}>
              <Text style={[styles.dateLabel, {color: isDark ? '#ffffff' : '#000000'}]}>Время начала:</Text>
              <View style={styles.datePickerRow}>
                <Button 
                  mode="outlined" 
                  style={[styles.dateButton, {borderColor: isDark ? '#3a3a3c' : '#e1e1e1'}]} 
                  textColor={isDark ? '#ffffff' : '#000000'}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  {formatDateForButton(editedMeeting.startTime)}
                </Button>
                <Button 
                  mode="outlined" 
                  style={[styles.timeButton, {borderColor: isDark ? '#3a3a3c' : '#e1e1e1'}]} 
                  textColor={isDark ? '#ffffff' : '#000000'}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  {formatTimeForButton(editedMeeting.startTime)}
                </Button>
              </View>
            </View>
            
            <View style={styles.dateSection}>
              <Text style={[styles.dateLabel, {color: isDark ? '#ffffff' : '#000000'}]}>Время окончания:</Text>
              <View style={styles.datePickerRow}>
                <Button 
                  mode="outlined" 
                  style={[styles.dateButton, {borderColor: isDark ? '#3a3a3c' : '#e1e1e1'}]} 
                  textColor={isDark ? '#ffffff' : '#000000'}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  {formatDateForButton(editedMeeting.endTime)}
                </Button>
                <Button 
                  mode="outlined" 
                  style={[styles.timeButton, {borderColor: isDark ? '#3a3a3c' : '#e1e1e1'}]} 
                  textColor={isDark ? '#ffffff' : '#000000'}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  {formatTimeForButton(editedMeeting.endTime)}
                </Button>
              </View>
            </View>
            
            {/* DateTimePicker для Android */}
            {showStartDatePicker && (
              <DateTimePicker
                value={editedMeeting.startTime || new Date()}
                mode="date"
                display="default"
                onChange={handleStartDateChange}
              />
            )}
            
            {showStartTimePicker && (
              <DateTimePicker
                value={editedMeeting.startTime || new Date()}
                mode="time"
                display="default"
                onChange={handleStartTimeChange}
              />
            )}
            
            {showEndDatePicker && (
              <DateTimePicker
                value={editedMeeting.endTime || new Date()}
                mode="date"
                display="default"
                onChange={handleEndDateChange}
              />
            )}
            
            {showEndTimePicker && (
              <DateTimePicker
                value={editedMeeting.endTime || new Date()}
                mode="time"
                display="default"
                onChange={handleEndTimeChange}
              />
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setEditDialogVisible(false)} 
              textColor={isDark ? '#8e8e93' : '#8e8e93'}
            >
              Отмена
            </Button>
            <Button 
              onPress={handleUpdateMeeting} 
              textColor={isDark ? '#ff375f' : '#ff375f'}
            >
              Сохранить
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Диалог создания встречи */}
      <Portal>
        <Dialog 
          visible={createDialogVisible} 
          onDismiss={() => setCreateDialogVisible(false)}
          style={{backgroundColor: isDark ? '#1c1c1e' : '#ffffff'}}
        >
          <Dialog.Title style={{color: isDark ? '#ffffff' : '#000000'}}>Создание встречи</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Название встречи"
              value={newMeeting.title || ''}
              onChangeText={text => setNewMeeting({...newMeeting, title: text})}
              style={[styles.input, {backgroundColor: isDark ? '#2c2c2e' : '#f2f2f7'}]}
              mode="outlined"
              outlineColor={isDark ? '#3a3a3c' : '#e1e1e1'}
              activeOutlineColor={isDark ? '#ff375f' : '#ff375f'}
              textColor={isDark ? '#ffffff' : '#000000'}
              placeholder="Введите название встречи"
            />
            
            <TextInput
              label="Описание"
              value={newMeeting.description || ''}
              onChangeText={text => setNewMeeting({...newMeeting, description: text})}
              style={[styles.input, {backgroundColor: isDark ? '#2c2c2e' : '#f2f2f7', marginTop: 12}]}
              mode="outlined"
              outlineColor={isDark ? '#3a3a3c' : '#e1e1e1'}
              activeOutlineColor={isDark ? '#ff375f' : '#ff375f'}
              textColor={isDark ? '#ffffff' : '#000000'}
              placeholder="Описание и повестка встречи"
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.dateSection}>
              <Text style={[styles.dateLabel, {color: isDark ? '#ffffff' : '#000000'}]}>Время начала:</Text>
              <View style={styles.datePickerRow}>
                <Button 
                  mode="outlined" 
                  style={[styles.dateButton, {borderColor: isDark ? '#3a3a3c' : '#e1e1e1'}]} 
                  textColor={isDark ? '#ffffff' : '#000000'}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  {formatDateForButton(newMeeting.startTime)}
                </Button>
                <Button 
                  mode="outlined" 
                  style={[styles.timeButton, {borderColor: isDark ? '#3a3a3c' : '#e1e1e1'}]} 
                  textColor={isDark ? '#ffffff' : '#000000'}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  {formatTimeForButton(newMeeting.startTime)}
                </Button>
              </View>
            </View>
            
            <View style={styles.dateSection}>
              <Text style={[styles.dateLabel, {color: isDark ? '#ffffff' : '#000000'}]}>Время окончания:</Text>
              <View style={styles.datePickerRow}>
                <Button 
                  mode="outlined" 
                  style={[styles.dateButton, {borderColor: isDark ? '#3a3a3c' : '#e1e1e1'}]} 
                  textColor={isDark ? '#ffffff' : '#000000'}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  {formatDateForButton(newMeeting.endTime)}
                </Button>
                <Button 
                  mode="outlined" 
                  style={[styles.timeButton, {borderColor: isDark ? '#3a3a3c' : '#e1e1e1'}]} 
                  textColor={isDark ? '#ffffff' : '#000000'}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  {formatTimeForButton(newMeeting.endTime)}
                </Button>
              </View>
            </View>
            
            <View style={styles.dateSection}>
              <Text style={[styles.dateLabel, {color: isDark ? '#ffffff' : '#000000'}]}>Участники:</Text>
              <View style={styles.participantsChips}>
                {Object.keys(demoUsers).map(id => (
                  <Chip
                    key={id}
                    selected={newMeeting.participants?.includes(id)}
                    onPress={() => {
                      const participants = newMeeting.participants || [];
                      if (participants.includes(id)) {
                        // Нельзя удалить организатора из списка участников
                        if (id === newMeeting.organizer) {
                          Alert.alert('Внимание', 'Организатор должен быть участником встречи');
                          return;
                        }
                        // Удаляем участника
                        setNewMeeting({
                          ...newMeeting,
                          participants: participants.filter(p => p !== id)
                        });
                      } else {
                        // Добавляем участника
                        setNewMeeting({
                          ...newMeeting,
                          participants: [...participants, id]
                        });
                      }
                    }}
                    style={[
                      styles.participantChip,
                      {
                        backgroundColor: newMeeting.participants?.includes(id) 
                          ? (isDark ? 'rgba(255, 55, 95, 0.2)' : 'rgba(255, 55, 95, 0.2)') 
                          : (isDark ? '#2c2c2e' : '#f2f2f7')
                      }
                    ]}
                    textStyle={{
                      color: newMeeting.participants?.includes(id) 
                        ? (isDark ? '#ff375f' : '#ff2d55') 
                        : (isDark ? '#8e8e93' : '#8e8e93')
                    }}
                    avatarStyle={{
                      backgroundColor: isDark ? '#3a3a3c' : '#e1e1e1'
                    }}
                  >
                    {demoUsers[id].name}
                  </Chip>
                ))}
              </View>
            </View>
            
            {/* DateTimePicker для Android - такие же, как для редактирования */}
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setCreateDialogVisible(false)} 
              textColor={isDark ? '#8e8e93' : '#8e8e93'}
            >
              Отмена
            </Button>
            <Button 
              onPress={handleSaveNewMeeting} 
              textColor={isDark ? '#ff375f' : '#ff375f'}
            >
              Создать
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ThemedContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1,
  },
  headerGradient: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    borderRadius: 12,
    elevation: 0,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    borderRadius: 12,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  meetingCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  meetingTimeContainer: {
    flex: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  meetingDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  meetingTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  meetingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  meetingDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  organizerLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  organizerName: {
    fontSize: 14,
    fontWeight: '500',
  },
  participantsSection: {
    marginBottom: 16,
  },
  participantsTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  participantsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  participantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  participantName: {
    fontSize: 14,
  },
  joinMeetingButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  joinMeetingGradient: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  joinMeetingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  button: {
    height: 46,
    borderRadius: 12,
    overflow: 'hidden',
    width: 200,
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f2f2f7',
  },
  dateSection: {
    marginTop: 16,
  },
  dateLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton: {
    flex: 3,
    marginRight: 8,
  },
  timeButton: {
    flex: 2,
  },
  participantsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  participantChip: {
    marginBottom: 8,
    borderRadius: 20,
  },
}); 