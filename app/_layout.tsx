import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AuthProvider } from '../context/AuthContext';
import { TaskProvider } from '../context/TaskContext';
import { MeetingProvider } from '../context/MeetingContext';
import { ChatProvider } from '../context/ChatContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { Colors } from '@/constants/Colors';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}

function RootLayoutContent() {
  const { isDark } = useTheme();
  
  try {
    // Безопасное получение цветов для навигации
    const getColor = (path, defaultColor) => {
      try {
        if (!Colors) return defaultColor;
        
        if (path === 'primary') 
          return isDark ? (Colors.dark?.tint || '#0A84FF') : (Colors.primary || '#007AFF');
        
        if (path === 'background') 
          return isDark ? (Colors.dark?.background || '#1C1C1E') : (Colors.light?.background || '#F2F2F7');
        
        if (path === 'card') 
          return isDark ? (Colors.dark?.foreground || '#2C2C2E') : (Colors.light?.foreground || '#FFFFFF');
        
        if (path === 'text') 
          return isDark ? (Colors.dark?.text || '#FFFFFF') : (Colors.light?.text || '#000000');
        
        if (path === 'border') 
          return isDark ? '#2C2C2E' : (Colors.lightGray || '#E5E5EA');
        
        if (path === 'notification') 
          return Colors.error || '#FF3B30';
        
        return defaultColor;
      } catch (e) {
        console.log(`Error getting color for ${path}:`, e);
        return defaultColor;
      }
    };
    
    // Настройка для iOS-подобного дизайна
    const navigationTheme = {
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        primary: getColor('primary', isDark ? '#0A84FF' : '#007AFF'),
        background: getColor('background', isDark ? '#1C1C1E' : '#F2F2F7'),
        card: getColor('card', isDark ? '#2C2C2E' : '#FFFFFF'),
        text: getColor('text', isDark ? '#FFFFFF' : '#000000'),
        border: getColor('border', isDark ? '#2C2C2E' : '#E5E5EA'),
        notification: getColor('notification', '#FF3B30'),
      },
    };
    
    const paperTheme = {
      ...(isDark ? MD3DarkTheme : MD3LightTheme),
      colors: {
        ...(isDark ? MD3DarkTheme.colors : MD3LightTheme.colors),
        primary: getColor('primary', isDark ? '#0A84FF' : '#007AFF'),
        accent: getColor('primary', isDark ? '#0A84FF' : '#007AFF'),
        background: getColor('background', isDark ? '#1C1C1E' : '#F2F2F7'),
        surface: getColor('card', isDark ? '#2C2C2E' : '#FFFFFF'),
        text: getColor('text', isDark ? '#FFFFFF' : '#000000'),
        error: getColor('notification', '#FF3B30'),
      },
    };

    return (
      <NavigationThemeProvider value={navigationTheme}>
        <PaperProvider theme={paperTheme}>
          <AuthProvider>
            <TaskProvider>
              <MeetingProvider>
                <ChatProvider>
                  <StatusBar style={isDark ? 'light' : 'dark'} />
                  <Stack screenOptions={{ 
                    headerShown: false,
                    contentStyle: { 
                      backgroundColor: getColor('background', isDark ? '#1C1C1E' : '#F2F2F7')
                    },
                    animation: 'fade',
                    headerTitleStyle: {
                      fontWeight: '600',
                      fontSize: 17,
                    },
                    headerShadowVisible: false,
                  }} />
                </ChatProvider>
              </MeetingProvider>
            </TaskProvider>
          </AuthProvider>
        </PaperProvider>
      </NavigationThemeProvider>
    );
  } catch (error) {
    console.log('Critical error in RootLayoutContent:', error);
    
    // Fallback-тема в случае ошибки
    const fallbackNavTheme = isDark ? DarkTheme : DefaultTheme;
    const fallbackPaperTheme = isDark ? MD3DarkTheme : MD3LightTheme;
    
    return (
      <NavigationThemeProvider value={fallbackNavTheme}>
        <PaperProvider theme={fallbackPaperTheme}>
          <AuthProvider>
            <TaskProvider>
              <MeetingProvider>
                <ChatProvider>
                  <StatusBar style={isDark ? 'light' : 'dark'} />
                  <Stack screenOptions={{ 
                    headerShown: false,
                    contentStyle: { 
                      backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7'
                    },
                    animation: 'default'
                  }} />
                </ChatProvider>
              </MeetingProvider>
            </TaskProvider>
          </AuthProvider>
        </PaperProvider>
      </NavigationThemeProvider>
    );
  }
}
