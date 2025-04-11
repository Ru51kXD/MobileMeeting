import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { user } = useAuth();
  
  // Проверяем, что пользователь вошел в систему
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }
  
  // Перенаправляем на главную страницу
  return <Redirect href="/(tabs)" />;
} 