import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Button, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Task, TaskPriority, TaskStatus, Meeting } from '../../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Временные примеры задач
const DEMO_TASKS: Task[] = [
  {
    id: '1',
    title: 'Разработать макет для нового проекта',
    description: 'Создать прототип пользовательского интерфейса для мобильного приложения',
    deadline: new Date(Date.now() + 86400000 * 2), // через 2 дня
    priority: TaskPriority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    assignedTo: '3',
    createdBy: '2',
    createdAt: new Date(Date.now() - 86400000), // вчера
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Подготовить отчет по продажам',
    description: 'Подготовить квартальный отчет по продажам для совета директоров',
    deadline: new Date(Date.now() + 86400000 * 5), // через 5 дней
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.ASSIGNED,
    assignedTo: '3',
    createdBy: '1',
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(Date.now() - 86400000),
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

export default function HomeScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Имитация загрузки данных с сервера
    setTimeout(() => {
      // Фильтруем задачи для текущего пользователя
      const userTasks = DEMO_TASKS.filter(task => task.assignedTo === user?.id);
      setUpcomingTasks(userTasks);

      // Фильтруем митинги, в которых пользователь участвует
      const userMeetings = DEMO_MEETINGS.filter(
        meeting => meeting.participants.includes(user?.id || '')
      );
      setUpcomingMeetings(userMeetings);

      setLoading(false);
      setRefreshing(false);
    }, 1000);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getTaskPriorityColor = (priority: TaskPriority) => {
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

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd MMMM, HH:mm', { locale: ru });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2196F3']} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Привет, {user?.name}!</Text>
        <Text style={styles.dateText}>
          {format(new Date(), 'EEEE, d MMMM', { locale: ru })}
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="calendar-clock" size={24} color="#2196F3" />
          <Text style={styles.sectionTitle}>Ближайшие митинги</Text>
        </View>

        {upcomingMeetings.length > 0 ? (
          upcomingMeetings.map(meeting => (
            <Card key={meeting.id} style={styles.card}>
              <Card.Content>
                <Title>{meeting.title}</Title>
                <Paragraph style={styles.meetingTime}>
                  {formatDate(meeting.startTime)} - {format(new Date(meeting.endTime), 'HH:mm')}
                </Paragraph>
                {meeting.description && (
                  <Paragraph style={styles.description}>{meeting.description}</Paragraph>
                )}
              </Card.Content>
              <Card.Actions>
                <Button>Просмотреть</Button>
              </Card.Actions>
            </Card>
          ))
        ) : (
          <Text style={styles.emptyText}>Нет запланированных митингов</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="checkbox-marked-outline" size={24} color="#2196F3" />
          <Text style={styles.sectionTitle}>Мои задачи</Text>
        </View>

        {upcomingTasks.length > 0 ? (
          upcomingTasks.map(task => (
            <Card key={task.id} style={styles.card}>
              <View
                style={[
                  styles.priorityIndicator,
                  { backgroundColor: getTaskPriorityColor(task.priority) },
                ]}
              />
              <Card.Content>
                <Title>{task.title}</Title>
                <Paragraph style={styles.taskStatus}>
                  Статус: {task.status === TaskStatus.IN_PROGRESS ? 'В процессе' : 
                           task.status === TaskStatus.ASSIGNED ? 'Назначена' :
                           task.status === TaskStatus.COMPLETED ? 'Выполнена' : 'Отменена'}
                </Paragraph>
                <Paragraph style={styles.taskDeadline}>
                  Срок: {formatDate(task.deadline)}
                </Paragraph>
                <Paragraph style={styles.description}>{task.description}</Paragraph>
              </Card.Content>
              <Card.Actions>
                <Button>Просмотреть</Button>
                {task.status !== TaskStatus.COMPLETED && (
                  <Button mode="outlined">
                    {task.status === TaskStatus.ASSIGNED ? 'Начать работу' : 'Завершить'}
                  </Button>
                )}
              </Card.Actions>
            </Card>
          ))
        ) : (
          <Text style={styles.emptyText}>Нет активных задач</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: '#2196F3',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  priorityIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
  },
  meetingTime: {
    color: '#666',
    marginBottom: 8,
  },
  taskStatus: {
    color: '#666',
    marginBottom: 4,
  },
  taskDeadline: {
    color: '#666',
    marginBottom: 8,
  },
  description: {
    marginTop: 8,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
    marginBottom: 16,
  },
});
