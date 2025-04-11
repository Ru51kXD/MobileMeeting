import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, ChatRoom } from '../types';
import { format } from 'date-fns';
import { useAuth } from './AuthContext';

// Демо-данные для сотрудников
const DEMO_EMPLOYEES = [
  { id: '1', name: 'Иванов Иван', position: 'Руководитель проекта', avatarUrl: 'https://ui-avatars.com/api/?name=Ivan+Ivanov&background=0D8ABC&color=fff' },
  { id: '2', name: 'Петрова Елена', position: 'Ведущий дизайнер', avatarUrl: 'https://ui-avatars.com/api/?name=Elena+Petrova&background=2E7D32&color=fff' },
  { id: '3', name: 'Сидоров Алексей', position: 'Разработчик', avatarUrl: 'https://ui-avatars.com/api/?name=Alexey+Sidorov&background=C62828&color=fff' },
  { id: '4', name: 'Козлова Мария', position: 'Тестировщик', avatarUrl: 'https://ui-avatars.com/api/?name=Maria+Kozlova&background=6A1B9A&color=fff' },
  { id: '5', name: 'Николаев Дмитрий', position: 'Бизнес-аналитик', avatarUrl: 'https://ui-avatars.com/api/?name=Dmitry+Nikolaev&background=00695C&color=fff' },
];

// Демо-данные для чатов
const DEMO_CHAT_ROOMS: ChatRoom[] = [
  {
    id: '1',
    name: 'Общий чат',
    isGroupChat: true,
    participants: ['1', '2', '3', '4', '5'],
    createdAt: new Date(Date.now() - 86400000 * 30),
    updatedAt: new Date(Date.now() - 3600000),
  },
  {
    id: '2',
    name: 'Команда разработки',
    isGroupChat: true,
    participants: ['1', '3', '5'],
    createdAt: new Date(Date.now() - 86400000 * 20),
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: '3',
    name: 'Петрова Елена',
    isGroupChat: false,
    participants: ['1', '2'],
    createdAt: new Date(Date.now() - 86400000 * 10),
    updatedAt: new Date(Date.now() - 43200000),
  },
];

// Демо-данные для сообщений
const DEMO_MESSAGES: Message[] = [
  {
    id: '1',
    senderId: '2',
    receiverId: null,
    text: 'Всем привет! Напоминаю о встрече завтра в 10:00.',
    timestamp: new Date(Date.now() - 86400000),
    isRead: true,
  },
  {
    id: '2',
    senderId: '3',
    receiverId: null,
    text: 'Спасибо за напоминание. Буду вовремя.',
    timestamp: new Date(Date.now() - 86400000 + 3600000),
    isRead: true,
  },
  {
    id: '3',
    senderId: '1',
    receiverId: null,
    text: 'Не забудьте подготовить отчеты к встрече.',
    timestamp: new Date(Date.now() - 43200000),
    isRead: true,
  },
  {
    id: '4',
    senderId: '2',
    receiverId: '1',
    text: 'Иван, можешь помочь с задачей по проекту?',
    timestamp: new Date(Date.now() - 86400000 * 2),
    isRead: true,
  },
  {
    id: '5',
    senderId: '1',
    receiverId: '2',
    text: 'Конечно, давай обсудим завтра на встрече.',
    timestamp: new Date(Date.now() - 86400000 * 2 + 3600000),
    isRead: true,
  },
  {
    id: '6',
    senderId: '3',
    receiverId: null,
    text: 'У меня есть вопрос по последнему заданию.',
    timestamp: new Date(Date.now() - 7200000),
    isRead: false,
  },
];

interface ChatContextType {
  chatRooms: ChatRoom[];
  messages: Message[];
  addMessage: (message: Omit<Message, 'id'>) => Promise<void>;
  getMessagesForChat: (chatRoomId: string) => Message[];
  getUnreadCount: () => number;
  markMessageAsRead: (messageId: string) => Promise<void>;
  refreshChatData: () => Promise<void>;
  createGroupChat: (name: string, participants: string[]) => Promise<string>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    loadChatData();
  }, [user]);

  // Функция для создания персональных чатов с каждым сотрудником
  const createPersonalChats = (existingRooms: ChatRoom[]): ChatRoom[] => {
    if (!user) return existingRooms;
    
    const updatedRooms = [...existingRooms];
    
    // Создаем персональные чаты со всеми сотрудниками
    DEMO_EMPLOYEES.forEach(employee => {
      // Не создаем чат с самим собой
      if (employee.id === user.id) return;
      
      // Проверяем, существует ли уже чат с этим сотрудником
      const existingChat = updatedRooms.find(room => 
        !room.isGroupChat && 
        room.participants.includes(user.id) && 
        room.participants.includes(employee.id) && 
        room.participants.length === 2
      );
      
      // Если чата нет, создаем новый
      if (!existingChat) {
        const newChat: ChatRoom = {
          id: `personal_${Date.now()}_${employee.id}`,
          name: employee.name,
          isGroupChat: false,
          participants: [user.id, employee.id],
          createdAt: new Date(),
          updatedAt: new Date(),
          // Добавляем приветственное сообщение в качестве lastMessage
          lastMessage: {
            id: `welcome_${Date.now()}_${employee.id}`,
            senderId: employee.id,
            receiverId: user.id,
            text: 'Привет! Теперь мы можем общаться здесь.',
            timestamp: new Date(),
            isRead: false
          }
        };
        
        updatedRooms.push(newChat);
        
        // Добавляем приветственное сообщение в список сообщений
        const welcomeMessage: Message = {
          ...newChat.lastMessage,
          chatRoomId: newChat.id
        };
        
        setMessages(prev => [...prev, welcomeMessage]);
      }
    });
    
    return updatedRooms;
  };

  const loadChatData = async () => {
    try {
      if (!user) return;
      
      // Загружаем комнаты чатов
      const storedChatRooms = await AsyncStorage.getItem('@chatRooms');
      let initialChatRooms: ChatRoom[] = [];
      
      if (storedChatRooms) {
        // Преобразуем строки дат обратно в объекты Date
        initialChatRooms = JSON.parse(storedChatRooms, (key, value) => {
          if (key === 'createdAt' || key === 'updatedAt' || (key === 'timestamp' && value)) {
            return new Date(value);
          }
          return value;
        });
      } else {
        // Если чатов еще нет, используем демо-данные
        initialChatRooms = DEMO_CHAT_ROOMS;
      }
      
      // Создаем персональные чаты для всех сотрудников, если их еще нет
      const updatedChatRooms = createPersonalChats(initialChatRooms);
      
      // Сохраняем обновленный список чатов
      setChatRooms(updatedChatRooms);
      await saveChatRooms(updatedChatRooms);

      // Загружаем сообщения
      const storedMessages = await AsyncStorage.getItem('@messages');
      if (storedMessages) {
        // Преобразуем строки дат обратно в объекты Date
        const parsedMessages = JSON.parse(storedMessages, (key, value) => {
          if (key === 'timestamp') {
            return new Date(value);
          }
          return value;
        });
        setMessages(parsedMessages);
      } else {
        // Если сообщений еще нет, используем демо-данные
        setMessages(DEMO_MESSAGES);
        await AsyncStorage.setItem('@messages', JSON.stringify(DEMO_MESSAGES));
      }
    } catch (error) {
      console.error('Ошибка загрузки данных чата:', error);
      // В случае ошибки используем демо-данные
      setChatRooms(DEMO_CHAT_ROOMS);
      setMessages(DEMO_MESSAGES);
    }
  };

  const saveChatRooms = async (updatedChatRooms: ChatRoom[]) => {
    try {
      await AsyncStorage.setItem('@chatRooms', JSON.stringify(updatedChatRooms));
    } catch (error) {
      console.error('Ошибка сохранения комнат чата:', error);
    }
  };

  const saveMessages = async (updatedMessages: Message[]) => {
    try {
      await AsyncStorage.setItem('@messages', JSON.stringify(updatedMessages));
    } catch (error) {
      console.error('Ошибка сохранения сообщений:', error);
    }
  };

  const addMessage = async (message: Omit<Message, 'id'>) => {
    try {
      // Проверяем, нет ли уже такого же сообщения с тем же текстом и временем
      // Более строгая проверка - последние 3 сообщения, отправленные в течение 10 секунд
      const now = new Date().getTime();
      const recentMessages = messages
        .filter(msg => 
          (now - msg.timestamp.getTime()) < 10000 && // в пределах 10 секунд от текущего времени
          msg.senderId === message.senderId && 
          msg.receiverId === message.receiverId
        )
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // сортируем по времени, сначала новые
        .slice(0, 3); // берем последние 3 сообщения
      
      const duplicateFound = recentMessages.some(msg => msg.text === message.text);
      
      // Если дубликат найден, не добавляем сообщение
      if (duplicateFound) {
        console.log('Дубликат сообщения обнаружен, пропускаем:', message.text);
        return;
      }
      
      const newMessage = {
        ...message,
        id: Date.now().toString(),
      } as Message;
      
      // Добавляем новое сообщение к существующим
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      
      // Сохраняем обновленный список сообщений в AsyncStorage
      await saveMessages(updatedMessages);
      
      // Получаем ID комнаты чата
      let chatRoomId = message.chatRoomId || '';
      
      // Если chatRoomId не указан, определяем его по старой логике
      if (!chatRoomId) {
        if (message.receiverId && !message.receiverId.startsWith('group_')) {
          // Это личное сообщение - ищем или создаем комнату
          const participants = [message.senderId, message.receiverId];
          const existingRoom = chatRooms.find(room => 
            !room.isGroupChat && 
            participants.every(p => room.participants.includes(p)) &&
            room.participants.length === participants.length
          );
          
          if (existingRoom) {
            chatRoomId = existingRoom.id;
          } else {
            // Создаем новую комнату для личного чата
            const receiverName = "Пользователь"; // Здесь должно быть имя получателя из данных пользователей
            const newRoom: ChatRoom = {
              id: `personal_${Date.now()}`,
              name: receiverName,
              isGroupChat: false,
              participants,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            const updatedRooms = [...chatRooms, newRoom];
            setChatRooms(updatedRooms);
            await saveChatRooms(updatedRooms);
            chatRoomId = newRoom.id;
          }
        } else if (message.receiverId && message.receiverId.startsWith('group_')) {
          // Это сообщение в групповой чат, ID чата хранится в receiverId
          chatRoomId = message.receiverId;
        } else {
          // Это сообщение в общий чат
          chatRoomId = '1'; // ID общего чата
        }
      }
      
      // Обновляем lastMessage и updatedAt для соответствующей комнаты
      const updatedChatRooms = chatRooms.map(room => 
        room.id === chatRoomId ? 
        {
          ...room, 
          lastMessage: newMessage,
          updatedAt: new Date()
        } : 
        room
      );
      
      setChatRooms(updatedChatRooms);
      await saveChatRooms(updatedChatRooms);
    } catch (error) {
      console.error('Ошибка добавления сообщения:', error);
    }
  };

  const createGroupChat = async (name: string, participants: string[]): Promise<string> => {
    try {
      // Создаем новую групповую комнату
      const newRoom: ChatRoom = {
        id: `group_${Date.now()}`,
        name: name,
        isGroupChat: true,
        participants: [...participants, user?.id || ''],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Используем функцию обновления состояния
      const updatedRooms = [...chatRooms, newRoom];
      setChatRooms(updatedRooms);
      
      // Сохраняем в AsyncStorage
      await AsyncStorage.setItem('@chatRooms', JSON.stringify(updatedRooms));
      
      // Делаем паузу для обновления
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Убедимся, что чат создан перед возвращением ID
      await loadChatData();
      
      return newRoom.id;
    } catch (error) {
      console.error('Ошибка создания группового чата:', error);
      throw error;
    }
  };

  const getMessagesForChat = (chatRoomId: string) => {
    // Находим комнату чата
    const chatRoom = chatRooms.find(room => room.id === chatRoomId);
    if (!chatRoom) return [];
    
    // Создаем Set для отслеживания уже добавленных ID сообщений
    const addedMessageIds = new Set<string>();
    let result: Message[] = [];
    
    // Сначала добавляем сообщения с указанным chatRoomId (новый формат)
    const messagesWithChatRoomId = messages.filter(message => message.chatRoomId === chatRoomId);
    messagesWithChatRoomId.forEach(msg => {
      result.push(msg);
      addedMessageIds.add(msg.id);
    });
    
    // Если это групповой чат, добавляем соответствующие сообщения
    if (chatRoom.isGroupChat) {
      // Для групповых чатов проверяем сообщения без chatRoomId
      if (chatRoom.id === '1' || chatRoom.id === '2') {
        // Для демо-чатов "Общий чат" и "Команда разработки" показываем демо-сообщения
        messages.forEach(message => {
          if (!addedMessageIds.has(message.id) && 
              message.chatRoomId === undefined && 
              message.receiverId === null && 
              chatRoom.participants.includes(message.senderId)) {
            result.push(message);
            addedMessageIds.add(message.id);
          }
        });
      } else {
        // Для новых групповых чатов проверяем, что сообщение было отправлено
        // после создания этого чата (грубая проверка для демо)
        const chatCreationTime = chatRoom.createdAt.getTime();
        messages.forEach(message => {
          if (!addedMessageIds.has(message.id) && 
              message.chatRoomId === undefined && 
              message.receiverId === null && 
              chatRoom.participants.includes(message.senderId) &&
              message.timestamp.getTime() > chatCreationTime) {
            result.push(message);
            addedMessageIds.add(message.id);
          }
        });
      }
    } else {
      // Для личных чатов - сообщения только между этими двумя участниками
      const participants = chatRoom.participants;
      messages.forEach(message => {
        if (!addedMessageIds.has(message.id) && 
            message.chatRoomId === undefined && 
            participants.includes(message.senderId) && 
            participants.includes(message.receiverId || '') && 
            participants.length === 2) {
          result.push(message);
          addedMessageIds.add(message.id);
        }
      });
    }
    
    // Сортируем сообщения по времени и возвращаем результат
    return result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  };

  const getUnreadCount = () => {
    if (!user) return 0;
    
    // Считаем непрочитанные сообщения для текущего пользователя
    return messages.filter(message => 
      !message.isRead && 
      (message.receiverId === user.id || 
       (message.receiverId === null && message.senderId !== user.id))
    ).length;
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      const updatedMessages = messages.map(message => 
        message.id === messageId ? 
        { ...message, isRead: true } : 
        message
      );
      
      setMessages(updatedMessages);
      await saveMessages(updatedMessages);
    } catch (error) {
      console.error('Ошибка при отметке сообщения как прочитанного:', error);
    }
  };

  const refreshChatData = async () => {
    await loadChatData();
  };

  return (
    <ChatContext.Provider 
      value={{ 
        chatRooms, 
        messages, 
        addMessage, 
        getMessagesForChat,
        getUnreadCount,
        markMessageAsRead,
        refreshChatData,
        createGroupChat
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};