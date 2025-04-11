import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, ChatRoom, MessageContentType, MessageContent } from '../types';
import { format } from 'date-fns';
import { useAuth } from './AuthContext';

// Демо-данные для сотрудников
export const DEMO_EMPLOYEES = [
  { id: '1', name: 'Иванов Иван', position: 'Руководитель проекта', avatarUrl: 'https://ui-avatars.com/api/?name=Ivan+Ivanov&background=0D8ABC&color=fff' },
  { id: '2', name: 'Петрова Елена', position: 'Ведущий дизайнер', avatarUrl: 'https://ui-avatars.com/api/?name=Elena+Petrova&background=2E7D32&color=fff' },
  { id: '3', name: 'Сидоров Алексей', position: 'Разработчик', avatarUrl: 'https://ui-avatars.com/api/?name=Alexey+Sidorov&background=C62828&color=fff' },
  { id: '4', name: 'Козлова Мария', position: 'Тестировщик', avatarUrl: 'https://ui-avatars.com/api/?name=Maria+Kozlova&background=6A1B9A&color=fff' },
  { id: '5', name: 'Николаев Дмитрий', position: 'Бизнес-аналитик', avatarUrl: 'https://ui-avatars.com/api/?name=Dmitry+Nikolaev&background=00695C&color=fff' },
];

// Функция для получения информации о сотруднике
export const getEmployeeInfo = (userId: string) => {
  return DEMO_EMPLOYEES.find(emp => emp.id === userId) || 
    { id: userId, name: 'Неизвестный пользователь', position: 'Нет данных', avatarUrl: 'https://ui-avatars.com/api/?name=Unknown&background=9E9E9E&color=fff' };
};

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

// Создание MessageContent из текста (для обратной совместимости)
const createTextContent = (text: string): MessageContent => {
  return {
    type: MessageContentType.TEXT,
    text
  };
};

// Демо-данные для сообщений
const DEMO_MESSAGES: Message[] = [
  {
    id: '1',
    senderId: '2',
    receiverId: null,
    content: createTextContent('Всем привет! Напоминаю о встрече завтра в 10:00.'),
    timestamp: new Date(Date.now() - 86400000),
    isRead: true,
  },
  {
    id: '2',
    senderId: '3',
    receiverId: null,
    content: createTextContent('Спасибо за напоминание. Буду вовремя.'),
    timestamp: new Date(Date.now() - 86400000 + 3600000),
    isRead: true,
  },
  {
    id: '3',
    senderId: '1',
    receiverId: null,
    content: createTextContent('Не забудьте подготовить отчеты к встрече.'),
    timestamp: new Date(Date.now() - 43200000),
    isRead: true,
  },
  {
    id: '4',
    senderId: '2',
    receiverId: '1',
    content: createTextContent('Иван, можешь помочь с задачей по проекту?'),
    timestamp: new Date(Date.now() - 86400000 * 2),
    isRead: true,
  },
  {
    id: '5',
    senderId: '1',
    receiverId: '2',
    content: createTextContent('Конечно, давай обсудим завтра на встрече.'),
    timestamp: new Date(Date.now() - 86400000 * 2 + 3600000),
    isRead: true,
  },
  {
    id: '6',
    senderId: '3',
    receiverId: null,
    content: createTextContent('У меня есть вопрос по последнему заданию.'),
    timestamp: new Date(Date.now() - 7200000),
    isRead: false,
  },
  // Примеры разных типов сообщений
  {
    id: '7',
    senderId: '4',
    receiverId: null,
    content: {
      type: MessageContentType.EMOJI,
      emoji: '👍'
    },
    timestamp: new Date(Date.now() - 3600000),
    isRead: false,
  },
  {
    id: '8',
    senderId: '5',
    receiverId: null,
    content: {
      type: MessageContentType.FILE,
      fileName: 'отчет_проект.pdf',
      fileUrl: 'https://example.com/files/report.pdf',
      fileMimeType: 'application/pdf'
    },
    timestamp: new Date(Date.now() - 1800000),
    isRead: false,
  },
  {
    id: '9',
    senderId: '2',
    receiverId: null,
    content: {
      type: MessageContentType.IMAGE,
      imageUrl: 'https://example.com/images/prototype.jpg',
      text: 'Новый прототип интерфейса'
    },
    timestamp: new Date(Date.now() - 1200000),
    isRead: false,
  }
];

interface ChatContextType {
  chatRooms: ChatRoom[];
  messages: Message[];
  addMessage: (message: Omit<Message, 'id'>) => Promise<void>;
  addVoiceMessage: (senderId: string, receiverId: string | null, chatRoomId: string, voiceUrl: string, duration: number) => Promise<void>;
  addFileMessage: (senderId: string, receiverId: string | null, chatRoomId: string, fileUrl: string, fileName: string, fileMimeType: string) => Promise<void>;
  addImageMessage: (senderId: string, receiverId: string | null, chatRoomId: string, imageUrl: string, caption?: string) => Promise<void>;
  addEmojiMessage: (senderId: string, receiverId: string | null, chatRoomId: string, emoji: string) => Promise<void>;
  getMessagesForChat: (chatRoomId: string) => Message[];
  getUnreadCount: () => number;
  markMessageAsRead: (messageId: string) => Promise<void>;
  refreshChatData: () => Promise<void>;
  resetAndRefreshChatData: () => Promise<void>;
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
    const updatedMessages = [...messages];
    let hasAddedNewChats = false;
    
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
        const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const welcomeMessageId = `welcome_${uniqueId}`;
        
        // Создаем приветственное сообщение
        const welcomeMessage: Message = {
          id: welcomeMessageId,
          senderId: employee.id,
          receiverId: user.id,
          chatRoomId: `personal_${uniqueId}`,
          content: createTextContent(`Привет! Я ${employee.name}, ${employee.position}. Чем могу помочь?`),
          timestamp: new Date(),
          isRead: false
        };
        
        // Создаем новый чат с полной информацией о сотруднике
        const newChat: ChatRoom = {
          id: `personal_${uniqueId}`,
          name: `${employee.name} (${employee.position})`,
          isGroupChat: false,
          participants: [user.id, employee.id],
          createdAt: new Date(),
          updatedAt: new Date(),
          lastMessage: welcomeMessage
        };
        
        updatedRooms.push(newChat);
        updatedMessages.push(welcomeMessage);
        hasAddedNewChats = true;
      }
    });
    
    // Обновляем сообщения только если были добавлены новые чаты
    if (hasAddedNewChats) {
      setMessages(updatedMessages);
      saveMessages(updatedMessages);
    }
    
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
        
        // Преобразуем старый формат сообщений (с полем text) в новый (с полем content)
        const migratedMessages = parsedMessages.map((msg: any) => {
          if (msg.text && !msg.content) {
            return {
              ...msg,
              content: createTextContent(msg.text)
            };
          }
          return msg;
        });
        
        setMessages(migratedMessages);
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
      const now = new Date().getTime();
      const recentMessages = messages
        .filter(msg => 
          (now - msg.timestamp.getTime()) < 10000 && // в пределах 10 секунд от текущего времени
          msg.senderId === message.senderId && 
          msg.receiverId === message.receiverId
        )
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // сортируем по времени, сначала новые
        .slice(0, 3); // берем последние 3 сообщения
      
      // Проверяем на дубликаты только текстовые сообщения
      if (message.content.type === MessageContentType.TEXT && message.content.text) {
        const duplicateFound = recentMessages.some(msg => 
          msg.content.type === MessageContentType.TEXT && 
          msg.content.text === message.content.text
        );
        
        // Если дубликат найден, не добавляем сообщение
        if (duplicateFound) {
          console.log('Дубликат сообщения обнаружен, пропускаем:', message.content.text);
          return;
        }
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
            const receiverInfo = getEmployeeInfo(message.receiverId);
            const newRoom: ChatRoom = {
              id: `personal_${Date.now()}`,
              name: receiverInfo.name,
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

  // Вспомогательные функции для отправки разных типов сообщений
  const addVoiceMessage = async (
    senderId: string, 
    receiverId: string | null, 
    chatRoomId: string, 
    voiceUrl: string, 
    duration: number
  ) => {
    const message: Omit<Message, 'id'> = {
      senderId,
      receiverId,
      chatRoomId,
      content: {
        type: MessageContentType.VOICE,
        voiceUrl,
        voiceDuration: duration
      },
      timestamp: new Date(),
      isRead: false
    };
    
    await addMessage(message);
  };
  
  const addFileMessage = async (
    senderId: string, 
    receiverId: string | null, 
    chatRoomId: string, 
    fileUrl: string, 
    fileName: string, 
    fileMimeType: string
  ) => {
    const message: Omit<Message, 'id'> = {
      senderId,
      receiverId,
      chatRoomId,
      content: {
        type: MessageContentType.FILE,
        fileUrl,
        fileName,
        fileMimeType
      },
      timestamp: new Date(),
      isRead: false
    };
    
    await addMessage(message);
  };
  
  const addImageMessage = async (
    senderId: string, 
    receiverId: string | null, 
    chatRoomId: string, 
    imageUrl: string, 
    caption?: string
  ) => {
    const message: Omit<Message, 'id'> = {
      senderId,
      receiverId,
      chatRoomId,
      content: {
        type: MessageContentType.IMAGE,
        imageUrl,
        text: caption
      },
      timestamp: new Date(),
      isRead: false
    };
    
    await addMessage(message);
  };
  
  const addEmojiMessage = async (
    senderId: string, 
    receiverId: string | null, 
    chatRoomId: string, 
    emoji: string
  ) => {
    const message: Omit<Message, 'id'> = {
      senderId,
      receiverId,
      chatRoomId,
      content: {
        type: MessageContentType.EMOJI,
        emoji
      },
      timestamp: new Date(),
      isRead: false
    };
    
    await addMessage(message);
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

  // Функция для полного сброса и перезагрузки данных (для отладки)
  const resetAndRefreshChatData = async () => {
    try {
      // Удаляем существующие данные
      await AsyncStorage.removeItem('@chatRooms');
      await AsyncStorage.removeItem('@messages');
      
      // Перезагружаем с демо-данными
      setChatRooms(DEMO_CHAT_ROOMS);
      setMessages(DEMO_MESSAGES);
      
      // Полная перезагрузка с генерацией новых чатов
      await loadChatData();
    } catch (error) {
      console.error('Ошибка сброса данных чата:', error);
    }
  };

  return (
    <ChatContext.Provider 
      value={{ 
        chatRooms, 
        messages, 
        addMessage, 
        addVoiceMessage,
        addFileMessage,
        addImageMessage,
        addEmojiMessage,
        getMessagesForChat,
        getUnreadCount,
        markMessageAsRead,
        refreshChatData,
        resetAndRefreshChatData,
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