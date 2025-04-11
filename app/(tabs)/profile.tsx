import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, Switch, useColorScheme } from 'react-native';
import { Avatar, Button, Divider, TextInput, Dialog, Portal, useTheme as usePaperTheme } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { UserRole } from '../../types/index';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const paperTheme = usePaperTheme();
  const [editMode, setEditMode] = useState(false);
  const [passwordDialogVisible, setPasswordDialogVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(true);
  const [avatarUri, setAvatarUri] = useState(user?.avatarUrl || 'https://ui-avatars.com/api/?name=Admin+System&background=0D8ABC&color=fff');
  
  const [userData, setUserData] = useState({
    name: user?.name || 'Админ Системы',
    position: user?.position || 'Руководитель отдела',
    department: user?.department || 'ИТ отдел',
    email: user?.email || 'admin@company.com',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Используем isDark из контекста ThemeContext
  const [darkModeEnabled, setDarkModeEnabled] = useState(isDark);

  // Обновляем локальное состояние при изменении глобальной темы
  useEffect(() => {
    setDarkModeEnabled(isDark);
  }, [isDark]);

  // Обработчик переключения темы
  const handleThemeToggle = (value: boolean) => {
    setDarkModeEnabled(value);
    toggleTheme();
  };

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
            router.replace('/(auth)/login');
          } 
        }
      ]
    );
  };

  const handleChangeAvatar = () => {
    // Имитация смены аватара без использования библиотеки выбора изображения
    const avatars = [
      'https://ui-avatars.com/api/?name=Admin+System&background=0D8ABC&color=fff',
      'https://ui-avatars.com/api/?name=Admin+User&background=2E7D32&color=fff',
      'https://ui-avatars.com/api/?name=Corporate+Admin&background=C62828&color=fff',
      'https://ui-avatars.com/api/?name=Task+Manager&background=6A1B9A&color=fff'
    ];
    
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
    setAvatarUri(randomAvatar);
    Alert.alert('Аватар обновлен', 'В тестовом режиме аватар выбирается случайным образом');
  };

  const handleEmailChange = () => {
    // В реальном приложении здесь будет логика изменения email
    Alert.alert('Функция в разработке', 'Изменение email пока недоступно');
  };

  const handleAppSettings = () => {
    Alert.alert('Настройки приложения', 'Здесь будут дополнительные настройки приложения');
  };

  const handleHelpSupport = () => {
    Alert.alert('Помощь и поддержка', 'Свяжитесь с нами по адресу support@company.com');
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
        return 'Администратор';
    }
  };

  return (
    <View style={styles.container(isDark)}>
      <ScrollView>
        <View style={styles.header(isDark)}>
          <View style={styles.avatarContainer}>
            <Avatar.Image
              source={{ uri: avatarUri }}
              size={100}
            />
            {editMode && (
              <TouchableOpacity 
                style={styles.changeAvatarButton}
                onPress={handleChangeAvatar}
              >
                <MaterialCommunityIcons name="camera" size={22} color="white" />
              </TouchableOpacity>
            )}
          </View>
          
          {!editMode ? (
            <View style={styles.userInfo}>
              <Text style={styles.userName(isDark)}>{userData.name}</Text>
              <Text style={styles.userRole}>{getRoleText(user?.role || UserRole.ADMIN)}</Text>
              {userData.position && <Text style={styles.userPosition(isDark)}>{userData.position}</Text>}
              {userData.department && <Text style={styles.userDepartment(isDark)}>{userData.department}</Text>}
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
        
        <View style={styles.section(isDark)}>
          <Text style={styles.sectionTitle(isDark)}>Учетная запись</Text>
          
          <TouchableOpacity 
            style={styles.option(isDark)}
            onPress={handleEmailChange}
          >
            <View style={styles.optionIconContainer}>
              <MaterialCommunityIcons name="email" size={24} color="#2196F3" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle(isDark)}>Email</Text>
              <Text style={styles.optionValue(isDark)}>{userData.email}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={isDark ? "#555" : "#ccc"} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.option(isDark)}
            onPress={() => setPasswordDialogVisible(true)}
          >
            <View style={styles.optionIconContainer}>
              <MaterialCommunityIcons name="lock" size={24} color="#2196F3" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle(isDark)}>Пароль</Text>
              <Text style={styles.optionValue(isDark)}>Изменить пароль</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={isDark ? "#555" : "#ccc"} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section(isDark)}>
          <Text style={styles.sectionTitle(isDark)}>Настройки</Text>
          
          <View style={styles.option(isDark)}>
            <View style={styles.optionIconContainer}>
              <MaterialCommunityIcons name="bell" size={24} color="#2196F3" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle(isDark)}>Уведомления</Text>
              <Text style={styles.optionValue(isDark)}>Получать push-уведомления</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={notificationsEnabled ? "#2196F3" : "#f4f3f4"}
            />
          </View>
          
          <View style={styles.option(isDark)}>
            <View style={styles.optionIconContainer}>
              <MaterialCommunityIcons name="calendar-sync" size={24} color="#2196F3" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle(isDark)}>Синхронизация календаря</Text>
              <Text style={styles.optionValue(isDark)}>Синхронизировать митинги с календарем</Text>
            </View>
            <Switch
              value={calendarSyncEnabled}
              onValueChange={setCalendarSyncEnabled}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={calendarSyncEnabled ? "#2196F3" : "#f4f3f4"}
            />
          </View>
          
          <View style={styles.option(isDark)}>
            <View style={styles.optionIconContainer}>
              <MaterialCommunityIcons name="theme-light-dark" size={24} color="#2196F3" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle(isDark)}>Темная тема</Text>
              <Text style={styles.optionValue(isDark)}>Использовать темную тему</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={handleThemeToggle}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={darkModeEnabled ? "#2196F3" : "#f4f3f4"}
            />
          </View>
        </View>
        
        <View style={styles.section(isDark)}>
          <Text style={styles.sectionTitle(isDark)}>Приложение</Text>
          
          <TouchableOpacity 
            style={styles.option(isDark)}
            onPress={handleAppSettings}
          >
            <View style={styles.optionIconContainer}>
              <MaterialCommunityIcons name="cog" size={24} color="#2196F3" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle(isDark)}>Настройки приложения</Text>
              <Text style={styles.optionValue(isDark)}>Язык, временная зона и другие настройки</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={isDark ? "#555" : "#ccc"} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.option(isDark)}
            onPress={handleHelpSupport}
          >
            <View style={styles.optionIconContainer}>
              <MaterialCommunityIcons name="help-circle" size={24} color="#2196F3" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle(isDark)}>Помощь и поддержка</Text>
              <Text style={styles.optionValue(isDark)}>Справка, обратная связь, сообщить о проблеме</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={isDark ? "#555" : "#ccc"} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.option(isDark), styles.logoutOption]}
            onPress={handleLogout}
          >
            <View style={styles.optionIconContainer}>
              <MaterialCommunityIcons name="logout" size={24} color="#F44336" />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle(isDark), styles.logoutText]}>Выйти из системы</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <Portal>
          <Dialog 
            visible={passwordDialogVisible}
            onDismiss={() => setPasswordDialogVisible(false)}
            style={{ backgroundColor: isDark ? '#1e1e1e' : 'white' }}
          >
            <Dialog.Title style={{ color: isDark ? Colors.dark.text : Colors.light.text }}>Изменение пароля</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Текущий пароль"
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData({...passwordData, currentPassword: text})}
                secureTextEntry
                mode="outlined"
                style={styles.dialogInput}
              />
              <TextInput
                label="Новый пароль"
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData({...passwordData, newPassword: text})}
                secureTextEntry
                mode="outlined"
                style={styles.dialogInput}
              />
              <TextInput
                label="Подтвердите новый пароль"
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData({...passwordData, confirmPassword: text})}
                secureTextEntry
                mode="outlined"
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setPasswordDialogVisible(false)}>Отмена</Button>
              <Button onPress={handleChangePassword}>Сохранить</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </View>
  );
}

// Преобразуем стили в функциональные, чтобы они могли зависеть от темы
const styles = {
  container: (isDark: boolean) => ({
    flex: 1,
    backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
  }),
  header: (isDark: boolean) => ({
    backgroundColor: isDark ? '#1e1e1e' : 'white',
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333' : '#eee',
  }),
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  changeAvatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: (isDark: boolean) => ({
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    color: isDark ? Colors.dark.text : Colors.light.text,
  }),
  userRole: {
    fontSize: 16,
    color: '#2196F3',
    marginBottom: 8,
  },
  userPosition: (isDark: boolean) => ({
    fontSize: 14,
    color: isDark ? '#aaa' : '#666',
    marginBottom: 4,
  }),
  userDepartment: (isDark: boolean) => ({
    fontSize: 14,
    color: isDark ? '#aaa' : '#666',
  }),
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
    marginRight: 12,
  },
  section: (isDark: boolean) => ({
    backgroundColor: isDark ? '#1e1e1e' : 'white',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: isDark ? '#333' : '#eee',
  }),
  sectionTitle: (isDark: boolean) => ({
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 12,
    color: isDark ? '#ccc' : '#333',
  }),
  option: (isDark: boolean) => ({
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333' : '#f5f5f5',
  }),
  optionIconContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: (isDark: boolean) => ({
    fontSize: 16,
    marginBottom: 4,
    color: isDark ? Colors.dark.text : Colors.light.text,
  }),
  optionValue: (isDark: boolean) => ({
    fontSize: 14,
    color: isDark ? '#aaa' : '#666',
  }),
  logoutOption: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#F44336',
  },
  dialogInput: {
    marginBottom: 12,
  },
}; 