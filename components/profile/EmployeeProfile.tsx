import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';
import { Employee } from '../../context/ChatContext';
import { Button } from '../ui/Button';

interface EmployeeProfileProps {
  employee: Employee;
  onClose: () => void;
}

const EmployeeProfile: React.FC<EmployeeProfileProps> = ({
  employee,
  onClose,
}) => {
  const { isDark } = useTheme();

  const contactMethods = [
    {
      id: 'phone',
      icon: 'call-outline',
      value: employee.phone,
      action: () => Linking.openURL(`tel:${employee.phone}`),
    },
    {
      id: 'email',
      icon: 'mail-outline',
      value: employee.email,
      action: () => Linking.openURL(`mailto:${employee.email}`),
    },
  ];

  // Преобразуем эффективность и своевременность в процентный формат
  const formatPercentage = (value?: number) => {
    if (value === undefined) return 'Н/Д';
    return `${Math.round(value * 100)}%`;
  };

  // Генерируем цвет индикатора в зависимости от значения
  const getIndicatorColor = (value?: number) => {
    if (value === undefined) return Colors.grey;
    if (value >= 0.8) return Colors.success;
    if (value >= 0.5) return Colors.warning;
    return Colors.error;
  };

  // Статистики для отображения
  const stats = [
    {
      id: 'efficiency',
      title: 'Эффективность',
      value: formatPercentage(employee.efficiency),
      color: getIndicatorColor(employee.efficiency),
    },
    {
      id: 'timeliness',
      title: 'Своевременность',
      value: formatPercentage(employee.timeliness),
      color: getIndicatorColor(employee.timeliness),
    },
    {
      id: 'activeTasks',
      title: 'Активные задачи',
      value: employee.activeTasks?.toString() || '0',
      color: Colors.primary,
    },
    {
      id: 'completedTasks',
      title: 'Завершенные задачи',
      value: employee.completedTasks?.toString() || '0',
      color: Colors.success,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Ionicons
            name="close"
            size={24}
            color={isDark ? Colors.dark.text : Colors.light.text}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Аватар и базовая информация */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: employee.avatarUrl }}
              style={styles.avatar}
            />
            {employee.isOnline !== undefined && (
              <View
                style={[
                  styles.statusIndicator,
                  {
                    backgroundColor: employee.isOnline
                      ? Colors.success
                      : Colors.grey,
                  },
                ]}
              />
            )}
          </View>

          <Text
            style={[
              styles.name,
              { color: isDark ? Colors.dark.text : Colors.light.text },
            ]}
          >
            {employee.name}
          </Text>
          <Text
            style={[
              styles.position,
              { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary },
            ]}
          >
            {employee.position}
          </Text>
          {employee.department && (
            <Text
              style={[
                styles.department,
                { color: isDark ? Colors.dark.textTertiary : Colors.light.textTertiary },
              ]}
            >
              {employee.department}
            </Text>
          )}
        </View>

        {/* Контактная информация */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? Colors.dark.text : Colors.light.text },
            ]}
          >
            Контактная информация
          </Text>
          <View style={styles.contactList}>
            {contactMethods.map((contact) => (
              <Pressable
                key={contact.id}
                style={[
                  styles.contactItem,
                  {
                    backgroundColor: isDark
                      ? Colors.dark.cardBackground
                      : Colors.light.cardBackground,
                  },
                ]}
                onPress={contact.action}
              >
                <Ionicons
                  name={contact.icon}
                  size={20}
                  color={Colors.primary}
                  style={styles.contactIcon}
                />
                <Text
                  style={[
                    styles.contactValue,
                    { color: isDark ? Colors.dark.text : Colors.light.text },
                  ]}
                >
                  {contact.value || 'Не указано'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={isDark ? Colors.dark.textTertiary : Colors.light.textTertiary}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Статистика сотрудника */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? Colors.dark.text : Colors.light.text },
            ]}
          >
            Статистика
          </Text>
          <View style={styles.statsGrid}>
            {stats.map((stat) => (
              <View
                key={stat.id}
                style={[
                  styles.statItem,
                  {
                    backgroundColor: isDark
                      ? Colors.dark.cardBackground
                      : Colors.light.cardBackground,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statIndicator,
                    { backgroundColor: stat.color },
                  ]}
                />
                <Text
                  style={[
                    styles.statValue,
                    { color: isDark ? Colors.dark.text : Colors.light.text },
                  ]}
                >
                  {stat.value}
                </Text>
                <Text
                  style={[
                    styles.statTitle,
                    {
                      color: isDark
                        ? Colors.dark.textSecondary
                        : Colors.light.textSecondary,
                    },
                  ]}
                >
                  {stat.title}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Проекты */}
        {employee.projects && employee.projects.length > 0 && (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? Colors.dark.text : Colors.light.text },
              ]}
            >
              Проекты
            </Text>
            <View style={styles.projectsList}>
              {employee.projects.map((project, index) => (
                <View
                  key={index}
                  style={[
                    styles.projectItem,
                    {
                      backgroundColor: isDark
                        ? Colors.dark.cardBackground
                        : Colors.light.cardBackground,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.projectName,
                      { color: isDark ? Colors.dark.text : Colors.light.text },
                    ]}
                  >
                    {project}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Кнопки действий */}
        <View style={styles.actionsContainer}>
          <Button
            title="Написать сообщение"
            leftIcon="chatbubble-outline"
            variant="filled"
            onPress={onClose}
            fullWidth
          />
          <Button
            title="Назначить задачу"
            leftIcon="document-text-outline"
            variant="outlined"
            containerStyle={{ marginTop: 12 }}
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 24,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  statusIndicator: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
    bottom: 5,
    right: 5,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  position: {
    fontSize: 16,
    marginBottom: 4,
  },
  department: {
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  contactList: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  contactIcon: {
    marginRight: 12,
  },
  contactValue: {
    flex: 1,
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
  },
  projectsList: {
    gap: 8,
  },
  projectItem: {
    padding: 16,
    borderRadius: 12,
  },
  projectName: {
    fontSize: 16,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
});

export default EmployeeProfile; 