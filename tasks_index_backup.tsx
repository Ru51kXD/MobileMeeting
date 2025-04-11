import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Dimensions, ScrollView } from 'react-native';
import { Searchbar, FAB, Chip, Menu, Divider, Button, ActivityIndicator, Dialog, Portal, Avatar } from 'react-native-paper';
import { useAuth } from './context/AuthContext';
import { useTask } from './context/TaskContext';
import { useTheme } from './context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedContainer } from '@/components/ThemedContainer';
import { Colors } from '@/constants/Colors';
import { User, Task, UserRole, TaskStatus, TaskPriority } from './types/index';

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
  const { isDark } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
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

  const getTaskPriorityColor = (priority: string) => {
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

  // Динамические стили на основе темы
  const dynamicStyles = {
    header: {
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      borderBottomColor: isDark ? '#333' : '#eee',
    },
    headerTitle: {
      color: isDark ? Colors.dark.text : '#333',
    },
    searchBar: {
      backgroundColor: isDark ? '#2c2c2c' : '#f2f2f2',
    },
    filterButton: {
      backgroundColor: isDark ? '#2c2c2c' : '#f2f2f2',
    },
    taskItem: {
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      shadowColor: isDark ? '#000' : '#000',
    },
    taskTitle: {
      color: isDark ? Colors.dark.text : '#333',
    },
    completedTaskTitle: {
      color: isDark ? '#666' : '#888',
    },
    taskDescription: {
      color: isDark ? '#aaa' : '#666',
    },
  };

  const renderTaskItem = ({ item }: { item: Task }) => {
    const isPastDeadline = new Date(item.deadline) < new Date() && 
                           item.status !== TaskStatus.COMPLETED &&
                           item.status !== TaskStatus.CANCELLED;

    return (
      <TouchableOpacity 
        style={[styles.taskItem, dynamicStyles.taskItem]} 
        onPress={() => handleTaskPress(item)}
      >
        <View style={styles.taskHeader}>
          <Text 
            style={[
              styles.taskTitle,
              dynamicStyles.taskTitle,
              (item.status === TaskStatus.COMPLETED || item.status === TaskStatus.CANCELLED) && 
              [styles.completedTaskTitle, dynamicStyles.completedTaskTitle]
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Chip 
            mode="outlined" 
            style={[styles.priorityChip, { borderColor: getTaskPriorityColor(item.priority) }]}
            textStyle={{ color: getTaskPriorityColor(item.priority) }}
          >
            {item.priority === TaskPriority.LOW ? 'Низкий' :
             item.priority === TaskPriority.MEDIUM ? 'Средний' :
             item.priority === TaskPriority.HIGH ? 'Высокий' : 'Срочно'}
          </Chip>
        </View>
        
        {item.description && (
          <Text 
            style={[styles.taskDescription, dynamicStyles.taskDescription]} 
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}
        
        <View style={styles.taskMeta}>
          <View style={styles.taskMetaItem}>
            <MaterialCommunityIcons name="calendar" size={16} color={isDark ? '#888' : '#666'} style={{ marginRight: 4 }} />
            <Text style={{ color: isDark ? '#888' : '#666' }}>
              Срок: {formatDate(item.deadline)}
            </Text>
          </View>
          
          <Chip 
            mode="flat" 
            style={{ backgroundColor: getTaskStatusColor(item.status), height: 22 }}
            textStyle={{ color: '#fff', fontSize: 12 }}
          >
            {getTaskStatusText(item.status)}
          </Chip>
        </View>
        
        <View style={styles.taskFooter}>
          <View style={styles.assigneeContainer}>
            <Avatar.Image 
              size={24} 
              source={{ uri: getEmployeeById(item.assignedTo)?.avatarUrl }} 
              style={{ marginRight: 8 }}
            />
            <Text style={{ color: isDark ? '#888' : '#666' }}>
              {getEmployeeById(item.assignedTo)?.name}
            </Text>
          </View>
          
          {user?.role !== UserRole.EMPLOYEE && (
            <MaterialCommunityIcons name="chevron-right" size={24} color={isDark ? '#555' : '#ccc'} />
          )}
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
    <ThemedContainer>
      <View style={[styles.header, dynamicStyles.header]}>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Задачи</Text>
        
        <View style={styles.searchContainer}>
          <Searchbar 
            placeholder="Поиск по названию или описанию"
            onChangeText={handleSearchChange}
            value={searchQuery}
            style={[styles.searchBar, dynamicStyles.searchBar]}
            iconColor={isDark ? Colors.dark.icon : Colors.light.icon}
            inputStyle={{ color: isDark ? Colors.dark.text : Colors.light.text }}
            placeholderTextColor={isDark ? '#888' : '#666'}
          />
          
          <TouchableOpacity 
            ref={filterButtonRef}
            style={[styles.filterButton, dynamicStyles.filterButton]}
            onPress={showFilterMenu}
          >
            <MaterialCommunityIcons name="filter-variant" size={24} color={isDark ? Colors.dark.icon : Colors.light.icon} />
          </TouchableOpacity>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={renderTaskItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.tasksList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2196F3"]}
            />
          }
          ListEmptyComponent={
            <View style={{ padding: 20, alignItems: 'center' }}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={isDark ? '#555' : '#ccc'} />
              <Text style={{ marginTop: 12, color: isDark ? '#888' : '#666', textAlign: 'center' }}>
                {searchQuery || selectedStatus || selectedPriority ? 
                  'Нет задач, соответствующих фильтрам' : 
                  'Нет доступных задач'}
              </Text>
              {(searchQuery || selectedStatus || selectedPriority) && (
                <Button mode="text" onPress={resetFilters} style={{ marginTop: 8 }}>
                  Сбросить фильтры
                </Button>
              )}
            </View>
          }
        />
      )}
      
      {(user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER) && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={goToCreateTask}
        />
      )}
      
      <Portal>
        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={menuPosition}
          contentStyle={{ backgroundColor: isDark ? '#2c2c2c' : 'white' }}
        >
          <Menu.Item 
            title="Фильтр по статусу"
            disabled 
            titleStyle={{ fontSize: 14, fontWeight: 'bold', color: isDark ? Colors.dark.text : '#333' }} 
          />
          <Menu.Item
            title="Все статусы"
            onPress={() => {
              setSelectedStatus(null);
              setFilterMenuVisible(false);
            }}
            titleStyle={{ color: selectedStatus === null ? '#2196F3' : (isDark ? Colors.dark.text : '#333') }}
          />
          <Menu.Item
            title="В очереди"
            onPress={() => {
              setSelectedStatus(TaskStatus.ASSIGNED);
              setFilterMenuVisible(false);
            }}
            titleStyle={{ color: selectedStatus === TaskStatus.ASSIGNED ? '#2196F3' : (isDark ? Colors.dark.text : '#333') }}
          />
          <Menu.Item
            title="В работе"
            onPress={() => {
              setSelectedStatus(TaskStatus.IN_PROGRESS);
              setFilterMenuVisible(false);
            }}
            titleStyle={{ color: selectedStatus === TaskStatus.IN_PROGRESS ? '#2196F3' : (isDark ? Colors.dark.text : '#333') }}
          />
          <Menu.Item
            title="Завершено"
            onPress={() => {
              setSelectedStatus(TaskStatus.COMPLETED);
              setFilterMenuVisible(false);
            }}
            titleStyle={{ color: selectedStatus === TaskStatus.COMPLETED ? '#2196F3' : (isDark ? Colors.dark.text : '#333') }}
          />
          <Divider style={{ backgroundColor: isDark ? '#444' : '#eee' }} />
          
          <Menu.Item 
            title="Фильтр по приоритету" 
            disabled 
            titleStyle={{ fontSize: 14, fontWeight: 'bold', color: isDark ? Colors.dark.text : '#333' }} 
          />
          <Menu.Item
            title="Все приоритеты"
            onPress={() => {
              setSelectedPriority(null);
              setFilterMenuVisible(false);
            }}
            titleStyle={{ color: selectedPriority === null ? '#2196F3' : (isDark ? Colors.dark.text : '#333') }}
          />
          <Menu.Item
            title="Низкий"
            onPress={() => {
              setSelectedPriority(TaskPriority.LOW);
              setFilterMenuVisible(false);
            }}
            titleStyle={{ color: selectedPriority === TaskPriority.LOW ? '#2196F3' : (isDark ? Colors.dark.text : '#333') }}
          />
          <Menu.Item
            title="Средний"
            onPress={() => {
              setSelectedPriority(TaskPriority.MEDIUM);
              setFilterMenuVisible(false);
            }}
            titleStyle={{ color: selectedPriority === TaskPriority.MEDIUM ? '#2196F3' : (isDark ? Colors.dark.text : '#333') }}
          />
          <Menu.Item
            title="Высокий"
            onPress={() => {
              setSelectedPriority(TaskPriority.HIGH);
              setFilterMenuVisible(false);
            }}
            titleStyle={{ color: selectedPriority === TaskPriority.HIGH ? '#2196F3' : (isDark ? Colors.dark.text : '#333') }}
          />
          <Menu.Item
            title="Срочный"
            onPress={() => {
              setSelectedPriority(TaskPriority.URGENT);
              setFilterMenuVisible(false);
            }}
            titleStyle={{ color: selectedPriority === TaskPriority.URGENT ? '#2196F3' : (isDark ? Colors.dark.text : '#333') }}
          />
          <Divider style={{ backgroundColor: isDark ? '#444' : '#eee' }} />
          
          <Menu.Item 
            title="Сортировка" 
            disabled 
            titleStyle={{ fontSize: 14, fontWeight: 'bold', color: isDark ? Colors.dark.text : '#333' }} 
          />
          <Menu.Item
            title={`По сроку (${sortDirection === 'asc' ? 'сначала ближайшие' : 'сначала дальние'})`}
            onPress={() => {
              if (sortOption === 'deadline') {
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              } else {
                setSortOption('deadline');
                setSortDirection('asc');
              }
              setFilterMenuVisible(false);
            }}
            titleStyle={{ color: sortOption === 'deadline' ? '#2196F3' : (isDark ? Colors.dark.text : '#333') }}
          />
          <Menu.Item
            title={`По приоритету (${sortDirection === 'asc' ? 'сначала низкий' : 'сначала высокий'})`}
            onPress={() => {
              if (sortOption === 'priority') {
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              } else {
                setSortOption('priority');
                setSortDirection('desc');
              }
              setFilterMenuVisible(false);
            }}
            titleStyle={{ color: sortOption === 'priority' ? '#2196F3' : (isDark ? Colors.dark.text : '#333') }}
          />
          <Menu.Item
            title={`По статусу (${sortDirection === 'asc' ? 'в очереди - завершенные' : 'завершенные - в очереди'})`}
            onPress={() => {
              if (sortOption === 'status') {
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              } else {
                setSortOption('status');
                setSortDirection('asc');
              }
              setFilterMenuVisible(false);
            }}
            titleStyle={{ color: sortOption === 'status' ? '#2196F3' : (isDark ? Colors.dark.text : '#333') }}
          />
          <Divider style={{ backgroundColor: isDark ? '#444' : '#eee' }} />
          
          <Menu.Item
            title="Сбросить все фильтры"
            onPress={() => {
              resetFilters();
              setFilterMenuVisible(false);
            }}
            titleStyle={{ color: '#F44336' }}
          />
        </Menu>
      </Portal>
    
      {/* Подробная информация о задаче */}
      <Portal>
        <Dialog 
          visible={taskDetailVisible} 
          onDismiss={() => setTaskDetailVisible(false)}
          style={{ backgroundColor: isDark ? '#1e1e1e' : 'white' }}
        >
          {selectedTask && (
            <>
              <Dialog.Title style={{ color: isDark ? Colors.dark.text : '#333' }}>{selectedTask.title}</Dialog.Title>
              <Dialog.Content>
                {selectedTask.description && (
                  <Text style={{ marginBottom: 16, color: isDark ? '#aaa' : '#666' }}>
                    {selectedTask.description}
                  </Text>
                )}
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontWeight: 'bold', marginRight: 8, color: isDark ? Colors.dark.text : '#333' }}>
                    Статус:
                  </Text>
                  <Chip 
                    mode="flat" 
                    style={{ backgroundColor: getTaskStatusColor(selectedTask.status) }}
                    textStyle={{ color: '#fff' }}
                  >
                    {getTaskStatusText(selectedTask.status)}
                  </Chip>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontWeight: 'bold', marginRight: 8, color: isDark ? Colors.dark.text : '#333' }}>
                    Приоритет:
                  </Text>
                  <Chip 
                    mode="outlined" 
                    style={{ borderColor: getTaskPriorityColor(selectedTask.priority) }}
                    textStyle={{ color: getTaskPriorityColor(selectedTask.priority) }}
                  >
                    {selectedTask.priority === TaskPriority.LOW ? 'Низкий' :
                     selectedTask.priority === TaskPriority.MEDIUM ? 'Средний' :
                     selectedTask.priority === TaskPriority.HIGH ? 'Высокий' : 'Срочно'}
                  </Chip>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontWeight: 'bold', marginRight: 8, color: isDark ? Colors.dark.text : '#333' }}>
                    Срок выполнения:
                  </Text>
                  <Text style={{ color: isDark ? '#aaa' : '#666' }}>
                    {formatDate(selectedTask.deadline)}
                  </Text>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontWeight: 'bold', marginRight: 8, color: isDark ? Colors.dark.text : '#333' }}>
                    Исполнитель:
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Avatar.Image 
                      size={24} 
                      source={{ uri: getEmployeeById(selectedTask.assignedTo)?.avatarUrl }} 
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{ color: isDark ? '#aaa' : '#666' }}>
                      {getEmployeeById(selectedTask.assignedTo)?.name}
                    </Text>
                  </View>
                </View>
                
                {user?.id === selectedTask.assignedTo && selectedTask.status !== TaskStatus.COMPLETED && selectedTask.status !== TaskStatus.CANCELLED && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 8, color: isDark ? Colors.dark.text : '#333' }}>
                      Действия:
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      {selectedTask.status === TaskStatus.ASSIGNED && (
                        <Button 
                          mode="contained" 
                          onPress={() => handleChangeTaskStatus(selectedTask, TaskStatus.IN_PROGRESS)}
                          style={{ flex: 1 }}
                        >
                          Начать работу
                        </Button>
                      )}
                      
                      {selectedTask.status === TaskStatus.IN_PROGRESS && (
                        <Button 
                          mode="contained" 
                          onPress={() => handleChangeTaskStatus(selectedTask, TaskStatus.COMPLETED)}
                          style={{ flex: 1 }}
                        >
                          Завершить задачу
                        </Button>
                      )}
                    </View>
                  </View>
                )}
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setTaskDetailVisible(false)}>Закрыть</Button>
              </Dialog.Actions>
            </>
          )}
        </Dialog>
      </Portal>
    </ThemedContainer>
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