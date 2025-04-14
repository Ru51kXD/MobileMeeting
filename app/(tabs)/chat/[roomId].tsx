import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  TextInput as RNTextInput,
  Modal,
  ScrollView,
  Alert,
  Animated,
  Pressable,
  Image,
  ImageBackground
} from 'react-native';
import { Appbar, Avatar, TextInput, IconButton, Menu } from 'react-native-paper';
import { useChat } from '../../../context/ChatContext';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { Message, ChatRoom, MessageContentType } from '../../../types';
import { useLocalSearchParams, router } from 'expo-router';
import { format, isToday, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ThemedContainer } from '@/components/ThemedContainer';
import { Colors } from '@/constants/Colors';
import { getEmployeeInfo } from '../../../context/ChatContext';
import { MessageContent } from '@/components/chat/MessageContent';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Icon } from '@/components/Icon';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { VoiceRecorder } from '@/components/chat/VoiceRecorder';
import { VoiceMessage } from '@/components/chat/VoiceMessage';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';

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
      <View style={[styles.dateSeparatorLine, {backgroundColor: isDark ? '#444' : '#e0e0e0'}]} />
      <Text style={[styles.dateSeparatorText, { backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0', color: isDark ? '#aaa' : '#999' }]}>{dateText}</Text>
      <View style={[styles.dateSeparatorLine, {backgroundColor: isDark ? '#444' : '#e0e0e0'}]} />
    </View>
  );
};

// Компонент анимированной печати
const TypingIndicator = ({isDark}: {isDark: boolean}) => {
  const [dot1] = useState(new Animated.Value(0));
  const [dot2] = useState(new Animated.Value(0));
  const [dot3] = useState(new Animated.Value(0));

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(dot1, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dot2, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dot3, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(dot1, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(animate);
    };

    animate();

    return () => {
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
    };
  }, []);

  return (
    <View style={[styles.typingContainer, {backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5'}]}>
      <View style={styles.typingContent}>
        <Text style={{color: isDark ? '#aaa' : '#888', marginRight: 8, fontSize: 12}}>Печатает</Text>
        <View style={styles.dotsContainer}>
          <Animated.View 
            style={[
              styles.typingDot, 
              {
                backgroundColor: isDark ? '#aaa' : '#888',
                transform: [{
                  translateY: dot1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -6]
                  })
                }]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.typingDot, 
              {
                backgroundColor: isDark ? '#aaa' : '#888',
                transform: [{
                  translateY: dot2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -6]
                  })
                }]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.typingDot, 
              {
                backgroundColor: isDark ? '#aaa' : '#888',
                transform: [{
                  translateY: dot3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -6]
                  })
                }]
              }
            ]} 
          />
        </View>
      </View>
    </View>
  );
};

// Функция для получения цвета проекта в зависимости от индекса
function getProjectColor(index: number, isDark: boolean) {
  const colors = isDark
    ? ['#ff2d55', '#ff9500', '#ffcc00', '#4cd964', '#5ac8fa', '#0a84ff', '#5e5ce6', '#bf5af2']
    : ['#ff2d55', '#ff9500', '#ffcc00', '#34c759', '#5ac8fa', '#007aff', '#5e5ce6', '#af52de'];
  return colors[index % colors.length];
}

// Функция для получения более темного оттенка цвета проекта
function getProjectColorDarker(index: number, isDark: boolean) {
  const colors = isDark
    ? ['#cc243f', '#cc7500', '#cc9900', '#39aa4e', '#479dc7', '#0868cc', '#4b49b7', '#9c47c2']
    : ['#cc243f', '#cc7500', '#cc9900', '#2a9447', '#479dc7', '#0062cc', '#4b49b7', '#8c42b2'];
  return colors[index % colors.length];
}

// Функция для улучшенной тени в зависимости от темы
const getThemeShadow = (isDark: boolean) => {
  return {
    shadowColor: isDark ? '#000000' : '#2e2e2e',
    shadowOffset: { width: 0, height: isDark ? 4 : 2 },
    shadowOpacity: isDark ? 0.4 : 0.15,
    shadowRadius: isDark ? 8 : 4,
    elevation: isDark ? 10 : 5,
  };
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
  const [showProfile, setShowProfile] = useState(false);
  const [profileEmployee, setProfileEmployee] = useState<any>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [modalScale] = useState(new Animated.Value(0.8));
  const [modalOpacity] = useState(new Animated.Value(0));
  
  // Для отслеживания последнего отправленного сообщения
  const lastSentMessageRef = useRef<{text: string, timestamp: number} | null>(null);
  
  const inputRef = useRef<RNTextInput>(null);
  const flatListRef = useRef<FlatList>(null);
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  // Добавляем анимированные значения для улучшения UI
  const headerOpacity = useState(new Animated.Value(0))[0];
  const listTranslateY = useState(new Animated.Value(20))[0];
  
  // Эффект для синхронизации сообщений с контекстом
  useEffect(() => {
    if (roomId) {
      const updatedMessages = getMessagesForChat(roomId);
      setChatMessages(updatedMessages);
    }
  }, [roomId, messages]);

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

    // Анимация при загрузке экрана
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      }),
      Animated.timing(listTranslateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();
  }, []);

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
      
      // Используем формат сообщения с content для совместимости с ChatContext
      const messageToSend: Omit<Message, 'id'> = {
        senderId: user.id,
        receiverId: receiverId,
        chatRoomId: currentChatRoom.id,
        content: {
          type: MessageContentType.TEXT,
          text: messageText
        },
        timestamp: new Date(now),
        isRead: false,
      };
      
      // Очищаем поле ввода и реплай
      setNewMessage('');
      setReplyingTo(null);
      
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

  const handleProfilePress = () => {
    if (!currentChatRoom?.isGroupChat && currentChatRoom) {
      const otherUserId = currentChatRoom.participants.find(id => id !== user?.id) || '';
      const employeeInfo = getEmployeeInfo(otherUserId);
      setSelectedEmployeeId(otherUserId);
      setIsProfileModalVisible(true);
      Animated.parallel([
        Animated.timing(modalScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }
  };

  const closeModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true
      })
    ]).start(() => {
      setIsProfileModalVisible(false);
      setSelectedEmployeeId(null);
    });
  }, [modalScale, modalOpacity]);

  // Улучшенные динамические стили
  const dynamicStyles = {
    header: {
      backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
      borderBottomWidth: 0,
      ...getThemeShadow(isDark),
    },
    headerTitle: {
      color: isDark ? Colors.dark.text : '#333',
      fontWeight: '700',
    },
    headerSubtitle: {
      color: isDark ? '#9a9a9a' : '#666',
    },
    messageContainer: {
      backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
    },
    ownMessage: {
      backgroundColor: isDark ? 'rgba(10, 132, 255, 0.25)' : '#e3f2fd',
    },
    otherMessage: {
      backgroundColor: isDark ? '#2a2a2c' : '#f5f5f5',
    },
    messageText: {
      color: isDark ? Colors.dark.text : '#333',
    },
    messageTime: {
      color: isDark ? '#9a9a9a' : '#888',
    },
    senderName: {
      color: isDark ? '#9a9a9a' : '#666',
    },
    inputContainer: {
      backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
      borderTopColor: isDark ? '#333' : '#e0e0e0',
      ...getThemeShadow(isDark),
    },
    input: {
      backgroundColor: isDark ? '#2a2a2c' : '#f5f5f5',
      color: isDark ? Colors.dark.text : '#333',
    },
    iconButton: {
      color: isDark ? '#9a9a9a' : '#666',
    },
    containerBackground: isDark ? '#1c1c1e' : '#f8f8fa',
  };

  // Обработчики для отправки файлов и изображений
  const handleSendFile = async () => {
    try {
      if (!user || !currentChatRoom) return;
      
      const result = await DocumentPicker.getDocumentAsync();
      
      if (result.canceled === false && result.assets && result.assets[0]) {
        const { uri, name, mimeType } = result.assets[0];
        
        setIsSending(true);
        
        const receiverId = currentChatRoom.isGroupChat 
          ? currentChatRoom.id 
          : currentChatRoom.participants.find(id => id !== user.id) || null;
        
        // Создаем сообщение с файлом
        const messageToSend: Omit<Message, 'id'> = {
          senderId: user.id,
          receiverId: receiverId,
          chatRoomId: currentChatRoom.id,
          content: {
            type: MessageContentType.FILE,
            fileUrl: uri,
            fileName: name,
            fileMimeType: mimeType || 'application/octet-stream'
          },
          timestamp: new Date(),
          isRead: false,
        };
        
        // Добавляем сообщение
        await addMessage(messageToSend);
        
        // Прокручиваем к последнему сообщению
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
          setIsSending(false);
        }, 300);
      }
    } catch (error) {
      console.error('Ошибка отправки файла:', error);
      Alert.alert('Ошибка', 'Не удалось отправить файл');
      setIsSending(false);
    }
  };
  
  const handleSendImage = async () => {
    try {
      if (!user || !currentChatRoom) return;
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Требуется разрешение', 'Нужно разрешение на доступ к галерее');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setIsSending(true);
        
        const receiverId = currentChatRoom.isGroupChat 
          ? currentChatRoom.id 
          : currentChatRoom.participants.find(id => id !== user.id) || null;
        
        // Создаем сообщение с изображением
        const messageToSend: Omit<Message, 'id'> = {
          senderId: user.id,
          receiverId: receiverId,
          chatRoomId: currentChatRoom.id,
          content: {
            type: MessageContentType.IMAGE,
            imageUrl: result.assets[0].uri,
            text: ''
          },
          timestamp: new Date(),
          isRead: false,
        };
        
        // Добавляем сообщение
        await addMessage(messageToSend);
        
        // Прокручиваем к последнему сообщению
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
          setIsSending(false);
        }, 300);
      }
    } catch (error) {
      console.error('Ошибка отправки изображения:', error);
      Alert.alert('Ошибка', 'Не удалось отправить изображение');
      setIsSending(false);
    }
  };

  const handleSendEmoji = async (emoji: string) => {
    try {
      if (!user || !currentChatRoom) return;
      
      setIsSending(true);
      
      const receiverId = currentChatRoom.isGroupChat 
        ? currentChatRoom.id 
        : currentChatRoom.participants.find(id => id !== user.id) || null;
      
      // Создаем сообщение с эмодзи
      const messageToSend: Omit<Message, 'id'> = {
        senderId: user.id,
        receiverId: receiverId,
        chatRoomId: currentChatRoom.id,
        content: {
          type: MessageContentType.EMOJI,
          emoji: emoji
        },
        timestamp: new Date(),
        isRead: false,
      };
      
      // Добавляем сообщение
      await addMessage(messageToSend);
      
      // Прокручиваем к последнему сообщению
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
        setIsSending(false);
      }, 300);
    } catch (error) {
      console.error('Ошибка отправки эмодзи:', error);
      Alert.alert('Ошибка', 'Не удалось отправить эмодзи');
      setIsSending(false);
    }
  };

  // Обработчик для отправки голосового сообщения
  const handleSendVoiceMessage = async (audioUri: string, duration: number) => {
    try {
      if (!user || !currentChatRoom) return;
      
      setIsSending(true);
      
      const receiverId = currentChatRoom.isGroupChat 
        ? currentChatRoom.id 
        : currentChatRoom.participants.find(id => id !== user.id) || null;
      
      // Создаем сообщение с голосовой записью
      const messageToSend: Omit<Message, 'id'> = {
        senderId: user.id,
        receiverId: receiverId,
        chatRoomId: currentChatRoom.id,
        content: {
          type: MessageContentType.VOICE,
          voiceUrl: audioUri,
          voiceDuration: duration
        },
        timestamp: new Date(),
        isRead: false,
      };
      
      // Закрываем рекордер
      setShowVoiceRecorder(false);
      
      // Добавляем сообщение
      await addMessage(messageToSend);
      
      // Прокручиваем к последнему сообщению
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
        setIsSending(false);
      }, 300);
    } catch (error) {
      console.error('Ошибка при отправке голосового сообщения:', error);
      Alert.alert('Ошибка', 'Не удалось отправить голосовое сообщение');
      setIsSending(false);
    }
  };

  // Функция для рендеринга контента сообщения в зависимости от типа
  const renderMessageContent = (item: Message) => {
    // Для обратной совместимости - простой текст
    if (item.text && !item.content) {
      return (
        <>
          <View style={styles.messageTextContainer}>
            <Text style={[styles.messageText, dynamicStyles.messageText]}>
              {item.text}
            </Text>
          </View>
          <Text style={[styles.messageTime, dynamicStyles.messageTime]}>
            {formatMessageTime(item.timestamp)}
          </Text>
        </>
      );
    }
    
    // Для сообщений с content
    if (item.content) {
      const isOwnMessage = item.senderId === user?.id;
      let type = 'text';
      
      // Определяем тип сообщения
      if (item.content.type === MessageContentType.TEXT) type = 'text';
      else if (item.content.type === MessageContentType.FILE) type = 'file';
      else if (item.content.type === MessageContentType.IMAGE) type = 'image';
      else if (item.content.type === MessageContentType.EMOJI) type = 'emoji';
      else if (item.content.type === MessageContentType.VOICE) type = 'voice';
      
      // Создаем метаданные в ожидаемом формате
      const metadata = {
        fileName: item.content.fileName,
        fileType: item.content.fileMimeType,
        size: 0
      };
      
      // Определяем контент для передачи в компонент
      const content = item.content.text || 
                      item.content.fileUrl || 
                      item.content.imageUrl || 
                      item.content.emoji || '';
      
      if (type === 'text') {
        return (
          <>
            <View style={styles.messageTextContainer}>
              <Text style={[styles.messageText, dynamicStyles.messageText]}>
                {item.content.text}
              </Text>
            </View>
            <Text style={[styles.messageTime, dynamicStyles.messageTime]}>
              {formatMessageTime(item.timestamp)}
            </Text>
          </>
        );
      } else if (type === 'emoji') {
        return (
          <>
            <View style={styles.emojiContainer}>
              <Text style={styles.emojiText}>
                {item.content.emoji}
              </Text>
            </View>
            <Text style={[styles.messageTime, dynamicStyles.messageTime]}>
              {formatMessageTime(item.timestamp)}
            </Text>
          </>
        );
      } else if (type === 'voice') {
        return (
          <>
            <VoiceMessage 
              uri={item.content.voiceUrl || ''}
              duration={item.content.voiceDuration || 0}
              isDark={isDark}
              isOutgoing={isOwnMessage}
            />
            <Text style={[styles.messageTime, dynamicStyles.messageTime]}>
              {formatMessageTime(item.timestamp)}
            </Text>
          </>
        );
      } else {
        return (
          <>
            <MessageContent 
              content={content}
              type={type as any}
              metadata={metadata}
              isDark={isDark}
              isOutgoing={isOwnMessage}
            />
            <Text style={[styles.messageTime, dynamicStyles.messageTime]}>
              {formatMessageTime(item.timestamp)}
            </Text>
          </>
        );
      }
    }
    
    // Если ничего не подходит
    return (
      <Text style={[styles.messageText, dynamicStyles.messageText]}>
        [Неподдерживаемое сообщение]
      </Text>
    );
  };

  // Функция для ответа на сообщение
  const handleReplyMessage = (message: Message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
    
    // Закрываем все свайпы
    swipeableRefs.current.forEach((swipeable) => {
      swipeable?.close();
    });
  };

  // Рендер левой стороны свайпа (для отображения действия ответа)
  const renderLeftActions = (message: Message) => {
    return (
      <View style={styles.swipeActionContainer}>
        <TouchableOpacity 
          style={[styles.swipeAction, {backgroundColor: '#2196F3'}]}
          onPress={() => handleReplyMessage(message)}
        >
          <Icon name="corner-up-left" size={20} color="#fff" />
          <Text style={styles.swipeActionText}>Ответить</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Обработчик изменения темы
  const updateStatusBadgeStyle = () => {
    return {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      padding: 4,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: isDark ? '#1e1e1e' : '#fff',
    };
  };

  const updateDepartmentBadgeStyle = () => {
    return {
      flexDirection: 'row' as const, 
      alignItems: 'center' as const,
      backgroundColor: isDark ? `${Colors.primary}40` : `${Colors.primary}20`,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 8,
      marginBottom: 16,
    };
  };

  // Переключатель для записи голоса
  const toggleVoiceRecorder = () => {
    // Если открыт инпут или меню вложений - закрываем их
    if (showAttachmentMenu) {
      setShowAttachmentMenu(false);
    }
    
    setShowVoiceRecorder(!showVoiceRecorder);
  };

  // Функция для отображения меню вложений
  const toggleAttachmentMenu = () => {
    setShowAttachmentMenu(!showAttachmentMenu);
  };

  // Обработчик изменения текста ввода
  const handleTextChange = (text: string) => {
    setNewMessage(text);
    
    // Симулируем индикатор печати
    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      // Через 3 секунды скрываем индикатор
      setTimeout(() => setIsTyping(false), 3000);
    }
  };

  const handleUserPress = useCallback((employeeId) => {
    setSelectedEmployeeId(employeeId);
    setIsProfileModalVisible(true);
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
  }, [modalScale, modalOpacity]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedContainer style={[styles.container, { backgroundColor: dynamicStyles.containerBackground }]}>
        <Animated.View style={{ opacity: headerOpacity }}>
          <Appbar.Header style={[dynamicStyles.header, styles.appHeader]}>
            <Appbar.BackAction onPress={handleBackPress} color={isDark ? Colors.dark.text : Colors.light.text} />
            <TouchableOpacity 
              style={styles.headerContent}
              onPress={handleProfilePress}
              disabled={currentChatRoom?.isGroupChat}
            >
              {currentChatRoom?.isGroupChat ? (
                <View style={styles.avatarGradientContainer}>
                  <LinearGradient
                    colors={isDark ? ['#4F46E5', '#6366F1'] : ['#6366F1', '#818CF8']}
                    style={styles.avatarGradient}
                  >
                    <Avatar.Icon size={40} icon="account-group" style={styles.groupAvatar} />
                  </LinearGradient>
                </View>
              ) : (
                <View style={styles.avatarGradientContainer}>
                  <LinearGradient
                    colors={isDark ? ['#3a3a3c', '#2c2c2e'] : ['#ffffff', '#f2f2f7']}
                    style={styles.avatarGradient}
                  >
                    <Avatar.Image 
                      size={40} 
                      source={{ 
                        uri: currentChatRoom ? 
                          getEmployeeInfo(currentChatRoom.participants.find(id => id !== user?.id) || '').avatarUrl : 
                          'https://ui-avatars.com/api/?name=Unknown&background=9E9E9E&color=fff'
                      }} 
                      style={styles.avatar}
                    />
                  </LinearGradient>
                </View>
              )}
              <View style={styles.headerInfo}>
                <Text style={[styles.headerTitle, dynamicStyles.headerTitle]} numberOfLines={1}>
                  {currentChatRoom?.isGroupChat 
                    ? currentChatRoom.name 
                    : (currentChatRoom 
                      ? getEmployeeInfo(currentChatRoom.participants.find(id => id !== user?.id) || '').name
                      : 'Чат')}
                </Text>
                {!currentChatRoom?.isGroupChat && currentChatRoom && (
                  <View style={styles.headerStatusContainer}>
                    <View style={[styles.statusDot, {
                      backgroundColor: '#4CAF50',
                      shadowColor: '#4CAF50',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.5,
                      shadowRadius: 4,
                      elevation: 5,
                    }]} />
                    <Text style={[styles.headerSubtitle, dynamicStyles.headerSubtitle]} numberOfLines={1}>
                      {getEmployeeInfo(currentChatRoom.participants.find(id => id !== user?.id) || '').position}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            
            <Menu
              visible={showHeaderMenu}
              onDismiss={() => setShowHeaderMenu(false)}
              anchor={
                <Appbar.Action 
                  icon="dots-vertical" 
                  onPress={() => setShowHeaderMenu(true)} 
                  color={isDark ? Colors.dark.text : Colors.light.text} 
                />
              }
              contentStyle={{
                backgroundColor: isDark ? '#2a2a2c' : '#ffffff',
                borderRadius: 12,
                ...getThemeShadow(isDark)
              }}
            >
              <Menu.Item 
                onPress={() => {
                  setShowHeaderMenu(false);
                  Alert.alert("Очистка чата", "Эта функция будет доступна в следующих обновлениях");
                }} 
                title="Очистить чат" 
                leadingIcon="trash-can"
                titleStyle={{ color: isDark ? '#ffffff' : '#000000' }}
              />
              <Menu.Item 
                onPress={() => {
                  setShowHeaderMenu(false);
                  Alert.alert("Поиск", "Эта функция будет доступна в следующих обновлениях");
                }} 
                title="Поиск" 
                leadingIcon="magnify"
                titleStyle={{ color: isDark ? '#ffffff' : '#000000' }}
              />
              <Menu.Item 
                onPress={() => {
                  setShowHeaderMenu(false);
                  Alert.alert("Вложения", "Эта функция будет доступна в следующих обновлениях");
                }} 
                title="Вложения" 
                leadingIcon="paperclip"
                titleStyle={{ color: isDark ? '#ffffff' : '#000000' }}
              />
            </Menu>
          </Appbar.Header>
        </Animated.View>
        
        <Animated.View 
          style={{ 
            flex: 1,
            transform: [{ translateY: listTranslateY }]
          }}
        >
          <FlatList
            ref={flatListRef}
            data={messagesWithDateSeparators()}
            renderItem={({ item }) => {
              if ('isDateSeparator' in item) {
                return <DateSeparator date={item.date} isDark={isDark} />;
              }
              
              const isOwnMessage = item.senderId === user?.id;
              const senderInfo = getEmployeeInfo(item.senderId);
              
              return (
                <Swipeable
                  ref={(ref) => {
                    if (ref && !('isDateSeparator' in item)) {
                      swipeableRefs.current.set(item.id, ref);
                    }
                  }}
                  renderLeftActions={() => renderLeftActions(item)}
                  overshootLeft={false}
                >
                  <View style={[
                    styles.messageContainer,
                    isOwnMessage 
                      ? [styles.ownMessageContainer, {
                          backgroundColor: 'transparent',
                        }]
                      : [styles.otherMessageContainer, {
                          backgroundColor: 'transparent',
                        }]
                  ]}>
                    {isOwnMessage ? (
                      <LinearGradient
                        colors={isDark 
                          ? ['rgba(10, 132, 255, 0.25)', 'rgba(10, 132, 255, 0.15)'] 
                          : ['rgba(0, 122, 255, 0.15)', 'rgba(0, 122, 255, 0.05)']}
                        style={[styles.messageBubble, styles.ownMessageBubble]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        {!isOwnMessage && currentChatRoom?.isGroupChat && (
                          <TouchableOpacity 
                            onPress={() => handleUserPress(item.senderId)}
                          >
                            <Text style={[styles.messageSender, {color: isDark ? Colors.dark.tint : Colors.primary}]}>
                              {senderInfo.name}
                            </Text>
                          </TouchableOpacity>
                        )}
                        
                        {renderMessageContent(item)}
                      </LinearGradient>
                    ) : (
                      <LinearGradient
                        colors={isDark 
                          ? ['#2a2a2c', '#252527'] 
                          : ['#f5f5f5', '#e8e8e8']}
                        style={[styles.messageBubble, styles.otherMessageBubble]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        {!isOwnMessage && currentChatRoom?.isGroupChat && (
                          <TouchableOpacity 
                            onPress={() => handleUserPress(item.senderId)}
                          >
                            <Text style={[styles.messageSender, {color: isDark ? Colors.dark.tint : Colors.primary}]}>
                              {senderInfo.name}
                            </Text>
                          </TouchableOpacity>
                        )}
                        
                        {renderMessageContent(item)}
                      </LinearGradient>
                    )}
                  </View>
                </Swipeable>
              );
            }}
            keyExtractor={(item) => ('isDateSeparator' in item) ? item.id : item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => {
              if (chatMessages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
            ListFooterComponent={isTyping ? <TypingIndicator isDark={isDark} /> : null}
          />
        </Animated.View>
        
        {/* Отображение ответа на сообщение */}
        {replyingTo && (
          <View style={[styles.replyContainer, {
            backgroundColor: isDark ? '#222' : '#f0f0f0',
            borderTopColor: isDark ? '#333' : '#ddd',
            borderBottomColor: isDark ? '#333' : '#ddd',
          }]}>
            <View style={styles.replyContent}>
              <LinearGradient
                colors={['#2196F3', '#1E88E5']}
                style={styles.replyLine}
              />
              <View style={styles.replyTextContainer}>
                <Text style={[styles.replyToText, {color: '#2196F3'}]}>
                  Ответ на сообщение от {getEmployeeInfo(replyingTo.senderId).name}
                </Text>
                <Text style={[styles.replyText, {color: isDark ? '#ddd' : '#333'}]} numberOfLines={1}>
                  {replyingTo.content?.text || 'Медиа сообщение'}
                </Text>
              </View>
            </View>
            <IconButton
              icon="close"
              size={20}
              onPress={() => setReplyingTo(null)}
              color={isDark ? '#aaa' : '#666'}
            />
          </View>
        )}
        
        {/* Панель записи голосового сообщения */}
        {showVoiceRecorder ? (
          <VoiceRecorder 
            onRecordComplete={handleSendVoiceMessage}
            onCancel={() => setShowVoiceRecorder(false)}
            visible={showVoiceRecorder}
            isDark={isDark}
          />
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <LinearGradient
              colors={isDark 
                ? ['#1c1c1e', '#1c1c1e'] 
                : ['#ffffff', '#f8f8fa']}
              style={[styles.inputContainer, dynamicStyles.inputContainer]}
            >
              {/* Кнопка для открытия меню вложений */}
              <TouchableOpacity
                style={[styles.inputIconButton, showAttachmentMenu && styles.inputIconButtonActive]}
                onPress={toggleAttachmentMenu}
                activeOpacity={0.7}
              >
                <Icon 
                  name="paperclip" 
                  size={24} 
                  color={showAttachmentMenu ? '#2196F3' : dynamicStyles.iconButton.color} 
                />
              </TouchableOpacity>
              
              {/* Кнопка микрофона */}
              <TouchableOpacity
                style={styles.inputIconButton}
                onPress={toggleVoiceRecorder}
                activeOpacity={0.7}
              >
                <Icon 
                  name="mic" 
                  size={24} 
                  color={dynamicStyles.iconButton.color} 
                />
              </TouchableOpacity>
              
              {/* Кнопка эмодзи */}
              <TouchableOpacity
                style={styles.inputIconButton}
                onPress={() => handleSendEmoji('👍')}
                activeOpacity={0.7}
              >
                <Icon name="smile" size={24} color={dynamicStyles.iconButton.color} />
              </TouchableOpacity>
              
              <TextInput
                ref={inputRef}
                style={[styles.input, dynamicStyles.input]}
                value={newMessage}
                onChangeText={handleTextChange}
                placeholder="Введите сообщение..."
                placeholderTextColor={isDark ? '#888' : '#999'}
                mode="flat"
                multiline
                theme={{ colors: { primary: '#2196F3' } }}
                underlineColor="transparent"
              />
              
              <TouchableOpacity
                style={[
                  styles.sendButton, 
                  {
                    opacity: isSending ? 0.5 : 1
                  }
                ]}
                onPress={handleSendMessage}
                disabled={!newMessage.trim() || isSending}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={newMessage.trim() ? ['#2196F3', '#1E88E5'] : [isDark ? '#333' : '#e0e0e0', isDark ? '#222' : '#d0d0d0']}
                  style={styles.sendButtonGradient}
                >
                  <Icon name="send" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
            
            {/* Меню вложений */}
            {showAttachmentMenu && (
              <View style={[styles.attachmentMenu, {
                backgroundColor: isDark ? '#2a2a2c' : '#f5f5f5',
                borderTopColor: isDark ? '#333' : '#e0e0e0',
                ...getThemeShadow(isDark)
              }]}>
                <TouchableOpacity 
                  style={styles.attachmentOption} 
                  onPress={() => {
                    handleSendImage();
                    toggleAttachmentMenu();
                  }}
                >
                  <LinearGradient
                    colors={['#2196F3', '#1E88E5']}
                    style={styles.attachmentIconGradient}
                  >
                    <IconButton icon="image" size={24} color="#ffffff" />
                  </LinearGradient>
                  <Text style={{ color: isDark ? '#fff' : '#333', marginTop: 4 }}>Изображение</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.attachmentOption} 
                  onPress={() => {
                    handleSendFile();
                    toggleAttachmentMenu();
                  }}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#43A047']}
                    style={styles.attachmentIconGradient}
                  >
                    <IconButton icon="file-document" size={24} color="#ffffff" />
                  </LinearGradient>
                  <Text style={{ color: isDark ? '#fff' : '#333', marginTop: 4 }}>Файл</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.attachmentOption} 
                  onPress={() => {
                    handleSendEmoji('🤔');
                    toggleAttachmentMenu();
                  }}
                >
                  <LinearGradient
                    colors={['#FFC107', '#FFB300']}
                    style={styles.attachmentIconGradient}
                  >
                    <IconButton icon="emoticon-excited" size={24} color="#ffffff" />
                  </LinearGradient>
                  <Text style={{ color: isDark ? '#fff' : '#333', marginTop: 4 }}>Эмодзи</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.attachmentOption} 
                  onPress={() => {
                    toggleVoiceRecorder();
                    toggleAttachmentMenu();
                  }}
                >
                  <LinearGradient
                    colors={['#9C27B0', '#8E24AA']}
                    style={styles.attachmentIconGradient}
                  >
                    <IconButton icon="microphone" size={24} color="#ffffff" />
                  </LinearGradient>
                  <Text style={{ color: isDark ? '#fff' : '#333', marginTop: 4 }}>Голосовое</Text>
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
        )}
        
        {/* Модальное окно профиля сотрудника */}
        {isProfileModalVisible && selectedEmployee && (
          <Pressable 
            style={styles.modalBackdrop} 
            onPress={closeModal}
          >
            <Animated.View 
              style={[
                styles.modalContainer,
                {
                  opacity: modalOpacity,
                  transform: [{ scale: modalScale }],
                  backgroundColor: isDark ? 'rgba(30, 30, 32, 0.95)' : 'rgba(250, 250, 252, 0.95)'
                }
              ]}
            >
              <Pressable style={{ flex: 1 }} onPress={(e) => e.stopPropagation()}>
                <ScrollView 
                  style={styles.profileContainer} 
                  contentContainerStyle={{ paddingBottom: 30 }}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                      <LinearGradient
                        colors={isDark ? 
                          ['rgba(80, 80, 100, 0.6)', 'rgba(40, 40, 60, 0.8)'] : 
                          ['rgba(240, 240, 250, 0.8)', 'rgba(200, 200, 230, 0.9)']}
                        style={styles.avatarBackground}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Image
                          source={{ uri: selectedEmployee.avatarUrl }}
                          style={styles.avatarImage}
                        />
                        <View 
                          style={[
                            styles.onlineIndicator, 
                            { backgroundColor: selectedEmployee.isOnline ? '#34C759' : '#888' }
                          ]} 
                        />
                      </LinearGradient>
                    </View>
                    <View style={styles.profileNameContainer}>
                      <Text style={[
                        styles.profileName, 
                        { color: isDark ? '#fff' : '#000',
                          textShadowColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 2 
                        }
                      ]}>
                        {selectedEmployee.name}
                      </Text>
                      <Text style={[
                        styles.profilePosition, 
                        { color: isDark ? '#ccc' : '#444' }
                      ]}>
                        {selectedEmployee.position}
                      </Text>
                      <View style={styles.departmentBadge}>
                        <Text style={styles.departmentText}>
                          {selectedEmployee.department}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={[styles.sectionCard, { marginTop: 24 }]}>
                    <View style={styles.cardHeader}>
                      <FontAwesome 
                        name="address-card" 
                        size={18} 
                        color={isDark ? '#BBA8FF' : '#6C47FF'} 
                      />
                      <Text style={[styles.cardHeaderText, { color: isDark ? '#eee' : '#333' }]}>
                        Контактная информация
                      </Text>
                    </View>
                    <View style={styles.contactInfo}>
                      <View style={styles.contactItem}>
                        <FontAwesome name="envelope" size={16} color={isDark ? '#aaa' : '#555'} />
                        <Text style={[styles.contactText, { color: isDark ? '#ddd' : '#333' }]}>
                          {selectedEmployee.email}
                        </Text>
                      </View>
                      <View style={styles.contactItem}>
                        <FontAwesome name="phone" size={16} color={isDark ? '#aaa' : '#555'} />
                        <Text style={[styles.contactText, { color: isDark ? '#ddd' : '#333' }]}>
                          {selectedEmployee.phone}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.sectionCard}>
                    <View style={styles.cardHeader}>
                      <FontAwesome 
                        name="tasks" 
                        size={18} 
                        color={isDark ? '#FFAA8A' : '#FF7846'} 
                      />
                      <Text style={[styles.cardHeaderText, { color: isDark ? '#eee' : '#333' }]}>
                        Задачи
                      </Text>
                    </View>
                    <View style={styles.statsSection}>
                      <View style={styles.taskCircle}>
                        <Text style={styles.taskNumber}>{selectedEmployee.activeTasks}</Text>
                        <Text style={styles.taskLabel}>Активные</Text>
                      </View>
                      <View style={styles.taskCircle}>
                        <Text style={styles.taskNumber}>{selectedEmployee.completedTasks}</Text>
                        <Text style={styles.taskLabel}>Завершенные</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.sectionCard}>
                    <View style={styles.cardHeader}>
                      <FontAwesome 
                        name="pie-chart" 
                        size={18} 
                        color={isDark ? '#A8E0FF' : '#0A84FF'} 
                      />
                      <Text style={[styles.cardHeaderText, { color: isDark ? '#eee' : '#333' }]}>
                        Статистика работы
                      </Text>
                    </View>
                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{selectedEmployee.efficiency}%</Text>
                        <Text style={styles.statLabel}>Эффективность</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{selectedEmployee.timeliness}%</Text>
                        <Text style={styles.statLabel}>Своевременность</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.sectionCard}>
                    <View style={styles.cardHeader}>
                      <FontAwesome 
                        name="folder-open" 
                        size={18} 
                        color={isDark ? '#A8FFB0' : '#30D158'} 
                      />
                      <Text style={[styles.cardHeaderText, { color: isDark ? '#eee' : '#333' }]}>
                        Проекты
                      </Text>
                      <View style={styles.projectCount}>
                        <Text style={styles.projectCountText}>{selectedEmployee.projects.length}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.projectsContainer}>
                      {selectedEmployee.projects.map((project, index) => (
                        <View
                          key={index}
                          style={[
                            styles.projectChip,
                            {
                              backgroundColor: getProjectColor(index, isDark),
                              shadowColor: getProjectColorDarker(index, isDark),
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.5,
                              shadowRadius: 3,
                              elevation: 3
                            }
                          ]}
                        >
                          <Text style={styles.projectChipText}>{project}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  
                  <View style={styles.actionButtonsContainer}>
                    <Pressable 
                      onPress={() => {
                        closeModal();
                        router.push(`/chat/${selectedEmployee.id}`);
                      }}
                    >
                      <LinearGradient
                        colors={isDark ? 
                          ['#4F46E5', '#7B6FFF'] : 
                          ['#5E5CE6', '#7B6FFF']}
                        style={[styles.actionButton, {
                          shadowColor: '#4338CA',
                          shadowOffset: { width: 0, height: 3 },
                          shadowOpacity: 0.4,
                          shadowRadius: 4,
                          elevation: 5
                        }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <FontAwesome name="comment" size={16} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.actionButtonText}>Написать сообщение</Text>
                      </LinearGradient>
                    </Pressable>
                    
                    <Pressable 
                      onPress={() => {
                        closeModal();
                        router.push('/tasks/new');
                      }}
                      style={{ marginTop: 12 }}
                    >
                      <LinearGradient
                        colors={isDark ? 
                          ['#4c6ceb', '#6c8aff'] : 
                          ['#5a7bff', '#7a96ff']}
                        style={[styles.actionButton, {
                          shadowColor: '#3e58bd',
                          shadowOffset: { width: 0, height: 3 },
                          shadowOpacity: 0.4,
                          shadowRadius: 4,
                          elevation: 5
                        }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <FontAwesome name="tasks" size={16} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.actionButtonText}>Назначить задачу</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </ScrollView>
                
                <Pressable 
                  onPress={closeModal} 
                  style={styles.closeButton}
                >
                  <FontAwesome name="times" size={22} color={isDark ? '#ccc' : '#555'} />
                </Pressable>
              </Pressable>
            </Animated.View>
          </Pressable>
        )}
      </ThemedContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  appHeader: {
    borderBottomWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  header: {
    backgroundColor: '#fff',
    elevation: 0,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerInfo: {
    flexDirection: 'column',
    marginLeft: 12,
    flex: 1,
  },
  headerStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  groupAvatar: {
    backgroundColor: 'transparent',
    marginRight: 0,
    marginLeft: 0,
  },
  avatar: {
    borderRadius: 20,
  },
  avatarGradientContainer: {
    borderRadius: 22,
    padding: 2,
    overflow: 'hidden',
  },
  avatarGradient: {
    borderRadius: 20,
    padding: 0,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    flexDirection: 'column',
    marginVertical: 4,
    maxWidth: '80%',
  },
  messageBubble: {
    borderRadius: 20,
    padding: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 0.5,
  },
  ownMessageBubble: {
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 4,
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
  messageSender: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
    letterSpacing: 0.1,
  },
  messageTextContainer: {
    marginVertical: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    alignSelf: 'flex-end',
    marginTop: 3,
    marginRight: 2,
  },
  inputContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    maxHeight: 120,
    minHeight: 36,
    paddingHorizontal: 16,
    fontSize: 16,
    marginHorizontal: 8,
    paddingTop: 8,
  },
  inputIconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  inputIconButtonActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 20,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: '#8E8E93',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileContainer: {
    padding: 24,
    borderRadius: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarBackground: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  avatarImage: {
    width: 82,
    height: 82,
    borderRadius: 41,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'white',
  },
  profileNameContainer: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  profilePosition: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 8,
  },
  departmentBadge: {
    backgroundColor: 'rgba(100, 100, 250, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  departmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5E5CE6',
  },
  sectionCard: {
    backgroundColor: 'rgba(150, 150, 150, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  contactInfo: {
    marginTop: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 15,
    marginLeft: 12,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  taskCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 130, 50, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8250',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  taskNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF8250',
  },
  taskLabel: {
    fontSize: 13,
    color: '#FF8250',
    marginTop: 4,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0A84FF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#0A84FF',
    opacity: 0.8,
  },
  projectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  projectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  projectChipText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  projectCount: {
    backgroundColor: 'rgba(30, 200, 30, 0.2)',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  projectCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#30D158',
  },
  actionButtonsContainer: {
    marginTop: 24,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(120, 120, 120, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1100,
  },
  emojiContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  emojiText: {
    fontSize: 50,
    lineHeight: 60,
  },
  attachmentMenu: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  attachmentOption: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  }
});
