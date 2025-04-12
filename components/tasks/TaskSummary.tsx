import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useTask } from '../../context/TaskContext';
import { TaskStatus, TaskPriority } from '../../types/index';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export const TaskSummary = () => {
  const { isDark } = useTheme();
  const { tasks } = useTask();
  
  // Получаем активные задачи (не выполненные и не отмененные)
  const activeTasks = tasks.filter(
    task => task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED
  ).slice(0, 3); // Берем первые 3 задачи
  
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return isDark ? '#4cd964' : '#34c759';
      case TaskPriority.MEDIUM:
        return '#ffcc00';
      case TaskPriority.HIGH:
        return '#ff9500';
      case TaskPriority.URGENT:
        return isDark ? '#ff3b30' : '#ff2d55';
      default:
        return '#8e8e93';
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
  
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd MMM', { locale: ru });
  };
  
  const handleViewTask = (taskId: string) => {
    router.push({
      pathname: '/(tabs)/tasks',
      params: { taskId }
    });
  };
  
  if (activeTasks.length === 0) {
    return (
      <LinearGradient
        colors={isDark ? ['#2c2c2e', '#252527'] : ['#ffffff', '#f8f8fa']}
        style={styles.emptyContainer}
      >
        <Text style={[styles.emptyText, {color: isDark ? '#9a9a9a' : '#8e8e93'}]}>
          Нет активных задач
        </Text>
      </LinearGradient>
    );
  }
  
  return (
    <View style={styles.container}>
      {activeTasks.map((task) => (
        <TouchableOpacity
          key={task.id}
          style={styles.taskItem}
          onPress={() => handleViewTask(task.id)}
        >
          <LinearGradient
            colors={isDark ? ['#2c2c2e', '#252527'] : ['#ffffff', '#f8f8fa']}
            style={styles.taskCard}
          >
            <View style={styles.taskHeader}>
              <View 
                style={[
                  styles.priorityIndicator, 
                  {backgroundColor: getPriorityColor(task.priority)}
                ]} 
              />
              <Text 
                style={[
                  styles.taskTitle, 
                  {color: isDark ? '#ffffff' : '#000000'}
                ]}
                numberOfLines={1}
              >
                {task.title}
              </Text>
            </View>
            
            <View style={styles.taskDetails}>
              <View style={styles.taskStatus}>
                <Text style={[styles.statusText, {color: isDark ? '#9a9a9a' : '#8e8e93'}]}>
                  {getStatusText(task.status)}
                </Text>
              </View>
              
              <View style={styles.deadlineContainer}>
                <FontAwesome 
                  name="calendar" 
                  size={12} 
                  color={isDark ? '#9a9a9a' : '#8e8e93'} 
                  style={styles.deadlineIcon} 
                />
                <Text style={[styles.deadlineText, {color: isDark ? '#9a9a9a' : '#8e8e93'}]}>
                  {formatDate(task.deadline)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  emptyContainer: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  taskItem: {
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  taskCard: {
    borderRadius: 16,
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  taskDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskStatus: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 142, 147, 0.12)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineIcon: {
    marginRight: 4,
  },
  deadlineText: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 