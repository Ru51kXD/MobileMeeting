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
  
  // Создаем обычные статические темы (без анимации в самих объектах)
  const navigationTheme = isDark ? DarkTheme : DefaultTheme;
  const paperTheme = isDark ? MD3DarkTheme : MD3LightTheme;

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
                    backgroundColor: isDark ? '#121212' : '#ffffff'
                  } 
                }} />
              </ChatProvider>
            </MeetingProvider>
          </TaskProvider>
        </AuthProvider>
      </PaperProvider>
    </NavigationThemeProvider>
  );
}
