/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

/**
 * Современная цветовая схема приложения с эффектными градиентами и неоновыми оттенками
 * Ультрасовременный стиль с глубокими контрастами и яркими акцентами
 */

// Определим типы для избежания ошибок
type ThemeColors = {
  text: string;
  textSecondary: string;
  textTertiary: string;
  background: string;
  backgroundSecondary: string;
  foreground: string;
  card: string;
  cardSecondary: string;
  tint: string;
  tintSecondary: string;
  tabIconDefault: string;
  tabIconSelected: string;
  separator: string;
  highlight: string;
  backdrop: string;
  elevation: {
    level1: string;
    level2: string;
    level3: string;
  }
};

type ColorScheme = {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryAlpha: {
    a10: string;
    a20: string;
    a30: string;
    a50: string;
    a70: string;
    a90: string;
  };
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  tertiary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  gray: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  lightGray: string;
  background: string;
  card: string;
  tint: string;
  blurs: {
    extraLight: string;
    light: string;
    dark: string;
    ultraDark: string;
  };
  dark: ThemeColors;
  light: ThemeColors;
  gradients: {
    primary: string[];
    secondary: string[];
    tertiary: string[];
    success: string[];
    warning: string[];
    error: string[];
    info: string[];
    purple: string[];
    blue: string[];
    cyan: string[];
    pink: string[];
    green: string[];
    dark: string[];
  };
  glass: {
    light: string;
    dark: string;
  };
};

export const Colors: ColorScheme = {
  // Основные яркие цвета в неоновом стиле
  primary: '#4F46E5', // Яркий индиго
  primaryDark: '#3730A3', 
  primaryLight: '#818CF8',
  primaryAlpha: {
    a10: 'rgba(79, 70, 229, 0.1)',
    a20: 'rgba(79, 70, 229, 0.2)',
    a30: 'rgba(79, 70, 229, 0.3)',
    a50: 'rgba(79, 70, 229, 0.5)',
    a70: 'rgba(79, 70, 229, 0.7)',
    a90: 'rgba(79, 70, 229, 0.9)',
  },
  // Элегантный фиолетовый
  secondary: '#E11D48', // Яркий малиновый
  secondaryDark: '#BE123C',
  secondaryLight: '#FB7185',
  // Яркий акцент
  tertiary: '#06B6D4', // Неоновый циан
  // Статусные цвета
  success: '#10B981', // Изумрудный
  warning: '#F59E0B', // Янтарный
  error: '#EF4444',   // Красный
  info: '#6366F1',    // Индиго
  gray: {
    50:  '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
  },
  lightGray: '#E4E4E7',
  background: '#FAFAFA',
  card: '#FFFFFF',
  tint: '#4F46E5',
  blurs: {
    extraLight: 'rgba(255,255,255,0.85)',
    light: 'rgba(255,255,255,0.7)',
    dark: 'rgba(0,0,0,0.5)',
    ultraDark: 'rgba(0,0,0,0.8)',
  },
  glass: {
    light: 'rgba(255, 255, 255, 0.25)',
    dark: 'rgba(17, 24, 39, 0.65)',
  },
  gradients: {
    primary: ['#4F46E5', '#6366F1', '#818CF8'], // Индиго градиент
    secondary: ['#E11D48', '#F43F5E', '#FB7185'], // Малиновый градиент
    tertiary: ['#06B6D4', '#0EA5E9', '#38BDF8'], // Циановый градиент
    success: ['#10B981', '#34D399', '#6EE7B7'], // Изумрудный градиент
    warning: ['#F59E0B', '#FBBF24', '#FCD34D'], // Янтарный градиент
    error: ['#EF4444', '#F87171', '#FCA5A5'], // Красный градиент
    info: ['#6366F1', '#A5B4FC', '#C7D2FE'], // Индиго градиент
    purple: ['#8B5CF6', '#A78BFA', '#C4B5FD'], // Фиолетовый градиент
    blue: ['#3B82F6', '#60A5FA', '#93C5FD'], // Синий градиент
    cyan: ['#06B6D4', '#22D3EE', '#67E8F9'], // Циановый градиент
    pink: ['#EC4899', '#F472B6', '#F9A8D4'], // Розовый градиент
    green: ['#10B981', '#34D399', '#6EE7B7'], // Зеленый градиент
    dark: ['#18181B', '#27272A', '#3F3F46'], // Темный градиент
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#E4E4E7',
    textTertiary: '#A1A1AA',
    background: '#18181B', // Очень темный серый 
    backgroundSecondary: '#27272A',
    foreground: '#27272A', 
    card: '#27272A',
    cardSecondary: '#3F3F46',
    tint: '#818CF8',  // Светлый индиго для темного режима
    tintSecondary: '#FB7185', // Светлый малиновый
    tabIconDefault: '#A1A1AA',
    tabIconSelected: '#818CF8',
    separator: '#3F3F46',
    highlight: 'rgba(255,255,255,0.1)',
    backdrop: 'rgba(0,0,0,0.5)',
    elevation: {
      level1: '#27272A',
      level2: '#3F3F46',
      level3: '#52525B',
    }
  },
  light: {
    text: '#18181B',
    textSecondary: '#3F3F46',
    textTertiary: '#71717A',
    background: '#FAFAFA',
    backgroundSecondary: '#F4F4F5',
    foreground: '#FFFFFF',
    card: '#FFFFFF',
    cardSecondary: '#F4F4F5',
    tint: '#4F46E5',  // Индиго
    tintSecondary: '#E11D48', // Малиновый
    tabIconDefault: '#A1A1AA',
    tabIconSelected: '#4F46E5',
    separator: '#E4E4E7',
    highlight: 'rgba(0,0,0,0.05)',
    backdrop: 'rgba(0,0,0,0.3)',
    elevation: {
      level1: 'rgba(255,255,255,1)',
      level2: 'rgba(250,250,252,1)',
      level3: 'rgba(244,244,245,1)',
    }
  },
};

// Добавляем экспорт по умолчанию для совместимости с обоими способами импорта
export default Colors;
