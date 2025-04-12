import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, View, Text, Platform } from 'react-native';
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

  try {
    // Количество непрочитанных сообщений
    const unreadCount = getUnreadCount ? getUnreadCount() : 0;

    // Создаем обработчики стилей, чтобы избежать ошибок с анимированными значениями
    const getTabBarStyle = () => {
      try {
        return { 
          paddingBottom: Platform.OS === 'android' ? 5 : 0, 
          height: Platform.OS === 'android' ? 60 : 50, 
          backgroundColor: isDark 
            ? (Colors?.dark?.background || '#121212') 
            : (Colors?.light?.background || '#ffffff'),
          borderTopColor: isDark 
            ? (Colors?.dark?.foreground || '#333') 
            : (Colors?.lightGray || '#e0e0e0'),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 3,
          elevation: 5,
        };
      } catch (e) {
        console.log('Error in getTabBarStyle:', e);
        return {
          paddingBottom: 5,
          height: 60,
          backgroundColor: isDark ? '#121212' : '#ffffff',
          borderTopColor: isDark ? '#333' : '#e0e0e0',
        };
      }
    };

    const getTabBarBackgroundStyle = () => {
      try {
        return { 
          flex: 1, 
          backgroundColor: isDark 
            ? (Colors?.dark?.background || '#121212') 
            : (Colors?.light?.background || '#ffffff')
        };
      } catch (e) {
        console.log('Error in getTabBarBackgroundStyle:', e);
        return {
          flex: 1,
          backgroundColor: isDark ? '#121212' : '#ffffff',
        };
      }
    };

    const getHeaderStyle = () => {
      try {
        return { 
          backgroundColor: isDark 
            ? (Colors?.dark?.background || '#121212') 
            : (Colors?.light?.background || '#ffffff'),
          borderBottomColor: isDark 
            ? (Colors?.dark?.foreground || '#333') 
            : (Colors?.lightGray || '#e0e0e0'),
          shadowOpacity: 0,
          elevation: 0,
          borderBottomWidth: 0.5
        };
      } catch (e) {
        console.log('Error in getHeaderStyle:', e);
        return {
          backgroundColor: isDark ? '#121212' : '#ffffff',
          borderBottomColor: isDark ? '#333' : '#e0e0e0',
          borderBottomWidth: 1
        };
      }
    };

    // Безопасное получение цветов
    const getColor = (colorPath, fallback) => {
      try {
        if (colorPath === 'tabIconDefault') {
          return isDark 
            ? (Colors?.dark?.tabIconDefault || '#999') 
            : (Colors?.light?.tabIconDefault || '#666');
        }
        if (colorPath === 'tint') {
          return isDark 
            ? (Colors?.dark?.tint || '#2196F3') 
            : (Colors?.tint || Colors?.primary || '#2196F3');
        }
        if (colorPath === 'error') {
          return Colors?.error || '#f44336';
        }
        return fallback;
      } catch (e) {
        console.log('Error getting color:', e);
        return fallback;
      }
    };

    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: getColor('tint', '#2196F3'),
          tabBarInactiveTintColor: getColor('tabIconDefault', isDark ? '#999' : '#666'),
          tabBarLabelStyle: { 
            fontSize: 11, 
            fontWeight: '500',
            marginBottom: Platform.OS === 'ios' ? 0 : -2
          },
          tabBarStyle: getTabBarStyle(),
          tabBarBackground: () => (
            <View style={getTabBarBackgroundStyle()} />
          ),
          headerStyle: getHeaderStyle(),
          headerTintColor: isDark ? '#ffffff' : '#333333',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 17,
          }
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
                      backgroundColor: getColor('error', '#f44336'),
                      minWidth: 16,
                      height: 16,
                      fontSize: 10,
                      borderRadius: 8
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
  } catch (error) {
    console.log('Critical error in TabLayout:', error);
    // Fallback безопасное представление в случае критической ошибки
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#2196F3',
          tabBarInactiveTintColor: isDark ? '#999' : '#666',
          tabBarStyle: {
            paddingBottom: 5,
            height: 60,
            backgroundColor: isDark ? '#121212' : '#ffffff',
            borderTopColor: isDark ? '#333' : '#e0e0e0',
          },
          headerStyle: {
            backgroundColor: isDark ? '#121212' : '#ffffff',
            borderBottomColor: isDark ? '#333' : '#e0e0e0',
            borderBottomWidth: 1,
          },
          headerTintColor: isDark ? '#ffffff' : '#333333',
        }}
      >
        {/* Минимальный набор вкладок для аварийного режима */}
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
}
