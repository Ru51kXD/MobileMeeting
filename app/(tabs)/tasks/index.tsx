import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Dimensions, ScrollView, Alert } from 'react-native';
import { Searchbar, FAB, Chip, Menu, Divider, Button, ActivityIndicator, Dialog, Portal, Avatar } from 'react-native-paper';
import { useAuth } from '../../../context/AuthContext';
import { useTask } from '../../../context/TaskContext';
import { useTheme } from '../../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, isSameDay, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedContainer } from '@/components/ThemedContainer';
import { Colors } from '@/constants/Colors';
import { UserRole, TaskPriority, TaskStatus, Task } from '../../../types/index';
import { LinearGradient } from 'expo-linear-gradient';

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
  const { tasks: allTasks, refreshTasks, updateTask, deleteTask } = useTask();
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
      backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
      borderBottomColor: isDark ? '#333' : '#eee',
    },
    headerTitle: {
      color: isDark ? Colors.dark.text : '#333',
    },
    searchBar: {
      backgroundColor: isDark ? '#2c2c2c' : '#f5f5f5',
      borderRadius: 12,
    },
    filterButton: {
      backgroundColor: isDark ? '#2c2c2c' : '#f5f5f5',
      borderRadius: 12,
    },
    taskItem: {
      backgroundColor: isDark ? '#2c2c2e' : '#ffffff',
      shadowColor: isDark ? '#000' : '#000',
      borderRadius: 16,
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 0,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 5,
      elevation: 4,
      overflow: 'hidden',
    },
    taskTitle: {
      color: isDark ? Colors.dark.text : '#333',
      fontWeight: '600',
      fontSize: 16,
    },
    completedTaskTitle: {
      color: isDark ? '#7f7f7f' : '#999',
      textDecorationLine: 'line-through',
    },
    taskDescription: {
      color: isDark ? '#b0b0b0' : '#666',
      marginTop: 4,
      lineHeight: 20,
    },
    dialog: {
      backgroundColor: isDark ? '#2c2c2e' : '#ffffff',
      borderRadius: 16,
    },
    dialogTitle: {
      color: isDark ? Colors.dark.text : '#333',
      fontWeight: '600',
    },
    dialogDescription: {
      color: isDark ? '#aaa' : '#666',
      lineHeight: 20,
    },
    dialogLabel: {
      fontWeight: 'bold',
      color: isDark ? Colors.dark.text : '#333',
    },
  };

  const renderTaskItem = ({ item }: { item: Task }) => {
    const isPastDeadline = new Date(item.deadline) < new Date() && 
                           item.status !== TaskStatus.COMPLETED &&
                           item.status !== TaskStatus.CANCELLED;
                           
    const assignedEmployee = getEmployeeById(item.assignedTo);
    const isTaskToday = isToday(new Date(item.deadline));

    // Определение цветов для градиента карточки в зависимости от приоритета
    let gradientColors;
    let borderLeftColor;
    
    switch (item.priority) {
      case TaskPriority.LOW:
        gradientColors = isDark ? ['#263238', '#2c353a'] : ['#ffffff', '#f9fff9'];
        borderLeftColor = '#28a745';
        break;
      case TaskPriority.MEDIUM:
        gradientColors = isDark ? ['#263238', '#2c3838'] : ['#ffffff', '#fffff9'];
        borderLeftColor = '#ffc107';
        break;
      case TaskPriority.HIGH:
        gradientColors = isDark ? ['#2d2d38', '#332d38'] : ['#ffffff', '#fff9f9'];
        borderLeftColor = '#fd7e14';
        break;
      case TaskPriority.URGENT:
        gradientColors = isDark ? ['#3d2d2d', '#38232d'] : ['#ffffff', '#fff5f5'];
        borderLeftColor = '#dc3545';
        break;
      default:
        gradientColors = isDark ? ['#2d2d38', '#2c2c2e'] : ['#ffffff', '#fafafa'];
        borderLeftColor = '#6c757d';
    }

    return (
      <TouchableOpacity
        style={[
          styles.taskItem, 
          dynamicStyles.taskItem,
          item.status === TaskStatus.COMPLETED && styles.completedTask
        ]}
        onPress={() => handleTaskPress(item)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={gradientColors}
          style={[
            styles.taskItemGradient, 
            { 
              borderLeftWidth: 4,
              borderLeftColor: borderLeftColor
            }
          ]}
        >
          <View style={styles.taskHeader}>
            <View style={styles.taskTitleContainer}>
              <Text 
                style={[
                  styles.taskTitle, 
                  dynamicStyles.taskTitle,
                  item.status === TaskStatus.COMPLETED && [styles.completedTaskTitle, dynamicStyles.completedTaskTitle]
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              
              {isTaskToday && item.status !== TaskStatus.COMPLETED && (
                <View style={styles.todayIndicator}>
                  <Text style={styles.todayText}>Сегодня</Text>
                </View>
              )}
            </View>
          </View>

          {item.description ? (
            <Text 
              style={[styles.taskDescription, dynamicStyles.taskDescription]} 
              numberOfLines={2}
            >
              {item.description}
            </Text>
          ) : null}
          
          <View style={[styles.taskMetaContainer, !item.description && styles.taskMetaNoDescription]}>
            <View style={styles.assigneeSection}>
              <Avatar.Image 
                size={24} 
                source={{ uri: assignedEmployee.avatarUrl }}
                style={styles.assigneeAvatar}
              />
              <Text style={[styles.assigneeName, { color: isDark ? '#aaa' : '#666' }]} numberOfLines={1}>
                {assignedEmployee.name}
              </Text>
            </View>
            
            <View style={styles.taskMetaInfo}>
              <View style={styles.taskDeadline}>
                <MaterialCommunityIcons 
                  name="calendar" 
                  size={16} 
                  color={isPastDeadline ? '#dc3545' : (isDark ? '#888' : '#666')} 
                />
                <Text 
                  style={[
                    styles.deadlineText, 
                    isPastDeadline && styles.pastDeadlineText,
                    { color: isPastDeadline ? '#dc3545' : (isDark ? '#aaa' : '#666') }
                  ]}
                >
                  {format(new Date(item.deadline), 'dd MMM, HH:mm', { locale: ru })}
                </Text>
              </View>
              
              <View style={[
                styles.taskStatusChip,
                { backgroundColor: getTaskStatusColor(item.status) + '20' }
              ]}>
                <Text style={[
                  styles.taskStatusText,
                  { color: getTaskStatusColor(item.status) }
                ]}>
                  {getTaskStatusText(item.status)}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
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

  // Функция для перехода на экран редактирования задачи
  const goToEditTask = (task: Task) => {
    router.push({
      pathname: '/(tabs)/tasks/create',
      params: { taskId: task.id }
    });
  };

  // Функция для перехода на экран создания задачи
  const goToCreateTask = () => {
    router.push('/(tabs)/tasks/create');
  };

  // Функция для удаления задачи
  const handleDeleteTask = async (task: Task) => {
    if (!task) return;

    Alert.alert(
      'Удаление задачи',
      'Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить.',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(task.id);
              setTaskDetailVisible(false);
              // После удаления обновляем список задач
              await refreshTasks();
            } catch (error) {
              console.error('Ошибка при удалении задачи:', error);
              Alert.alert('Ошибка', 'Не удалось удалить задачу. Попробуйте еще раз.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={isDark ? Colors.dark.tint : Colors.light.tint} />
      </View>
    );
  }

  return (
    <ThemedContainer style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#1c1c1e', '#252527'] : ['#ffffff', '#f9f9f9']}
        style={[styles.header, dynamicStyles.header]}
      >
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Задачи</Text>
        
        <View style={styles.searchFilterContainer}>
          <Searchbar
            placeholder="Поиск задач..."
            onChangeText={handleSearchChange}
            value={searchQuery}
            style={[styles.searchBar, dynamicStyles.searchBar]}
            inputStyle={styles.searchInput}
            iconColor={isDark ? '#999' : '#666'}
            clearIcon="close-circle"
          />
          
          <TouchableOpacity
            ref={filterButtonRef}
            style={[styles.filterButton, dynamicStyles.filterButton]}
            onPress={showFilterMenu}
          >
            <MaterialCommunityIcons 
              name="filter-variant" 
              size={24} 
              color={isDark ? Colors.dark.tint : Colors.light.tint} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.chipContainer}>
          {selectedStatus && (
            <Chip 
              mode="outlined" 
              onClose={() => setSelectedStatus(null)}
              style={[styles.chip, { borderColor: isDark ? '#555' : '#ddd' }]}
              textStyle={{ color: isDark ? Colors.dark.text : Colors.light.text }}
            >
              {getTaskStatusText(selectedStatus as TaskStatus)}
            </Chip>
          )}
          
          {selectedPriority && (
            <Chip 
              mode="outlined" 
              onClose={() => setSelectedPriority(null)}
              style={[styles.chip, { borderColor: isDark ? '#555' : '#ddd' }]}
              textStyle={{ color: isDark ? Colors.dark.text : Colors.light.text }}
            >
              {selectedPriority}
            </Chip>
          )}
          
          {(selectedStatus || selectedPriority) && (
            <Chip 
              mode="outlined" 
              onPress={resetFilters}
              style={[styles.chip, { borderColor: isDark ? '#555' : '#ddd' }]}
              textStyle={{ color: isDark ? '#ff5252' : '#e53935' }}
            >
              Сбросить
            </Chip>
          )}
        </View>
      </LinearGradient>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? Colors.dark.tint : Colors.light.tint} />
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={renderTaskItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.taskList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[isDark ? Colors.dark.tint : Colors.light.tint]}
              tintColor={isDark ? Colors.dark.tint : Colors.light.tint}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={isDark ? '#555' : '#ccc'} />
              <Text style={[styles.emptyText, { color: isDark ? Colors.dark.text : Colors.light.text }]}>
                {searchQuery.trim() || selectedStatus || selectedPriority ? 
                  'Задачи не найдены. Попробуйте изменить параметры поиска.' : 
                  'Нет активных задач.'}
              </Text>
              <Button 
                mode="contained" 
                onPress={user?.role !== UserRole.EMPLOYEE ? goToCreateTask : resetFilters}
                style={styles.emptyButton}
                buttonColor={isDark ? Colors.dark.tint : Colors.light.tint}
              >
                {user?.role !== UserRole.EMPLOYEE ? 'Создать задачу' : 'Сбросить фильтры'}
              </Button>
            </View>
          }
        />
      )}
      
      <FAB
        style={[
          styles.fab,
          { backgroundColor: isDark ? Colors.dark.tint : Colors.light.tint }
        ]}
        icon="plus"
        color="#fff"
        onPress={goToCreateTask}
        visible={user?.role !== UserRole.EMPLOYEE}
      />
      
      <Portal>
        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={menuPosition}
          contentStyle={{ 
            backgroundColor: isDark ? '#2c2c2e' : 'white',
            borderRadius: 16,
            marginTop: 8
          }}
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
          style={[styles.dialog, dynamicStyles.dialog]}
        >
          {selectedTask && (
            <>
              <Dialog.Title style={dynamicStyles.dialogTitle}>{selectedTask.title}</Dialog.Title>
              <Dialog.Content>
                <Text style={[styles.dialogDescription, dynamicStyles.dialogDescription]}>
                  {selectedTask.description}
                </Text>
                
                {/* Определяем isPastDeadline для использования в диалоге */}
                {(() => {
                  const isPastDeadline = new Date(selectedTask.deadline) < new Date() && 
                                        selectedTask.status !== TaskStatus.COMPLETED &&
                                        selectedTask.status !== TaskStatus.CANCELLED;
                  
                  return (
                    <>
                      <View style={styles.dialogSection}>
                        <Text style={dynamicStyles.dialogLabel}>Срок выполнения:</Text>
                        <Text style={{ color: isPastDeadline ? '#dc3545' : (isDark ? '#aaa' : '#666') }}>
                          {formatDate(selectedTask.deadline)}
                          {isPastDeadline && ' (Просрочено)'}
                        </Text>
                      </View>
                      
                      <View style={styles.dialogSection}>
                        <Text style={dynamicStyles.dialogLabel}>Приоритет:</Text>
                        <View style={[
                          styles.statusChipContainer,
                          { backgroundColor: getTaskPriorityColor(selectedTask.priority) + '20' }
                        ]}>
                          <Text style={{ color: getTaskPriorityColor(selectedTask.priority), fontWeight: '500' }}>
                            {selectedTask.priority}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.dialogSection}>
                        <Text style={dynamicStyles.dialogLabel}>Статус:</Text>
                        <View style={[
                          styles.statusChipContainer,
                          { backgroundColor: getTaskStatusColor(selectedTask.status) + '20' }
                        ]}>
                          <Text style={{ color: getTaskStatusColor(selectedTask.status), fontWeight: '500' }}>
                            {getTaskStatusText(selectedTask.status)}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.dialogSection}>
                        <Text style={dynamicStyles.dialogLabel}>Ответственный:</Text>
                        <View style={styles.assigneeDialogContainer}>
                          <Avatar.Image 
                            size={32} 
                            source={{ uri: getEmployeeById(selectedTask.assignedTo)?.avatarUrl }}
                            style={{ marginRight: 12 }}
                          />
                          <View>
                            <Text style={[styles.assigneeDialogName, { color: isDark ? Colors.dark.text : '#333' }]}>
                              {getEmployeeById(selectedTask.assignedTo)?.name}
                            </Text>
                            <Text style={[styles.assigneeDialogPosition, { color: isDark ? '#aaa' : '#666' }]}>
                              {getEmployeeById(selectedTask.assignedTo)?.position}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </>
                  );
                })()}
                
                {/* Добавляем условие для показа действий для админа или ответственного */}
                {(user?.role === UserRole.ADMIN || user?.id === selectedTask.assignedTo) && 
                 (selectedTask.status !== TaskStatus.COMPLETED && selectedTask.status !== TaskStatus.CANCELLED) && (
                  <View style={styles.dialogActionsSection}>
                    <Text style={[dynamicStyles.dialogLabel, styles.actionsLabel]}>
                      Действия:
                    </Text>
                    <View style={styles.actionButtonsContainer}>
                      {/* Кнопки для всех пользователей */}
                      {selectedTask.status === TaskStatus.ASSIGNED && user?.id === selectedTask.assignedTo && (
                        <Button 
                          mode="contained" 
                          onPress={() => handleChangeTaskStatus(selectedTask, TaskStatus.IN_PROGRESS)}
                          style={styles.actionButton}
                          buttonColor={Colors.light.tint}
                          icon="play"
                        >
                          Начать работу
                        </Button>
                      )}
                      
                      {selectedTask.status === TaskStatus.IN_PROGRESS && user?.id === selectedTask.assignedTo && (
                        <Button 
                          mode="contained" 
                          onPress={() => handleChangeTaskStatus(selectedTask, TaskStatus.COMPLETED)}
                          style={styles.actionButton}
                          buttonColor="#28a745"
                          icon="check"
                        >
                          Завершить
                        </Button>
                      )}
                      
                      {/* Кнопки только для админа */}
                      {user?.role === UserRole.ADMIN && (
                        <View style={styles.adminButtonsContainer}>
                          <Button 
                            mode="contained" 
                            onPress={() => goToEditTask(selectedTask)}
                            style={[styles.actionButton, styles.adminButton]}
                            buttonColor={isDark ? '#333' : '#6c757d'}
                            icon="pencil"
                          >
                            Редактировать
                          </Button>
                          
                          {selectedTask.status !== TaskStatus.COMPLETED && (
                            <Button 
                              mode="contained" 
                              onPress={() => handleChangeTaskStatus(selectedTask, TaskStatus.COMPLETED)}
                              style={[styles.actionButton, styles.adminButton]}
                              buttonColor="#28a745"
                              icon="check"
                            >
                              Завершить
                            </Button>
                          )}
                          
                          {selectedTask.status !== TaskStatus.CANCELLED && (
                            <Button 
                              mode="contained" 
                              onPress={() => handleChangeTaskStatus(selectedTask, TaskStatus.CANCELLED)}
                              style={[styles.actionButton, styles.adminButton]}
                              buttonColor="#dc3545"
                              icon="close"
                            >
                              Отменить
                            </Button>
                          )}
                          
                          <Button 
                            mode="contained" 
                            onPress={() => handleDeleteTask(selectedTask)}
                            style={[styles.actionButton, styles.adminButton]}
                            buttonColor="#dc3545"
                            icon="delete"
                          >
                            Удалить задачу
                          </Button>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </Dialog.Content>
              <Dialog.Actions>
                <Button 
                  onPress={() => setTaskDetailVisible(false)}
                  textColor={isDark ? Colors.dark.tint : Colors.light.tint}
                >
                  Закрыть
                </Button>
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
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    elevation: 2,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    height: 40,
    marginRight: 8,
    elevation: 0,
  },
  searchInput: {
    fontSize: 14,
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    height: 30,
  },
  taskList: {
    paddingVertical: 8,
    paddingBottom: 80,
  },
  taskItem: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  taskItemGradient: {
    padding: 16,
    height: 'auto',
    minHeight: 90,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayIndicator: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  todayText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  taskDescription: {
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  taskMetaContainer: {
    marginTop: 8,
  },
  taskMetaNoDescription: {
    marginTop: 16,
  },
  assigneeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assigneeAvatar: {
    marginRight: 8,
  },
  assigneeName: {
    fontSize: 13,
  },
  taskMetaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  taskDeadline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineText: {
    fontSize: 12,
    marginLeft: 4,
  },
  pastDeadlineText: {
    fontWeight: '500',
  },
  taskStatusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskStatusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  completedTask: {
    opacity: 0.7,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: 8,
  },
  dialog: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  dialogDescription: {
    marginBottom: 24,
    lineHeight: 20,
  },
  dialogSection: {
    marginBottom: 16,
  },
  statusChipContainer: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  statusChipGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  priorityChipContainer: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  priorityChipGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dialogIcon: {
    marginRight: 8,
  },
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dialogAvatar: {
    marginRight: 12,
  },
  assigneeDialogName: {
    fontSize: 14,
    fontWeight: '500',
  },
  assigneeDialogPosition: {
    fontSize: 12,
    marginTop: 2,
  },
  dialogActionsSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: 16,
  },
  actionsLabel: {
    marginBottom: 12,
  },
  actionButtonsContainer: {
    flexDirection: 'column',
    marginTop: 8,
  },
  actionButton: {
    marginTop: 8,
  },
  adminButtonsContainer: {
    marginTop: 8,
  },
  adminButton: {
    marginBottom: 8,
  },
}); 