import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Calendar, CalendarProps, DateData } from 'react-native-calendars';
import { Button, FAB, ActivityIndicator, Chip, Dialog, Portal, Avatar } from 'react-native-paper';
import { Meeting, UserRole } from '../../../types/index';
import { useAuth } from '../../../context/AuthContext';
import { useMeeting } from '../../../context/MeetingContext';
import { useTheme } from '../../../context/ThemeContext';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { format, isSameDay, parseISO, startOfDay, isToday, differenceInMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';
import { router } from 'expo-router';
import { ThemedContainer } from '@/components/ThemedContainer';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

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
      backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
      borderBottomColor: isDark ? '#333' : '#e0e0e0',
      borderBottomWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.1,
      shadowRadius: 2,
      elevation: 3,
      borderRadius: 0,
    },
    calendar: {
      backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
    },
    meetingsContainer: {
      backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
    },
    meetingsHeader: {
      backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
      borderBottomColor: isDark ? '#333' : '#e0e0e0',
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    meetingsTitle: {
      color: isDark ? Colors.dark.text : '#333',
      fontSize: 18,
      fontWeight: '600',
    },
    meetingsCount: {
      color: isDark ? '#888' : '#666',
      fontSize: 14,
    },
    meetingItem: {
      backgroundColor: isDark ? '#2c2c2e' : '#ffffff',
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 16,
      padding: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 5,
      elevation: 4,
      overflow: 'hidden',
    },
    pastMeetingItem: {
      opacity: 0.7,
    },
    meetingTitle: {
      color: isDark ? Colors.dark.text : '#333',
      fontSize: 16,
      fontWeight: '600',
    },
    meetingDescription: {
      color: isDark ? '#b0b0b0' : '#666',
      marginTop: 8,
      marginBottom: 12,
      lineHeight: 20,
    },
    organizerText: {
      color: isDark ? '#888' : '#666',
      fontSize: 13,
    },
    participantsText: {
      color: isDark ? '#888' : '#666',
      fontSize: 13,
    },
    dialogContent: {
      color: isDark ? Colors.dark.text : '#333',
    },
    dialogSubcontent: {
      color: isDark ? '#aaa' : '#666',
    },
    emptyContainer: {
      flex: 1,
      paddingTop: 40,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyText: {
      color: isDark ? Colors.dark.text : '#666',
      marginTop: 16,
      marginBottom: 24,
      textAlign: 'center',
      lineHeight: 22,
    },
    monthTitle: {
      color: isDark ? Colors.dark.text : '#333',
      fontSize: 18,
      fontWeight: '600',
      paddingHorizontal: 16,
      paddingVertical: 8,
    }
  };

  const renderMeetingItem = ({ item }: { item: Meeting }) => {
    const isPastMeeting = new Date(item.startTime) < new Date();
    const isToday = isSameDay(new Date(item.startTime), new Date());
    const startingSoon = !isPastMeeting && isToday && 
      differenceInMinutes(new Date(item.startTime), new Date()) <= 60;
    
    // Определение цветов для градиента карточки
    let gradientColors;
    let statusChipBg;
    let statusText;
    
    if (isPastMeeting) {
      gradientColors = isDark ? ['#2d2d33', '#2d2d30'] : ['#fdfdfd', '#f7f7f7'];
      statusChipBg = 'rgba(108, 117, 125, 0.2)';
      statusText = 'Завершен';
    } else if (startingSoon) {
      gradientColors = isDark ? ['#3d3320', '#3d2d20'] : ['#fff9f0', '#fffaf5'];
      statusChipBg = 'rgba(253, 126, 20, 0.2)';
      statusText = 'Скоро начнется';
    } else if (isToday) {
      gradientColors = isDark ? ['#213d33', '#1f2d33'] : ['#f0f9f5', '#f5fff9'];
      statusChipBg = 'rgba(40, 167, 69, 0.2)';
      statusText = 'Сегодня';
    } else {
      gradientColors = isDark ? ['#2d3d43', '#2d333d'] : ['#f7f9ff', '#f5faff'];
      statusChipBg = 'rgba(0, 123, 255, 0.2)';
      statusText = 'Запланирован';
    }

    return (
      <TouchableOpacity
        style={[
          styles.meetingItem, 
          dynamicStyles.meetingItem
        ]}
        onPress={() => handleMeetingPress(item)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={gradientColors}
          style={styles.meetingItemGradient}
        >
          <View style={styles.meetingHeader}>
            <Text style={[styles.meetingTitle, dynamicStyles.meetingTitle]} numberOfLines={1}>
              {item.title}
            </Text>
            <Chip 
              style={[styles.timeChip, { backgroundColor: 'rgba(33, 150, 243, 0.15)' }]}
              textStyle={styles.timeChipText}
              icon="clock-outline"
            >
              {formatMeetingTime(item.startTime, item.endTime)}
            </Chip>
          </View>
          
          {item.description && (
            <Text style={[styles.meetingDescription, dynamicStyles.meetingDescription]} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          
          <View style={styles.meetingTags}>
            <View style={[styles.statusChip, { backgroundColor: statusChipBg }]}>
              <Text style={styles.statusText}>
                {statusText}
              </Text>
            </View>
          </View>
          
          <View style={styles.meetingFooter}>
            <View style={styles.organizerContainer}>
              <MaterialCommunityIcons 
                name="account-tie" 
                size={16} 
                color={isDark ? '#888' : '#666'} 
                style={styles.footerIcon}
              />
              <Text style={[styles.organizerText, dynamicStyles.organizerText]}>
                {item.organizer === user?.id ? 'Вы (организатор)' : 'Организатор'}
              </Text>
            </View>
            
            <View style={styles.participantsContainer}>
              <MaterialCommunityIcons 
                name="account-group" 
                size={16} 
                color={isDark ? '#888' : '#666'} 
                style={styles.footerIcon}
              />
              <Text style={[styles.participantsText, dynamicStyles.participantsText]}>
                {item.participants.length} {getCorrectParticipantsForm(item.participants.length)}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <ThemedContainer style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={isDark ? Colors.dark.tint : Colors.light.tint} />
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
      <LinearGradient
        colors={isDark ? ['#1c1c1e', '#252527'] : ['#ffffff', '#f9f9f9']}
        style={[styles.calendarContainer, dynamicStyles.calendarContainer]}
      >
        <Text style={dynamicStyles.monthTitle}>
          {format(selectedDate, 'LLLL yyyy', { locale: ru })}
        </Text>
        <Calendar
          style={[styles.calendar, dynamicStyles.calendar]}
          current={format(selectedDate, 'yyyy-MM-dd')}
          onDayPress={onDayPress}
          monthFormat="MMMM yyyy"
          hideExtraDays={true}
          firstDay={1}
          markingType="multi-dot"
          markedDates={markedDates}
          hideArrows={true}
          hideDayNames={false}
          disableMonthChange={true}
          theme={{
            calendarBackground: isDark ? '#1c1c1e' : '#ffffff',
            textSectionTitleColor: isDark ? '#888' : '#b6c1cd',
            selectedDayBackgroundColor: isDark ? Colors.dark.tint : Colors.light.tint,
            selectedDayTextColor: '#ffffff',
            todayTextColor: isDark ? Colors.dark.tint : Colors.light.tint,
            dayTextColor: isDark ? Colors.dark.text : '#2d4150',
            textDisabledColor: isDark ? '#555' : '#d9e1e8',
            dotColor: isDark ? Colors.dark.tint : Colors.light.tint,
            selectedDotColor: '#ffffff',
            arrowColor: isDark ? Colors.dark.tint : Colors.light.tint,
            monthTextColor: isDark ? Colors.dark.text : '#2d4150',
            indicatorColor: isDark ? Colors.dark.tint : Colors.light.tint,
            textDayFontWeight: '400',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '400',
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 13,
          }}
        />
      </LinearGradient>
      
      <View style={[styles.meetingsContainer, dynamicStyles.meetingsContainer]}>
        <LinearGradient
          colors={isDark ? ['#2c2c2e', '#252527'] : ['#ffffff', '#f9f9f9']}
          style={[styles.meetingsHeader, dynamicStyles.meetingsHeader]}
        >
          <View style={styles.meetingsTitleContainer}>
            <Ionicons 
              name="calendar" 
              size={22} 
              color={isDark ? Colors.dark.tint : Colors.light.tint} 
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.meetingsTitle, dynamicStyles.meetingsTitle]}>
              Митинги {format(selectedDate, 'd MMMM', { locale: ru })}
            </Text>
          </View>
          <View style={styles.meetingsCountChip}>
            <Text style={[styles.meetingsCount, dynamicStyles.meetingsCount]}>
              {selectedDateMeetings.length} {getCorrectWordForm(selectedDateMeetings.length)}
            </Text>
          </View>
        </LinearGradient>
        
        <FlatList
          data={selectedDateMeetings}
          renderItem={renderMeetingItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.meetingsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[isDark ? Colors.dark.tint : Colors.light.tint]}
              tintColor={isDark ? Colors.dark.tint : Colors.light.tint}
            />
          }
          ListEmptyComponent={
            <View style={[styles.emptyContainer, dynamicStyles.emptyContainer]}>
              <LinearGradient
                colors={isDark ? ['#282830', '#23232b'] : ['#f7f9ff', '#f5faff']}
                style={styles.emptyIconContainer}
              >
                <MaterialCommunityIcons 
                  name="calendar-blank" 
                  size={44} 
                  color={isDark ? Colors.dark.tint : Colors.light.tint} 
                />
              </LinearGradient>
              <Text style={[styles.emptyText, dynamicStyles.emptyText]}>
                Нет запланированных митингов {'\n'}на выбранную дату
              </Text>
              <Button 
                mode="contained" 
                onPress={goToCreateMeeting}
                style={styles.createButton}
                buttonColor={isDark ? Colors.dark.tint : Colors.light.tint}
                icon="plus"
              >
                Создать митинг
              </Button>
            </View>
          }
        />
      </View>
      
      <FAB
        style={[
          styles.fab,
          { backgroundColor: isDark ? Colors.dark.tint : Colors.light.tint }
        ]}
        icon="plus"
        color="#fff"
        onPress={goToCreateMeeting}
      />
      
      <Portal>
        <Dialog 
          visible={detailDialogVisible} 
          onDismiss={() => setDetailDialogVisible(false)}
          style={[
            styles.dialog,
            { backgroundColor: isDark ? '#2c2c2e' : '#ffffff' }
          ]}
        >
          <LinearGradient
            colors={isDark ? ['#2c2c2e', '#252527'] : ['#ffffff', '#f9f9f9']}
            style={styles.dialogGradient}
          >
            {selectedMeeting && (
              <>
                <Dialog.Title 
                  style={{ 
                    color: isDark ? Colors.dark.text : Colors.light.text,
                    fontWeight: '600'
                  }}
                >
                  {selectedMeeting.title}
                </Dialog.Title>
                <Dialog.Content>
                  {selectedMeeting.description && (
                    <View style={styles.dialogSection}>
                      <Text 
                        style={[
                          styles.dialogSectionTitle, 
                          { color: isDark ? '#888' : '#666' }
                        ]}
                      >
                        Описание
                      </Text>
                      <Text style={[styles.dialogContent, dynamicStyles.dialogContent]}>
                        {selectedMeeting.description}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.dialogSection}>
                    <Text 
                      style={[
                        styles.dialogSectionTitle, 
                        { color: isDark ? '#888' : '#666' }
                      ]}
                    >
                      Время
                    </Text>
                    <View style={styles.dialogTimeCard}>
                      <View style={styles.dialogTimeIconContainer}>
                        <MaterialCommunityIcons 
                          name="calendar-clock" 
                          size={24} 
                          color="#fff" 
                        />
                      </View>
                      <View style={styles.dialogTimeContent}>
                        <Text style={[styles.dialogTimeLabel, { color: isDark ? '#aaa' : '#888' }]}>Начало</Text>
                        <Text style={[styles.dialogTimeText, { color: isDark ? Colors.dark.text : '#333' }]}>
                          {selectedMeeting ? formatDetailDate(selectedMeeting.startTime) : ''}
                        </Text>
                        
                        <Text style={[styles.dialogTimeLabel, { color: isDark ? '#aaa' : '#888', marginTop: 8 }]}>Окончание</Text>
                        <Text style={[styles.dialogTimeText, { color: isDark ? Colors.dark.text : '#333' }]}>
                          {selectedMeeting ? formatDetailDate(selectedMeeting.endTime) : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.dialogGrid}>
                    <View style={styles.dialogGridItem}>
                      <View style={styles.dialogGridIconContainer}>
                        <MaterialCommunityIcons 
                          name="account-tie" 
                          size={22} 
                          color="#fff" 
                        />
                      </View>
                      <View>
                        <Text style={[styles.dialogGridLabel, { color: isDark ? '#aaa' : '#888' }]}>
                          Организатор
                        </Text>
                        <Text style={[styles.dialogGridText, { color: isDark ? Colors.dark.text : '#333' }]}>
                          {selectedMeeting?.organizer === user?.id ? 'Вы' : 'Организатор'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.dialogGridItem}>
                      <View style={[styles.dialogGridIconContainer, { backgroundColor: '#7e57c2' }]}>
                        <MaterialCommunityIcons 
                          name="account-group" 
                          size={22} 
                          color="#fff" 
                        />
                      </View>
                      <View>
                        <Text style={[styles.dialogGridLabel, { color: isDark ? '#aaa' : '#888' }]}>
                          Участники
                        </Text>
                        <Text style={[styles.dialogGridText, { color: isDark ? Colors.dark.text : '#333' }]}>
                          {selectedMeeting?.participants.length} {selectedMeeting ? 
                            getCorrectParticipantsForm(selectedMeeting.participants.length) : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  {isToday(selectedMeeting?.startTime) && (
                    <View style={styles.todayMeetingActions}>
                      <Button 
                        mode="contained" 
                        icon="video"
                        buttonColor={isDark ? Colors.dark.tint : Colors.light.tint}
                        style={styles.joinMeetingButton}
                      >
                        Присоединиться
                      </Button>
                    </View>
                  )}
                </Dialog.Content>
                
                <Dialog.Actions>
                  <Button 
                    onPress={() => setDetailDialogVisible(false)}
                    textColor={isDark ? Colors.dark.tint : Colors.light.tint}
                  >
                    Закрыть
                  </Button>
                </Dialog.Actions>
              </>
            )}
          </LinearGradient>
        </Dialog>
      </Portal>
    </ThemedContainer>
  );
}

function getCorrectWordForm(count: number): string {
  // Склонение слова "митинг" в зависимости от числа
  if (count === 1) {
    return 'митинг';
  } else if (count >= 2 && count <= 4) {
    return 'митинга';
  } else {
    return 'митингов';
  }
}

function getCorrectParticipantsForm(count: number): string {
  // Склонение слова "участник" в зависимости от числа
  if (count === 1) {
    return 'участник';
  } else if (count >= 2 && count <= 4) {
    return 'участника';
  } else {
    return 'участников';
  }
}

const styles = StyleSheet.create({
  calendarContainer: {
    paddingBottom: 8,
  },
  calendar: {
    paddingBottom: 10,
  },
  meetingsContainer: {
    flex: 1,
  },
  meetingsHeader: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meetingsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meetingsTitle: {
    fontSize: 18,
  },
  meetingsCountChip: {
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  meetingsCount: {
    fontSize: 14,
    color: '#2196F3',
  },
  meetingsList: {
    paddingVertical: 8,
    paddingBottom: 80,
  },
  meetingItem: {
    overflow: 'hidden',
  },
  meetingItemGradient: {
    padding: 16,
  },
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  meetingTitle: {
    flex: 1,
    marginRight: 8,
  },
  timeChip: {
    height: 30,
  },
  timeChipText: {
    fontSize: 12,
    color: '#2196F3',
  },
  meetingDescription: {
    marginBottom: 12,
  },
  meetingTags: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2196F3',
  },
  meetingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  organizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerIcon: {
    marginRight: 6,
  },
  pastMeetingItem: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  dialog: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 0,
  },
  dialogGradient: {
    borderRadius: 20,
  },
  dialogSection: {
    marginBottom: 20,
  },
  dialogSectionTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  dialogTimeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dialogTimeCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(33, 150, 243, 0.08)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dialogTimeIconContainer: {
    backgroundColor: '#2196F3',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogTimeContent: {
    padding: 12,
    flex: 1,
  },
  dialogTimeLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  dialogTimeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dialogGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dialogGridItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dialogGridIconContainer: {
    backgroundColor: '#4caf50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dialogGridLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  dialogGridText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dialogContent: {
    lineHeight: 20,
  },
  emptyContainer: {
    paddingTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    paddingHorizontal: 16,
  },
  todayMeetingActions: {
    marginTop: 8,
    marginBottom: 8,
  },
  joinMeetingButton: {
    borderRadius: 8,
  },
}); 