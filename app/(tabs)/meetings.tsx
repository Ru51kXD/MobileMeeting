import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Calendar, CalendarProps, DateData } from 'react-native-calendars';
import { Button, FAB, ActivityIndicator, Chip, Dialog, Portal } from 'react-native-paper';
import { Meeting, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useMeeting } from '../../context/MeetingContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, isSameDay, parseISO, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { router } from 'expo-router';

export default function MeetingsScreen() {
  const { user } = useAuth();
  const { meetings: allMeetings, refreshMeetings } = useMeeting();
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

  const renderMeetingItem = ({ item }: { item: Meeting }) => {
    const isUpcoming = new Date(item.startTime) > new Date();
    
    return (
      <TouchableOpacity
        style={[styles.meetingItem, !isUpcoming && styles.pastMeetingItem]}
        onPress={() => handleMeetingPress(item)}
      >
        <View style={styles.meetingHeader}>
          <Text style={styles.meetingTitle} numberOfLines={1}>{item.title}</Text>
          <Chip style={styles.timeChip}>
            {formatMeetingTime(item.startTime, item.endTime)}
          </Chip>
        </View>
        
        {item.description && (
          <Text style={styles.meetingDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.meetingFooter}>
          <View style={styles.organizerContainer}>
            <MaterialCommunityIcons name="account" size={16} color="#666" />
            <Text style={styles.organizerText}>
              {item.organizer === user?.id ? 'Вы (организатор)' : 'Организатор'}
            </Text>
          </View>
          
          <View style={styles.participantsContainer}>
            <MaterialCommunityIcons name="account-group" size={16} color="#666" />
            <Text style={styles.participantsText}>
              {item.participants.length} участников
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const selectedDateMeetings = getMeetingsForSelectedDate();

  return (
    <View style={styles.container}>
      <View style={styles.calendarContainer}>
        <Calendar
          style={styles.calendar}
          current={format(selectedDate, 'yyyy-MM-dd')}
          onDayPress={onDayPress}
          monthFormat="MMMM yyyy"
          hideExtraDays={true}
          firstDay={1}
          markingType="multi-dot"
          markedDates={markedDates}
          theme={{
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#b6c1cd',
            selectedDayBackgroundColor: '#2196F3',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#2196F3',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#2196F3',
            selectedDotColor: '#ffffff',
            arrowColor: '#2196F3',
            monthTextColor: '#2d4150',
            indicatorColor: '#2196F3',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
          }}
        />
      </View>
      
      <View style={styles.meetingsContainer}>
        <View style={styles.meetingsHeader}>
          <Text style={styles.meetingsTitle}>
            Митинги на {format(selectedDate, 'd MMMM', { locale: ru })}
          </Text>
          <Text style={styles.meetingsCount}>
            {selectedDateMeetings.length} {getCorrectWordForm(selectedDateMeetings.length)}
          </Text>
        </View>
        
        <FlatList
          data={selectedDateMeetings}
          renderItem={renderMeetingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.meetingsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-blank" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Нет запланированных митингов на этот день</Text>
            </View>
          }
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#2196F3']}
            />
          }
        />
      </View>
      
      <Portal>
        <Dialog 
          visible={detailDialogVisible}
          onDismiss={() => setDetailDialogVisible(false)}
          style={styles.dialog}
        >
          {selectedMeeting && (
            <>
              <Dialog.Title>{selectedMeeting.title}</Dialog.Title>
              <Dialog.Content>
                <View style={styles.dialogSection}>
                  <Text style={styles.dialogSectionTitle}>Дата и время</Text>
                  <Text style={styles.dialogText}>
                    {formatDetailDate(selectedMeeting.startTime)} - {format(new Date(selectedMeeting.endTime), 'HH:mm')}
                  </Text>
                </View>
                
                {selectedMeeting.description && (
                  <View style={styles.dialogSection}>
                    <Text style={styles.dialogSectionTitle}>Описание</Text>
                    <Text style={styles.dialogText}>{selectedMeeting.description}</Text>
                  </View>
                )}
                
                <View style={styles.dialogSection}>
                  <Text style={styles.dialogSectionTitle}>Организатор</Text>
                  <Text style={styles.dialogText}>
                    {selectedMeeting.organizer === user?.id ? 'Вы' : 'ID: ' + selectedMeeting.organizer}
                  </Text>
                </View>
                
                <View style={styles.dialogSection}>
                  <Text style={styles.dialogSectionTitle}>Участники</Text>
                  <Text style={styles.dialogText}>
                    {selectedMeeting.participants.length} человек
                  </Text>
                </View>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setDetailDialogVisible(false)}>Закрыть</Button>
                <Button 
                  mode="contained"
                  onPress={() => {
                    // Здесь будет логика синхронизации с календарем
                    setDetailDialogVisible(false);
                  }}
                >
                  Добавить в календарь
                </Button>
              </Dialog.Actions>
            </>
          )}
        </Dialog>
      </Portal>
      
      {(user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER) && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => router.push('/(tabs)/meetings/create')}
        />
      )}
    </View>
  );
}

// Вспомогательная функция для правильного склонения слова "митинг"
function getCorrectWordForm(count: number): string {
  if (count === 0) {
    return 'митингов';
  }
  
  if (count === 1) {
    return 'митинг';
  }
  
  if (count >= 2 && count <= 4) {
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
    elevation: 2,
    marginBottom: 16,
  },
  calendar: {
    paddingBottom: 10,
  },
  meetingsContainer: {
    flex: 1,
  },
  meetingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  meetingItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
  },
  pastMeetingItem: {
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
    backgroundColor: '#e0f7fa',
  },
  meetingDescription: {
    color: '#666',
    marginBottom: 12,
  },
  meetingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
  dialog: {
    maxHeight: '80%',
  },
  dialogSection: {
    marginBottom: 16,
  },
  dialogSectionTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#666',
  },
  dialogText: {
    fontSize: 16,
    lineHeight: 24,
  },
}); 