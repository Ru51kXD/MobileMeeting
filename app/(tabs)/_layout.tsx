import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, View, Text } from 'react-native';
import { Badge } from 'react-native-paper';
import { UserRole } from '../../types/index';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const { getUnreadCount } = useChat();
  const router = useRouter();
  const { isDark } = useTheme();

  useEffect(() => {
    if (!isLoading && !user) {
      // Если пользователь не авторизован, перенаправляем на страницу входа
      router.replace('/(auth)/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: isDark ? '#121212' : '#ffffff'
      }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  // Количество непрочитанных сообщений
  const unreadCount = getUnreadCount();

  // Создаем обработчики стилей, чтобы избежать ошибок с анимированными значениями
  const getTabBarStyle = () => {
    return { 
      paddingBottom: 5, 
      height: 60, 
      backgroundColor: isDark ? '#121212' : '#ffffff',
      borderTopColor: isDark ? '#333' : '#e0e0e0',
    };
  };

  const getTabBarBackgroundStyle = () => {
    return { 
      flex: 1, 
      backgroundColor: isDark ? '#121212' : '#ffffff'
    };
  };

  const getHeaderStyle = () => {
    return { 
      backgroundColor: isDark ? '#121212' : '#ffffff',
      borderBottomColor: isDark ? '#333' : '#e0e0e0',
      borderBottomWidth: 1 
    };
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: isDark ? '#999' : '#666',
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: getTabBarStyle(),
        tabBarBackground: () => (
          <View style={getTabBarBackgroundStyle()} />
        ),
        headerStyle: getHeaderStyle(),
        headerTintColor: isDark ? '#ffffff' : '#333333',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Задачи',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="checkbox-marked-outline" color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
      
      <Tabs.Screen
        name="meetings"
        options={{
          title: 'Митинги',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-month" color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
      
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Чат',
          tabBarIcon: ({ color, size }) => (
            <View>
              <MaterialCommunityIcons name="chat" color={color} size={size} />
              {unreadCount > 0 && (
                <Badge 
                  style={{ 
                    position: 'absolute', 
                    top: -5, 
                    right: -10,
                    backgroundColor: '#f44336',
                  }}
                >
                  {unreadCount}
                </Badge>
              )}
            </View>
          ),
          headerShown: false,
        }}
      />
      
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Обзор',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="compass" color={color} size={size} />
          ),
          headerShown: false,
        }}
      />
      
      {(user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER) && (
        <Tabs.Screen
          name="employees"
          options={{
            title: 'Сотрудники',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account-group" color={color} size={size} />
            ),
          }}
        />
      )}
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
