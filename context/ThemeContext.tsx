import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useDeviceColorScheme, Animated } from 'react-native';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
  isDark: boolean;
  themeAnimation: Animated.Value;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const deviceTheme = useDeviceColorScheme() as ThemeType;
  const [theme, setThemeState] = useState<ThemeType>('light');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Создаем анимированное значение
  const themeAnimation = useRef(new Animated.Value(theme === 'dark' ? 1 : 0)).current;

  // Загружаем сохраненную тему при первом запуске
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@theme');
        if (savedTheme) {
          setThemeState(savedTheme as ThemeType);
          // Устанавливаем начальное значение анимации
          themeAnimation.setValue(savedTheme === 'dark' ? 1 : 0);
        } else {
          // Если тема не была сохранена, используем системную тему устройства
          setThemeState(deviceTheme || 'light');
          // Устанавливаем начальное значение анимации
          themeAnimation.setValue((deviceTheme || 'light') === 'dark' ? 1 : 0);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Ошибка загрузки темы:', error);
        setThemeState('light');
        // Устанавливаем начальное значение анимации
        themeAnimation.setValue(0);
        setIsInitialized(true);
      }
    };
    
    loadTheme();
  }, [deviceTheme]);

  // Анимация при смене темы
  useEffect(() => {
    if (isInitialized) {
      Animated.timing(themeAnimation, {
        toValue: theme === 'dark' ? 1 : 0,
        duration: 300, // Длительность анимации в миллисекундах
        useNativeDriver: false,
      }).start();
    }
  }, [theme, isInitialized]);

  const setTheme = async (newTheme: ThemeType) => {
    try {
      await AsyncStorage.setItem('@theme', newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Ошибка сохранения темы:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const isDark = theme === 'dark';

  const contextValue = {
    theme,
    setTheme,
    toggleTheme,
    isDark,
    themeAnimation
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {isInitialized ? children : null}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 