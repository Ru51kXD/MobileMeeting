import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Создаем красивую иконку для главной страницы
const HomeTabIcon = ({ color, focused }) => {
  const { isDark } = useTheme() || { isDark: false };
  const activeColor = '#5E60CE';
  
  return (
    <View style={styles.iconContainer}>
      {focused && (
        <LinearGradient
          colors={['#7F5BFF', '#5E60CE']}
          style={styles.activeIconBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      <Ionicons 
        name="home" 
        size={24} 
        color={focused ? '#FFFFFF' : color} 
        style={focused ? styles.activeIcon : null}
      />
    </View>
  );
};

// Создаем красивую иконку для встреч
const MeetingsTabIcon = ({ color, focused }) => {
  return (
    <View style={styles.iconContainer}>
      {focused && (
        <LinearGradient
          colors={['#FF375F', '#CC2E4C']}
          style={styles.activeIconBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      <MaterialCommunityIcons 
        name="video-outline" 
        size={26} 
        color={focused ? '#FFFFFF' : color} 
        style={focused ? styles.activeIcon : null}
      />
    </View>
  );
};

export default function TabLayout() {
  const { isDark } = useTheme() || { isDark: false };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? '#7F5BFF' : '#5E60CE',
        tabBarInactiveTintColor: isDark ? '#888888' : '#999999',
        tabBarStyle: {
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderTopColor: isDark ? '#333333' : '#E0E0E0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarShowLabel: true,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: (props) => <HomeTabIcon {...props} />,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          }
        }}
      />
      <Tabs.Screen
        name="employees"
        options={{
          title: 'Сотрудники',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="users" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Чаты',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses" size={size} color={color} />
          ),
          tabBarShowLabel: true,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Задачи',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="tasks" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="video-meetings"
        options={{
          title: 'Встречи',
          tabBarIcon: (props) => <MeetingsTabIcon {...props} />,
          tabBarActiveTintColor: '#FF375F',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeIconBackground: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    zIndex: 1,
  },
  activeIcon: {
    zIndex: 2,
  }
});
