import React, { useState, useRef, useEffect } from 'react';
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
  Pressable
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
  
  // Для отслеживания последнего отправленного сообщения
  const lastSentMessageRef = useRef<{text: string, timestamp: number} | null>(null);
  
  const inputRef = useRef<RNTextInput>(null);
  const flatListRef = useRef<FlatList>(null);
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

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
      setProfileEmployee(employeeInfo);
      setShowProfile(true);
    }
  };

  // Динамические стили для темной темы
  const dynamicStyles = {
    header: {
      backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
      borderBottomWidth: 0,
      elevation: isDark ? 0 : 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    headerTitle: {
      color: isDark ? Colors.dark.text : '#333',
    },
    headerSubtitle: {
      color: isDark ? '#aaa' : '#666',
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
      color: isDark ? Colors.dark.text : '#333',
    },
    iconButton: {
      color: isDark ? '#aaa' : '#666',
    },
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedContainer style={styles.container}>
        <Appbar.Header style={[dynamicStyles.header, styles.appHeader]}>
          <Appbar.BackAction onPress={handleBackPress} color={isDark ? Colors.dark.text : '#333'} />
          <TouchableOpacity 
            style={styles.headerContent}
            onPress={handleProfilePress}
            disabled={currentChatRoom?.isGroupChat}
          >
            {currentChatRoom?.isGroupChat ? (
              <Avatar.Icon size={40} icon="account-group" style={styles.groupAvatar} />
            ) : (
              <Avatar.Image 
                size={40} 
                source={{ 
                  uri: currentChatRoom ? 
                    getEmployeeInfo(currentChatRoom.participants.find(id => id !== user?.id) || '').avatarUrl : 
                    'https://ui-avatars.com/api/?name=Unknown&background=9E9E9E&color=fff'
                }} 
              />
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
                  <View style={[styles.statusDot, {backgroundColor: '#4CAF50'}]} />
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
                color={isDark ? Colors.dark.text : '#333'} 
              />
            }
          >
            <Menu.Item 
              onPress={() => {
                setShowHeaderMenu(false);
                // Очистить чат (просто демо-функция)
                Alert.alert("Очистка чата", "Эта функция будет доступна в следующих обновлениях");
              }} 
              title="Очистить чат" 
              leadingIcon="trash-can"
            />
            <Menu.Item 
              onPress={() => {
                setShowHeaderMenu(false);
                // Поиск в сообщениях (просто демо-функция)
                Alert.alert("Поиск", "Эта функция будет доступна в следующих обновлениях");
              }} 
              title="Поиск" 
              leadingIcon="magnify"
            />
            <Menu.Item 
              onPress={() => {
                setShowHeaderMenu(false);
                // Показать вложения в чате (просто демо-функция)
                Alert.alert("Вложения", "Эта функция будет доступна в следующих обновлениях");
              }} 
              title="Вложения" 
              leadingIcon="paperclip"
            />
          </Menu>
        </Appbar.Header>
        
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
                    ? [styles.ownMessageContainer, {backgroundColor: isDark ? '#1e476b' : '#e3f2fd'}]
                    : [styles.otherMessageContainer, {backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5'}]
                ]}>
                  {!isOwnMessage && currentChatRoom?.isGroupChat && (
                    <Text style={[styles.messageSender, dynamicStyles.senderName]}>
                      {senderInfo.name}
                    </Text>
                  )}
                  
                  {renderMessageContent(item)}
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
        
        {/* Отображение ответа на сообщение */}
        {replyingTo && (
          <View style={[styles.replyContainer, {
            backgroundColor: isDark ? '#222' : '#f0f0f0',
            borderTopColor: isDark ? '#333' : '#ddd',
            borderBottomColor: isDark ? '#333' : '#ddd',
          }]}>
            <View style={styles.replyContent}>
              <View style={[styles.replyLine, {backgroundColor: '#2196F3'}]} />
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
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={[styles.inputContainer, dynamicStyles.inputContainer]}>
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
                  backgroundColor: newMessage.trim() ? '#2196F3' : isDark ? '#333' : '#e0e0e0',
                  opacity: isSending ? 0.5 : 1
                }
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              activeOpacity={0.7}
            >
              <Icon name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {/* Меню вложений */}
          {showAttachmentMenu && (
            <View style={[styles.attachmentMenu, {
              backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
              borderTopColor: isDark ? '#333' : '#e0e0e0'
            }]}>
              <TouchableOpacity 
                style={styles.attachmentOption} 
                onPress={() => {
                  handleSendImage();
                  toggleAttachmentMenu();
                }}
              >
                <IconButton icon="image" size={24} color="#2196F3" />
                <Text style={{ color: isDark ? '#fff' : '#333' }}>Изображение</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.attachmentOption} 
                onPress={() => {
                  handleSendFile();
                  toggleAttachmentMenu();
                }}
              >
                <IconButton icon="file-document" size={24} color="#4CAF50" />
                <Text style={{ color: isDark ? '#fff' : '#333' }}>Файл</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.attachmentOption} 
                onPress={() => {
                  handleSendEmoji('🤔');
                  toggleAttachmentMenu();
                }}
              >
                <IconButton icon="emoticon-excited" size={24} color="#FFC107" />
                <Text style={{ color: isDark ? '#fff' : '#333' }}>Эмодзи</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
        
        {/* Модальное окно профиля сотрудника */}
        <Modal
          visible={showProfile}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowProfile(false)}
        >
          <View style={[styles.modalContainer, {backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.5)'}]}>
            <View style={[styles.profileContainer, {backgroundColor: isDark ? '#1e1e1e' : '#ffffff'}]}>
              <Appbar.Header style={[styles.profileHeader, {backgroundColor: isDark ? '#1e1e1e' : '#ffffff'}]}>
                <Appbar.BackAction onPress={() => setShowProfile(false)} color={isDark ? Colors.dark.text : '#333'} />
                <Appbar.Content title="Профиль сотрудника" color={isDark ? Colors.dark.text : '#333'} />
                <Appbar.Action icon="dots-vertical" onPress={() => {}} color={isDark ? Colors.dark.text : '#333'} />
              </Appbar.Header>
              
              <ScrollView contentContainerStyle={styles.profileContent}>
                <View style={styles.profileImageContainer}>
                  <Avatar.Image 
                    size={120} 
                    source={{ uri: profileEmployee?.avatarUrl }}
                    style={styles.profileImage}
                  />
                  <View style={updateStatusBadgeStyle()}>
                    <View style={[styles.statusDot, {backgroundColor: '#4CAF50'}]} />
                  </View>
                </View>
                
                <Text style={[styles.profileName, {color: isDark ? Colors.dark.text : '#333'}]}>
                  {profileEmployee?.name}
                </Text>
                
                <Text style={[styles.profilePosition, {color: isDark ? '#aaa' : '#666'}]}>
                  {profileEmployee?.position}
                </Text>
                
                <View style={updateDepartmentBadgeStyle()}>
                  <Icon name="briefcase" size={14} color={isDark ? '#fff' : '#333'} style={{marginRight: 4}} />
                  <Text style={[styles.profileDepartment, {color: isDark ? '#fff' : '#333'}]}>
                    {profileEmployee?.department || 'ИТ отдел'}
                  </Text>
                </View>
                
                <View style={[styles.statsContainer, {backgroundColor: isDark ? '#2a2a2a' : '#f8f8f8', borderRadius: 12}]}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: isDark ? Colors.dark.text : '#333'}]}>24</Text>
                    <Text style={[styles.statLabel, {color: isDark ? '#aaa' : '#888'}]}>Задачи</Text>
                  </View>
                  <View style={[styles.statDivider, {backgroundColor: isDark ? '#333' : '#eee'}]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: isDark ? Colors.dark.text : '#333'}]}>12</Text>
                    <Text style={[styles.statLabel, {color: isDark ? '#aaa' : '#888'}]}>Проекты</Text>
                  </View>
                  <View style={[styles.statDivider, {backgroundColor: isDark ? '#333' : '#eee'}]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: isDark ? Colors.dark.text : '#333'}]}>98%</Text>
                    <Text style={[styles.statLabel, {color: isDark ? '#aaa' : '#888'}]}>Рейтинг</Text>
                  </View>
                </View>
                
                <View style={[styles.sectionHeader, {borderBottomColor: isDark ? '#333' : '#eee'}]}>
                  <Icon name="user" size={16} color={isDark ? Colors.primary : Colors.primary} style={{marginRight: 8}} />
                  <Text style={[styles.sectionHeaderText, {color: isDark ? Colors.dark.text : '#333'}]}>
                    Личная информация
                  </Text>
                </View>
                
                <View style={[styles.infoCard, {backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5'}]}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <Icon name="mail" size={16} color={isDark ? '#aaa' : '#666'} style={{marginRight: 8}} />
                      <Text style={[styles.infoLabel, {color: isDark ? '#aaa' : '#666'}]}>Email:</Text>
                    </View>
                    <View style={styles.infoValueContainer}>
                      <Text style={[styles.infoValue, {color: isDark ? Colors.dark.text : '#333'}]}>
                        {profileEmployee?.email || 'example@company.com'}
                      </Text>
                      <TouchableOpacity style={styles.copyButton}>
                        <Icon name="copy" size={16} color="#2196F3" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <Icon name="phone" size={16} color={isDark ? '#aaa' : '#666'} style={{marginRight: 8}} />
                      <Text style={[styles.infoLabel, {color: isDark ? '#aaa' : '#666'}]}>Телефон:</Text>
                    </View>
                    <View style={styles.infoValueContainer}>
                      <Text style={[styles.infoValue, {color: isDark ? Colors.dark.text : '#333'}]}>
                        {profileEmployee?.phone || '+7 (XXX) XXX-XX-XX'}
                      </Text>
                      <TouchableOpacity style={styles.copyButton}>
                        <Icon name="copy" size={16} color="#2196F3" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <Icon name="map-pin" size={16} color={isDark ? '#aaa' : '#666'} style={{marginRight: 8}} />
                      <Text style={[styles.infoLabel, {color: isDark ? '#aaa' : '#666'}]}>Локация:</Text>
                    </View>
                    <Text style={[styles.infoValue, {color: isDark ? Colors.dark.text : '#333'}]}>
                      {profileEmployee?.location || 'Москва, Главный офис'}
                    </Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <Icon name="clock" size={16} color={isDark ? '#aaa' : '#666'} style={{marginRight: 8}} />
                      <Text style={[styles.infoLabel, {color: isDark ? '#aaa' : '#666'}]}>Часовой пояс:</Text>
                    </View>
                    <Text style={[styles.infoValue, {color: isDark ? Colors.dark.text : '#333'}]}>
                      {profileEmployee?.timezone || 'GMT+3 (Москва)'}
                    </Text>
                  </View>
                </View>
                
                <View style={[styles.sectionHeader, {borderBottomColor: isDark ? '#333' : '#eee'}]}>
                  <Icon name="bar-chart" size={16} color={isDark ? Colors.primary : Colors.primary} style={{marginRight: 8}} />
                  <Text style={[styles.sectionHeaderText, {color: isDark ? Colors.dark.text : '#333'}]}>
                    Рабочая информация
                  </Text>
                </View>
                
                <View style={[styles.infoCard, {backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5'}]}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <Icon name="briefcase" size={16} color={isDark ? '#aaa' : '#666'} style={{marginRight: 8}} />
                      <Text style={[styles.infoLabel, {color: isDark ? '#aaa' : '#666'}]}>Должность:</Text>
                    </View>
                    <Text style={[styles.infoValue, {color: isDark ? Colors.dark.text : '#333'}]}>
                      {profileEmployee?.position || 'Разработчик'}
                    </Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <Icon name="calendar" size={16} color={isDark ? '#aaa' : '#666'} style={{marginRight: 8}} />
                      <Text style={[styles.infoLabel, {color: isDark ? '#aaa' : '#666'}]}>Дата найма:</Text>
                    </View>
                    <Text style={[styles.infoValue, {color: isDark ? Colors.dark.text : '#333'}]}>
                      {profileEmployee?.hireDate || '01.01.2020'}
                    </Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <Icon name="users" size={16} color={isDark ? '#aaa' : '#666'} style={{marginRight: 8}} />
                      <Text style={[styles.infoLabel, {color: isDark ? '#aaa' : '#666'}]}>Команда:</Text>
                    </View>
                    <Text style={[styles.infoValue, {color: isDark ? Colors.dark.text : '#333'}]}>
                      {profileEmployee?.team || 'Команда разработки'}
                    </Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <Icon name="user-check" size={16} color={isDark ? '#aaa' : '#666'} style={{marginRight: 8}} />
                      <Text style={[styles.infoLabel, {color: isDark ? '#aaa' : '#666'}]}>Руководитель:</Text>
                    </View>
                    <Text style={[styles.infoValue, {color: isDark ? Colors.dark.text : '#333'}]}>
                      {profileEmployee?.manager || 'Иванов И.И.'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity 
                    style={[styles.actionButton, {backgroundColor: isDark ? '#1e476b' : '#e3f2fd'}]}
                    onPress={() => {
                      setShowProfile(false);
                      // Здесь можно добавить переход к списку задач сотрудника
                    }}
                  >
                    <Icon name="list" size={16} color={isDark ? Colors.dark.text : '#2196F3'} style={{marginRight: 8}} />
                    <Text style={[styles.actionButtonText, {color: isDark ? Colors.dark.text : '#2196F3'}]}>
                      Просмотр задач
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.messageButton, {backgroundColor: '#2196F3', marginTop: 8}]}
                    onPress={() => setShowProfile(false)}
                  >
                    <Icon name="message-circle" size={16} color="#fff" style={{marginRight: 8}} />
                    <Text style={[styles.actionButtonText, {color: '#fff'}]}>
                      Вернуться к чату
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    elevation: 0,
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
    padding: 12,
    paddingBottom: 16,
  },
  messageContainer: {
    flexDirection: 'column',
    marginVertical: 6,
    maxWidth: '85%',
    borderRadius: 20,
    padding: 16,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    marginLeft: 'auto',
    borderBottomRightRadius: 8,
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    marginRight: 'auto',
    borderBottomLeftRadius: 8,
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
  messageSender: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 6,
  },
  messageTextContainer: {
    marginVertical: 4,
  },
  messageText: {
    fontSize: 17,
    color: '#333',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  inputContainer: {
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    maxHeight: 120,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginHorizontal: 8,
  },
  inputIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  inputIconButtonActive: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    flexDirection: 'column',
    marginLeft: 8,
  },
  headerStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  profileContainer: {
    width: '90%',
    maxHeight: '90%',
    borderRadius: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  profileHeader: {
    elevation: 0,
    backgroundColor: '#fff',
  },
  profileContent: {
    padding: 16,
    alignItems: 'center',
  },
  profileImageContainer: {
    marginVertical: 16,
    position: 'relative',
    alignItems: 'center',
  },
  profileImage: {
    backgroundColor: '#e0e0e0',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  profilePosition: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  profileDepartment: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#eee',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  copyButton: {
    padding: 4,
  },
  actionButtonsContainer: {
    width: '100%',
    marginTop: 8,
    marginBottom: 24,
  },
  actionButton: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageButton: {
    borderWidth: 0,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  attachmentMenu: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    justifyContent: 'space-around',
    borderTopColor: '#eee',
  },
  attachmentOption: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    marginHorizontal: 6,
  },
  typingContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  typingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  swipeActionContainer: {
    justifyContent: 'center',
    marginVertical: 6,
  },
  swipeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginLeft: 8,
  },
  swipeActionText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  replyContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  replyContent: {
    flex: 1,
    flexDirection: 'row',
  },
  replyLine: {
    width: 4,
    borderRadius: 2,
    marginRight: 8,
  },
  replyTextContainer: {
    flex: 1,
  },
  replyToText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  replyText: {
    fontSize: 14,
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
}); 