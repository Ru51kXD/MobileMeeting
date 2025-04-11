import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Calendar, CalendarProps, DateData } from 'react-native-calendars';
import { Button, FAB, ActivityIndicator, Chip, Dialog, Portal } from 'react-native-paper';
import { Meeting, UserRole } from '../../../types/index';
import { useAuth } from '../../../context/AuthContext';
import { useMeeting } from '../../../context/MeetingContext';
import { useTheme } from '../../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, isSameDay, parseISO, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { router } from 'expo-router';
import { ThemedContainer } from '@/components/ThemedContainer';
import { Colors } from '@/constants/Colors';

export default function MeetingsScreen() {
  const { user } = useAuth();
  const { meetings: allMeetings, refreshMeetings } = useMeeting();
  const { isDark } = useTheme();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [markedDates, setMarkedDates] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [detailDialogVisible, setDetailDialogVisible] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, [allMeetings]);

  useEffect(() => {
    generateMarkedDates();
  }, [meetings]);

  const loadMeetings = () => {
    // Фильтруем митинги, в которых пользователь участвует
    const userMeetings = allMeetings.filter(
      meeting => meeting.participants.includes(user?.id || '')
    );
    setMeetings(userMeetings);
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshMeetings();
  };

  const generateMarkedDates = () => {
    const marks: any = {};
    
    meetings.forEach(meeting => {
      const dateStr = format(new Date(meeting.startTime), 'yyyy-MM-dd');
      
      if (marks[dateStr]) {
        marks[dateStr].dots.push({
          key: meeting.id,
          color: '#2196F3',
        });
      } else {
        marks[dateStr] = {
          dots: [{ key: meeting.id, color: '#2196F3' }],
        };
      }
    });
    
    // Добавляем выбранную дату
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    marks[selectedDateStr] = {
      ...(marks[selectedDateStr] || {}),
      selected: true,
      selectedColor: '#2196F3',
      dots: marks[selectedDateStr]?.dots || [],
    };
    
    setMarkedDates(marks);
  };

  const onDayPress = (day: DateData) => {
    setSelectedDate(new Date(day.timestamp));
  };

  const getMeetingsForSelectedDate = () => {
    return meetings.filter(meeting => 
      isSameDay(new Date(meeting.startTime), selectedDate)
    );
  };

  const formatMeetingTime = (startTime: Date | string, endTime: Date | string) => {
    const start = typeof startTime === 'string' ? parseISO(startTime) : startTime;
    const end = typeof endTime === 'string' ? parseISO(endTime) : endTime;
    
    return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
  };

  const handleMeetingPress = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setDetailDialogVisible(true);
  };

  const formatDetailDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd MMMM yyyy, HH:mm', { locale: ru });
  };

  // Динамические стили в зависимости от темы
  const dynamicStyles = {
    calendarContainer: {
      backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
      borderBottomColor: isDark ? '#333' : '#e0e0e0',
    },
    calendar: {
      backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
    },
    meetingsContainer: {
      backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
    },
    meetingsHeader: {
      backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
      borderBottomColor: isDark ? '#333' : '#e0e0e0',
    },
    meetingsTitle: {
      color: isDark ? Colors.dark.text : '#333',
    },
    meetingsCount: {
      color: isDark ? '#888' : '#666',
    },
    meetingItem: {
      backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
      shadowColor: isDark ? '#000' : '#000',
    },
    pastMeetingItem: {
      opacity: 0.7,
    },
    meetingTitle: {
      color: isDark ? Colors.dark.text : '#333',
    },
    meetingDescription: {
      color: isDark ? '#aaa' : '#666',
    },
    organizerText: {
      color: isDark ? '#888' : '#666',
    },
    participantsText: {
      color: isDark ? '#888' : '#666',
    },
    dialogContent: {
      color: isDark ? Colors.dark.text : '#333',
    },
    dialogSubcontent: {
      color: isDark ? '#aaa' : '#666',
    },
  };

  if (loading) {
    return (
      <ThemedContainer style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </ThemedContainer>
    );
  }

  const selectedDateMeetings = getMeetingsForSelectedDate();

  // Функция для перехода на экран создания митинга
  const goToCreateMeeting = () => {
    router.push('/(tabs)/meetings/create');
  };

  return (
    <ThemedContainer>
      <View style={[styles.calendarContainer, dynamicStyles.calendarContainer]}>
        <Calendar
          style={[styles.calendar, dynamicStyles.calendar]}
          current={format(selectedDate, 'yyyy-MM-dd')}
          onDayPress={onDayPress}
          monthFormat="MMMM yyyy"
          hideExtraDays={true}
          firstDay={1}
          markingType="multi-dot"
          markedDates={markedDates}
          theme={{
            calendarBackground: isDark ? '#1e1e1e' : '#ffffff',
            textSectionTitleColor: isDark ? '#888' : '#b6c1cd',
            selectedDayBackgroundColor: '#2196F3',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#2196F3',
            dayTextColor: isDark ? Colors.dark.text : '#2d4150',
            textDisabledColor: isDark ? '#555' : '#d9e1e8',
            dotColor: '#2196F3',
            selectedDotColor: '#ffffff',
            arrowColor: '#2196F3',
            monthTextColor: isDark ? Colors.dark.text : '#2d4150',
            indicatorColor: '#2196F3',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
          }}
        />
      </View>
      
      <View style={[styles.meetingsContainer, dynamicStyles.meetingsContainer]}>
        <View style={[styles.meetingsHeader, dynamicStyles.meetingsHeader]}>
          <Text style={[styles.meetingsTitle, dynamicStyles.meetingsTitle]}>
            Митинги на {format(selectedDate, 'd MMMM', { locale: ru })}
          </Text>
          <Text style={[styles.meetingsCount, dynamicStyles.meetingsCount]}>
            {selectedDateMeetings.length} {getCorrectWordForm(selectedDateMeetings.length)}
          </Text>
        </View>
        
        <FlatList
          data={selectedDateMeetings}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.meetingItem, 
                dynamicStyles.meetingItem,
                new Date(item.startTime) < new Date() && [styles.pastMeetingItem, dynamicStyles.pastMeetingItem]
              ]}
              onPress={() => handleMeetingPress(item)}
            >
              <View style={styles.meetingHeader}>
                <Text style={[styles.meetingTitle, dynamicStyles.meetingTitle]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Chip style={styles.timeChip}>
                  {formatMeetingTime(item.startTime, item.endTime)}
                </Chip>
              </View>
              
              {item.description && (
                <Text style={[styles.meetingDescription, dynamicStyles.meetingDescription]} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              
              <View style={styles.meetingFooter}>
                <View style={styles.organizerContainer}>
                  <MaterialCommunityIcons name="account" size={16} color={isDark ? '#888' : '#666'} />
                  <Text style={[styles.organizerText, dynamicStyles.organizerText]}>
                    {item.organizer === user?.id ? 'Вы (организатор)' : 'Организатор'}
                  </Text>
                </View>
                
                <View style={styles.participantsContainer}>
                  <MaterialCommunityIcons name="account-group" size={16} color={isDark ? '#888' : '#666'} />
                  <Text style={[styles.participantsText, dynamicStyles.participantsText]}>
                    {item.participants.length} участников
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.meetingsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2196F3"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color={isDark ? '#555' : '#ccc'} />
              <Text style={{ marginTop: 12, color: isDark ? '#888' : '#666', textAlign: 'center' }}>
                Нет митингов на выбранную дату
              </Text>
            </View>
          }
        />
      </View>
      
      {(user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER) && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={goToCreateMeeting}
        />
      )}
      
      <Portal>
        <Dialog
          visible={detailDialogVisible}
          onDismiss={() => setDetailDialogVisible(false)}
          style={{ backgroundColor: isDark ? '#1e1e1e' : 'white' }}
        >
          {selectedMeeting && (
            <>
              <Dialog.Title style={{ color: isDark ? Colors.dark.text : '#333' }}>
                {selectedMeeting.title}
              </Dialog.Title>
              <Dialog.Content>
                {selectedMeeting.description && (
                  <Text style={[{ marginBottom: 16 }, dynamicStyles.dialogSubcontent]}>
                    {selectedMeeting.description}
                  </Text>
                )}
                
                <View style={{ marginBottom: 12 }}>
                  <Text style={[{ fontWeight: 'bold', marginBottom: 4 }, dynamicStyles.dialogContent]}>
                    Дата и время:
                  </Text>
                  <Text style={dynamicStyles.dialogSubcontent}>
                    {formatDetailDate(selectedMeeting.startTime)} - {format(new Date(selectedMeeting.endTime), 'HH:mm')}
                  </Text>
                </View>
                
                <View style={{ marginBottom: 12 }}>
                  <Text style={[{ fontWeight: 'bold', marginBottom: 4 }, dynamicStyles.dialogContent]}>
                    Расположение:
                  </Text>
                  <Text style={dynamicStyles.dialogSubcontent}>
                    {selectedMeeting.location || 'Не указано'}
                  </Text>
                </View>
                
                <View>
                  <Text style={[{ fontWeight: 'bold', marginBottom: 4 }, dynamicStyles.dialogContent]}>
                    Участники:
                  </Text>
                  <Text style={dynamicStyles.dialogSubcontent}>
                    {selectedMeeting.participants.length} человек
                  </Text>
                </View>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setDetailDialogVisible(false)}>Закрыть</Button>
              </Dialog.Actions>
            </>
          )}
        </Dialog>
      </Portal>
    </ThemedContainer>
  );
}

function getCorrectWordForm(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'митингов';
  }
  
  if (lastDigit === 1) {
    return 'митинг';
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'митинга';
  }
  
  return 'митингов';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  calendar: {
    borderRadius: 10,
  },
  meetingsContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -10,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  meetingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  meetingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  meetingsCount: {
    fontSize: 14,
    color: '#666',
  },
  meetingsList: {
    paddingBottom: 80,
  },
  meetingItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  pastMeetingItem: {
    borderLeftColor: '#9e9e9e',
    opacity: 0.7,
  },
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  timeChip: {
    backgroundColor: '#e3f2fd',
    height: 30,
  },
  meetingDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  meetingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  organizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    color: '#999',
    textAlign: 'center',
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  dialogSection: {
    marginBottom: 16,
  },
  dialogSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  dialogText: {
    fontSize: 16,
    color: '#333',
  },
}); 