import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Dimensions, ScrollView } from 'react-native';
import { Searchbar, FAB, Chip, Menu, Divider, Button, ActivityIndicator, Dialog, Portal, Avatar } from 'react-native-paper';
import { Task, TaskPriority, TaskStatus, UserRole } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useTask } from '../../../context/TaskContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

export default function TasksScreen() {
  const { user } = useAuth();
  const { tasks: allTasks, refreshTasks, updateTask } = useTask();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | null>(null);
  const [sortOption, setSortOption] = useState<'deadline' | 'priority' | 'status'>('deadline');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Для хранения координат меню фильтров
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const filterButtonRef = useRef<TouchableOpacity>(null);
  
  // Состояние для диалога детализации задачи
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailVisible, setTaskDetailVisible] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [allTasks]);

  useEffect(() => {
    applyFilters();
  }, [tasks, searchQuery, selectedStatus, selectedPriority, sortOption, sortDirection]);

  const loadTasks = () => {
    setLoading(true);
    
    // Фильтруем задачи для текущего пользователя, если он не админ
    let userTasks = [...allTasks];
    if (user?.role === UserRole.EMPLOYEE) {
      userTasks = userTasks.filter(task => task.assignedTo === user.id);
    }
    
    setTasks(userTasks);
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTasks();
    setRefreshing(false);
  };

  // Улучшенная функция обработки поискового запроса с небольшой задержкой
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const applyFilters = () => {
    let result = [...tasks];

    // Применяем поиск по названию или описанию
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        task => 
          (task.title && task.title.toLowerCase().includes(query)) || 
          (task.description && task.description.toLowerCase().includes(query))
      );
    }

    // Фильтр по статусу
    if (selectedStatus) {
      result = result.filter(task => task.status === selectedStatus);
    }

    // Фильтр по приоритету
    if (selectedPriority) {
      result = result.filter(task => task.priority === selectedPriority);
    }

    // Нормализация дат перед сортировкой
    result = result.map(task => ({
      ...task,
      deadlineDate: new Date(task.deadline)
    }));

    // Сортировка
    result.sort((a, b) => {
      if (sortOption === 'deadline') {
        const dateA = a.deadlineDate.getTime();
        const dateB = b.deadlineDate.getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      if (sortOption === 'priority') {
        const priorityOrder = { 
          [TaskPriority.LOW]: 1, 
          [TaskPriority.MEDIUM]: 2, 
          [TaskPriority.HIGH]: 3, 
          [TaskPriority.URGENT]: 4 
        };
        const prioA = priorityOrder[a.priority];
        const prioB = priorityOrder[b.priority];
        return sortDirection === 'asc' ? prioA - prioB : prioB - prioA;
      }

      if (sortOption === 'status') {
        const statusOrder = { 
          [TaskStatus.ASSIGNED]: 1, 
          [TaskStatus.IN_PROGRESS]: 2, 
          [TaskStatus.COMPLETED]: 3, 
          [TaskStatus.CANCELLED]: 4 
        };
        const statusA = statusOrder[a.status];
        const statusB = statusOrder[b.status];
        return sortDirection === 'asc' ? statusA - statusB : statusB - statusA;
      }

      return 0;
    });

    setFilteredTasks(result);
  };

  const resetFilters = () => {
    setSelectedStatus(null);
    setSelectedPriority(null);
    setSortOption('deadline');
    setSortDirection('asc');
    setSearchQuery('');
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

  const getTaskStatusText = (status: TaskStatus) => {
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

  const getTaskStatusColor = (status: TaskStatus) => {
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

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setTaskDetailVisible(true);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd MMMM yyyy, HH:mm', { locale: ru });
  };

  // Функция для получения данных сотрудника по ID
  const getEmployeeById = (employeeId: string) => {
    return DEMO_EMPLOYEES.find(employee => employee.id === employeeId) || 
      { id: employeeId, name: 'Неизвестный сотрудник', position: 'Не указана', avatarUrl: 'https://ui-avatars.com/api/?name=Unknown&background=9E9E9E&color=fff' };
  };

  const renderTaskItem = ({ item }: { item: Task }) => {
    const isPastDeadline = new Date(item.deadline) < new Date() && 
                           item.status !== TaskStatus.COMPLETED &&
                           item.status !== TaskStatus.CANCELLED;

    return (
      <TouchableOpacity 
        style={styles.taskItem} 
        onPress={() => handleTaskPress(item)}
      >
        <View style={styles.taskHeader}>
          <Text 
            style={[
              styles.taskTitle,
              (item.status === TaskStatus.COMPLETED || item.status === TaskStatus.CANCELLED) && 
              styles.completedTaskTitle
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Chip 
            style={[styles.priorityChip, { backgroundColor: getTaskPriorityColor(item.priority) }]}
            textStyle={{ color: 'white', fontSize: 12 }}
          >
            {item.priority}
          </Chip>
        </View>
        
        <Text 
          style={styles.taskDescription}
          numberOfLines={2}
        >
          {item.description}
        </Text>
        
        <View style={styles.taskMeta}>
          <View style={styles.assigneeContainer}>
            <Avatar.Image 
              size={24} 
              source={{ uri: getEmployeeById(item.assignedTo).avatarUrl }}
            />
            <Text style={styles.assigneeName}>
              {getEmployeeById(item.assignedTo).name}
            </Text>
          </View>
          <Chip 
            style={{ 
              backgroundColor: getTaskStatusColor(item.status),
              height: 26,
            }}
            textStyle={{ color: 'white', fontSize: 12 }}
          >
            {getTaskStatusText(item.status)}
          </Chip>
        </View>
        
        <View style={styles.taskFooter}>
          <View style={styles.deadlineContainer}>
            <MaterialCommunityIcons 
              name="clock-outline" 
              size={16} 
              color={isPastDeadline ? '#dc3545' : '#666'} 
            />
            <Text 
              style={[
                styles.deadlineText,
                isPastDeadline && styles.pastDeadlineText
              ]}
            >
              {formatDate(item.deadline)}
            </Text>
          </View>
          
          <View style={styles.commentsContainer}>
            <MaterialCommunityIcons name="comment-outline" size={16} color="#666" />
            <Text style={styles.commentsText}>
              {item.comments?.length || 0} комм.
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const showFilterMenu = () => {
    if (filterButtonRef.current) {
      filterButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setMenuPosition({ x: pageX, y: pageY + height });
        setFilterMenuVisible(true);
      });
    }
  };

  // Функция обновления статуса задачи из диалога детализации
  const handleChangeTaskStatus = async (task: Task, newStatus: TaskStatus) => {
    if (!task) return;

    try {
      const updatedTask = { ...task, status: newStatus };
      await updateTask(updatedTask);
      setSelectedTask(updatedTask);
    } catch (error) {
      console.error('Ошибка при обновлении статуса задачи:', error);
    }
  };

  // Функция для перехода на экран создания задачи
  const goToCreateTask = () => {
    router.push('/(tabs)/tasks/create');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Задачи</Text>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Поиск задач..."
            onChangeText={handleSearchChange}
            value={searchQuery}
            style={styles.searchBar}
            iconColor="#666"
          />
          
          <TouchableOpacity
            ref={filterButtonRef}
            style={styles.filterButton}
            onPress={showFilterMenu}
          >
            <MaterialCommunityIcons 
              name="filter-variant" 
              size={24} 
              color={
                selectedStatus || selectedPriority || 
                sortOption !== 'deadline' || sortDirection !== 'asc' 
                  ? '#2196F3' 
                  : '#666'
              } 
            />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.tasksList}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#2196F3']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery.trim() || selectedStatus || selectedPriority ? 
                'Задачи не найдены. Попробуйте изменить параметры поиска.' : 
                'У вас пока нет активных задач.'}
            </Text>
            {(searchQuery.trim() || selectedStatus || selectedPriority) && (
              <Button mode="outlined" onPress={resetFilters} style={styles.resetFiltersButton}>
                Сбросить фильтры
              </Button>
            )}
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={goToCreateTask}
        color="#ffffff"
      />

      <Menu
        visible={filterMenuVisible}
        onDismiss={() => setFilterMenuVisible(false)}
        anchor={menuPosition}
        style={styles.filterMenu}
      >
        <Text style={styles.filterMenuTitle}>Фильтры</Text>
        <Divider />
        
        <Text style={styles.filterMenuSubtitle}>Статус</Text>
        <View style={styles.statusFilters}>
          {Object.values(TaskStatus).map((status) => (
            <Chip
              key={status}
              selected={selectedStatus === status}
              onPress={() => setSelectedStatus(selectedStatus === status ? null : status)}
              style={[
                styles.filterChip,
                selectedStatus === status && { backgroundColor: getTaskStatusColor(status) }
              ]}
              textStyle={selectedStatus === status ? { color: 'white' } : undefined}
            >
              {getTaskStatusText(status)}
            </Chip>
          ))}
        </View>
        
        <Text style={styles.filterMenuSubtitle}>Приоритет</Text>
        <View style={styles.priorityFilters}>
          {Object.values(TaskPriority).map((priority) => (
            <Chip
              key={priority}
              selected={selectedPriority === priority}
              onPress={() => setSelectedPriority(selectedPriority === priority ? null : priority)}
              style={[
                styles.filterChip,
                selectedPriority === priority && { backgroundColor: getTaskPriorityColor(priority) }
              ]}
              textStyle={selectedPriority === priority ? { color: 'white' } : undefined}
            >
              {priority}
            </Chip>
          ))}
        </View>
        
        <Text style={styles.filterMenuSubtitle}>Сортировка</Text>
        <View style={styles.sortOptions}>
          <Chip
            selected={sortOption === 'deadline'}
            onPress={() => setSortOption('deadline')}
            style={styles.filterChip}
          >
            По сроку
          </Chip>
          <Chip
            selected={sortOption === 'priority'}
            onPress={() => setSortOption('priority')}
            style={styles.filterChip}
          >
            По приоритету
          </Chip>
          <Chip
            selected={sortOption === 'status'}
            onPress={() => setSortOption('status')}
            style={styles.filterChip}
          >
            По статусу
          </Chip>
        </View>
        
        <View style={styles.sortDirection}>
          <Chip
            selected={sortDirection === 'asc'}
            onPress={() => setSortDirection('asc')}
            style={styles.filterChip}
          >
            По возрастанию
          </Chip>
          <Chip
            selected={sortDirection === 'desc'}
            onPress={() => setSortDirection('desc')}
            style={styles.filterChip}
          >
            По убыванию
          </Chip>
        </View>
        
        <Divider />
        <View style={styles.filterMenuFooter}>
          <Button onPress={resetFilters}>Сбросить</Button>
          <Button 
            mode="contained"
            onPress={() => setFilterMenuVisible(false)}
          >
            Применить
          </Button>
        </View>
      </Menu>

      <Portal>
        <Dialog
          visible={taskDetailVisible}
          onDismiss={() => setTaskDetailVisible(false)}
          style={styles.dialog}
        >
          {selectedTask && (
            <>
              <Dialog.Title>{selectedTask.title}</Dialog.Title>
              <Dialog.Content>
                <ScrollView style={styles.dialogContent}>
                  <View style={styles.dialogSection}>
                    <Text style={styles.dialogSectionTitle}>Описание</Text>
                    <Text style={styles.dialogText}>{selectedTask.description}</Text>
                  </View>
                  
                  <View style={styles.dialogSection}>
                    <Text style={styles.dialogSectionTitle}>Срок выполнения</Text>
                    <Text 
                      style={[
                        styles.dialogText,
                        new Date(selectedTask.deadline) < new Date() && 
                        selectedTask.status !== TaskStatus.COMPLETED &&
                        selectedTask.status !== TaskStatus.CANCELLED && 
                        styles.pastDeadlineText
                      ]}
                    >
                      {formatDate(selectedTask.deadline)}
                    </Text>
                  </View>
                  
                  <View style={styles.dialogSection}>
                    <Text style={styles.dialogSectionTitle}>Назначена</Text>
                    <View style={styles.assigneeDialogContainer}>
                      <Avatar.Image 
                        size={32} 
                        source={{ uri: getEmployeeById(selectedTask.assignedTo).avatarUrl }}
                      />
                      <View style={styles.assigneeDialogInfo}>
                        <Text style={styles.dialogText}>
                          {getEmployeeById(selectedTask.assignedTo).name}
                        </Text>
                        <Text style={styles.dialogSubtext}>
                          {getEmployeeById(selectedTask.assignedTo).position}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.dialogSection}>
                    <Text style={styles.dialogSectionTitle}>Статус задачи</Text>
                    <View style={styles.statusButtonsContainer}>
                      {Object.values(TaskStatus).map((status) => (
                        <Button
                          key={status}
                          mode={selectedTask.status === status ? 'contained' : 'outlined'}
                          onPress={() => handleChangeTaskStatus(selectedTask, status)}
                          style={[
                            styles.statusButton,
                            selectedTask.status === status && { backgroundColor: getTaskStatusColor(status) }
                          ]}
                          labelStyle={selectedTask.status === status ? { color: 'white' } : undefined}
                        >
                          {getTaskStatusText(status)}
                        </Button>
                      ))}
                    </View>
                  </View>
                </ScrollView>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setTaskDetailVisible(false)}>Закрыть</Button>
              </Dialog.Actions>
            </>
          )}
        </Dialog>
      </Portal>
    </View>
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
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
    elevation: 0,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    height: 48,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    width: 48,
  },
  tasksList: {
    padding: 16,
    paddingBottom: 80,
  },
  taskItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  priorityChip: {
    height: 26,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assigneeName: {
    fontSize: 12,
    color: '#333',
    marginLeft: 8,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  pastDeadlineText: {
    color: '#dc3545',
    fontWeight: 'bold',
  },
  commentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    color: '#999',
    textAlign: 'center',
  },
  resetFiltersButton: {
    marginTop: 16,
  },
  filterMenu: {
    width: Dimensions.get('window').width * 0.9,
    maxWidth: 400,
  },
  filterMenuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: 16,
  },
  filterMenuSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    marginLeft: 16,
    marginBottom: 8,
  },
  statusFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  priorityFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  sortDirection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  filterChip: {
    margin: 4,
  },
  filterMenuFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: '80%',
  },
  dialogContent: {
    maxHeight: 400,
  },
  dialogSection: {
    marginBottom: 16,
  },
  dialogSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  dialogText: {
    fontSize: 16,
    color: '#333',
  },
  dialogSubtext: {
    fontSize: 12,
    color: '#666',
  },
  assigneeDialogContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  assigneeDialogInfo: {
    marginLeft: 16,
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  statusButton: {
    margin: 4,
  },
}); 