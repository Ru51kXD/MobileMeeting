import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { Appbar, TextInput, Button, Avatar } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedContainer } from '@/components/ThemedContainer';

export default function EditProfileScreen() {
  const { user, updateUser } = useAuth();
  const { isDark } = useTheme();
  
  const [avatarUri, setAvatarUri] = useState(user?.avatarUrl || 'https://ui-avatars.com/api/?name=Admin+System&background=0D8ABC&color=fff');
  const [userData, setUserData] = useState({
    name: user?.name || 'Админ Системы',
    position: user?.position || 'Руководитель отдела',
    department: user?.department || 'ИТ отдел',
    email: user?.email || 'admin@company.com',
  });

  const handleChangeAvatar = () => {
    // Имитация смены аватара без использования библиотеки выбора изображения
    const avatars = [
      'https://ui-avatars.com/api/?name=Admin+System&background=0D8ABC&color=fff',
      'https://ui-avatars.com/api/?name=Admin+User&background=2E7D32&color=fff',
      'https://ui-avatars.com/api/?name=Corporate+Admin&background=C62828&color=fff',
      'https://ui-avatars.com/api/?name=Task+Manager&background=6A1B9A&color=fff'
    ];
    
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
    setAvatarUri(randomAvatar);
  };

  const handleSaveProfile = async () => {
    if (!userData.name.trim()) {
      Alert.alert('Ошибка', 'Имя не может быть пустым');
      return;
    }
    
    try {
      const success = await updateUser({
        name: userData.name,
        position: userData.position,
        department: userData.department,
        avatarUrl: avatarUri
      });
      
      if (success) {
        Alert.alert('Успешно', 'Профиль обновлен', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Ошибка', 'Не удалось обновить профиль. Попробуйте еще раз.');
      }
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при обновлении профиля');
    }
  };

  return (
    <ThemedContainer style={styles.container}>
      <Appbar.Header style={{backgroundColor: isDark ? '#1c1c1e' : '#ffffff'}}>
        <Appbar.BackAction onPress={() => router.back()} color={isDark ? '#ffffff' : '#000000'} />
        <Appbar.Content title="Редактирование профиля" titleStyle={{color: isDark ? '#ffffff' : '#000000'}} />
        <Appbar.Action icon="check" onPress={handleSaveProfile} color={isDark ? '#0a84ff' : '#007aff'} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <View style={styles.avatarContainer}>
          <Avatar.Image 
            source={{ uri: avatarUri }} 
            size={100} 
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.changeAvatarButton} onPress={handleChangeAvatar}>
            <LinearGradient
              colors={isDark ? ['#0a84ff', '#0066cc'] : ['#007aff', '#0062cc']}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>Изменить фото</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: isDark ? '#ffffff' : '#000000'}]}>Ваше имя</Text>
          <TextInput
            value={userData.name}
            onChangeText={(text) => setUserData({...userData, name: text})}
            style={[styles.input, {backgroundColor: isDark ? '#2c2c2e' : '#ffffff'}]}
            mode="outlined"
            outlineColor={isDark ? '#3a3a3c' : '#e1e1e1'}
            activeOutlineColor={isDark ? '#0a84ff' : '#007aff'}
            textColor={isDark ? '#ffffff' : '#000000'}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: isDark ? '#ffffff' : '#000000'}]}>Должность</Text>
          <TextInput
            value={userData.position}
            onChangeText={(text) => setUserData({...userData, position: text})}
            style={[styles.input, {backgroundColor: isDark ? '#2c2c2e' : '#ffffff'}]}
            mode="outlined"
            outlineColor={isDark ? '#3a3a3c' : '#e1e1e1'}
            activeOutlineColor={isDark ? '#0a84ff' : '#007aff'}
            textColor={isDark ? '#ffffff' : '#000000'}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: isDark ? '#ffffff' : '#000000'}]}>Отдел</Text>
          <TextInput
            value={userData.department}
            onChangeText={(text) => setUserData({...userData, department: text})}
            style={[styles.input, {backgroundColor: isDark ? '#2c2c2e' : '#ffffff'}]}
            mode="outlined"
            outlineColor={isDark ? '#3a3a3c' : '#e1e1e1'}
            activeOutlineColor={isDark ? '#0a84ff' : '#007aff'}
            textColor={isDark ? '#ffffff' : '#000000'}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: isDark ? '#ffffff' : '#000000'}]}>Email</Text>
          <TextInput
            value={userData.email}
            disabled={true}
            style={[styles.input, {backgroundColor: isDark ? '#2c2c2e' : '#ffffff', opacity: 0.7}]}
            mode="outlined"
            outlineColor={isDark ? '#3a3a3c' : '#e1e1e1'}
            textColor={isDark ? '#ffffff' : '#000000'}
          />
          <Text style={[styles.helperText, {color: isDark ? '#999999' : '#666666'}]}>
            Email не может быть изменен
          </Text>
        </View>

        <Button 
          mode="contained" 
          onPress={handleSaveProfile}
          style={styles.saveButton}
          buttonColor={isDark ? '#0a84ff' : '#007aff'}
        >
          Сохранить изменения
        </Button>
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
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatar: {
    marginBottom: 16,
  },
  changeAvatarButton: {
    marginTop: 8,
  },
  gradientButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    marginVertical: 24,
  },
}); 