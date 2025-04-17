import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { Appbar, TextInput, Button, Switch, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemedContainer } from '@/components/ThemedContainer';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export default function SecurityScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [passwordChange, setPasswordChange] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const handleChangePassword = () => {
    // Проверка на текущий пароль (в демо просто проверяем что не пустое)
    if (!passwordData.currentPassword) {
      Alert.alert('Ошибка', 'Введите текущий пароль');
      return;
    }
    
    // Проверка на совпадение новых паролей
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Ошибка', 'Новые пароли не совпадают');
      return;
    }
    
    // Проверка сложности пароля
    if (passwordData.newPassword.length < 6) {
      Alert.alert('Ошибка', 'Новый пароль должен содержать не менее 6 символов');
      return;
    }
    
    // В реальном приложении здесь был бы запрос к API для смены пароля
    Alert.alert('Успешно', 'Пароль изменен', [
      { text: 'OK', onPress: () => setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })}
    ]);
  };

  const toggleTwoFactor = () => {
    if (!twoFactorEnabled) {
      // В реальном приложении здесь бы отображался QR-код для настройки 2FA
      Alert.alert('Двухфакторная аутентификация', 'Функция в разработке. В рабочем приложении здесь был бы процесс настройки 2FA.');
    }
    setTwoFactorEnabled(!twoFactorEnabled);
  };

  const toggleBiometric = () => {
    if (!biometricEnabled) {
      // В реальном приложении здесь бы запрашивался доступ к биометрическим данным
      Alert.alert('Биометрическая аутентификация', 'Функция в разработке. В рабочем приложении здесь был бы запрос на использование биометрических данных.');
    }
    setBiometricEnabled(!biometricEnabled);
  };

  return (
    <ThemedContainer style={styles.container}>
      <Appbar.Header style={{backgroundColor: isDark ? '#1c1c1e' : '#ffffff'}}>
        <Appbar.BackAction onPress={() => router.back()} color={isDark ? '#ffffff' : '#000000'} />
        <Appbar.Content title="Безопасность" titleStyle={{color: isDark ? '#ffffff' : '#000000'}} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: isDark ? '#ffffff' : '#000000'}]}>
            Изменение пароля
          </Text>
          
          {!passwordChange ? (
            <Button 
              mode="contained" 
              onPress={() => setPasswordChange(true)}
              style={styles.changePasswordButton}
              buttonColor={isDark ? '#0a84ff' : '#007aff'}
            >
              Изменить пароль
            </Button>
          ) : (
            <View style={styles.passwordForm}>
              <TextInput
                label="Текущий пароль"
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData({...passwordData, currentPassword: text})}
                secureTextEntry={!showPassword.current}
                style={[styles.input, {backgroundColor: isDark ? '#2c2c2e' : '#ffffff'}]}
                mode="outlined"
                outlineColor={isDark ? '#3a3a3c' : '#e1e1e1'}
                activeOutlineColor={isDark ? '#0a84ff' : '#007aff'}
                textColor={isDark ? '#ffffff' : '#000000'}
                right={
                  <TextInput.Icon 
                    icon={showPassword.current ? 'eye-off' : 'eye'} 
                    onPress={() => setShowPassword({...showPassword, current: !showPassword.current})}
                    color={isDark ? '#ffffff80' : '#00000080'}
                  />
                }
              />
              
              <TextInput
                label="Новый пароль"
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData({...passwordData, newPassword: text})}
                secureTextEntry={!showPassword.new}
                style={[styles.input, {backgroundColor: isDark ? '#2c2c2e' : '#ffffff', marginTop: 16}]}
                mode="outlined"
                outlineColor={isDark ? '#3a3a3c' : '#e1e1e1'}
                activeOutlineColor={isDark ? '#0a84ff' : '#007aff'}
                textColor={isDark ? '#ffffff' : '#000000'}
                right={
                  <TextInput.Icon 
                    icon={showPassword.new ? 'eye-off' : 'eye'} 
                    onPress={() => setShowPassword({...showPassword, new: !showPassword.new})}
                    color={isDark ? '#ffffff80' : '#00000080'}
                  />
                }
              />
              
              <TextInput
                label="Подтвердите новый пароль"
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData({...passwordData, confirmPassword: text})}
                secureTextEntry={!showPassword.confirm}
                style={[styles.input, {backgroundColor: isDark ? '#2c2c2e' : '#ffffff', marginTop: 16}]}
                mode="outlined"
                outlineColor={isDark ? '#3a3a3c' : '#e1e1e1'}
                activeOutlineColor={isDark ? '#0a84ff' : '#007aff'}
                textColor={isDark ? '#ffffff' : '#000000'}
                right={
                  <TextInput.Icon 
                    icon={showPassword.confirm ? 'eye-off' : 'eye'} 
                    onPress={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                    color={isDark ? '#ffffff80' : '#00000080'}
                  />
                }
              />
              
              <View style={styles.buttonRow}>
                <Button 
                  mode="outlined" 
                  onPress={() => setPasswordChange(false)}
                  style={[styles.button, {marginRight: 8}]}
                  textColor={isDark ? '#0a84ff' : '#007aff'}
                >
                  Отмена
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleChangePassword}
                  style={styles.button}
                  buttonColor={isDark ? '#0a84ff' : '#007aff'}
                >
                  Сохранить
                </Button>
              </View>
            </View>
          )}
        </View>
        
        <Divider style={[styles.divider, {backgroundColor: isDark ? '#3a3a3c' : '#e1e1e1'}]} />
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: isDark ? '#ffffff' : '#000000'}]}>
            Дополнительная защита
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="two-factor-authentication" size={24} color={isDark ? '#ffffff' : '#000000'} style={styles.settingIcon} />
              <View>
                <Text style={[styles.settingTitle, {color: isDark ? '#ffffff' : '#000000'}]}>
                  Двухфакторная аутентификация
                </Text>
                <Text style={[styles.settingDescription, {color: isDark ? '#999999' : '#666666'}]}>
                  Повысьте безопасность аккаунта с помощью дополнительного кода подтверждения
                </Text>
              </View>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={toggleTwoFactor}
              color={isDark ? '#0a84ff' : '#007aff'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="finger-print" size={24} color={isDark ? '#ffffff' : '#000000'} style={styles.settingIcon} />
              <View>
                <Text style={[styles.settingTitle, {color: isDark ? '#ffffff' : '#000000'}]}>
                  Биометрическая аутентификация
                </Text>
                <Text style={[styles.settingDescription, {color: isDark ? '#999999' : '#666666'}]}>
                  Входите в приложение с помощью отпечатка пальца или Face ID
                </Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={toggleBiometric}
              color={isDark ? '#0a84ff' : '#007aff'}
            />
          </View>
        </View>
        
        <Divider style={[styles.divider, {backgroundColor: isDark ? '#3a3a3c' : '#e1e1e1'}]} />
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: isDark ? '#ffffff' : '#000000'}]}>
            Активные сессии
          </Text>
          
          <View style={[styles.sessionItem, {backgroundColor: isDark ? '#2c2c2e' : '#f5f5f5'}]}>
            <View style={styles.sessionInfo}>
              <MaterialCommunityIcons name="cellphone" size={24} color={isDark ? '#ffffff' : '#000000'} style={styles.deviceIcon} />
              <View>
                <Text style={[styles.deviceName, {color: isDark ? '#ffffff' : '#000000'}]}>
                  Текущее устройство
                </Text>
                <Text style={[styles.sessionDetails, {color: isDark ? '#999999' : '#666666'}]}>
                  Последняя активность: Сейчас
                </Text>
              </View>
            </View>
            <Text style={[styles.currentSession, {color: isDark ? '#30d158' : '#34c759'}]}>
              Активна
            </Text>
          </View>
        </View>
      </ScrollView>
    </ThemedContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  changePasswordButton: {
    alignSelf: 'flex-start',
  },
  passwordForm: {
    marginTop: 8,
  },
  input: {
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    maxWidth: '90%',
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIcon: {
    marginRight: 16,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  sessionDetails: {
    fontSize: 14,
  },
  currentSession: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 