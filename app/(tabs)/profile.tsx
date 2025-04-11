import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, Switch } from 'react-native';
import { Avatar, Button, Divider, TextInput, Dialog, Portal } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UserRole } from '../../types';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [passwordDialogVisible, setPasswordDialogVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  
  const [userData, setUserData] = useState({
    name: user?.name || '',
    position: user?.position || '',
    department: user?.department || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSaveProfile = () => {
    if (!userData.name.trim()) {
      Alert.alert('Ошибка', 'Имя не может быть пустым');
      return;
    }
    
    // В реальном приложении здесь был бы запрос к API для обновления данных
    Alert.alert('Успешно', 'Профиль обновлен');
    setEditMode(false);
  };
  
  const handleChangePassword = () => {
    // Проверка на текущий пароль (в демо просто проверяем что не пустое)
    if (!passwordData.currentPassword) {
      Alert.alert('Ошибка', 'Введите текущий пароль');
      return;
    }
    
    // Проверка на совпадение новых паролей
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Ошибка', 'Новые пароли не совпадают');
      return;
    }
    
    // Проверка сложности пароля
    if (passwordData.newPassword.length < 6) {
      Alert.alert('Ошибка', 'Новый пароль должен содержать не менее 6 символов');
      return;
    }
    
    // В реальном приложении здесь был бы запрос к API для смены пароля
    Alert.alert('Успешно', 'Пароль изменен');
    setPasswordDialogVisible(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };
  
  const handleLogout = () => {
    Alert.alert(
      'Выход из системы',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Выйти', 
          style: 'destructive',
          onPress: () => {
            logout();
          } 
        }
      ]
    );
  };

  const getRoleText = (role: UserRole) => {
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Avatar.Image
            source={{ uri: user?.avatarUrl }}
            size={100}
          />
          {editMode && (
            <TouchableOpacity style={styles.changeAvatarButton}>
              <MaterialCommunityIcons name="camera" size={22} color="white" />
            </TouchableOpacity>
          )}
        </View>
        
        {!editMode ? (
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userRole}>{getRoleText(user?.role || UserRole.EMPLOYEE)}</Text>
            {user?.position && <Text style={styles.userPosition}>{user.position}</Text>}
            {user?.department && <Text style={styles.userDepartment}>{user.department}</Text>}
          </View>
        ) : (
          <View style={styles.editForm}>
            <TextInput
              label="Имя и фамилия"
              value={userData.name}
              onChangeText={(text) => setUserData({ ...userData, name: text })}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Должность"
              value={userData.position}
              onChangeText={(text) => setUserData({ ...userData, position: text })}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Отдел"
              value={userData.department}
              onChangeText={(text) => setUserData({ ...userData, department: text })}
              style={styles.input}
              mode="outlined"
            />
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          {!editMode ? (
            <Button 
              mode="contained" 
              onPress={() => setEditMode(true)}
              icon="account-edit"
            >
              Редактировать профиль
            </Button>
          ) : (
            <View style={styles.editButtons}>
              <Button 
                mode="outlined" 
                onPress={() => setEditMode(false)}
                style={styles.cancelButton}
              >
                Отмена
              </Button>
              <Button 
                mode="contained" 
                onPress={handleSaveProfile}
              >
                Сохранить
              </Button>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Учетная запись</Text>
        
        <TouchableOpacity 
          style={styles.option}
          onPress={() => {}}
        >
          <View style={styles.optionIconContainer}>
            <MaterialCommunityIcons name="email" size={24} color="#2196F3" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Email</Text>
            <Text style={styles.optionValue}>{user?.email}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.option}
          onPress={() => setPasswordDialogVisible(true)}
        >
          <View style={styles.optionIconContainer}>
            <MaterialCommunityIcons name="lock" size={24} color="#2196F3" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Пароль</Text>
            <Text style={styles.optionValue}>Изменить пароль</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Настройки</Text>
        
        <View style={styles.option}>
          <View style={styles.optionIconContainer}>
            <MaterialCommunityIcons name="bell" size={24} color="#2196F3" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Уведомления</Text>
            <Text style={styles.optionValue}>Получать push-уведомления</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={notificationsEnabled ? "#2196F3" : "#f4f3f4"}
          />
        </View>
        
        <View style={styles.option}>
          <View style={styles.optionIconContainer}>
            <MaterialCommunityIcons name="calendar-sync" size={24} color="#2196F3" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Синхронизация календаря</Text>
            <Text style={styles.optionValue}>Синхронизировать митинги с календарем</Text>
          </View>
          <Switch
            value={calendarSyncEnabled}
            onValueChange={setCalendarSyncEnabled}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={calendarSyncEnabled ? "#2196F3" : "#f4f3f4"}
          />
        </View>
        
        <View style={styles.option}>
          <View style={styles.optionIconContainer}>
            <MaterialCommunityIcons name="theme-light-dark" size={24} color="#2196F3" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Темная тема</Text>
            <Text style={styles.optionValue}>Использовать темную тему</Text>
          </View>
          <Switch
            value={darkModeEnabled}
            onValueChange={setDarkModeEnabled}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={darkModeEnabled ? "#2196F3" : "#f4f3f4"}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>О приложении</Text>
        
        <TouchableOpacity 
          style={styles.option}
          onPress={() => {}}
        >
          <View style={styles.optionIconContainer}>
            <MaterialCommunityIcons name="information" size={24} color="#2196F3" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>О приложении</Text>
            <Text style={styles.optionValue}>Версия 1.0.0</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.option}
          onPress={() => {}}
        >
          <View style={styles.optionIconContainer}>
            <MaterialCommunityIcons name="shield" size={24} color="#2196F3" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Политика конфиденциальности</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>
      
      <Button 
        mode="contained" 
        onPress={handleLogout}
        icon="logout"
        style={styles.logoutButton}
        buttonColor="#f44336"
      >
        Выйти из системы
      </Button>
      
      <Portal>
        <Dialog
          visible={passwordDialogVisible}
          onDismiss={() => setPasswordDialogVisible(false)}
        >
          <Dialog.Title>Смена пароля</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Текущий пароль"
              value={passwordData.currentPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
              secureTextEntry
              style={styles.dialogInput}
              mode="outlined"
            />
            
            <TextInput
              label="Новый пароль"
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
              secureTextEntry
              style={styles.dialogInput}
              mode="outlined"
            />
            
            <TextInput
              label="Подтвердите новый пароль"
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
              secureTextEntry
              style={styles.dialogInput}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPasswordDialogVisible(false)}>Отмена</Button>
            <Button onPress={handleChangePassword}>Изменить</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 16,
    elevation: 2,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  changeAvatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#2196F3',
    marginBottom: 8,
  },
  userPosition: {
    fontSize: 14,
    color: '#666',
  },
  userDepartment: {
    fontSize: 14,
    color: '#666',
  },
  editForm: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  buttonContainer: {
    width: '100%',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    marginRight: 8,
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 16,
    paddingTop: 12,
    paddingBottom: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingBottom: 8,
    color: '#666',
    fontSize: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
    marginLeft: 8,
  },
  optionTitle: {
    fontSize: 16,
    color: '#333',
  },
  optionValue: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    margin: 20,
  },
  dialogInput: {
    marginBottom: 12,
  },
}); 