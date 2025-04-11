import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Button, FAB, Avatar } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { useTask } from '../../context/TaskContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Task, TaskPriority, TaskStatus, Meeting, UserRole } from '../../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { router } from 'expo-router';

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

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2196F3']} />
        }
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Привет, {user?.name || 'Админ Системы'}!</Text>
          <Text style={styles.dateText}>
            {format(new Date(), 'EEEE, d MMMM', { locale: ru })}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="calendar-clock" size={24} color="#1E88E5" />
            <Text style={styles.sectionTitle}>Ближайшие митинги</Text>
          </View>

          {upcomingMeetings.length > 0 ? (
            upcomingMeetings.map(meeting => (
              <Card key={meeting.id} style={styles.meetingCard}>
                <View style={styles.meetingContent}>
                  <View style={styles.meetingInfo}>
                    <Text style={styles.meetingTitle}>{meeting.title}</Text>
                    <Text style={styles.meetingTime}>
                      {formatDate(meeting.startTime)}, {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                    </Text>
                    <Text style={styles.meetingDescription}>{meeting.description}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.viewButton} 
                    onPress={() => handleViewMeeting(meeting.id)}
                  >
                    <Text style={styles.viewButtonText}>Просмотреть</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          ) : (
            <Text style={styles.emptyText}>Нет запланированных митингов</Text>
          )}

          <TouchableOpacity 
            style={styles.sectionFooter}
            onPress={handleGoToMeetings}
          >
            <Text style={styles.sectionFooterText}>Показать все митинги</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#1E88E5" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="checkbox-marked-outline" size={24} color="#1E88E5" />
            <Text style={styles.sectionTitle}>Мои задачи</Text>
          </View>

          {upcomingTasks.length > 0 ? (
            upcomingTasks.map(task => (
              <Card key={task.id} style={styles.taskCard}>
                <TouchableOpacity
                  style={styles.taskContent}
                  onPress={() => handleViewTask(task.id)}
                >
                  <View style={styles.taskHeader}>
                    <View 
                      style={[
                        styles.priorityIndicator, 
                        { backgroundColor: getPriorityColor(task.priority) }
                      ]} 
                    />
                    <Text style={styles.taskTitle}>{task.title}</Text>
                  </View>
                  <Text style={styles.taskDeadline}>Срок: {formatDate(task.deadline)}</Text>
                  <Text style={styles.taskDescription} numberOfLines={2}>{task.description}</Text>
                  <View style={styles.taskFooter}>
                    <View style={styles.assigneeContainer}>
                      <Avatar.Image 
                        size={24} 
                        source={{ uri: getEmployeeById(task.assignedTo).avatarUrl }} 
                        style={styles.assigneeAvatar}
                      />
                      <Text style={styles.assigneeName}>
                        {getEmployeeById(task.assignedTo).name}
                      </Text>
                    </View>
                    <View style={[styles.statusChip, { backgroundColor: getStatusColor(task.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(task.status)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Card>
            ))
          ) : (
            <Text style={styles.emptyText}>Нет активных задач</Text>
          )}

          <TouchableOpacity 
            style={styles.sectionFooter}
            onPress={handleGoToTasks}
          >
            <Text style={styles.sectionFooterText}>Показать все задачи</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#1E88E5" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleAddTask}
        label="Новая задача"
      />
    </View>
  );
}

// Вспомогательные функции для стилей задач
const getPriorityColor = (priority: TaskPriority) => {
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
    backgroundColor: '#F0F0F0',
  },
  welcomeSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#2196F3',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  meetingCard: {
    marginBottom: 16,
    elevation: 1,
    borderRadius: 8,
  },
  meetingContent: {
    padding: 16,
  },
  meetingInfo: {
    marginBottom: 12,
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  meetingTime: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  meetingDescription: {
    fontSize: 14,
    color: '#666',
  },
  viewButton: {
    alignSelf: 'flex-end',
    padding: 8,
    borderRadius: 20,
  },
  viewButtonText: {
    color: '#673AB7',
    fontWeight: '500',
  },
  taskCard: {
    marginBottom: 16,
    elevation: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  taskContent: {
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  taskDeadline: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#757575',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  sectionFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  sectionFooterText: {
    color: '#1E88E5',
    marginRight: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80,
    backgroundColor: '#1E88E5',
  },
  bottomSpacing: {
    height: 80,
  },
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assigneeAvatar: {
    marginRight: 4,
  },
  assigneeName: {
    fontSize: 12,
    color: '#666',
  },
});
