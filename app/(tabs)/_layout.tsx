import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, View, Text } from 'react-native';
import { UserRole } from '../../types';
import { Badge } from 'react-native-paper';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const { getUnreadCount } = useChat();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      // Если пользователь не авторизован, перенаправляем на страницу входа
      router.replace('/(auth)/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  // Количество непрочитанных сообщений
  const unreadCount = getUnreadCount();

  // Проверим наличие UserRole и создадим константы для ролей
  const ADMIN_ROLE = 'ADMIN';
  const MANAGER_ROLE = 'MANAGER';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: { paddingBottom: 5, height: 60 },
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
      
      {(user?.role === ADMIN_ROLE || user?.role === MANAGER_ROLE) && (
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
