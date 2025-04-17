import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image
} from 'react-native';
import { 
  TextInput, 
  Button, 
  Appbar, 
  RadioButton, 
  Chip,
  HelperText,
  Switch,
  List,
  Avatar,
  Divider
} from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useTask } from '../../../context/TaskContext';
import { Task, TaskPriority, TaskStatus } from '../../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import DateTimePicker from '../../../components/DateTimePicker';

// Константы для приоритетов задач
const PRIORITY_LOW = 'LOW';
const PRIORITY_MEDIUM = 'MEDIUM';
const PRIORITY_HIGH = 'HIGH';
const PRIORITY_URGENT = 'URGENT';

// Временные данные сотрудников для демо
const DEMO_EMPLOYEES = [
  { id: '1', name: 'Иванов Иван', position: 'Руководитель проекта', avatarUrl: 'https://ui-avatars.com/api/?name=Ivan+Ivanov&background=0D8ABC&color=fff' },
  { id: '2', name: 'Петрова Елена', position: 'Ведущий дизайнер', avatarUrl: 'https://ui-avatars.com/api/?name=Elena+Petrova&background=2E7D32&color=fff' },
  { id: '3', name: 'Сидоров Алексей', position: 'Разработчик', avatarUrl: 'https://ui-avatars.com/api/?name=Alexey+Sidorov&background=C62828&color=fff' },
  { id: '4', name: 'Козлова Мария', position: 'Тестировщик', avatarUrl: 'https://ui-avatars.com/api/?name=Maria+Kozlova&background=6A1B9A&color=fff' },
  { id: '5', name: 'Николаев Дмитрий', position: 'Бизнес-аналитик', avatarUrl: 'https://ui-avatars.com/api/?name=Dmitry+Nikolaev&background=00695C&color=fff' },
];

export default function CreateTaskScreen() {
  const { user } = useAuth();
  const { addTask, tasks, updateTask } = useTask();
  const params = useLocalSearchParams();
  const taskId = params.taskId as string | undefined;
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [task, setTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // Завтра по умолчанию
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.ASSIGNED,
    assignedTo: user?.id || '',
    createdBy: user?.id || '',
    createdAt: new Date(),
    updatedAt: new Date(),
    comments: [] // Добавляем массив комментариев
  });
  
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [assignToMe, setAssignToMe] = useState(true);
  const [employeePickerVisible, setEmployeePickerVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{id: string, name: string, avatarUrl: string} | null>(null);
  const [comment, setComment] = useState('');

  const predefinedDates = [
    { label: 'Сегодня', date: new Date() },
    { label: 'Завтра', date: addDays(new Date(), 1) },
    { label: 'Через 3 дня', date: addDays(new Date(), 3) },
    { label: 'Через неделю', date: addDays(new Date(), 7) },
    { label: 'Через 2 недели', date: addDays(new Date(), 14) },
  ];

  // Эффект для загрузки задачи, если мы в режиме редактирования
  useEffect(() => {
    if (taskId && tasks.length > 0) {
      const existingTask = tasks.find(t => t.id === taskId);
      if (existingTask) {
        setIsEditMode(true);
        setTask({
          ...existingTask,
          deadline: new Date(existingTask.deadline),
          createdAt: new Date(existingTask.createdAt),
          updatedAt: new Date(), // Обновляем время редактирования
        });
        
        // Устанавливаем исполнителя
        const assignee = DEMO_EMPLOYEES.find(emp => emp.id === existingTask.assignedTo);
        if (assignee) {
          setSelectedEmployee(assignee);
          setAssignToMe(user?.id === assignee.id);
        }
      }
    }
  }, [taskId, tasks]);

  // Эффект для установки текущего пользователя при загрузке
  useEffect(() => {
    if (user && !isEditMode) {
      const currentUser = DEMO_EMPLOYEES.find(emp => emp.id === user.id) || 
        { id: user.id, name: user.name || 'Текущий пользователь', avatarUrl: user.avatarUrl || 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff' };
      
      setSelectedEmployee(currentUser);
    }
  }, [user, isEditMode]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!task.title || task.title.trim() === '') {
      newErrors.title = 'Название задачи обязательно';
    }
    
    if (!task.description || task.description.trim() === '') {
      newErrors.description = 'Описание задачи обязательно';
    }
    
    if (!task.deadline) {
      newErrors.deadline = 'Срок выполнения обязателен';
    }

    if (!assignToMe && !task.assignedTo) {
      newErrors.assignedTo = 'Необходимо выбрать исполнителя задачи';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveTask = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      if (isEditMode && taskId) {
        // Обновляем существующую задачу
        const updatedTask = {
          ...task,
          id: taskId,
          updatedAt: new Date()
        } as Task;
        
        // Добавим новый комментарий, если он есть
        if (comment.trim()) {
          const newComment = {
            id: Date.now().toString(),
            text: comment,
            createdBy: user?.id || '',
            createdAt: new Date(),
            authorName: user?.name || 'Текущий пользователь'
          };
          
          updatedTask.comments = [...(updatedTask.comments || []), newComment];
        }
        
        await updateTask(updatedTask);
        
        Alert.alert(
          'Задача обновлена',
          'Изменения успешно сохранены',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        // Добавляем новую задачу
        const finalTask = {...task};
        if (comment.trim()) {
          finalTask.comments = [{
            id: Date.now().toString(),
            text: comment,
            createdBy: user?.id || '',
            createdAt: new Date(),
            authorName: user?.name || 'Текущий пользователь'
          }];
        }
        
        await addTask(finalTask as Omit<Task, 'id'>);
        
        Alert.alert(
          'Задача создана',
          'Задача успешно добавлена в систему',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Ошибка',
        isEditMode ? 'Не удалось обновить задачу. Попробуйте еще раз.' : 'Не удалось создать задачу. Попробуйте еще раз.'
      );
      console.error(isEditMode ? 'Ошибка при обновлении задачи:' : 'Ошибка при создании задачи:', error);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSelectDate = (date: Date) => {
    setTask({ ...task, deadline: date });
    setDatePickerVisible(false);
  };

  const handleSelectEmployee = (employee: typeof DEMO_EMPLOYEES[0]) => {
    setSelectedEmployee(employee);
    setTask({ ...task, assignedTo: employee.id });
    setEmployeePickerVisible(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case PRIORITY_LOW: return '#28a745';
      case PRIORITY_MEDIUM: return '#ffc107';
      case PRIORITY_HIGH: return '#fd7e14';
      case PRIORITY_URGENT: return '#dc3545';
      default: return '#6c757d';
    }
  };

  const formatDate = (date: Date) => {
    return format(date, 'dd MMMM yyyy', { locale: ru });
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={handleCancel} />
        <Appbar.Content title={isEditMode ? "Редактирование задачи" : "Создание задачи"} />
      </Appbar.Header>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content}>
          <TextInput
            label="Название задачи"
            value={task.title}
            onChangeText={(text) => {
              setTask({ ...task, title: text });
              if (errors.title) {
                setErrors({ ...errors, title: '' });
              }
            }}
            style={styles.input}
            error={!!errors.title}
            mode="outlined"
          />
          {errors.title && <HelperText type="error">{errors.title}</HelperText>}

          <TextInput
            label="Описание задачи"
            value={task.description}
            onChangeText={(text) => {
              setTask({ ...task, description: text });
              if (errors.description) {
                setErrors({ ...errors, description: '' });
              }
            }}
            style={styles.input}
            error={!!errors.description}
            multiline
            numberOfLines={4}
            mode="outlined"
          />
          {errors.description && <HelperText type="error">{errors.description}</HelperText>}

          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>Срок выполнения</Text>
          </View>

          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setDatePickerVisible(true)}
          >
            <MaterialCommunityIcons name="calendar" size={24} color="#2196F3" />
            <Text style={styles.dateText}>
              {task.deadline ? formatDate(task.deadline) : 'Выберите дату'}
            </Text>
          </TouchableOpacity>
          
          <Modal
            visible={datePickerVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setDatePickerVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Выберите срок выполнения</Text>
                
                {predefinedDates.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.dateOption}
                    onPress={() => handleSelectDate(item.date)}
                  >
                    <Text style={styles.dateOptionLabel}>{item.label}</Text>
                    <Text style={styles.dateOptionValue}>{formatDate(item.date)}</Text>
                  </TouchableOpacity>
                ))}
                
                <Button
                  mode="outlined" 
                  onPress={() => setDatePickerVisible(false)}
                  style={styles.modalCloseButton}
                >
                  Отмена
                </Button>
              </View>
            </View>
          </Modal>

          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>Приоритет</Text>
          </View>

          <View style={styles.priorityContainer}>
            <TouchableOpacity
              style={[
                styles.priorityButton,
                task.priority === PRIORITY_LOW && styles.priorityButtonSelected,
                { borderColor: getPriorityColor(PRIORITY_LOW) }
              ]}
              onPress={() => setTask({ ...task, priority: PRIORITY_LOW })}
            >
              <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(PRIORITY_LOW) }]} />
              <Text style={styles.priorityText}>Низкий</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.priorityButton,
                task.priority === PRIORITY_MEDIUM && styles.priorityButtonSelected,
                { borderColor: getPriorityColor(PRIORITY_MEDIUM) }
              ]}
              onPress={() => setTask({ ...task, priority: PRIORITY_MEDIUM })}
            >
              <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(PRIORITY_MEDIUM) }]} />
              <Text style={styles.priorityText}>Средний</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.priorityButton,
                task.priority === PRIORITY_HIGH && styles.priorityButtonSelected,
                { borderColor: getPriorityColor(PRIORITY_HIGH) }
              ]}
              onPress={() => setTask({ ...task, priority: PRIORITY_HIGH })}
            >
              <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(PRIORITY_HIGH) }]} />
              <Text style={styles.priorityText}>Высокий</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.priorityButton,
                task.priority === PRIORITY_URGENT && styles.priorityButtonSelected,
                { borderColor: getPriorityColor(PRIORITY_URGENT) }
              ]}
              onPress={() => setTask({ ...task, priority: PRIORITY_URGENT })}
            >
              <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(PRIORITY_URGENT) }]} />
              <Text style={styles.priorityText}>Срочный</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>Назначение</Text>
          </View>

          <View style={styles.assignmentContainer}>
            <View style={styles.switchContainer}>
              <Text>Назначить на меня</Text>
              <Switch
                value={assignToMe}
                onValueChange={(value) => {
                  setAssignToMe(value);
                  if (value) {
                    setTask({ ...task, assignedTo: user?.id || '' });
                    
                    // Выбираем текущего пользователя из списка сотрудников
                    const currentUser = DEMO_EMPLOYEES.find(emp => emp.id === user?.id) || {
                      id: user?.id || '', 
                      name: user?.name || 'Текущий пользователь',
                      avatarUrl: user?.avatarUrl || 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff'
                    };
                    setSelectedEmployee(currentUser);
                  }
                }}
              />
            </View>
            
            {!assignToMe && (
              <View style={styles.employeeSelection}>
                <Text style={styles.selectionLabel}>Выберите сотрудника:</Text>
                
                <TouchableOpacity 
                  style={styles.employeeSelectButton}
                  onPress={() => setEmployeePickerVisible(true)}
                >
                  {selectedEmployee ? (
                    <View style={styles.selectedEmployee}>
                      <Avatar.Image 
                        source={{ uri: selectedEmployee.avatarUrl }} 
                        size={40} 
                      />
                      <View style={styles.employeeInfo}>
                        <Text style={styles.employeeName}>{selectedEmployee.name}</Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.placeholderText}>Выберите сотрудника</Text>
                  )}
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
                </TouchableOpacity>
                
                {errors.assignedTo && (
                  <HelperText type="error">{errors.assignedTo}</HelperText>
                )}
              </View>
            )}
          </View>

          {/* Модальное окно выбора сотрудника */}
          <Modal
            visible={employeePickerVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setEmployeePickerVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, styles.employeeModalContent]}>
                <Text style={styles.modalTitle}>Выберите сотрудника</Text>
                
                <ScrollView>
                  {DEMO_EMPLOYEES.map((employee) => (
                    <TouchableOpacity
                      key={employee.id}
                      style={styles.employeeItem}
                      onPress={() => handleSelectEmployee(employee)}
                    >
                      <Avatar.Image 
                        source={{ uri: employee.avatarUrl }} 
                        size={40} 
                      />
                      <View style={styles.employeeItemInfo}>
                        <Text style={styles.employeeItemName}>{employee.name}</Text>
                        <Text style={styles.employeeItemPosition}>{employee.position}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                
                <Button
                  mode="outlined" 
                  onPress={() => setEmployeePickerVisible(false)}
                  style={styles.modalCloseButton}
                >
                  Отмена
                </Button>
              </View>
            </View>
          </Modal>

          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>Комментарий</Text>
          </View>

          <TextInput
            label="Комментарий к задаче"
            value={comment}
            onChangeText={setComment}
            style={styles.input}
            multiline
            numberOfLines={3}
            mode="outlined"
            placeholder="Добавьте комментарий к создаваемой задаче"
          />

          {/* Раздел выбора статуса - только для режима редактирования и только для админа */}
          {isEditMode && user?.role === 'ADMIN' && (
            <>
              <View style={styles.sectionTitle}>
                <Text style={styles.sectionTitleText}>Статус задачи</Text>
              </View>
              
              <View style={styles.statusContainer}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    task.status === TaskStatus.ASSIGNED && styles.statusButtonSelected,
                    { borderColor: '#6c757d' }
                  ]}
                  onPress={() => setTask({ ...task, status: TaskStatus.ASSIGNED })}
                >
                  <View style={[styles.statusIndicator, { backgroundColor: '#6c757d' }]} />
                  <Text style={styles.statusText}>Назначена</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    task.status === TaskStatus.IN_PROGRESS && styles.statusButtonSelected,
                    { borderColor: '#fd7e14' }
                  ]}
                  onPress={() => setTask({ ...task, status: TaskStatus.IN_PROGRESS })}
                >
                  <View style={[styles.statusIndicator, { backgroundColor: '#fd7e14' }]} />
                  <Text style={styles.statusText}>В процессе</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    task.status === TaskStatus.COMPLETED && styles.statusButtonSelected,
                    { borderColor: '#28a745' }
                  ]}
                  onPress={() => setTask({ ...task, status: TaskStatus.COMPLETED })}
                >
                  <View style={[styles.statusIndicator, { backgroundColor: '#28a745' }]} />
                  <Text style={styles.statusText}>Выполнена</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    task.status === TaskStatus.CANCELLED && styles.statusButtonSelected,
                    { borderColor: '#dc3545' }
                  ]}
                  onPress={() => setTask({ ...task, status: TaskStatus.CANCELLED })}
                >
                  <View style={[styles.statusIndicator, { backgroundColor: '#dc3545' }]} />
                  <Text style={styles.statusText}>Отменена</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>Исполнитель</Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={handleCancel}
              style={styles.cancelButton}
            >
              Отмена
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveTask}
              style={styles.createButton}
            >
              {isEditMode ? 'Сохранить' : 'Создать задачу'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  priorityButtonSelected: {
    backgroundColor: '#f0f0f0',
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 14,
  },
  assignmentContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  employeeSelection: {
    marginTop: 8,
  },
  selectionLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  employeeSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedEmployee: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeInfo: {
    marginLeft: 12,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '500',
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  notImplementedText: {
    color: '#666',
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginBottom: 32,
  },
  createButton: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  cancelButton: {
    paddingVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    elevation: 5,
  },
  employeeModalContent: {
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  dateOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  dateOptionValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modalCloseButton: {
    marginTop: 16,
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  employeeItemInfo: {
    marginLeft: 12,
  },
  employeeItemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  employeeItemPosition: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
    width: '48%',
    marginBottom: 8,
  },
  
  statusButtonSelected: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  
  statusText: {
    fontSize: 14,
  },
}); 