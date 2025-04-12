import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput as RNTextInput, RefreshControl, Alert, Image, ScrollView, Modal } from 'react-native';
import { Avatar, Button, FAB, ActivityIndicator, Dialog, Portal, Chip, Searchbar, SegmentedButtons, IconButton } from 'react-native-paper';
import { User, UserRole } from '../../types/index';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Временный список сотрудников
const DEMO_USERS: User[] = [
  {
    id: '1',
    email: 'admin@company.com',
    name: 'Админ Системы',
    role: UserRole.ADMIN,
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
  },
  {
    id: '2',
    email: 'manager@company.com',
    name: 'Менеджер Проектов',
    role: UserRole.MANAGER,
    department: 'Разработка',
    position: 'Руководитель отдела',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
  },
  {
    id: '3',
    email: 'employee@company.com',
    name: 'Сотрудник Компании',
    role: UserRole.EMPLOYEE,
    department: 'Разработка',
    position: 'Разработчик',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
  },
  {
    id: '4',
    email: 'designer@company.com',
    name: 'Дизайнер UI/UX',
    role: UserRole.EMPLOYEE,
    department: 'Дизайн',
    position: 'UI/UX дизайнер',
    avatarUrl: 'https://i.pravatar.cc/150?img=4',
  },
  {
    id: '5',
    email: 'qa@company.com',
    name: 'Тестировщик',
    role: UserRole.EMPLOYEE,
    department: 'QA',
    position: 'QA инженер',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
  },
  {
    id: '6',
    email: 'sales@company.com',
    name: 'Менеджер продаж',
    role: UserRole.MANAGER,
    department: 'Продажи',
    position: 'Руководитель отдела продаж',
    avatarUrl: 'https://i.pravatar.cc/150?img=6',
  },
];

// Ключ для хранения данных в AsyncStorage
const EMPLOYEES_STORAGE_KEY = 'app_employees_data';

export default function EmployeesScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [employees, setEmployees] = useState<User[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [detailDialogVisible, setDetailDialogVisible] = useState(false);
  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: UserRole.EMPLOYEE,
    department: '',
    position: '',
  });

  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  
  // Предопределенные данные для выбора
  const departments = ['Разработка', 'Дизайн', 'Маркетинг', 'Продажи', 'QA', 'HR', 'Финансы'];
  
  const positions = {
    'Разработка': ['Разработчик', 'Старший разработчик', 'Тимлид', 'Архитектор'],
    'Дизайн': ['UI/UX дизайнер', 'Графический дизайнер', 'Продуктовый дизайнер'],
    'Маркетинг': ['Маркетолог', 'SMM-специалист', 'Контент-менеджер'],
    'Продажи': ['Менеджер продаж', 'Руководитель отдела продаж', 'Аналитик'],
    'QA': ['QA инженер', 'Тестировщик', 'Автоматизатор тестирования'],
    'HR': ['HR-менеджер', 'Рекрутер', 'Специалист по обучению'],
    'Финансы': ['Бухгалтер', 'Финансовый аналитик', 'Экономист']
  };
  
  const emailDomains = ['company.com', 'example.org', 'mail.ru', 'gmail.com'];

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchQuery, selectedFilter]);

  // Сохранение списка сотрудников в AsyncStorage
  useEffect(() => {
    if (employees.length > 0) {
      saveEmployeesToStorage();
    }
  }, [employees]);

  // Функция для сохранения сотрудников в AsyncStorage
  const saveEmployeesToStorage = async () => {
    try {
      const jsonValue = JSON.stringify(employees);
      await AsyncStorage.setItem(EMPLOYEES_STORAGE_KEY, jsonValue);
      console.log('Сотрудники сохранены в хранилище');
    } catch (e) {
      console.error('Ошибка при сохранении сотрудников:', e);
    }
  };

  const loadEmployees = async () => {
    setLoading(true);
    
    try {
      // Пытаемся загрузить сохраненных сотрудников из AsyncStorage
      const savedEmployees = await AsyncStorage.getItem(EMPLOYEES_STORAGE_KEY);
      
      if (savedEmployees !== null) {
        // Если есть сохраненные данные, используем их
        setEmployees(JSON.parse(savedEmployees));
        console.log('Сотрудники загружены из хранилища');
      } else {
        // Если нет сохраненных данных, используем демо-данные
        setEmployees(DEMO_USERS);
        console.log('Загружены демо-сотрудники');
      }
    } catch (e) {
      console.error('Ошибка при загрузке сотрудников:', e);
      setEmployees(DEMO_USERS); // Если произошла ошибка, загружаем демо-данные
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEmployees();
  };

  // Функция для сброса данных к демо-данным
  const resetToDefaultEmployees = async () => {
    try {
      await AsyncStorage.removeItem(EMPLOYEES_STORAGE_KEY);
      setEmployees(DEMO_USERS);
      Alert.alert('Успешно', 'Список сотрудников сброшен к начальному состоянию');
    } catch (e) {
      console.error('Ошибка при сбросе сотрудников:', e);
      Alert.alert('Ошибка', 'Не удалось сбросить список сотрудников');
    }
  };

  const filterEmployees = () => {
    let filtered = [...employees];
    
    // Фильтр по поиску
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(query) || 
        emp.email.toLowerCase().includes(query) ||
        emp.department?.toLowerCase().includes(query) ||
        emp.position?.toLowerCase().includes(query)
      );
    }
    
    // Фильтр по категории
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(emp => emp.role === selectedFilter);
    }
    
    setFilteredEmployees(filtered);
  };

  const handleEmployeePress = (employee: User) => {
    setSelectedEmployee(employee);
    setDetailDialogVisible(true);
  };

  const handleAddEmployee = () => {
    // Валидация
    if (!newEmployee.name || !newEmployee.email) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните обязательные поля');
      return;
    }
    
    // Проверка email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmployee.email)) {
      Alert.alert('Ошибка', 'Введите корректный email');
      return;
    }
    
    // Проверка на существующий email
    if (employees.some(emp => emp.email.toLowerCase() === newEmployee.email.toLowerCase())) {
      Alert.alert('Ошибка', 'Пользователь с таким email уже существует');
      return;
    }
    
    // Добавляем нового сотрудника
    const newId = (Math.max(...employees.map(e => parseInt(e.id))) + 1).toString();
    const newUser: User = {
      id: newId,
      ...newEmployee,
      avatarUrl: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 50)}`,
    };
    
    setEmployees([...employees, newUser]);
    setAddDialogVisible(false);
    
    // Сброс формы
    setNewEmployee({
      name: '',
      email: '',
      role: UserRole.EMPLOYEE,
      department: '',
      position: '',
    });
    
    Alert.alert('Успешно', 'Сотрудник добавлен');
  };

  const handleDeleteEmployee = () => {
    if (selectedEmployee) {
      // Проверяем, не пытается ли пользователь удалить самого себя
      if (selectedEmployee.id === user?.id) {
        Alert.alert('Ошибка', 'Вы не можете удалить свою учетную запись');
        setDeleteConfirmVisible(false);
        return;
      }
      
      // Удаляем сотрудника
      const updatedEmployees = employees.filter(emp => emp.id !== selectedEmployee.id);
      setEmployees(updatedEmployees);
      setDetailDialogVisible(false);
      setDeleteConfirmVisible(false);
      Alert.alert('Успешно', 'Сотрудник удален');
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Администратор';
      case UserRole.MANAGER:
        return 'Менеджер';
      case UserRole.EMPLOYEE:
        return 'Сотрудник';
      default:
        return '';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return '#f44336';
      case UserRole.MANAGER:
        return '#2196F3';
      case UserRole.EMPLOYEE:
        return '#4CAF50';
      default:
        return '#6c757d';
    }
  };

  const getDepartmentColor = (department: string) => {
    // Генерация цвета на основе названия отдела
    const departmentMap: {[key: string]: string[]} = {
      'Разработка': ['#4CAF50', '#2E7D32'],
      'Дизайн': ['#9C27B0', '#7B1FA2'],
      'Маркетинг': ['#FF9800', '#F57C00'],
      'Продажи': ['#2196F3', '#1976D2'],
      'QA': ['#FF5722', '#E64A19'],
      'HR': ['#3F51B5', '#303F9F'],
      'Финансы': ['#009688', '#00796B'],
    };
    
    return departmentMap[department] || ['#757575', '#616161'];
  };

  const getStatusColor = (online: boolean) => {
    return online ? '#4CAF50' : '#9E9E9E';
  };

  // Вспомогательная функция для создания градиента роли
  const getRoleGradient = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return ['#F44336', '#D32F2F'];
      case UserRole.MANAGER:
        return ['#2196F3', '#1976D2'];
      case UserRole.EMPLOYEE:
        return ['#4CAF50', '#388E3C'];
      default:
        return ['#757575', '#616161'];
    }
  };

  // Обновленная функция для генерации email на основе имени
  const generateEmail = (name: string, domain: string) => {
    // Транслитерация кириллицы в латиницу
    const translit = (text: string): string => {
      const ru = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
        'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'ZH',
        'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
        'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'TS',
        'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SCH', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'YU',
        'Я': 'YA'
      };
      return text.split('').map(char => ru[char.toLowerCase()] || char).join('');
    };
    
    // Обрабатываем имя: транслитерация, приведение к нижнему регистру, замена пробелов и спецсимволов
    const nameParts = name.split(' ');
    let emailPrefix = '';
    
    if (nameParts.length >= 2) {
      // Если есть имя и фамилия, берем первую букву имени и всю фамилию
      const firstName = translit(nameParts[0]);
      const lastName = translit(nameParts[1]);
      emailPrefix = `${firstName.charAt(0).toLowerCase()}.${lastName.toLowerCase()}`;
    } else {
      // Если только одно слово, берем его целиком
      emailPrefix = translit(name.toLowerCase());
    }
    
    emailPrefix = emailPrefix.replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
    return `${emailPrefix}@${domain}`;
  };

  if (loading) {
    return (
      <LinearGradient
        colors={isDark ? ['#121212', '#1a1a1a'] : ['#f5f5f5', '#e5e5e5']}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color={isDark ? Colors.dark.tint : Colors.light.tint} />
      </LinearGradient>
    );
  }

  const renderEmployeeItem = ({ item }: { item: User }) => {
    // Определяем случайный статус для демонстрации (в реальном приложении это будет настоящий статус)
    const isOnline = item.id === '1' || item.id === '3' || item.id === '6';
    
    return (
      <TouchableOpacity
        style={styles.employeeItemContainer}
        onPress={() => handleEmployeePress(item)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={isDark ? ['#1e1e1e', '#252527'] : ['#ffffff', '#f8f8fa']}
          style={styles.employeeItem}
        >
          <View style={styles.employeeHeader}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={getDepartmentColor(item.department || 'Разработка')}
                style={styles.avatarBorder}
              >
                <Image
                  source={{ uri: item.avatarUrl }}
                  style={styles.avatar}
                />
                <View 
                  style={[
                    styles.statusIndicator, 
                    { backgroundColor: getStatusColor(isOnline) }
                  ]} 
                />
              </LinearGradient>
            </View>
            
            <View style={styles.employeeInfo}>
              <Text style={[styles.employeeName, { color: isDark ? Colors.dark.text : '#333' }]}>
                {item.name}
              </Text>
              
              <LinearGradient
                colors={getRoleGradient(item.role)}
                style={styles.roleChip}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
              >
                <Text style={styles.roleChipText}>
                  {getRoleText(item.role)}
                </Text>
              </LinearGradient>
              
              <View style={styles.employeeDetails}>
                {item.position && (
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons 
                      name="briefcase-outline" 
                      size={14} 
                      color={isDark ? '#aaa' : '#666'} 
                      style={styles.detailIcon}
                    />
                    <Text style={[styles.detailText, { color: isDark ? '#aaa' : '#666' }]}>
                      {item.position}
                    </Text>
                  </View>
                )}
                
                {item.department && (
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons 
                      name="office-building-outline" 
                      size={14} 
                      color={isDark ? '#aaa' : '#666'} 
                      style={styles.detailIcon}
                    />
                    <Text style={[styles.detailText, { color: isDark ? '#aaa' : '#666' }]}>
                      {item.department}
                    </Text>
                  </View>
                )}
                
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons 
                    name="email-outline" 
                    size={14} 
                    color={isDark ? '#aaa' : '#666'} 
                    style={styles.detailIcon}
                  />
                  <Text style={[styles.detailText, { color: isDark ? '#aaa' : '#666' }]}>
                    {item.email}
                  </Text>
                </View>
              </View>
            </View>
            
            <IconButton
              icon="chevron-right"
              iconColor={isDark ? '#aaa' : '#999'}
              size={24}
              style={styles.arrowIcon}
              onPress={() => handleEmployeePress(item)}
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={isDark ? ['#121212', '#1a1a1a'] : ['#f5f5f5', '#e5e5e5']}
      style={styles.container}
    >
      <LinearGradient
        colors={isDark ? ['#1c1c1e', '#252527'] : ['#ffffff', '#f9f9f9']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#222222' }]}>
            Сотрудники
          </Text>
          
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity 
              style={[styles.headerButton, { marginRight: 8 }]}
              onPress={() => Alert.alert(
                'Сбросить список',
                'Вы уверены, что хотите сбросить список сотрудников к исходному?',
                [
                  { text: 'Отмена', style: 'cancel' },
                  { text: 'Сбросить', onPress: resetToDefaultEmployees, style: 'destructive' }
                ]
              )}
            >
              <MaterialCommunityIcons name="refresh" size={24} color={isDark ? Colors.dark.tint : Colors.light.tint} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setAddDialogVisible(true)}
            >
              <MaterialCommunityIcons name="account-plus" size={24} color={isDark ? Colors.dark.tint : Colors.light.tint} />
            </TouchableOpacity>
          </View>
        </View>
        
        <Searchbar
          placeholder="Поиск сотрудников..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[
            styles.searchBar,
            isDark ? styles.searchBarDark : styles.searchBarLight
          ]}
          inputStyle={[
            styles.searchInput,
            isDark ? styles.searchInputDark : styles.searchInputLight
          ]}
          iconColor={isDark ? '#999' : '#666'}
          placeholderTextColor={isDark ? '#888' : '#999'}
        />
      </LinearGradient>

      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={selectedFilter}
          onValueChange={setSelectedFilter}
          buttons={[
            { value: 'all', label: 'Все', icon: 'account-group' },
            { value: UserRole.EMPLOYEE, label: 'Сотрудники', icon: 'account' },
            { value: UserRole.MANAGER, label: 'Менеджеры', icon: 'account-tie' },
            { value: UserRole.ADMIN, label: 'Админы', icon: 'shield-account' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>
      
      <FlatList
        data={filteredEmployees}
        renderItem={renderEmployeeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.employeesList}
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
            <LinearGradient
              colors={isDark ? ['#2c2c2e', '#1c1c1e'] : ['#f0f0f0', '#e0e0e0']}
              style={styles.emptyIconContainer}
            >
              <MaterialCommunityIcons 
                name="account-search" 
                size={44} 
                color={isDark ? Colors.dark.tint : Colors.light.tint} 
              />
            </LinearGradient>
            <Text style={[styles.emptyText, isDark ? styles.emptyTextDark : styles.emptyTextLight]}>
              {searchQuery.trim() ? 
                'Сотрудники не найдены, измените запрос поиска' : 
                'Список сотрудников пуст'}
            </Text>
            <Button 
              mode="contained" 
              onPress={() => setAddDialogVisible(true)}
              style={styles.emptyButton}
              buttonColor={isDark ? Colors.dark.tint : Colors.light.tint}
              icon="account-plus"
            >
              Добавить сотрудника
            </Button>
          </View>
        }
      />
      
      <Portal>
        <Dialog
          visible={detailDialogVisible}
          onDismiss={() => setDetailDialogVisible(false)}
          style={[styles.dialog, { backgroundColor: isDark ? '#1e1e1e' : 'white' }]}
        >
          {selectedEmployee && (
            <>
              <Dialog.Title style={{ color: isDark ? Colors.dark.text : '#333' }}>Информация о сотруднике</Dialog.Title>
              <Dialog.Content>
                <View style={styles.dialogAvatarContainer}>
                  <LinearGradient
                    colors={getDepartmentColor(selectedEmployee.department || 'Разработка')}
                    style={styles.dialogAvatarBorder}
                  >
                    <Image
                      source={{ uri: selectedEmployee.avatarUrl }}
                      style={styles.dialogAvatar}
                    />
                  </LinearGradient>
                  <Text style={[styles.dialogName, { color: isDark ? Colors.dark.text : '#333' }]}>{selectedEmployee.name}</Text>
                  <LinearGradient
                    colors={getRoleGradient(selectedEmployee.role)}
                    style={styles.dialogRoleChip}
                  >
                    <Text style={styles.dialogRoleText}>{getRoleText(selectedEmployee.role)}</Text>
                  </LinearGradient>
                </View>
                
                <View style={styles.dialogInfoContainer}>
                  <View style={styles.dialogInfoItem}>
                    <MaterialCommunityIcons name="email" size={22} color={isDark ? Colors.dark.tint : Colors.light.tint} />
                    <Text style={[styles.dialogInfoText, { color: isDark ? Colors.dark.text : '#333' }]}>{selectedEmployee.email}</Text>
                  </View>
                  
                  {selectedEmployee.department && (
                    <View style={styles.dialogInfoItem}>
                      <MaterialCommunityIcons name="office-building" size={22} color={isDark ? Colors.dark.tint : Colors.light.tint} />
                      <Text style={[styles.dialogInfoText, { color: isDark ? Colors.dark.text : '#333' }]}>{selectedEmployee.department}</Text>
                    </View>
                  )}
                  
                  {selectedEmployee.position && (
                    <View style={styles.dialogInfoItem}>
                      <MaterialCommunityIcons name="briefcase" size={22} color={isDark ? Colors.dark.tint : Colors.light.tint} />
                      <Text style={[styles.dialogInfoText, { color: isDark ? Colors.dark.text : '#333' }]}>{selectedEmployee.position}</Text>
                    </View>
                  )}
                </View>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setDetailDialogVisible(false)}>Закрыть</Button>
                {user?.role === UserRole.ADMIN && (
                  <Button 
                    textColor="red" 
                    onPress={() => {
                      setDeleteConfirmVisible(true);
                    }}
                  >
                    Удалить
                  </Button>
                )}
              </Dialog.Actions>
            </>
          )}
        </Dialog>
      </Portal>
      
      <Portal>
        <Dialog
          visible={deleteConfirmVisible}
          onDismiss={() => setDeleteConfirmVisible(false)}
          style={{ backgroundColor: isDark ? '#1e1e1e' : 'white' }}
        >
          <Dialog.Title style={{ color: isDark ? Colors.dark.text : '#333' }}>Подтверждение удаления</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: isDark ? Colors.dark.text : '#333' }}>
              Вы уверены, что хотите удалить сотрудника {selectedEmployee?.name}?
              Это действие нельзя отменить.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteConfirmVisible(false)}>Отмена</Button>
            <Button textColor="red" onPress={handleDeleteEmployee}>Удалить</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      <Portal>
        <Dialog
          visible={addDialogVisible}
          onDismiss={() => setAddDialogVisible(false)}
          style={[styles.dialog, { backgroundColor: isDark ? '#1e1e1e' : 'white' }]}
        >
          <Dialog.Title style={{ color: isDark ? Colors.dark.text : '#333' }}>Добавить сотрудника</Dialog.Title>
          <Dialog.Content>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: isDark ? '#aaa' : '#666' }]}>Имя и фамилия *</Text>
              <RNTextInput
                style={[
                  styles.textInput,
                  { 
                    backgroundColor: isDark ? '#2c2c2e' : '#f5f5f5',
                    color: isDark ? '#fff' : '#333',
                    borderColor: isDark ? '#444' : '#ddd'
                  }
                ]}
                value={newEmployee.name}
                onChangeText={(text) => setNewEmployee({ ...newEmployee, name: text })}
                placeholder="Введите имя и фамилию"
                placeholderTextColor={isDark ? '#888' : '#999'}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: isDark ? '#aaa' : '#666' }]}>Email *</Text>
              <View style={styles.emailInputContainer}>
                <RNTextInput
                  style={[
                    styles.textInput,
                    { 
                      backgroundColor: isDark ? '#2c2c2e' : '#f5f5f5',
                      color: isDark ? '#fff' : '#333',
                      borderColor: isDark ? '#444' : '#ddd'
                    }
                  ]}
                  value={newEmployee.email}
                  onChangeText={(text) => setNewEmployee({ ...newEmployee, email: text })}
                  placeholder="Введите email"
                  placeholderTextColor={isDark ? '#888' : '#999'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => {
                    if (newEmployee.name && !newEmployee.email) {
                      setShowEmailSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Небольшая задержка перед скрытием, чтобы успеть нажать на подсказку
                    setTimeout(() => setShowEmailSuggestions(false), 200);
                  }}
                />
              </View>
            </View>
            
            {showEmailSuggestions && newEmployee.name && (
              <View style={[
                styles.emailSuggestions,
                { 
                  backgroundColor: isDark ? '#252527' : '#f5f5f5',
                  borderColor: isDark ? '#444' : '#ddd'
                }
              ]}>
                <View style={styles.emailSuggestionsHeader}>
                  <Text style={{ 
                    color: isDark ? '#aaa' : '#666', 
                    fontWeight: 'bold',
                    fontSize: 13
                  }}>
                    Рекомендуемые email:
                  </Text>
                </View>
                
                <ScrollView style={styles.emailSuggestionsList}>
                  {emailDomains.map((domain, index) => {
                    const suggestedEmail = generateEmail(newEmployee.name, domain);
                    return (
                      <TouchableOpacity 
                        key={index}
                        style={[
                          styles.emailSuggestionItem,
                          { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                        ]}
                        onPress={() => {
                          setNewEmployee({ ...newEmployee, email: suggestedEmail });
                          setShowEmailSuggestions(false);
                        }}
                      >
                        <MaterialCommunityIcons
                          name="email-outline"
                          size={16}
                          color={isDark ? Colors.dark.tint : Colors.light.tint}
                          style={{ marginRight: 8 }}
                        />
                        <Text style={{ color: isDark ? '#fff' : '#333', fontSize: 14 }}>
                          {suggestedEmail}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: isDark ? '#aaa' : '#666' }]}>Отдел</Text>
              <View style={styles.selectContainer}>
                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    { 
                      borderColor: isDark ? '#444' : '#ddd',
                      backgroundColor: isDark ? '#2c2c2e' : '#f5f5f5' 
                    }
                  ]}
                  onPress={() => setShowDepartmentDropdown(true)}
                >
                  <Text style={{ color: isDark ? '#fff' : '#333' }}>
                    {newEmployee.department || "Выбрать отдел"}
                  </Text>
                  <MaterialCommunityIcons 
                    name="chevron-down" 
                    size={24} 
                    color={isDark ? '#aaa' : '#666'} 
                    style={styles.selectIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: isDark ? '#aaa' : '#666' }]}>Должность</Text>
              <View style={styles.selectContainer}>
                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    { 
                      borderColor: isDark ? '#444' : '#ddd',
                      backgroundColor: isDark ? '#2c2c2e' : '#f5f5f5' 
                    }
                  ]}
                  onPress={() => {
                    if (newEmployee.department) {
                      setShowPositionDropdown(true);
                    } else {
                      Alert.alert('Ошибка', 'Сначала выберите отдел');
                    }
                  }}
                >
                  <Text style={{ color: isDark ? '#fff' : '#333' }}>
                    {newEmployee.position || "Выбрать должность"}
                  </Text>
                  <MaterialCommunityIcons 
                    name="chevron-down" 
                    size={24} 
                    color={isDark ? '#aaa' : '#666'} 
                    style={styles.selectIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={[styles.roleLabel, { color: isDark ? '#aaa' : '#666' }]}>Роль:</Text>
            <SegmentedButtons
              value={newEmployee.role}
              onValueChange={(value) => setNewEmployee({ ...newEmployee, role: value as string })}
              buttons={[
                { value: UserRole.EMPLOYEE, label: 'Сотрудник', icon: 'account' },
                { value: UserRole.MANAGER, label: 'Менеджер', icon: 'account-tie' },
                { value: UserRole.ADMIN, label: 'Админ', icon: 'shield-account' },
              ]}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddDialogVisible(false)}>Отмена</Button>
            <Button mode="contained" onPress={handleAddEmployee}>Добавить</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Выпадающий список для выбора отдела */}
      <Portal>
        <Modal
          visible={showDepartmentDropdown}
          onDismiss={() => setShowDepartmentDropdown(false)}
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={[
              styles.dropdown, 
              {
                backgroundColor: isDark ? '#1e1e1e' : 'white',
                borderColor: isDark ? '#444' : '#ddd'
              }
            ]}>
              <View style={styles.dropdownHeader}>
                <Text style={[styles.dropdownTitle, { color: isDark ? '#fff' : '#333' }]}>
                  Выберите отдел
                </Text>
                <IconButton
                  icon="close"
                  size={20}
                  onPress={() => setShowDepartmentDropdown(false)}
                  iconColor={isDark ? '#fff' : '#333'}
                />
              </View>
              
              <ScrollView style={styles.dropdownList}>
                {departments.map((dept, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dropdownItem,
                      newEmployee.department === dept && styles.dropdownItemSelected
                    ]}
                    onPress={() => {
                      setNewEmployee({ 
                        ...newEmployee, 
                        department: dept,
                        // Сбрасываем должность при смене отдела
                        position: '' 
                      });
                      setShowDepartmentDropdown(false);
                    }}
                  >
                    <LinearGradient
                      colors={getDepartmentColor(dept)}
                      style={styles.departmentIcon}
                    >
                      <MaterialCommunityIcons
                        name="office-building"
                        size={16}
                        color="#fff"
                      />
                    </LinearGradient>
                    <Text style={{ 
                      color: isDark ? '#fff' : '#333',
                      fontWeight: newEmployee.department === dept ? 'bold' : 'normal'
                    }}>
                      {dept}
                    </Text>
                    {newEmployee.department === dept && (
                      <MaterialCommunityIcons
                        name="check"
                        size={20}
                        color={isDark ? Colors.dark.tint : Colors.light.tint}
                        style={{ marginLeft: 'auto' }}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </Portal>
      
      {/* Выпадающий список для выбора должности */}
      <Portal>
        <Modal
          visible={showPositionDropdown}
          onDismiss={() => setShowPositionDropdown(false)}
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={[
              styles.dropdown, 
              {
                backgroundColor: isDark ? '#1e1e1e' : 'white',
                borderColor: isDark ? '#444' : '#ddd'
              }
            ]}>
              <View style={styles.dropdownHeader}>
                <Text style={[styles.dropdownTitle, { color: isDark ? '#fff' : '#333' }]}>
                  Выберите должность
                </Text>
                <IconButton
                  icon="close"
                  size={20}
                  onPress={() => setShowPositionDropdown(false)}
                  iconColor={isDark ? '#fff' : '#333'}
                />
              </View>
              
              <ScrollView style={styles.dropdownList}>
                {newEmployee.department && positions[newEmployee.department]?.map((pos, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dropdownItem,
                      newEmployee.position === pos && styles.dropdownItemSelected
                    ]}
                    onPress={() => {
                      setNewEmployee({ ...newEmployee, position: pos });
                      setShowPositionDropdown(false);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="briefcase-outline"
                      size={20}
                      color={isDark ? '#aaa' : '#666'}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={{ 
                      color: isDark ? '#fff' : '#333',
                      fontWeight: newEmployee.position === pos ? 'bold' : 'normal'
                    }}>
                      {pos}
                    </Text>
                    {newEmployee.position === pos && (
                      <MaterialCommunityIcons
                        name="check"
                        size={20}
                        color={isDark ? Colors.dark.tint : Colors.light.tint}
                        style={{ marginLeft: 'auto' }}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </Portal>
      
      <FAB
        icon="account-plus"
        label="Добавить"
        style={[styles.fab, { backgroundColor: isDark ? Colors.dark.tint : Colors.light.tint }]}
        onPress={() => setAddDialogVisible(true)}
        color="#fff"
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  searchBar: {
    height: 40,
    elevation: 0,
    borderRadius: 10,
  },
  searchBarLight: {
    backgroundColor: '#f0f0f0',
  },
  searchBarDark: {
    backgroundColor: '#2c2c2e',
  },
  searchInput: {
    fontSize: 14,
  },
  searchInputLight: {
    color: '#333333',
  },
  searchInputDark: {
    color: '#e0e0e0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  employeesList: {
    paddingHorizontal: 16,
    paddingBottom: 80, // Для FAB
  },
  employeeItemContainer: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  employeeItem: {
    borderRadius: 16,
    padding: 16,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatarBorder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  statusIndicator: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'white',
    bottom: 0,
    right: 0,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  roleChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  roleChipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  employeeDetails: {
    marginTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 14,
  },
  arrowIcon: {
    marginLeft: 'auto',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 16,
  },
  emptyTextLight: {
    color: '#666666',
  },
  emptyTextDark: {
    color: '#cccccc',
  },
  emptyButton: {
    paddingHorizontal: 16,
  },
  dialog: {
    borderRadius: 16,
    maxHeight: '80%',
  },
  dialogAvatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dialogAvatarBorder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  dialogAvatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  dialogName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogRoleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dialogRoleText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dialogInfoContainer: {
    marginTop: 16,
  },
  dialogInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    borderRadius: 10,
  },
  dialogInfoText: {
    fontSize: 16,
    marginLeft: 12,
  },
  input: {
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  roleLabel: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  selectContainer: {
    position: 'relative',
  },
  selectButton: {
    height: 48,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
  },
  selectIcon: {
    position: 'absolute',
    right: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  dropdown: {
    width: '90%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: '70%',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dropdownList: {
    paddingVertical: 8,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  departmentIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  emailInputContainer: {
    position: 'relative',
  },
  emailSuggestions: {
    position: 'absolute',
    top: 120, // Позиционируем ниже поля ввода
    left: 12,
    right: 12,
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emailSuggestionsHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  emailSuggestionsList: {
    maxHeight: 180,
  },
  emailSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
}); 