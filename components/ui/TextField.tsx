import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  ViewStyle,
  TextStyle,
  Platform,
  Animated,
  Pressable,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { createStyles } from '../../constants/Styles';
import { Ionicons } from '@expo/vector-icons';

export type TextFieldVariant = 'outlined' | 'filled' | 'underlined' | 'plain';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  onLeftIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  variant?: TextFieldVariant;
  secure?: boolean;
  required?: boolean;
  clearable?: boolean;
  maxLength?: number;
  showCharacterCount?: boolean;
  multiline?: boolean;
}

export interface TextFieldRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
}

/**
 * Компонент текстового поля в стиле iOS
 */
export const TextField = forwardRef<TextFieldRef, TextFieldProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      onRightIconPress,
      onLeftIconPress,
      containerStyle,
      inputStyle,
      labelStyle,
      variant = 'outlined',
      secure = false,
      required = false,
      clearable = false,
      placeholder,
      value,
      onFocus,
      onBlur,
      maxLength,
      showCharacterCount,
      multiline = false,
      ...restProps
    },
    ref
  ) => {
    const { isDark } = useTheme();
    const styles = createStyles(isDark);
    const inputRef = useRef<TextInput>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(!secure);
    const [inputValue, setInputValue] = useState(value || '');
    
    // Значение для анимации плавающего лейбла
    const floatingLabelAnim = useRef(new Animated.Value(
      value && value.length > 0 ? 1 : 0
    )).current;

    // Экспозиция методов референса
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => {
        inputRef.current?.clear();
        setInputValue('');
      },
    }));

    // Обработчик фокуса
    const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
      
      // Анимация лейбла вверх
      Animated.timing(floatingLabelAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }).start();
    };

    // Обработчик потери фокуса
    const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
      
      // Если поле пустое, анимация лейбла вниз
      if (!inputValue || inputValue.length === 0) {
        Animated.timing(floatingLabelAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }).start();
      }
    };
    
    // Обработчик изменения текста
    const handleChangeText = (text: string) => {
      setInputValue(text);
      if (restProps.onChangeText) {
        restProps.onChangeText(text);
      }
    };

    // Переключение видимости пароля
    const togglePasswordVisibility = () => {
      setIsPasswordVisible(!isPasswordVisible);
    };
    
    // Очистка поля ввода
    const handleClearInput = () => {
      setInputValue('');
      if (restProps.onChangeText) {
        restProps.onChangeText('');
      }
      inputRef.current?.clear();
    };

    // Получение цветов в зависимости от состояния
    const getColors = () => {
      if (error) return { border: Colors.error, text: Colors.error, icon: Colors.error };
      if (isFocused) return { 
        border: isDark ? Colors.primary : Colors.primary,
        text: isDark ? Colors.dark.text : Colors.light.text,
        icon: isDark ? Colors.primary : Colors.primary
      };
      return { 
        border: isDark ? Colors.dark.border : Colors.light.border,
        text: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary,
        icon: isDark ? Colors.dark.textTertiary : Colors.light.textTertiary 
      };
    };

    const colors = getColors();
    
    // Стили контейнера в зависимости от варианта
    const getContainerStyle = () => {
      switch (variant) {
        case 'filled':
          return [
            localStyles.container, 
            { 
              backgroundColor: isDark ? Colors.dark.cardSecondary : Colors.light.cardSecondary,
              borderColor: isFocused ? colors.border : 'transparent'
            }
          ];
        case 'underlined':
          return [
            localStyles.container,
            localStyles.underlined,
            { 
              borderBottomColor: colors.border,
              backgroundColor: 'transparent'
            }
          ];
        case 'plain':
          return [
            localStyles.container,
            { 
              borderColor: 'transparent',
              backgroundColor: 'transparent'
            }
          ];
        default: // outlined
          return [
            localStyles.container, 
            { 
              borderColor: colors.border,
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
            }
          ];
      }
    };
    
    // Анимированные стили для лейбла
    const labelPositionStyles = {
      top: floatingLabelAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [variant === 'plain' ? 10 : 14, -8],
      }),
      fontSize: floatingLabelAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [14, 12],
      }),
      color: floatingLabelAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [
          isDark ? Colors.dark.textSecondary : Colors.light.textSecondary,
          error 
            ? Colors.error 
            : (isFocused 
              ? Colors.primary 
              : (isDark ? Colors.dark.textTertiary : Colors.light.textTertiary))
        ],
      }),
    };

    const isSecureEntry = restProps.secureTextEntry && !isPasswordVisible;

    const effectiveRightIcon = restProps.secureTextEntry 
      ? isPasswordVisible ? 'eye-off' : 'eye'
      : rightIcon;

    const effectiveRightIconPress = restProps.secureTextEntry 
      ? togglePasswordVisibility
      : onRightIconPress;

    return (
      <View style={[localStyles.wrapper, containerStyle]}>
        {/* Контейнер для поля ввода */}
        <View style={getContainerStyle()}>
          {/* Левая иконка */}
          {leftIcon && (
            <TouchableOpacity 
              activeOpacity={onLeftIconPress ? 0.7 : 1}
              onPress={onLeftIconPress}
              style={localStyles.leftIcon}
            >
              <Ionicons 
                name={leftIcon as any}
                size={20} 
                color={colors.icon} 
              />
            </TouchableOpacity>
          )}
          
          {/* Контейнер для инпута и лейбла */}
          <View style={localStyles.inputContainer}>
            {/* Плавающий лейбл */}
            {label && (
              <Animated.Text 
                style={[
                  localStyles.label,
                  labelPositionStyles,
                  labelStyle
                ]}
              >
                {label}{required ? ' *' : ''}
              </Animated.Text>
            )}
            
            {/* Поле ввода */}
            <TextInput
              ref={inputRef}
              style={[
                localStyles.input,
                {
                  color: isDark ? Colors.dark.text : Colors.light.text,
                  paddingTop: label ? 16 : 0,
                  paddingBottom: label ? 8 : 0,
                },
                inputStyle,
              ]}
              placeholderTextColor={
                isDark ? Colors.dark.textTertiary : Colors.light.textTertiary
              }
              placeholder={floatingLabelAnim._value === 0 ? placeholder : ''}
              value={inputValue}
              onChangeText={handleChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              secureTextEntry={isSecureEntry}
              {...restProps}
            />
          </View>
          
          {/* Кнопка очистки текста */}
          {clearable && inputValue && inputValue.length > 0 && (
            <TouchableOpacity 
              style={localStyles.rightIcon} 
              onPress={handleClearInput}
            >
              <Ionicons 
                name="close-circle" 
                size={18} 
                color={colors.icon} 
              />
            </TouchableOpacity>
          )}
          
          {/* Кнопка переключения видимости пароля */}
          {secure && (
            <TouchableOpacity 
              style={localStyles.rightIcon} 
              onPress={togglePasswordVisibility}
            >
              <Ionicons 
                name={effectiveRightIcon} 
                size={20} 
                color={colors.icon} 
              />
            </TouchableOpacity>
          )}
          
          {/* Правая иконка */}
          {rightIcon && !secure && !(clearable && inputValue && inputValue.length > 0) && (
            <TouchableOpacity 
              activeOpacity={onRightIconPress ? 0.7 : 1}
              style={localStyles.rightIcon} 
              onPress={effectiveRightIconPress}
            >
              <Ionicons 
                name={effectiveRightIcon}
                size={20} 
                color={colors.icon} 
              />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Вспомогательный текст или текст ошибки */}
        {(helperText || error) && (
          <Text 
            style={[
              localStyles.helperText, 
              { color: error ? Colors.error : isDark ? Colors.dark.textTertiary : Colors.light.textTertiary }
            ]}
          >
            {error || helperText}
          </Text>
        )}
      </View>
    );
  }
);

const localStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 56,
    overflow: 'hidden',
  },
  underlined: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  input: {
    fontSize: 16,
    padding: 0,
    margin: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  label: {
    position: 'absolute',
    left: 0,
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
  },
  leftIcon: {
    paddingHorizontal: 12,
  },
  rightIcon: {
    paddingHorizontal: 12,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
}); 