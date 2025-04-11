import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Dimensions, ScrollView } from 'react-native';
import { Searchbar, FAB, Chip, Menu, Divider, Button, ActivityIndicator, Dialog, Portal, Avatar } from 'react-native-paper';
import { Task, TaskPriority, TaskStatus, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTask } from '../../context/TaskContext';
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
              style={styles.assigneeAvatar}
            />
            <Text style={styles.assigneeName}>
              {getEmployeeById(item.assignedTo).name}
            </Text>
          </View>
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
          
          <Chip 
            style={[styles.statusChip, { backgroundColor: getTaskStatusColor(item.status) }]}
            textStyle={{ color: 'white', fontSize: 12 }}
          >
            {getTaskStatusText(item.status)}
          </Chip>
        </View>
      </TouchableOpacity>
    );
  };

  // Показать меню фильтров с правильным позиционированием
  const showFilterMenu = () => {
    // Используем фиксированное позиционирование вместо динамического
    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height;
    
    // Позиционируем меню в верхнем правом углу экрана
    setMenuPosition({ 
      x: windowWidth * 0.5, 
      y: 60 
    });
    
    setFilterMenuVisible(true);
  };

  const handleChangeTaskStatus = async (task: Task) => {
    if (!task) return;
    
    const newStatus = task.status === TaskStatus.ASSIGNED
      ? TaskStatus.IN_PROGRESS
      : task.status === TaskStatus.IN_PROGRESS
        ? TaskStatus.COMPLETED
        : task.status;
    
    const updatedTask = {
      ...task,
      status: newStatus,
      updatedAt: new Date()
    };
    
    try {
      await updateTask(updatedTask);
      // Закрываем диалог после успешного обновления
      setTaskDetailVisible(false);
      // Обновляем список задач
      await refreshTasks();
    } catch (error) {
      console.error('Ошибка при обновлении статуса задачи:', error);
    }
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
        <Searchbar
          placeholder="Поиск задач..."
          onChangeText={handleSearchChange}
          value={searchQuery}
          style={styles.searchBar}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TouchableOpacity 
          ref={filterButtonRef}
          style={styles.filterButton}
          onPress={showFilterMenu}
        >
          <MaterialCommunityIcons name="filter-variant" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterChips}>
        {selectedStatus && (
          <Chip 
            style={styles.chip}
            onClose={() => setSelectedStatus(null)}
            closeIconAccessibilityLabel="Удалить фильтр"
          >
            Статус: {getTaskStatusText(selectedStatus)}
          </Chip>
        )}
        
        {selectedPriority && (
          <Chip 
            style={styles.chip}
            onClose={() => setSelectedPriority(null)}
            closeIconAccessibilityLabel="Удалить фильтр"
          >
            Приоритет: {selectedPriority}
          </Chip>
        )}

        {(selectedStatus || selectedPriority || sortOption !== 'deadline' || sortDirection !== 'asc') && (
          <Chip 
            style={[styles.chip, styles.resetChip]}
            onPress={resetFilters}
          >
            Сбросить
          </Chip>
        )}
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.tasksList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery.trim() || selectedStatus || selectedPriority 
                ? 'Нет задач, соответствующих фильтрам'
                : 'Нет задач'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#2196F3']}
          />
        }
      />

      <Portal>
        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={{ x: 20, y: 60 }}
          contentStyle={{ 
            backgroundColor: 'white', 
            width: Dimensions.get('window').width - 40
          }}
        >
          <View style={styles.menuHeader}>
            <Text style={styles.menuHeaderTitle}>Фильтры и сортировка</Text>
          </View>
          <Divider />
          
          <ScrollView style={{ maxHeight: 500 }}>
            <Text style={styles.menuSectionTitle}>Статус задачи</Text>
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
            
            <Text style={styles.menuSectionTitle}>Приоритет</Text>
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
            
            <Text style={styles.menuSectionTitle}>Сортировка</Text>
            <View style={styles.sortOptions}>
              <View style={styles.sortOptionRow}>
                <Text>По дате выполнения</Text>
                <Button
                  compact
                  onPress={() => {
                    setSortOption('deadline');
                    setSortDirection(
                      sortOption === 'deadline' && sortDirection === 'asc' ? 'desc' : 'asc'
                    );
                  }}
                  icon={sortOption === 'deadline' 
                    ? sortDirection === 'asc' 
                      ? 'arrow-up' 
                      : 'arrow-down' 
                    : undefined
                  }
                  mode={sortOption === 'deadline' ? 'contained' : 'outlined'}
                  style={styles.sortButton}
                >
                  Выбрать
                </Button>
              </View>
              
              <View style={styles.sortOptionRow}>
                <Text>По приоритету</Text>
                <Button
                  compact
                  onPress={() => {
                    setSortOption('priority');
                    setSortDirection(
                      sortOption === 'priority' && sortDirection === 'asc' ? 'desc' : 'asc'
                    );
                  }}
                  icon={sortOption === 'priority' 
                    ? sortDirection === 'asc' 
                      ? 'arrow-up' 
                      : 'arrow-down' 
                    : undefined
                  }
                  mode={sortOption === 'priority' ? 'contained' : 'outlined'}
                  style={styles.sortButton}
                >
                  Выбрать
                </Button>
              </View>
              
              <View style={styles.sortOptionRow}>
                <Text>По статусу</Text>
                <Button
                  compact
                  onPress={() => {
                    setSortOption('status');
                    setSortDirection(
                      sortOption === 'status' && sortDirection === 'asc' ? 'desc' : 'asc'
                    );
                  }}
                  icon={sortOption === 'status' 
                    ? sortDirection === 'asc' 
                      ? 'arrow-up' 
                      : 'arrow-down' 
                    : undefined
                  }
                  mode={sortOption === 'status' ? 'contained' : 'outlined'}
                  style={styles.sortButton}
                >
                  Выбрать
                </Button>
              </View>
            </View>
          </ScrollView>
          
          <Divider />
          <View style={styles.filterActions}>
            <Button onPress={() => {
              resetFilters();
              setFilterMenuVisible(false);
            }}>
              Сбросить
            </Button>
            <Button 
              mode="contained" 
              onPress={() => {
                applyFilters();
                setFilterMenuVisible(false);
              }}
            >
              Применить
            </Button>
          </View>
        </Menu>
      </Portal>

      <Portal>
        <Dialog 
          visible={taskDetailVisible} 
          onDismiss={() => setTaskDetailVisible(false)}
          style={styles.taskDialog}
        >
          {selectedTask && (
            <>
              <Dialog.Title>{selectedTask.title}</Dialog.Title>
              <Dialog.Content>
                <View style={styles.dialogSection}>
                  <Text style={styles.dialogSectionTitle}>Статус</Text>
                  <Chip 
                    style={{ backgroundColor: getTaskStatusColor(selectedTask.status) }}
                    textStyle={{ color: 'white' }}
                  >
                    {getTaskStatusText(selectedTask.status)}
                  </Chip>
                </View>

                <View style={styles.dialogSection}>
                  <Text style={styles.dialogSectionTitle}>Приоритет</Text>
                  <Chip 
                    style={{ backgroundColor: getTaskPriorityColor(selectedTask.priority) }}
                    textStyle={{ color: 'white' }}
                  >
                    {selectedTask.priority}
                  </Chip>
                </View>

                <View style={styles.dialogSection}>
                  <Text style={styles.dialogSectionTitle}>Срок выполнения</Text>
                  <Text style={styles.dialogText}>{formatDate(selectedTask.deadline)}</Text>
                </View>

                <View style={styles.dialogSection}>
                  <Text style={styles.dialogSectionTitle}>Описание</Text>
                  <Text style={styles.dialogText}>{selectedTask.description}</Text>
                </View>

                <View style={styles.dialogSection}>
                  <Text style={styles.dialogSectionTitle}>Назначена</Text>
                  <View style={styles.assigneeContainer}>
                    {selectedTask.assignedTo && (
                      <>
                        <Avatar.Image 
                          size={36} 
                          source={{ uri: getEmployeeById(selectedTask.assignedTo).avatarUrl }} 
                          style={styles.assigneeAvatar}
                        />
                        <View style={styles.assigneeInfo}>
                          <Text style={styles.assigneeName}>{getEmployeeById(selectedTask.assignedTo).name}</Text>
                          <Text style={styles.assigneePosition}>{getEmployeeById(selectedTask.assignedTo).position}</Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setTaskDetailVisible(false)}>Закрыть</Button>
                {selectedTask.status !== TaskStatus.COMPLETED && selectedTask.status !== TaskStatus.CANCELLED && (
                  <Button 
                    mode="contained"
                    onPress={() => handleChangeTaskStatus(selectedTask)}
                  >
                    {selectedTask.status === TaskStatus.ASSIGNED ? 'Начать работу' : 'Завершить'}
                  </Button>
                )}
              </Dialog.Actions>
            </>
          )}
        </Dialog>
      </Portal>

      {(user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER) && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => router.push('/(tabs)/tasks/create')}
        />
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
    elevation: 0,
  },
  filterButton: {
    padding: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  chip: {
    margin: 4,
  },
  resetChip: {
    backgroundColor: '#f44336',
  },
  tasksList: {
    padding: 8,
  },
  taskItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
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
    height: 24,
  },
  taskDescription: {
    color: '#666',
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    height: 24,
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
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    marginTop: 8,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
  menuHeader: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  menuSectionTitle: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#333',
  },
  statusFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  priorityFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  filterChip: {
    margin: 4,
  },
  sortOptions: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sortOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  sortButton: {
    minWidth: 100,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
  },
  taskDialog: {
    maxHeight: '80%',
  },
  dialogSection: {
    marginBottom: 16,
  },
  dialogSectionTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#666',
  },
  dialogText: {
    fontSize: 16,
    lineHeight: 24,
  },
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  assigneeAvatar: {
    marginRight: 12,
  },
  assigneeInfo: {
    flex: 1,
  },
  assigneeName: {
    fontSize: 16,
    fontWeight: '500',
  },
  assigneePosition: {
    fontSize: 14,
    color: '#666',
  },
  taskMeta: {
    marginBottom: 8,
  },
}); 