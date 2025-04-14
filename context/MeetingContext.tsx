import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Meeting } from '../types';
import { format } from 'date-fns';

// Временные примеры митингов
const INITIAL_MEETINGS: Meeting[] = [
  {
    id: '1',
    title: 'Обсуждение нового проекта',
    description: 'Встреча команды для обсуждения стратегии разработки нового проекта',
    startTime: new Date(Date.now() + 86400000), // завтра
    endTime: new Date(Date.now() + 86400000 + 7200000), // завтра + 2 часа
    organizer: '2',
    participants: ['1', '2', '3'],
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: '2',
    title: 'Ежедневный статус-митинг',
    description: 'Короткая встреча для обсуждения текущего прогресса задач',
    startTime: new Date(Date.now() + 3600000), // через час
    endTime: new Date(Date.now() + 3600000 + 1800000), // через час + 30 минут
    organizer: '2',
    participants: ['2', '3'],
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 43200000),
  },
  {
    id: '3',
    title: 'Ретроспектива спринта',
    description: 'Обсуждение результатов предыдущего спринта и планирование следующего',
    startTime: new Date(Date.now() + 86400000 * 3), // через 3 дня
    endTime: new Date(Date.now() + 86400000 * 3 + 5400000), // через 3 дня + 1.5 часа
    organizer: '1',
    participants: ['1', '2', '3'],
    createdAt: new Date(Date.now() - 86400000 * 7),
    updatedAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: '4',
    title: 'Планирование бюджета',
    description: 'Планирование бюджета на следующий квартал',
    startTime: new Date(Date.now() + 86400000 * 7), // через неделю
    endTime: new Date(Date.now() + 86400000 * 7 + 10800000), // через неделю + 3 часа
    organizer: '1',
    participants: ['1', '2'],
    createdAt: new Date(Date.now() - 86400000 * 14),
    updatedAt: new Date(Date.now() - 86400000 * 7),
  },
];

interface MeetingContextType {
  meetings: Meeting[];
  addMeeting: (meeting: Omit<Meeting, 'id'>) => Promise<void>;
  updateMeeting: (meeting: Meeting) => Promise<void>;
  deleteMeeting: (meetingId: string) => Promise<void>;
  refreshMeetings: () => Promise<void>;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export const MeetingProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  
  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const storedMeetings = await AsyncStorage.getItem('@meetings');
      if (storedMeetings) {
        // Преобразуем строки дат обратно в объекты Date
        const parsedMeetings = JSON.parse(storedMeetings, (key, value) => {
          if (key === 'startTime' || key === 'endTime' || key === 'createdAt' || key === 'updatedAt') {
            return new Date(value);
          }
          return value;
        });
        setMeetings(parsedMeetings);
      } else {
        // Если встреч еще нет, используем начальные демо-встречи
        setMeetings(INITIAL_MEETINGS);
        await AsyncStorage.setItem('@meetings', JSON.stringify(INITIAL_MEETINGS));
      }
    } catch (error) {
      console.error('Ошибка загрузки встреч:', error);
      // В случае ошибки используем начальные демо-встречи
      setMeetings(INITIAL_MEETINGS);
    }
  };

  const saveMeetings = async (updatedMeetings: Meeting[]) => {
    try {
      await AsyncStorage.setItem('@meetings', JSON.stringify(updatedMeetings));
    } catch (error) {
      console.error('Ошибка сохранения встреч:', error);
    }
  };

  const addMeeting = async (meeting: Omit<Meeting, 'id'>) => {
    try {
      const newMeetingId = Date.now().toString(); // Генерируем уникальный ID
      const newMeeting = {
        ...meeting,
        id: newMeetingId,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Meeting;
      
      const updatedMeetings = [...meetings, newMeeting];
      setMeetings(updatedMeetings);
      await saveMeetings(updatedMeetings);
      
      // Создание чата для встречи перенесено в компонент создания встречи
      
    } catch (error) {
      console.error('Ошибка добавления встречи:', error);
    }
  };

  const updateMeeting = async (updatedMeeting: Meeting) => {
    try {
      const updatedMeetings = meetings.map(meeting => 
        meeting.id === updatedMeeting.id ? 
        {...updatedMeeting, updatedAt: new Date()} : 
        meeting
      );
      setMeetings(updatedMeetings);
      await saveMeetings(updatedMeetings);
    } catch (error) {
      console.error('Ошибка обновления встречи:', error);
    }
  };

  const deleteMeeting = async (meetingId: string) => {
    try {
      const updatedMeetings = meetings.filter(meeting => meeting.id !== meetingId);
      setMeetings(updatedMeetings);
      await saveMeetings(updatedMeetings);
    } catch (error) {
      console.error('Ошибка удаления встречи:', error);
    }
  };

  const refreshMeetings = async () => {
    await loadMeetings();
  };

  return (
    <MeetingContext.Provider 
      value={{ 
        meetings, 
        addMeeting, 
        updateMeeting, 
        deleteMeeting,
        refreshMeetings
      }}
    >
      {children}
    </MeetingContext.Provider>
  );
};

export const useMeeting = () => {
  const context = useContext(MeetingContext);
  if (context === undefined) {
    throw new Error('useMeeting must be used within a MeetingProvider');
  }
  return context;
}; 