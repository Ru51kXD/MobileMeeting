import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, Alert } from 'react-native';
import { Avatar, Button, FAB, ActivityIndicator, Dialog, Portal, Chip, Searchbar, SegmentedButtons } from 'react-native-paper';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Определим UserRole прямо здесь, чтобы избежать проблем с импортом
const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE'
};

// Обновим тип User
interface EmployeeUser extends User {
  role: string;
}

// Временный список сотрудников
const DEMO_USERS: EmployeeUser[] = [
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

export default function EmployeesScreen() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeUser | null>(null);
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

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchQuery, selectedFilter]);

  const loadEmployees = () => {
    // Имитация загрузки данных с сервера
    setTimeout(() => {
      setEmployees(DEMO_USERS);
      setLoading(false);
      setRefreshing(false);
    }, 1000);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEmployees();
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

  const handleEmployeePress = (employee: EmployeeUser) => {
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
    const newUser: EmployeeUser = {
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

  const renderEmployeeItem = ({ item }: { item: EmployeeUser }) => {
    return (
      <TouchableOpacity
        style={styles.employeeItem}
        onPress={() => handleEmployeePress(item)}
      >
        <View style={styles.employeeHeader}>
          <Avatar.Image
            source={{ uri: item.avatarUrl }}
            size={50}
          />
          <View style={styles.employeeInfo}>
            <Text style={styles.employeeName}>{item.name}</Text>
            <Text style={styles.employeeEmail}>{item.email}</Text>
            {item.position && (
              <Text style={styles.employeePosition}>{item.position}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.employeeFooter}>
          <Chip 
            style={[styles.roleChip, { backgroundColor: getRoleColor(item.role) }]}
            textStyle={{ color: 'white' }}
          >
            {getRoleText(item.role)}
          </Chip>
          
          {item.department && (
            <Chip style={styles.departmentChip}>
              {item.department}
            </Chip>
          )}
        </View>
      </TouchableOpacity>
    );
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
          placeholder="Поиск сотрудников..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={selectedFilter}
          onValueChange={setSelectedFilter}
          buttons={[
            { value: 'all', label: 'Все' },
            { value: UserRole.EMPLOYEE, label: 'Сотрудники' },
            { value: UserRole.MANAGER, label: 'Менеджеры' },
            { value: UserRole.ADMIN, label: 'Админы' },
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
            colors={['#2196F3']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-search" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Сотрудники не найдены</Text>
          </View>
        }
      />
      
      {/* Диалог с детальной информацией о сотруднике */}
      <Portal>
        <Dialog
          visible={detailDialogVisible}
          onDismiss={() => setDetailDialogVisible(false)}
          style={styles.dialog}
        >
          {selectedEmployee && (
            <>
              <Dialog.Title>Информация о сотруднике</Dialog.Title>
              <Dialog.Content>
                <View style={styles.dialogAvatarContainer}>
                  <Avatar.Image
                    source={{ uri: selectedEmployee.avatarUrl }}
                    size={80}
                  />
                </View>
                
                <View style={styles.dialogSection}>
                  <Text style={styles.dialogSectionTitle}>Имя</Text>
                  <Text style={styles.dialogText}>{selectedEmployee.name}</Text>
                </View>
                
                <View style={styles.dialogSection}>
                  <Text style={styles.dialogSectionTitle}>Email</Text>
                  <Text style={styles.dialogText}>{selectedEmployee.email}</Text>
                </View>
                
                <View style={styles.dialogSection}>
                  <Text style={styles.dialogSectionTitle}>Роль</Text>
                  <Chip 
                    style={[styles.dialogChip, { backgroundColor: getRoleColor(selectedEmployee.role) }]}
                    textStyle={{ color: 'white' }}
                  >
                    {getRoleText(selectedEmployee.role)}
                  </Chip>
                </View>
                
                {selectedEmployee.department && (
                  <View style={styles.dialogSection}>
                    <Text style={styles.dialogSectionTitle}>Отдел</Text>
                    <Text style={styles.dialogText}>{selectedEmployee.department}</Text>
                  </View>
                )}
                
                {selectedEmployee.position && (
                  <View style={styles.dialogSection}>
                    <Text style={styles.dialogSectionTitle}>Должность</Text>
                    <Text style={styles.dialogText}>{selectedEmployee.position}</Text>
                  </View>
                )}
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setDetailDialogVisible(false)}>Закрыть</Button>
                {/* Кнопка удаления только для администраторов */}
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
      
      {/* Диалог подтверждения удаления */}
      <Portal>
        <Dialog
          visible={deleteConfirmVisible}
          onDismiss={() => setDeleteConfirmVisible(false)}
        >
          <Dialog.Title>Подтверждение удаления</Dialog.Title>
          <Dialog.Content>
            <Text>
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
      
      {/* Диалог добавления сотрудника */}
      <Portal>
        <Dialog
          visible={addDialogVisible}
          onDismiss={() => setAddDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Добавить сотрудника</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Имя и фамилия *"
              value={newEmployee.name}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, name: text })}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Email *"
              value={newEmployee.email}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Отдел"
              value={newEmployee.department}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, department: text })}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Должность"
              value={newEmployee.position}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, position: text })}
              style={styles.input}
              mode="outlined"
            />
            
            <Text style={styles.roleLabel}>Роль:</Text>
            <SegmentedButtons
              value={newEmployee.role}
              onValueChange={(value) => setNewEmployee({ ...newEmployee, role: value as string })}
              buttons={[
                { value: UserRole.EMPLOYEE, label: 'Сотрудник' },
                { value: UserRole.MANAGER, label: 'Менеджер' },
                { value: UserRole.ADMIN, label: 'Админ' },
              ]}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddDialogVisible(false)}>Отмена</Button>
            <Button mode="contained" onPress={handleAddEmployee}>Добавить</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setAddDialogVisible(true)}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  searchBar: {
    elevation: 0,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    marginTop: 1,
    elevation: 1,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  employeesList: {
    padding: 16,
  },
  employeeItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
  },
  employeeHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  employeeInfo: {
    marginLeft: 16,
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  employeeEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  employeePosition: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  employeeFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  roleChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  departmentChip: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#e0e0e0',
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
  dialog: {
    maxHeight: '80%',
  },
  dialogAvatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
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
    color: '#333',
  },
  dialogChip: {
    alignSelf: 'flex-start',
  },
  input: {
    marginBottom: 16,
  },
  roleLabel: {
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#666',
  },
}); 