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
import { ThemeProvider } from '../context/ThemeContext';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Компонент, который используется внутри ThemeProvider для доступа к теме
function AppContent() {
  const { isDark } = useTheme();
  
  // Создаем тему для react-native-paper на основе нашей темы
  const paperTheme = isDark ? {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      primary: '#4F46E5'
    }
  } : {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: '#4F46E5'
    }
  };

  return (
    <PaperProvider theme={paperTheme}>
      <AuthProvider>
        <ChatProvider>
          <MeetingProvider>
            <TaskProvider>
              <StatusBar style={isDark ? "light" : "dark"} />
              <Stack 
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)/forgot-password" options={{ headerShown: false }} />
                <Stack.Screen name="account/edit" options={{ headerShown: false }} />
                <Stack.Screen name="security/index" options={{ headerShown: false }} />
                <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
              </Stack>
            </TaskProvider>
          </MeetingProvider>
        </ChatProvider>
      </AuthProvider>
    </PaperProvider>
  );
}

export default function AppLayout() {
  // Загружаем шрифты
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
      <AppContent />
    </ThemeProvider>
  );
}
