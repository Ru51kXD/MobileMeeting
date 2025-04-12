import { StyleSheet, Platform, Dimensions, PlatformIOSStatic } from "react-native";
import { Colors } from "./Colors";

// Получаем ширину экрана
const { width, height } = Dimensions.get("window");

// Проверяем, является ли устройство iPhone с челкой (notch)
const hasNotch = Platform.OS === 'ios' && 
  ((Platform as unknown as PlatformIOSStatic).isPad === false && 
  (height === 812 || height === 896 || height >= 844));

// Константы для отступов и размеров
const BASE_SPACING = 8;
const LAYOUT = {
  xs: BASE_SPACING / 2,        // 4
  s: BASE_SPACING,             // 8
  m: BASE_SPACING * 2,         // 16
  l: BASE_SPACING * 3,         // 24
  xl: BASE_SPACING * 4,        // 32
  xxl: BASE_SPACING * 6,       // 48
  xxxl: BASE_SPACING * 8,      // 64
  screenPadding: BASE_SPACING * 2, // 16
  bottomTabHeight: hasNotch ? 84 : 64,
  statusBarHeight: hasNotch ? 44 : 20,
};

// Типографика
const TYPOGRAPHY = {
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: 0.37,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600',
    letterSpacing: 0.38,
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.41,
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.41,
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: -0.32,
  },
  subhead: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: -0.08,
  },
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '500',
    letterSpacing: 0.07,
  },
};

// Тени для карточек и элементов
const createElevation = (isDark: boolean) => {
  const elevationBase = {
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowOpacity: isDark ? 0.5 : 0.1,
    elevation: 2,
  };
  
  return {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowRadius: 0,
      shadowOpacity: 0,
      elevation: 0,
    },
    xs: {
      ...elevationBase,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      shadowOpacity: isDark ? 0.3 : 0.05,
      elevation: 1,
    },
    s: {
      ...elevationBase,
      shadowRadius: 4,
      shadowOpacity: isDark ? 0.4 : 0.08,
    },
    m: elevationBase,
    l: {
      ...elevationBase,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      shadowOpacity: isDark ? 0.6 : 0.12,
      elevation: 4,
    },
    xl: {
      ...elevationBase,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
      shadowOpacity: isDark ? 0.8 : 0.2,
      elevation: 16,
    },
  };
};

// Скругления углов
const BORDER_RADIUS = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  xxl: 24,
  round: 9999,
};

// Анимации
const ANIMATIONS = {
  default: {
    duration: 300,
    easing: 'ease-in-out',
  },
  fast: {
    duration: 150,
    easing: 'ease-out',
  },
  slow: {
    duration: 500,
    easing: 'ease-in-out',
  },
};

// Создаем стили для карточек
const createCardStyles = (isDark: boolean) => {
  const elevation = createElevation(isDark);
  
  return StyleSheet.create({
    container: {
      backgroundColor: isDark ? Colors.dark.card : Colors.light.card,
      borderRadius: BORDER_RADIUS.m,
      padding: LAYOUT.m,
      ...elevation.s,
      shadowColor: '#000',
    },
    plain: {
      backgroundColor: isDark ? Colors.dark.card : Colors.light.card,
      borderRadius: BORDER_RADIUS.m,
    },
    elevated: {
      backgroundColor: isDark ? Colors.dark.card : Colors.light.card,
      borderRadius: BORDER_RADIUS.m,
      padding: LAYOUT.m,
      ...elevation.m,
      shadowColor: '#000',
    },
    prominent: {
      backgroundColor: isDark ? Colors.dark.card : Colors.light.card,
      borderRadius: BORDER_RADIUS.l,
      padding: LAYOUT.l,
      ...elevation.xl,
      shadowColor: '#000',
    },
    grouped: {
      backgroundColor: isDark ? Colors.dark.card : Colors.light.card,
      padding: LAYOUT.m,
      borderRadius: BORDER_RADIUS.m,
      marginVertical: LAYOUT.xs,
    },
    sheet: {
      backgroundColor: isDark ? Colors.dark.card : Colors.light.card,
      borderTopLeftRadius: BORDER_RADIUS.xl,
      borderTopRightRadius: BORDER_RADIUS.xl,
      padding: LAYOUT.l,
      ...elevation.xl,
      shadowColor: '#000',
    },
    insetGrouped: {
      marginHorizontal: LAYOUT.m,
      marginVertical: LAYOUT.m,
      borderRadius: BORDER_RADIUS.l,
      backgroundColor: isDark ? Colors.dark.card : Colors.light.card,
      overflow: 'hidden',
    },
  });
};

// Стили для кнопок
const createButtonStyles = (isDark: boolean) => {
  return StyleSheet.create({
    primary: {
      backgroundColor: isDark ? Colors.dark.tint : Colors.primary,
      borderRadius: BORDER_RADIUS.m,
      paddingVertical: LAYOUT.s,
      paddingHorizontal: LAYOUT.m,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    secondary: {
      backgroundColor: isDark ? Colors.dark.foreground : Colors.light.background,
      borderRadius: BORDER_RADIUS.m,
      paddingVertical: LAYOUT.s,
      paddingHorizontal: LAYOUT.m,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: isDark ? Colors.dark.separator : Colors.light.separator,
    },
    secondaryText: {
      color: isDark ? Colors.dark.tint : Colors.primary,
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    text: {
      backgroundColor: 'transparent',
      paddingVertical: LAYOUT.s,
      paddingHorizontal: LAYOUT.m,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    textButtonText: {
      color: isDark ? Colors.dark.tint : Colors.primary,
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
};

// Стили для полей ввода
const createInputStyles = (isDark: boolean) => {
  return StyleSheet.create({
    container: {
      marginBottom: LAYOUT.m,
    },
    label: {
      fontSize: TYPOGRAPHY.footnote.fontSize,
      lineHeight: TYPOGRAPHY.footnote.lineHeight,
      fontWeight: '500',
      color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary,
      marginBottom: LAYOUT.xs,
    },
    input: {
      backgroundColor: isDark ? Colors.dark.foreground : Colors.light.foreground,
      borderRadius: BORDER_RADIUS.m,
      borderWidth: 1,
      borderColor: isDark ? Colors.dark.separator : Colors.light.separator,
      paddingHorizontal: LAYOUT.m,
      paddingVertical: LAYOUT.s,
      fontSize: TYPOGRAPHY.body.fontSize,
      lineHeight: TYPOGRAPHY.body.lineHeight,
      color: isDark ? Colors.dark.text : Colors.light.text,
    },
    inputFocused: {
      borderColor: isDark ? Colors.dark.tint : Colors.primary,
      shadowColor: isDark ? Colors.dark.tint : Colors.primary,
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 0 },
      shadowRadius: 4,
    },
    error: {
      color: Colors.error,
      fontSize: TYPOGRAPHY.caption1.fontSize,
      marginTop: LAYOUT.xs,
    },
  });
};

// Создаем базовый набор стилей для общих компонентов
export const createStyles = (isDark: boolean) => {
  return {
    layout: LAYOUT,
    typography: TYPOGRAPHY,
    borderRadius: BORDER_RADIUS,
    animations: ANIMATIONS,
    elevation: createElevation(isDark),
    cards: createCardStyles(isDark),
    buttons: createButtonStyles(isDark),
    inputs: createInputStyles(isDark),
    screen: {
      flex: 1,
      backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
    },
    container: {
      paddingHorizontal: LAYOUT.screenPadding,
    },
    section: {
      marginBottom: LAYOUT.xl,
    },
    separator: {
      height: 1,
      backgroundColor: isDark ? Colors.dark.separator : Colors.light.separator,
      marginVertical: LAYOUT.m,
    },
    text: {
      headline: {
        ...TYPOGRAPHY.headline,
        color: isDark ? Colors.dark.text : Colors.light.text,
      },
      body: {
        ...TYPOGRAPHY.body,
        color: isDark ? Colors.dark.text : Colors.light.text,
      },
      secondary: {
        ...TYPOGRAPHY.subhead,
        color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary,
      },
      tertiary: {
        ...TYPOGRAPHY.footnote,
        color: isDark ? Colors.dark.textTertiary : Colors.light.textTertiary,
      },
    },
  };
};

export const Styles = {
  LAYOUT,
  TYPOGRAPHY,
  BORDER_RADIUS,
  ANIMATIONS,
  createStyles,
}; 