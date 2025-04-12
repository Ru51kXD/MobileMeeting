import React from 'react';
import { 
  View, 
  ViewStyle, 
  StyleSheet, 
  StatusBar, 
  SafeAreaView, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ViewProps
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { createStyles } from '../../constants/Styles';
import { Colors } from '../../constants/Colors';
import { BlurView } from 'expo-blur';

interface ScreenProps extends ViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  safeBottom?: boolean;
  safeTop?: boolean;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  keyboardAvoiding?: boolean;
  blurHeader?: boolean;
  statusBarColor?: 'light' | 'dark' | 'auto';
  statusBarTranslucent?: boolean;
  renderHeader?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
  fullWidth?: boolean;
  centerContent?: boolean;
}

/**
 * Компонент контейнера экрана в стиле iOS
 */
export const Screen: React.FC<ScreenProps> = ({
  children,
  style,
  safeBottom = true,
  safeTop = true,
  scroll = false,
  refreshing = false,
  onRefresh,
  keyboardAvoiding = true,
  blurHeader = false,
  statusBarColor = 'auto',
  statusBarTranslucent = false,
  renderHeader,
  renderFooter,
  fullWidth = false,
  centerContent = false,
  ...props
}) => {
  const { isDark } = useTheme();
  const styles = createStyles(isDark);
  
  const containerStyles = [
    localStyles.container,
    styles.screen,
    style,
  ];
  
  // Определяем цвет статус-бара
  const statusBarStyle = statusBarColor === 'auto' 
    ? (isDark ? 'light-content' : 'dark-content')
    : (statusBarColor === 'light' ? 'light-content' : 'dark-content');
  
  // Основной контент экрана
  const renderContent = () => {
    const contentElement = (
      <View 
        style={[
          fullWidth ? null : styles.container, 
          centerContent && localStyles.centerContent
        ]}
        {...props}
      >
        {children}
      </View>
    );
    
    if (!scroll) return contentElement;
    
    return (
      <ScrollView
        style={localStyles.scrollView}
        contentContainerStyle={[
          localStyles.scrollContent,
          centerContent && localStyles.centerContent
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? Colors.dark.tint : Colors.primary}
              colors={[Colors.primary, Colors.secondary]}
            />
          ) : undefined
        }
      >
        {contentElement}
      </ScrollView>
    );
  };
  
  // Оборачиваем контент в зависимости от опций
  const renderWrappedContent = () => {
    let content = renderContent();
    
    // Добавляем KeyboardAvoidingView, если нужно
    if (keyboardAvoiding) {
      content = (
        <KeyboardAvoidingView
          style={localStyles.keyboardAvoiding}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          {content}
        </KeyboardAvoidingView>
      );
    }
    
    return content;
  };
  
  return (
    <View style={containerStyles}>
      <StatusBar
        barStyle={statusBarStyle}
        translucent={statusBarTranslucent}
        backgroundColor="transparent"
      />
      
      {/* Верхняя безопасная зона */}
      {safeTop && <SafeAreaView style={[localStyles.safeTop, { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }]} />}
      
      {/* Хедер с фоном-блюром при необходимости */}
      {renderHeader && (
        <View style={localStyles.headerContainer}>
          {blurHeader && (
            <BlurView 
              intensity={70} 
              tint={isDark ? 'dark' : 'light'} 
              style={localStyles.headerBlur}
            />
          )}
          {renderHeader()}
        </View>
      )}
      
      {/* Основной контент */}
      {renderWrappedContent()}
      
      {/* Футер */}
      {renderFooter && (
        <View style={localStyles.footerContainer}>
          {renderFooter()}
        </View>
      )}
      
      {/* Нижняя безопасная зона */}
      {safeBottom && <SafeAreaView style={[localStyles.safeBottom, { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }]} />}
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoiding: {
    flex: 1,
  },
  safeTop: {
    flex: 0,
  },
  safeBottom: {
    flex: 0,
  },
  headerContainer: {
    position: 'relative',
    zIndex: 10,
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  footerContainer: {
    position: 'relative',
    zIndex: 10,
  },
}); 