import React from 'react';
import { View, ViewStyle, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { createStyles } from '../../constants/Styles';
import { Colors } from '../../constants/Colors';

export type CardVariant = 'plain' | 'elevated' | 'prominent' | 'grouped' | 'insetGrouped';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  onPress?: () => void;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
}

/**
 * Компонент карточки в стиле iOS
 */
export const Card: React.FC<CardProps> = ({
  children,
  variant = 'plain',
  style,
  onPress,
  title,
  subtitle,
  footer,
}) => {
  const { isDark } = useTheme();
  const styles = createStyles(isDark);
  const cardStyles = styles.cards;
  
  const variantStyle = cardStyles[variant] || cardStyles.plain;
  
  const CardContainer = onPress ? TouchableOpacity : View;
  
  return (
    <CardContainer
      style={[variantStyle, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {(title || subtitle) && (
        <View style={localStyles.header}>
          {title && (
            <Text style={[styles.text.headline, localStyles.title]}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={[styles.text.secondary, localStyles.subtitle]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      
      <View style={localStyles.content}>
        {children}
      </View>
      
      {footer && (
        <View style={localStyles.footer}>
          {footer}
        </View>
      )}
    </CardContainer>
  );
};

const localStyles = StyleSheet.create({
  header: {
    marginBottom: 12,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    
  },
  content: {
    
  },
  footer: {
    marginTop: 12,
    borderTopWidth: 1,
    paddingTop: 12,
  },
});

/**
 * Группа карточек в стиле iOS
 */
export const CardGroup: React.FC<{
  children: React.ReactNode;
  title?: string;
  variant?: 'plain' | 'inset';
  style?: ViewStyle;
}> = ({ 
  children, 
  title, 
  variant = 'plain',
  style 
}) => {
  const { isDark } = useTheme();
  const styles = createStyles(isDark);
  
  return (
    <View style={[cardGroupStyles.container, style]}>
      {title && (
        <Text style={[
          styles.text.secondary,
          cardGroupStyles.title,
          { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }
        ]}>
          {title.toUpperCase()}
        </Text>
      )}
      <View style={[
        cardGroupStyles.group,
        variant === 'inset' && cardGroupStyles.insetGroup,
        { 
          backgroundColor: isDark ? Colors.dark.card : Colors.light.card,
          borderRadius: variant === 'inset' ? 12 : 0,
        }
      ]}>
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return child;
          
          const isLast = index === React.Children.count(children) - 1;
          
          return (
            <View key={index}>
              {child}
              {!isLast && (
                <View style={[cardGroupStyles.separator, { 
                  backgroundColor: isDark ? Colors.dark.separator : Colors.light.separator,
                  marginLeft: 16
                }]} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const cardGroupStyles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    marginLeft: 16,
    marginBottom: 8,
  },
  group: {
    overflow: 'hidden',
  },
  insetGroup: {
    marginHorizontal: 16,
  },
  separator: {
    height: 1,
  },
}); 