import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';

interface ThemedContainerProps extends ViewProps {
  children: React.ReactNode;
}

export function ThemedContainer({ children, style, ...props }: ThemedContainerProps) {
  const { isDark } = useTheme();

  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor: isDark ? Colors.dark.background : Colors.light.background },
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 