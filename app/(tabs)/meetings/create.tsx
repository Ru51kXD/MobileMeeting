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
  Modal
} from 'react-native';
import { 
  TextInput, 
  Button, 
  Appbar, 
  HelperText, 
  List,
  Avatar,
  Checkbox,
  Divider,
  Switch,
  Portal,
  Dialog
} from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useMeeting } from '../../../context/MeetingContext';
import { Meeting } from '../../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, addDays, addMinutes, parseISO, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';

// Временные данные сотрудников для демо
const DEMO_EMPLOYEES = [
  { id: '1', name: 'Иванов Иван', position: 'Руководитель проекта', avatarUrl: 'https://ui-avatars.com/api/?name=Ivan+Ivanov&background=0D8ABC&color=fff' },
  { id: '2', name: 'Петрова Елена', position: 'Ведущий дизайнер', avatarUrl: 'https://ui-avatars.com/api/?name=Elena+Petrova&background=2E7D32&color=fff' },
  { id: '3', name: 'Сидоров Алексей', position: 'Разработчик', avatarUrl: 'https://ui-avatars.com/api/?name=Alexey+Sidorov&background=C62828&color=fff' },
  { id: '4', name: 'Козлова Мария', position: 'Тестировщик', avatarUrl: 'https://ui-avatars.com/api/?name=Maria+Kozlova&background=6A1B9A&color=fff' },
  { id: '5', name: 'Николаев Дмитрий', position: 'Бизнес-аналитик', avatarUrl: 'https://ui-avatars.com/api/?name=Dmitry+Nikolaev&background=00695C&color=fff' },
];

export default function CreateMeetingScreen() {
  const { user } = useAuth();
  const { addMeeting } = useMeeting();
  
  const [meeting, setMeeting] = useState<Partial<Meeting>>({
    title: '',
    description: '',
    startTime: new Date(Date.now() + 3600000), // Через час по умолчанию
    endTime: new Date(Date.now() + 3600000 + 3600000), // Через 2 часа по умолчанию
    organizer: user?.id || '',
    participants: user?.id ? [user.id] : [], // Добавляем себя как участника по умолчанию
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [startTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [endTimePickerVisible, setEndTimePickerVisible] = useState(false);
  const [employeePickerVisible, setEmployeePickerVisible] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<{id: string, name: string, selected: boolean}[]>([]);
  const [timePickerMode, setTimePickerMode] = useState<'start' | 'end'>('start');
  
  // Инициализация списка сотрудников
  useEffect(() => {
    if (meeting.participants && meeting.participants.length > 0) {
      const initialSelectedEmployees = DEMO_EMPLOYEES.map(emp => ({
        id: emp.id,
        name: emp.name,
        selected: meeting.participants?.includes(emp.id) || false
      }));
      setSelectedEmployees(initialSelectedEmployees);
    } else {
      const initialSelectedEmployees = DEMO_EMPLOYEES.map(emp => ({
        id: emp.id,
        name: emp.name,
        selected: emp.id === user?.id
      }));
      setSelectedEmployees(initialSelectedEmployees);
    }
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!meeting.title || meeting.title.trim() === '') {
      newErrors.title = 'Название встречи обязательно';
    }
    
    if (!meeting.startTime) {
      newErrors.startTime = 'Время начала обязательно';
    }
    
    if (!meeting.endTime) {
      newErrors.endTime = 'Время окончания обязательно';
    }
    
    if (meeting.startTime && meeting.endTime && meeting.startTime >= meeting.endTime) {
      newErrors.endTime = 'Время окончания должно быть позже времени начала';
    }
    
    const selectedParticipants = selectedEmployees.filter(emp => emp.selected).map(emp => emp.id);
    if (selectedParticipants.length === 0) {
      newErrors.participants = 'Необходимо выбрать хотя бы одного участника';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateMeeting = async () => {
    if (!validateForm()) {
      return;
    }
    
    // Получаем выбранных участников
    const participants = selectedEmployees
      .filter(emp => emp.selected)
      .map(emp => emp.id);
    
    try {
      // Создаем объект встречи с выбранными участниками
      const finalMeeting = {
        ...meeting,
        participants,
        organizer: user?.id || '',
      } as Omit<Meeting, 'id'>;
      
      // Добавляем встречу через контекст
      await addMeeting(finalMeeting);
      
      // Уведомление об успешном создании
      Alert.alert(
        'Встреча создана',
        'Встреча успешно добавлена в календарь',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Ошибка',
        'Не удалось создать встречу. Попробуйте еще раз.'
      );
      console.error('Ошибка при создании встречи:', error);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Функция для отображения кастомного DatePicker
  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  // Функция для отображения кастомного TimePicker для начала встречи
  const showStartTimePicker = () => {
    setTimePickerMode('start');
    setStartTimePickerVisible(true);
  };

  // Функция для отображения кастомного TimePicker для окончания встречи
  const showEndTimePicker = () => {
    setTimePickerMode('end');
    setEndTimePickerVisible(true);
  };

  // Обработчик выбора даты
  const handleDateChange = (date: Date) => {
    if (!date) return;
    
    // Сохраняем время от текущего startTime
    const currentStartTime = meeting.startTime || new Date();
    const hours = currentStartTime.getHours();
    const minutes = currentStartTime.getMinutes();
    
    // Создаем новую дату с выбранной датой и текущим временем
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    
    // Обновляем также endTime, сохраняя разницу во времени
    const timeDiff = meeting.endTime ? 
      meeting.endTime.getTime() - (meeting.startTime?.getTime() || 0) : 
      3600000; // 1 час по умолчанию
    
    const newEndTime = new Date(newDate.getTime() + timeDiff);
    
    setMeeting({
      ...meeting,
      startTime: newDate,
      endTime: newEndTime
    });
    
    setDatePickerVisible(false);
  };

  // Обработчик выбора времени начала
  const handleStartTimeChange = (hours: number, minutes: number) => {
    if (meeting.startTime) {
      const newStartTime = new Date(meeting.startTime);
      newStartTime.setHours(hours);
      newStartTime.setMinutes(minutes);
      
      // Если время окончания раньше нового времени начала, обновляем его
      let newEndTime = meeting.endTime ? new Date(meeting.endTime) : new Date(newStartTime.getTime() + 3600000);
      if (newEndTime <= newStartTime) {
        newEndTime = new Date(newStartTime.getTime() + 3600000); // + 1 час
      }
      
      setMeeting({
        ...meeting,
        startTime: newStartTime,
        endTime: newEndTime
      });
    }
    
    setStartTimePickerVisible(false);
  };

  // Обработчик выбора времени окончания
  const handleEndTimeChange = (hours: number, minutes: number) => {
    if (meeting.endTime && meeting.startTime) {
      const newEndTime = new Date(meeting.endTime);
      newEndTime.setHours(hours);
      newEndTime.setMinutes(minutes);
      
      // Проверяем, что время окончания позже времени начала
      if (newEndTime <= meeting.startTime) {
        Alert.alert('Неверное время', 'Время окончания должно быть позже времени начала');
        return;
      }
      
      setMeeting({
        ...meeting,
        endTime: newEndTime
      });
    }
    
    setEndTimePickerVisible(false);
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return '';
    return format(dateObj, 'dd MMMM yyyy', { locale: ru });
  };

  const formatTime = (date?: Date | string) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return '';
    return format(dateObj, 'HH:mm', { locale: ru });
  };

  const toggleEmployeeSelection = (id: string) => {
    setSelectedEmployees(
      selectedEmployees.map(emp => 
        emp.id === id ? { ...emp, selected: !emp.selected } : emp
      )
    );
  };

  // Создаем кнопки для диалога выбора времени
  const generateTimeButtons = (isStartTime: boolean = true) => {
    const buttons = [];
    const currentDate = isStartTime ? 
      (meeting.startTime || new Date()) : 
      (meeting.endTime || new Date(Date.now() + 3600000));
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();
    
    // Создаем список часов (0-23)
    for (let hour = 0; hour < 24; hour++) {
      buttons.push(
        <Button
          key={`hour-${hour}`}
          mode={currentHour === hour ? "contained" : "outlined"}
          style={{ margin: 4 }}
          onPress={() => {
            if (isStartTime) {
              handleStartTimeChange(hour, currentMinute);
            } else {
              handleEndTimeChange(hour, currentMinute);
            }
          }}
        >
          {hour < 10 ? `0${hour}` : hour}
        </Button>
      );
    }
    
    return buttons;
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={handleCancel} />
        <Appbar.Content title="Создание встречи" />
      </Appbar.Header>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content}>
          <TextInput
            label="Название встречи"
            value={meeting.title}
            onChangeText={(text) => {
              setMeeting({ ...meeting, title: text });
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
            label="Описание встречи"
            value={meeting.description}
            onChangeText={(text) => {
              setMeeting({ ...meeting, description: text });
            }}
            style={styles.input}
            multiline
            numberOfLines={4}
            mode="outlined"
          />

          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>Дата и время</Text>
          </View>

          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={showDatePicker}
          >
            <MaterialCommunityIcons name="calendar" size={24} color="#2196F3" />
            <Text style={styles.dateText}>
              {meeting.startTime ? formatDate(meeting.startTime) : 'Выберите дату'}
            </Text>
          </TouchableOpacity>

          <View style={styles.timePickersContainer}>
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={showStartTimePicker}
            >
              <MaterialCommunityIcons name="clock-start" size={24} color="#2196F3" />
              <Text style={styles.timeText}>
                {meeting.startTime ? formatTime(meeting.startTime) : '00:00'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.timeSeparator}>—</Text>

            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={showEndTimePicker}
            >
              <MaterialCommunityIcons name="clock-end" size={24} color="#2196F3" />
              <Text style={styles.timeText}>
                {meeting.endTime ? formatTime(meeting.endTime) : '01:00'}
              </Text>
            </TouchableOpacity>
          </View>
          {errors.startTime && <HelperText type="error">{errors.startTime}</HelperText>}
          {errors.endTime && <HelperText type="error">{errors.endTime}</HelperText>}

          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>Участники встречи</Text>
          </View>
          
          <TouchableOpacity
            style={styles.participantsButton}
            onPress={() => setEmployeePickerVisible(true)}
          >
            <MaterialCommunityIcons name="account-multiple" size={24} color="#2196F3" />
            <View style={styles.participantsButtonContent}>
              <Text style={styles.participantsButtonText}>
                Выбрать участников ({selectedEmployees.filter(emp => emp.selected).length})
              </Text>
              <Text style={styles.participantsButtonSubtext}>
                {selectedEmployees.filter(emp => emp.selected).length > 0 
                  ? selectedEmployees.filter(emp => emp.selected).map(emp => emp.name).join(', ')
                  : 'Нажмите, чтобы выбрать участников'}
              </Text>
            </View>
          </TouchableOpacity>
          {errors.participants && <HelperText type="error">{errors.participants}</HelperText>}

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
              onPress={handleCreateMeeting}
              style={styles.createButton}
            >
              Создать
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Модальное окно выбора сотрудников */}
      <Modal
        visible={employeePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEmployeePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите участников</Text>
              <TouchableOpacity onPress={() => setEmployeePickerVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Divider />
            
            <ScrollView style={styles.employeeList}>
              {selectedEmployees.map((employee) => (
                <TouchableOpacity
                  key={employee.id}
                  style={styles.employeeItem}
                  onPress={() => toggleEmployeeSelection(employee.id)}
                >
                  <View style={styles.employeeInfo}>
                    <Avatar.Image 
                      size={40} 
                      source={{ 
                        uri: DEMO_EMPLOYEES.find(emp => emp.id === employee.id)?.avatarUrl || 
                             'https://ui-avatars.com/api/?name=Unknown&background=9E9E9E&color=fff'
                      }} 
                    />
                    <Text style={styles.employeeName}>{employee.name}</Text>
                  </View>
                  <Checkbox
                    status={employee.selected ? 'checked' : 'unchecked'}
                    onPress={() => toggleEmployeeSelection(employee.id)}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <Divider />
            
            <View style={styles.modalFooter}>
              <Button onPress={() => {
                setSelectedEmployees(selectedEmployees.map(emp => ({ ...emp, selected: false })));
              }}>
                Очистить
              </Button>
              <Button 
                mode="contained" 
                onPress={() => {
                  setEmployeePickerVisible(false);
                }}
              >
                Готово
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Диалог выбора даты */}
      <Portal>
        <Dialog visible={datePickerVisible} onDismiss={() => setDatePickerVisible(false)}>
          <Dialog.Title>Выберите дату</Dialog.Title>
          <Dialog.Content>
            <View style={styles.dateButtonsContainer}>
              {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                const date = addDays(new Date(), dayOffset);
                const dateStr = format(date, 'dd MMMM', { locale: ru });
                const isToday = dayOffset === 0;
                
                return (
                  <Button
                    key={dateStr}
                    mode="outlined"
                    style={[
                      styles.dateButton,
                      meeting.startTime && 
                      format(meeting.startTime, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') ? 
                      styles.selectedDateButton : null
                    ]}
                    onPress={() => handleDateChange(date)}
                  >
                    {isToday ? 'Сегодня' : dateStr}
                  </Button>
                );
              })}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDatePickerVisible(false)}>Отмена</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Диалог выбора времени начала */}
      <Portal>
        <Dialog 
          visible={startTimePickerVisible} 
          onDismiss={() => setStartTimePickerVisible(false)}
          style={{ maxHeight: '80%' }}
        >
          <Dialog.Title>Выберите время начала</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <View style={styles.timeButtonsContainer}>
                {generateTimeButtons(true)}
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setStartTimePickerVisible(false)}>Отмена</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Диалог выбора времени окончания */}
      <Portal>
        <Dialog 
          visible={endTimePickerVisible} 
          onDismiss={() => setEndTimePickerVisible(false)}
          style={{ maxHeight: '80%' }}
        >
          <Dialog.Title>Выберите время окончания</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <View style={styles.timeButtonsContainer}>
                {generateTimeButtons(false)}
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setEndTimePickerVisible(false)}>Отмена</Button>
          </Dialog.Actions>
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
  content: {
    padding: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 8,
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
    backgroundColor: '#ffffff',
    borderRadius: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  timePickersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    flex: 0.45,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  timeText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  timeSeparator: {
    fontSize: 20,
    color: '#555',
  },
  participantsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  participantsButtonContent: {
    marginLeft: 8,
    flex: 1,
  },
  participantsButtonText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  participantsButtonSubtext: {
    fontSize: 12,
    color: '#777',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  createButton: {
    flex: 1,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  employeeList: {
    maxHeight: 300,
  },
  employeeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeName: {
    marginLeft: 12,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  dateButtonsContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  dateButton: {
    marginBottom: 8,
  },
  selectedDateButton: {
    backgroundColor: '#e3f2fd',
  },
  timeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 8,
  },
}); 