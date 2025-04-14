import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, Switch, useColorScheme, Animated } from 'react-native';
import { Avatar, Button, Divider, TextInput, Dialog, Portal, useTheme as usePaperTheme, Card, Badge, Chip } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons, FontAwesome, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { UserRole } from '../../types/index';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedContainer } from '@/components/ThemedContainer';

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

  // Анимированные значения
  const [fadeAnims] = useState({
    header: new Animated.Value(0),
    profileCard: new Animated.Value(0),
    statsCard: new Animated.Value(0),
    projectsCard: new Animated.Value(0),
    settingsCard: new Animated.Value(0)
  });

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

  // Анимация появления элементов
  useEffect(() => {
    const animations = Object.values(fadeAnims).map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 100 * index,
        useNativeDriver: true
      })
    );
    
    Animated.stagger(150, animations).start();
  }, []);

  if (!user) {
    return (
      <ThemedContainer style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <Text style={{color: isDark ? '#ffffff' : '#000000', fontSize: 18}}>
          Пожалуйста, авторизуйтесь
        </Text>
        <TouchableOpacity 
          style={[styles.button, {marginTop: 20}]} 
          onPress={() => router.replace('/login')}
        >
          <LinearGradient
            colors={isDark ? ['#0a84ff', '#0066cc'] : ['#007aff', '#0062cc']}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>Войти</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ThemedContainer>
    );
  }

  return (
    <ThemedContainer style={[styles.container, {backgroundColor: isDark ? '#1c1c1e' : '#f8f8fa'}]}>
      <Animated.View style={{
        opacity: fadeAnims.header,
        transform: [{
          translateY: fadeAnims.header.interpolate({
            inputRange: [0, 1],
            outputRange: [-20, 0]
          })
        }]
      }}>
        <LinearGradient
          colors={isDark ? ['#2c2c2e', '#1c1c1e'] : ['#ffffff', '#f8f8fa']}
          style={styles.header}
        >
          <Text style={[styles.headerTitle, {color: isDark ? '#ffffff' : '#000000'}]}>
            Мой профиль
          </Text>
          <TouchableOpacity 
            style={styles.themeToggle}
            onPress={toggleTheme}
          >
            <LinearGradient
              colors={isDark ? ['#3a3a3c', '#2c2c2e'] : ['#ffffff', '#f2f2f7']}
              style={styles.themeToggleGradient}
            >
              <FontAwesome 
                name={isDark ? "moon-o" : "sun-o"} 
                size={18} 
                color={isDark ? '#ffffff' : '#000000'} 
              />
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{
          opacity: fadeAnims.profileCard,
          transform: [{
            translateY: fadeAnims.profileCard.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })
          }]
        }}>
          <LinearGradient
            colors={isDark ? ['#2c2c2e', '#252527'] : ['#ffffff', '#f8f8fa']}
            style={styles.profileCard}
          >
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={isDark ? 
                    ['rgba(80, 80, 100, 0.6)', 'rgba(40, 40, 60, 0.8)'] : 
                    ['rgba(240, 240, 250, 0.8)', 'rgba(200, 200, 230, 0.9)']}
                  style={styles.avatarGradient}
                >
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatar}
                  />
                  <View style={styles.statusBadge} />
                </LinearGradient>
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={[styles.userName, {color: isDark ? '#ffffff' : '#000000'}]}>
                  {userData.name}
                </Text>
                <Text style={[styles.userPosition, {color: isDark ? '#9a9a9a' : '#666666'}]}>
                  {getRoleText(user?.role || UserRole.ADMIN)}
                </Text>
                {userData.position && <Text style={[styles.userPosition, {color: isDark ? '#9a9a9a' : '#666666'}]}>{userData.position}</Text>}
                {userData.department && <Text style={[styles.userPosition, {color: isDark ? '#9a9a9a' : '#666666'}]}>{userData.department}</Text>}
              </View>
            </View>
            
            <View style={styles.contactInfo}>
              <View style={styles.contactItem}>
                <View style={[styles.contactIcon, {backgroundColor: isDark ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 122, 255, 0.15)'}]}>
                  <FontAwesome name="envelope" size={16} color={isDark ? '#0a84ff' : '#007aff'} />
                </View>
                <Text style={[styles.contactText, {color: isDark ? '#ffffff' : '#000000'}]}>
                  {userData.email}
                </Text>
              </View>
              
              <View style={styles.contactItem}>
                <View style={[styles.contactIcon, {backgroundColor: isDark ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 122, 255, 0.15)'}]}>
                  <FontAwesome name="phone" size={16} color={isDark ? '#0a84ff' : '#007aff'} />
                </View>
                <Text style={[styles.contactText, {color: isDark ? '#ffffff' : '#000000'}]}>
                  {user?.phone || '+7 (999) 123-45-67'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
        
        <Animated.View style={{
          opacity: fadeAnims.statsCard,
          transform: [{
            translateY: fadeAnims.statsCard.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })
          }]
        }}>
          <LinearGradient
            colors={isDark ? ['#2c2c2e', '#252527'] : ['#ffffff', '#f8f8fa']}
            style={styles.statsCard}
          >
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={isDark ? ['#ff9500', '#ff6000'] : ['#ff9500', '#ff6000']}
                style={styles.cardIcon}
              >
                <FontAwesome name="tasks" size={16} color="#ffffff" />
              </LinearGradient>
              <Text style={[styles.cardTitle, {color: isDark ? '#ffffff' : '#000000'}]}>
                Рабочая статистика
              </Text>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <LinearGradient
                  colors={isDark ? ['rgba(76, 217, 100, 0.2)', 'rgba(76, 217, 100, 0.1)'] : ['rgba(52, 199, 89, 0.2)', 'rgba(52, 199, 89, 0.1)']}
                  style={styles.statCircle}
                >
                  <Text style={[styles.statValue, {color: isDark ? '#4cd964' : '#34c759'}]}>
                    85%
                  </Text>
                </LinearGradient>
                <Text style={[styles.statLabel, {color: isDark ? '#9a9a9a' : '#666666'}]}>
                  Эффективность
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <LinearGradient
                  colors={isDark ? ['rgba(10, 132, 255, 0.2)', 'rgba(10, 132, 255, 0.1)'] : ['rgba(0, 122, 255, 0.2)', 'rgba(0, 122, 255, 0.1)']}
                  style={styles.statCircle}
                >
                  <Text style={[styles.statValue, {color: isDark ? '#0a84ff' : '#007aff'}]}>
                    92%
                  </Text>
                </LinearGradient>
                <Text style={[styles.statLabel, {color: isDark ? '#9a9a9a' : '#666666'}]}>
                  Своевременность
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <LinearGradient
                  colors={isDark ? ['rgba(255, 149, 0, 0.2)', 'rgba(255, 149, 0, 0.1)'] : ['rgba(255, 149, 0, 0.2)', 'rgba(255, 149, 0, 0.1)']}
                  style={styles.statCircle}
                >
                  <Text style={[styles.statValue, {color: isDark ? '#ff9500' : '#ff9500'}]}>
                    7
                  </Text>
                </LinearGradient>
                <Text style={[styles.statLabel, {color: isDark ? '#9a9a9a' : '#666666'}]}>
                  Активные задачи
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
        
        <Animated.View style={{
          opacity: fadeAnims.projectsCard,
          transform: [{
            translateY: fadeAnims.projectsCard.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })
          }]
        }}>
          <LinearGradient
            colors={isDark ? ['#2c2c2e', '#252527'] : ['#ffffff', '#f8f8fa']}
            style={styles.projectsCard}
          >
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={isDark ? ['#5e5ce6', '#4b49b7'] : ['#5e5ce6', '#4b49b7']}
                style={styles.cardIcon}
              >
                <FontAwesome name="folder-open" size={16} color="#ffffff" />
              </LinearGradient>
              <Text style={[styles.cardTitle, {color: isDark ? '#ffffff' : '#000000'}]}>
                Проекты
              </Text>
              <View style={styles.projectsCount}>
                <Text style={styles.projectsCountText}>{user?.projects?.length || '4'}</Text>
              </View>
            </View>
            
            <View style={styles.projectsList}>
              {user?.projects?.map((project, index) => (
                <View key={index} style={styles.projectItem}>
                  <LinearGradient
                    colors={getProjectGradient(index, isDark)}
                    style={styles.projectDot}
                  />
                  <Text style={[styles.projectName, {color: isDark ? '#ffffff' : '#000000'}]}>
                    {project.name}
                  </Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>
        
        <Animated.View style={{
          opacity: fadeAnims.settingsCard,
          transform: [{
            translateY: fadeAnims.settingsCard.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })
          }]
        }}>
          <LinearGradient
            colors={isDark ? ['#2c2c2e', '#252527'] : ['#ffffff', '#f8f8fa']}
            style={styles.settingsCard}
          >
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={isDark ? ['#4cd964', '#30ad4b'] : ['#34c759', '#248a3d']}
                style={styles.cardIcon}
              >
                <FontAwesome name="cog" size={16} color="#ffffff" />
              </LinearGradient>
              <Text style={[styles.cardTitle, {color: isDark ? '#ffffff' : '#000000'}]}>
                Настройки
              </Text>
            </View>
            
            <TouchableOpacity style={styles.settingItem} onPress={toggleTheme}>
              <View style={styles.settingIconContainer}>
                <LinearGradient
                  colors={isDark ? ['#3a3a3c', '#2c2c2e'] : ['#ffffff', '#f2f2f7']}
                  style={styles.settingIcon}
                >
                  <FontAwesome name={isDark ? "moon-o" : "sun-o"} size={16} color={isDark ? '#ffffff' : '#000000'} />
                </LinearGradient>
                <Text style={[styles.settingText, {color: isDark ? '#ffffff' : '#000000'}]}>
                  Переключить тему
                </Text>
              </View>
              <FontAwesome name="angle-right" size={18} color={isDark ? '#9a9a9a' : '#666666'} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/account/edit')}>
              <View style={styles.settingIconContainer}>
                <LinearGradient
                  colors={isDark ? ['#3a3a3c', '#2c2c2e'] : ['#ffffff', '#f2f2f7']}
                  style={styles.settingIcon}
                >
                  <FontAwesome name="user-circle" size={16} color={isDark ? '#ffffff' : '#000000'} />
                </LinearGradient>
                <Text style={[styles.settingText, {color: isDark ? '#ffffff' : '#000000'}]}>
                  Редактировать профиль
                </Text>
              </View>
              <FontAwesome name="angle-right" size={18} color={isDark ? '#9a9a9a' : '#666666'} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/security')}>
              <View style={styles.settingIconContainer}>
                <LinearGradient
                  colors={isDark ? ['#3a3a3c', '#2c2c2e'] : ['#ffffff', '#f2f2f7']}
                  style={styles.settingIcon}
                >
                  <FontAwesome name="lock" size={16} color={isDark ? '#ffffff' : '#000000'} />
                </LinearGradient>
                <Text style={[styles.settingText, {color: isDark ? '#ffffff' : '#000000'}]}>
                  Безопасность
                </Text>
              </View>
              <FontAwesome name="angle-right" size={18} color={isDark ? '#9a9a9a' : '#666666'} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/notifications')}>
              <View style={styles.settingIconContainer}>
                <LinearGradient
                  colors={isDark ? ['#3a3a3c', '#2c2c2e'] : ['#ffffff', '#f2f2f7']}
                  style={styles.settingIcon}
                >
                  <FontAwesome name="bell" size={16} color={isDark ? '#ffffff' : '#000000'} />
                </LinearGradient>
                <Text style={[styles.settingText, {color: isDark ? '#ffffff' : '#000000'}]}>
                  Уведомления
                </Text>
              </View>
              <FontAwesome name="angle-right" size={18} color={isDark ? '#9a9a9a' : '#666666'} />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
        
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
        >
          <LinearGradient
            colors={isDark ? ['#ff3b30', '#cc2e26'] : ['#ff3b30', '#cc2e26']}
            style={styles.gradientButton}
          >
            <FontAwesome name="sign-out" size={16} color="#ffffff" style={{marginRight: 8}} />
            <Text style={styles.buttonText}>Выйти</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </ThemedContainer>
  );
}

// Вспомогательная функция для получения градиента для проекта
const getProjectGradient = (index: number, isDark: boolean) => {
  const gradients = [
    isDark ? ['#ff2d55', '#ff2d55cc'] : ['#ff2d55', '#ff2d55cc'],
    isDark ? ['#5e5ce6', '#5e5ce6cc'] : ['#5e5ce6', '#5e5ce6cc'],
    isDark ? ['#ff9500', '#ff9500cc'] : ['#ff9500', '#ff9500cc'],
    isDark ? ['#4cd964', '#4cd964cc'] : ['#34c759', '#34c759cc'],
  ];
  return gradients[index % gradients.length];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  themeToggleGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  profileCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4cd964',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  userPosition: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 8,
  },
  departmentBadge: {
    backgroundColor: 'rgba(100, 100, 250, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  departmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5E5CE6',
  },
  contactInfo: {
    marginTop: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactText: {
    fontSize: 15,
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  projectsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  projectsCount: {
    backgroundColor: 'rgba(94, 92, 230, 0.15)',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectsCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5E5CE6',
  },
  projectsList: {
    marginTop: 8,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  projectName: {
    fontSize: 16,
  },
  settingsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 142, 147, 0.1)',
  },
  settingIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 20,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    height: 46,
    borderRadius: 12,
    overflow: 'hidden',
    width: 200,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 