import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Appbar, Switch, Divider, List } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemedContainer } from '@/components/ThemedContainer';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  
  // Состояния для различных типов уведомлений
  const [notificationSettings, setNotificationSettings] = useState({
    taskAssigned: true,
    taskCompleted: true,
    taskDeadline: true,
    meetingScheduled: true,
    meetingReminder: true,
    systemUpdates: false,
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: true,
  });

  const toggleSetting = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting]
    });
  };

  return (
    <ThemedContainer style={styles.container}>
      <Appbar.Header style={{backgroundColor: isDark ? '#1c1c1e' : '#ffffff'}}>
        <Appbar.BackAction onPress={() => router.back()} color={isDark ? '#ffffff' : '#000000'} />
        <Appbar.Content title="Уведомления" titleStyle={{color: isDark ? '#ffffff' : '#000000'}} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: isDark ? '#ffffff' : '#000000'}]}>
            Общие настройки
          </Text>
          
          <List.Item
            title="Push-уведомления"
            description="Получать уведомления в реальном времени"
            titleStyle={{color: isDark ? '#ffffff' : '#000000'}}
            descriptionStyle={{color: isDark ? '#999999' : '#666666'}}
            left={props => <List.Icon {...props} icon="bell" color={isDark ? '#ffffff' : '#000000'} />}
            right={props => 
              <Switch
                value={notificationSettings.pushNotifications}
                onValueChange={() => toggleSetting('pushNotifications')}
                color={isDark ? '#0a84ff' : '#007aff'}
              />
            }
          />
          
          <List.Item
            title="Email-уведомления"
            description="Получать уведомления по email"
            titleStyle={{color: isDark ? '#ffffff' : '#000000'}}
            descriptionStyle={{color: isDark ? '#999999' : '#666666'}}
            left={props => <List.Icon {...props} icon="email" color={isDark ? '#ffffff' : '#000000'} />}
            right={props => 
              <Switch
                value={notificationSettings.emailNotifications}
                onValueChange={() => toggleSetting('emailNotifications')}
                color={isDark ? '#0a84ff' : '#007aff'}
              />
            }
          />
          
          <List.Item
            title="Звуковые уведомления"
            description="Воспроизводить звук при получении уведомлений"
            titleStyle={{color: isDark ? '#ffffff' : '#000000'}}
            descriptionStyle={{color: isDark ? '#999999' : '#666666'}}
            left={props => <List.Icon {...props} icon="volume-high" color={isDark ? '#ffffff' : '#000000'} />}
            right={props => 
              <Switch
                value={notificationSettings.soundEnabled}
                onValueChange={() => toggleSetting('soundEnabled')}
                color={isDark ? '#0a84ff' : '#007aff'}
              />
            }
          />
        </View>
        
        <Divider style={[styles.divider, {backgroundColor: isDark ? '#3a3a3c' : '#e1e1e1'}]} />
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: isDark ? '#ffffff' : '#000000'}]}>
            Уведомления о задачах
          </Text>
          
          <List.Item
            title="Новые назначенные задачи"
            description="Уведомления о задачах, назначенных вам"
            titleStyle={{color: isDark ? '#ffffff' : '#000000'}}
            descriptionStyle={{color: isDark ? '#999999' : '#666666'}}
            left={props => <List.Icon {...props} icon="clipboard-check" color={isDark ? '#ffffff' : '#000000'} />}
            right={props => 
              <Switch
                value={notificationSettings.taskAssigned}
                onValueChange={() => toggleSetting('taskAssigned')}
                color={isDark ? '#0a84ff' : '#007aff'}
              />
            }
          />
          
          <List.Item
            title="Завершение задач"
            description="Уведомления о выполнении задач"
            titleStyle={{color: isDark ? '#ffffff' : '#000000'}}
            descriptionStyle={{color: isDark ? '#999999' : '#666666'}}
            left={props => <List.Icon {...props} icon="check-all" color={isDark ? '#ffffff' : '#000000'} />}
            right={props => 
              <Switch
                value={notificationSettings.taskCompleted}
                onValueChange={() => toggleSetting('taskCompleted')}
                color={isDark ? '#0a84ff' : '#007aff'}
              />
            }
          />
          
          <List.Item
            title="Сроки выполнения"
            description="Напоминания о приближающихся сроках"
            titleStyle={{color: isDark ? '#ffffff' : '#000000'}}
            descriptionStyle={{color: isDark ? '#999999' : '#666666'}}
            left={props => <List.Icon {...props} icon="clock-alert" color={isDark ? '#ffffff' : '#000000'} />}
            right={props => 
              <Switch
                value={notificationSettings.taskDeadline}
                onValueChange={() => toggleSetting('taskDeadline')}
                color={isDark ? '#0a84ff' : '#007aff'}
              />
            }
          />
        </View>
        
        <Divider style={[styles.divider, {backgroundColor: isDark ? '#3a3a3c' : '#e1e1e1'}]} />
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: isDark ? '#ffffff' : '#000000'}]}>
            Уведомления о встречах
          </Text>
          
          <List.Item
            title="Планирование встреч"
            description="Уведомления о новых встречах"
            titleStyle={{color: isDark ? '#ffffff' : '#000000'}}
            descriptionStyle={{color: isDark ? '#999999' : '#666666'}}
            left={props => <List.Icon {...props} icon="calendar-plus" color={isDark ? '#ffffff' : '#000000'} />}
            right={props => 
              <Switch
                value={notificationSettings.meetingScheduled}
                onValueChange={() => toggleSetting('meetingScheduled')}
                color={isDark ? '#0a84ff' : '#007aff'}
              />
            }
          />
          
          <List.Item
            title="Напоминания о встречах"
            description="Напоминания перед началом встречи"
            titleStyle={{color: isDark ? '#ffffff' : '#000000'}}
            descriptionStyle={{color: isDark ? '#999999' : '#666666'}}
            left={props => <List.Icon {...props} icon="calendar-clock" color={isDark ? '#ffffff' : '#000000'} />}
            right={props => 
              <Switch
                value={notificationSettings.meetingReminder}
                onValueChange={() => toggleSetting('meetingReminder')}
                color={isDark ? '#0a84ff' : '#007aff'}
              />
            }
          />
        </View>
        
        <Divider style={[styles.divider, {backgroundColor: isDark ? '#3a3a3c' : '#e1e1e1'}]} />
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: isDark ? '#ffffff' : '#000000'}]}>
            Другие уведомления
          </Text>
          
          <List.Item
            title="Обновления системы"
            description="Информация о новых функциях и обновлениях"
            titleStyle={{color: isDark ? '#ffffff' : '#000000'}}
            descriptionStyle={{color: isDark ? '#999999' : '#666666'}}
            left={props => <List.Icon {...props} icon="update" color={isDark ? '#ffffff' : '#000000'} />}
            right={props => 
              <Switch
                value={notificationSettings.systemUpdates}
                onValueChange={() => toggleSetting('systemUpdates')}
                color={isDark ? '#0a84ff' : '#007aff'}
              />
            }
          />
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
    paddingHorizontal: 16,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
}); 