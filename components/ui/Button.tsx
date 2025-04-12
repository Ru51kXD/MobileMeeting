import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';

export type ButtonVariant = 'filled' | 'outlined' | 'text';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  title: string;
  leftIcon?: string;
  rightIcon?: string;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
  iconSize?: number;
  color?: string;
}

/**
 * Кнопка в стиле iOS с различными вариантами отображения
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'filled',
  size = 'medium',
  title,
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  containerStyle,
  textStyle,
  iconSize,
  color = Colors.primary,
  ...restProps
}) => {
  const { isDark } = useTheme();
  
  // Определяем цвета на основе темы и состояния кнопки
  const getColors = () => {
    // Для disabled состояния используем приглушенные цвета
    if (disabled) {
      return {
        background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        text: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
        border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
      };
    }
    
    // Для активной кнопки используем разные стили в зависимости от variant
    switch (variant) {
      case 'filled':
        return {
          background: color,
          text: '#FFFFFF',
          border: color
        };
      case 'outlined':
        return {
          background: 'transparent',
          text: color,
          border: color
        };
      case 'text':
        return {
          background: 'transparent',
          text: color,
          border: 'transparent'
        };
      default:
        return {
          background: color,
          text: '#FFFFFF',
          border: color
        };
    }
  };
  
  // Определяем размеры кнопки
  const getSizeStyles = (): { container: ViewStyle, text: TextStyle, icon: number } => {
    switch (size) {
      case 'small':
        return {
          container: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
          text: { fontSize: 14 },
          icon: iconSize || 16
        };
      case 'medium':
        return {
          container: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
          text: { fontSize: 16 },
          icon: iconSize || 18
        };
      case 'large':
        return {
          container: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10 },
          text: { fontSize: 18 },
          icon: iconSize || 20
        };
      default:
        return {
          container: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
          text: { fontSize: 16 },
          icon: iconSize || 18
        };
    }
  };
  
  const colors = getColors();
  const sizeStyles = getSizeStyles();
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          borderWidth: variant === 'outlined' ? 1 : 0,
          opacity: loading ? 0.8 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        sizeStyles.container,
        containerStyle,
      ]}
      disabled={disabled || loading}
      activeOpacity={disabled ? 1 : 0.7}
      {...restProps}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'filled' ? '#FFFFFF' : color}
          size={sizeStyles.icon}
        />
      ) : (
        <View style={styles.contentContainer}>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={sizeStyles.icon}
              color={colors.text}
              style={styles.leftIcon}
            />
          )}
          
          <Text
            style={[
              styles.text,
              { color: colors.text },
              sizeStyles.text,
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          
          {rightIcon && (
            <Ionicons
              name={rightIcon}
              size={sizeStyles.icon}
              color={colors.text}
              style={styles.rightIcon}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

// Компонент группы кнопок (горизонтальный)
export interface ButtonGroupProps {
  children: React.ReactNode;
  style?: ViewStyle;
  spaceEvenly?: boolean;
  spaceBetween?: boolean;
}

export const ButtonGroup: React.FC<{
  children: React.ReactNode;
  containerStyle?: ViewStyle;
  fullWidth?: boolean;
  gap?: number;
}> = ({ children, containerStyle, fullWidth = false, gap = 8 }) => {
  return (
    <View
      style={[
        styles.buttonGroup,
        {
          width: fullWidth ? '100%' : undefined,
          gap: gap
        },
        containerStyle
      ]}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        
        return React.cloneElement(child, {
          ...child.props,
          containerStyle: [
            child.props.containerStyle,
            { flex: fullWidth ? 1 : undefined }
          ]
        });
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
}); 