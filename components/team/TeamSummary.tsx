import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Определим тип Employee
interface Employee {
  id: string;
  name: string;
  position: string;
  avatarUrl: string;
  isOnline?: boolean;
  activeTasks?: number;
  projects?: number;
  efficiency?: string;
}

interface TeamSummaryProps {
  employees: Employee[];
}

export const TeamSummary = ({ employees }: TeamSummaryProps) => {
  const { isDark } = useTheme();
  
  // Берем первые 3 сотрудника для отображения
  const displayedEmployees = employees.slice(0, 3);
  
  const handleViewEmployee = (employeeId: string) => {
    router.push({
      pathname: '/profile',
      params: { employeeId }
    });
  };
  
  if (displayedEmployees.length === 0) {
    return (
      <LinearGradient
        colors={isDark ? ['#2c2c2e', '#252527'] : ['#ffffff', '#f8f8fa']}
        style={styles.emptyContainer}
      >
        <Text style={[styles.emptyText, {color: isDark ? '#9a9a9a' : '#8e8e93'}]}>
          Нет сотрудников в команде
        </Text>
      </LinearGradient>
    );
  }
  
  return (
    <View style={styles.container}>
      {displayedEmployees.map((employee) => (
        <TouchableOpacity
          key={employee.id}
          style={styles.employeeItem}
          onPress={() => handleViewEmployee(employee.id)}
        >
          <LinearGradient
            colors={isDark ? ['#2c2c2e', '#252527'] : ['#ffffff', '#f8f8fa']}
            style={styles.employeeCard}
          >
            <View style={styles.employeeHeader}>
              <View style={styles.avatarContainer}>
                <Image 
                  source={{ uri: employee.avatarUrl }} 
                  style={styles.avatar} 
                />
                {employee.isOnline && (
                  <View 
                    style={[
                      styles.onlineIndicator, 
                      {backgroundColor: isDark ? '#4cd964' : '#34c759'}
                    ]} 
                  />
                )}
              </View>
              
              <View style={styles.employeeInfo}>
                <Text 
                  style={[
                    styles.employeeName, 
                    {color: isDark ? '#ffffff' : '#000000'}
                  ]}
                  numberOfLines={1}
                >
                  {employee.name}
                </Text>
                <Text 
                  style={[
                    styles.employeePosition, 
                    {color: isDark ? '#9a9a9a' : '#8e8e93'}
                  ]}
                  numberOfLines={1}
                >
                  {employee.position}
                </Text>
              </View>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, {color: isDark ? '#ffffff' : '#000000'}]}>
                  {employee.activeTasks || '0'}
                </Text>
                <Text style={[styles.statLabel, {color: isDark ? '#9a9a9a' : '#8e8e93'}]}>
                  Задач
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, {color: isDark ? '#ffffff' : '#000000'}]}>
                  {employee.projects || '0'}
                </Text>
                <Text style={[styles.statLabel, {color: isDark ? '#9a9a9a' : '#8e8e93'}]}>
                  Проектов
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, {color: isDark ? '#ffffff' : '#000000'}]}>
                  {employee.efficiency || '0%'}
                </Text>
                <Text style={[styles.statLabel, {color: isDark ? '#9a9a9a' : '#8e8e93'}]}>
                  Эффект.
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  emptyContainer: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  employeeItem: {
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  employeeCard: {
    borderRadius: 16,
    padding: 16,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  onlineIndicator: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'white',
    bottom: 0,
    right: 0,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  employeePosition: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(142, 142, 147, 0.1)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
}); 