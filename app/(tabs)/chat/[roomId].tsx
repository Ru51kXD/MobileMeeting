import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  TextInput as RNTextInput
} from 'react-native';
import { Appbar, Avatar, TextInput, IconButton } from 'react-native-paper';
import { useChat } from '../../../context/ChatContext';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { Message, ChatRoom } from '../../../types';
import { useLocalSearchParams, router } from 'expo-router';
import { format, isToday, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ThemedContainer } from '@/components/ThemedContainer';
import { Colors } from '@/constants/Colors';

// Временные данные сотрудников для демо
const DEMO_EMPLOYEES = [
  { id: '1', name: 'Иванов Иван', position: 'Руководитель проекта', avatarUrl: 'https://ui-avatars.com/api/?name=Ivan+Ivanov&background=0D8ABC&color=fff' },
  { id: '2', name: 'Петрова Елена', position: 'Ведущий дизайнер', avatarUrl: 'https://ui-avatars.com/api/?name=Elena+Petrova&background=2E7D32&color=fff' },
  { id: '3', name: 'Сидоров Алексей', position: 'Разработчик', avatarUrl: 'https://ui-avatars.com/api/?name=Alexey+Sidorov&background=C62828&color=fff' },
  { id: '4', name: 'Козлова Мария', position: 'Тестировщик', avatarUrl: 'https://ui-avatars.com/api/?name=Maria+Kozlova&background=6A1B9A&color=fff' },
  { id: '5', name: 'Николаев Дмитрий', position: 'Бизнес-аналитик', avatarUrl: 'https://ui-avatars.com/api/?name=Dmitry+Nikolaev&background=00695C&color=fff' },
];

// Компонент для отображения даты сообщений в чате (с поддержкой темной темы)
const DateSeparator = ({ date, isDark }: { date: Date, isDark: boolean }) => {
  let dateText = '';
  
  if (isToday(date)) {
    dateText = 'Сегодня';
  } else if (isYesterday(date)) {
    dateText = 'Вчера';
  } else {
    dateText = format(date, 'd MMMM yyyy', { locale: ru });
  }
  
  return (
    <View style={styles.dateSeparator}>
      <Text style={[styles.dateSeparatorText, { color: isDark ? '#888' : '#999' }]}>{dateText}</Text>
    </View>
  );
};

export default function ChatRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { chatRooms, messages, addMessage, getMessagesForChat, markMessageAsRead } = useChat();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [newMessage, setNewMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [currentChatRoom, setCurrentChatRoom] = useState<ChatRoom | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  // Для отслеживания последнего отправленного сообщения
  const lastSentMessageRef = useRef<{text: string, timestamp: number} | null>(null);
  
  const inputRef = useRef<RNTextInput>(null);
  const flatListRef = useRef<FlatList>(null);

  // Находим информацию о пользователе по ID
  const getUserInfo = (userId: string) => {
    return DEMO_EMPLOYEES.find(emp => emp.id === userId) || 
      { id: userId, name: 'Неизвестный пользователь', position: '', avatarUrl: 'https://ui-avatars.com/api/?name=Unknown' };
  };

  useEffect(() => {
    if (roomId) {
      // Находим информацию о текущей комнате чата
      const chatRoom = chatRooms.find(room => room.id === roomId);
      if (chatRoom) {
        setCurrentChatRoom(chatRoom);
        
        // Получаем сообщения для этого чата
        const roomMessages = getMessagesForChat(roomId);
        
        // Сортируем сообщения по времени (от старых к новым)
        const sortedMessages = [...roomMessages].sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
        );
        
        // Устанавливаем сообщения
        setChatMessages(sortedMessages);
        
        // Отмечаем все непрочитанные сообщения как прочитанные
        if (user) {
          roomMessages.forEach(msg => {
            if (!msg.isRead && (
                msg.receiverId === user.id || 
                (msg.receiverId === null && msg.senderId !== user.id)
              )) {
              markMessageAsRead(msg.id);
            }
          });
        }
      }
    }
  }, [roomId, messages]);

  const handleBackPress = () => {
    router.back();
  };

  const handleSendMessage = async () => {
    // Если сообщение пустое, пользователь не авторизован, комната не найдена, или отправка в процессе - выходим
    if (!newMessage.trim() || !user || !currentChatRoom || isSending) return;
    
    const messageText = newMessage.trim();
    const now = Date.now();
    
    // Проверяем, не отправляем ли мы то же самое сообщение в течение 5 секунд
    if (lastSentMessageRef.current && 
        lastSentMessageRef.current.text === messageText && 
        now - lastSentMessageRef.current.timestamp < 5000) {
      console.log('Предотвращено дублирование сообщения');
      return;
    }
    
    try {
      // Устанавливаем флаг отправки
      setIsSending(true);
      
      // Запоминаем отправляемое сообщение
      lastSentMessageRef.current = { text: messageText, timestamp: now };
      
      const receiverId = currentChatRoom.isGroupChat 
        ? currentChatRoom.id // Для групповых чатов сохраняем ID чата как receiverId
        : currentChatRoom.participants.find(id => id !== user.id) || null;
      
      const messageToSend: Omit<Message, 'id'> = {
        senderId: user.id,
        receiverId: receiverId,
        chatRoomId: currentChatRoom.id, // Добавляем ID комнаты в сообщение
        text: messageText,
        timestamp: new Date(now),
        isRead: false,
      };
      
      // Очищаем поле ввода
      setNewMessage('');
      
      // Добавляем сообщение через контекст
      await addMessage(messageToSend);
      
      // Прокручиваем список к последнему сообщению
      if (flatListRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    } finally {
      // Сбрасываем флаг отправки через небольшую задержку
      setTimeout(() => {
        setIsSending(false);
      }, 1000);
    }
  };

  const formatMessageTime = (date: Date) => {
    return format(date, 'HH:mm', { locale: ru });
  };

  // Группируем сообщения по дате для вставки разделителей
  const messagesWithDateSeparators = () => {
    const result: (Message | { id: string, isDateSeparator: true, date: Date })[] = [];
    let currentDate = '';
    
    chatMessages.forEach(message => {
      const messageDate = format(message.timestamp, 'yyyy-MM-dd');
      
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        result.push({
          id: `date-${messageDate}`,
          isDateSeparator: true,
          date: message.timestamp,
        });
      }
      
      result.push(message);
    });
    
    return result;
  };

  // Динамические стили для темной темы
  const dynamicStyles = {
    header: {
      backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
    },
    headerTitle: {
      color: isDark ? Colors.dark.text : '#333',
    },
    messageContainer: {
      backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
    },
    ownMessage: {
      backgroundColor: isDark ? '#1e476b' : '#e3f2fd',
    },
    otherMessage: {
      backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
    },
    messageText: {
      color: isDark ? Colors.dark.text : '#333',
    },
    messageTime: {
      color: isDark ? '#aaa' : '#888',
    },
    senderName: {
      color: isDark ? '#aaa' : '#666',
    },
    inputContainer: {
      backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
      borderTopColor: isDark ? '#333' : '#e0e0e0',
    },
    input: {
      backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
    },
  };

  return (
    <ThemedContainer style={styles.container}>
      <Appbar.Header style={dynamicStyles.header}>
        <Appbar.BackAction onPress={handleBackPress} color={isDark ? Colors.dark.text : '#333'} />
        <View style={styles.headerContent}>
          {currentChatRoom?.isGroupChat ? (
            <Avatar.Icon size={40} icon="account-group" style={styles.groupAvatar} />
          ) : (
            <Avatar.Image 
              size={40} 
              source={{ 
                uri: getUserInfo(
                  currentChatRoom?.participants.find(id => id !== user?.id) || ''
                ).avatarUrl 
              }} 
            />
          )}
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, dynamicStyles.headerTitle]} numberOfLines={1}>
              {currentChatRoom?.name || 'Чат'}
            </Text>
          </View>
        </View>
      </Appbar.Header>
      
      <FlatList
        ref={flatListRef}
        data={messagesWithDateSeparators()}
        renderItem={({ item }) => {
          if ('isDateSeparator' in item) {
            return <DateSeparator date={item.date} isDark={isDark} />;
          }
          
          const isOwnMessage = item.senderId === user?.id;
          const senderInfo = getUserInfo(item.senderId);
          
          return (
            <View style={[
              styles.messageContainer,
              isOwnMessage ? [styles.ownMessageContainer, dynamicStyles.ownMessage] : [styles.otherMessageContainer, dynamicStyles.otherMessage]
            ]}>
              {!isOwnMessage && currentChatRoom?.isGroupChat && (
                <Text style={[styles.senderName, dynamicStyles.senderName]}>
                  {senderInfo.name}
                </Text>
              )}
              
              <Text style={[styles.messageText, dynamicStyles.messageText]}>
                {item.text}
              </Text>
              
              <Text style={[styles.messageTime, dynamicStyles.messageTime]}>
                {formatMessageTime(item.timestamp)}
              </Text>
            </View>
          );
        }}
        keyExtractor={(item) => ('isDateSeparator' in item) ? item.id : item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => {
          if (chatMessages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputContainer, dynamicStyles.inputContainer]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, dynamicStyles.input]}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Введите сообщение..."
            placeholderTextColor={isDark ? '#888' : '#999'}
            mode="flat"
            multiline
            theme={{ colors: { primary: '#2196F3' } }}
            right={
              <TextInput.Icon
                icon="send"
                onPress={handleSendMessage}
                disabled={!newMessage.trim() || isSending}
                style={styles.sendButton}
                color={isSending ? '#cccccc' : undefined}
              />
            }
          />
        </View>
      </KeyboardAvoidingView>
    </ThemedContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    elevation: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  groupAvatar: {
    backgroundColor: '#2196F3',
    marginRight: 8,
    marginLeft: 4,
  },
  messagesList: {
    padding: 8,
    paddingBottom: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    marginLeft: 'auto',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    marginRight: 'auto',
  },
  messageAvatar: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    minWidth: 80,
  },
  ownMessageBubble: {
    backgroundColor: '#e3f2fd',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
  },
  messageSender: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    backgroundColor: '#fff',
  },
  inputOutline: {
    borderRadius: 20,
    borderWidth: 1,
  },
  sendButton: {
    alignSelf: 'center',
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    flexDirection: 'column',
    marginLeft: 8,
  },
}); 