import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Временный пользователь для демонстрационных целей
const DEMO_USERS = [
  {
    id: '1',
    email: 'admin@company.com',
    password: 'admin123',
    name: 'Админ Системы',
    role: UserRole.ADMIN,
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
  },
  {
    id: '2',
    email: 'manager@company.com',
    password: 'manager123',
    name: 'Менеджер Проектов',
    role: UserRole.MANAGER,
    department: 'Разработка',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
  },
  {
    id: '3',
    email: 'employee@company.com',
    password: 'employee123',
    name: 'Сотрудник Компании',
    role: UserRole.EMPLOYEE,
    department: 'Разработка',
    position: 'Разработчик',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Проверка наличия аутентифицированного пользователя при загрузке
    const loadUser = async () => {
      try {
        const userJson = await AsyncStorage.getItem('@auth_user');
        if (userJson) {
          setUser(JSON.parse(userJson));
        }
      } catch (error) {
        console.error('Ошибка при загрузке пользователя:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Имитация API запроса
      // В реальном приложении здесь будет запрос к серверу
      const foundUser = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (foundUser) {
        // Удаляем пароль перед сохранением в состоянии
        const { password: _, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword as User);
        await AsyncStorage.setItem('@auth_user', JSON.stringify(userWithoutPassword));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Ошибка при входе:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('@auth_user');
      setUser(null);
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Имитация регистрации пользователя
      // В реальном приложении здесь будет запрос к серверу
      const existingUser = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (existingUser) {
        // Пользователь уже существует
        return false;
      }

      // В реальном приложении здесь бы создавался пользователь на сервере
      // Сейчас просто возвращаем успех, но не сохраняем нового пользователя
      return true;
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      // Имитация сброса пароля
      // В реальном приложении здесь будет запрос к серверу
      const existingUser = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (!existingUser) {
        return false;
      }

      // В реальном приложении здесь бы отправлялось письмо для сброса пароля
      return true;
    } catch (error) {
      console.error('Ошибка при сбросе пароля:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        register,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 