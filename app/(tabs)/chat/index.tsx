import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, Image, Animated, Dimensions, Easing, SectionList, Pressable, ScrollView } from 'react-native';
import { Searchbar, FAB, Avatar, Badge, Divider, ActivityIndicator, Button, Checkbox, TextInput, RadioButton } from 'react-native-paper';
import { useChat } from '../../../context/ChatContext';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { ChatRoom } from '../../../types';
import { format, isToday, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedContainer } from '@/components/ThemedContainer';
import { Colors } from '@/constants/Colors';
import { getEmployeeInfo, DEMO_EMPLOYEES } from '../../../context/ChatContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChatListScreen() {
  const chatContext = useChat();
  const authContext = useAuth();
  const themeContext = useTheme();
  
  if (!chatContext || !authContext || !themeContext) {
    return (
      <ThemedContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </ThemedContainer>
    );
  }

  const { chatRooms = [], messages = [], getUnreadCount, refreshChatData, resetAndRefreshChatData, createGroupChat, ensureChatsWithAllEmployees } = chatContext;
  const { user } = authContext;
  const { isDark } = themeContext;
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChatRooms, setFilteredChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [sectionedData, setSectionedData] = useState<{title: string, data: any[]}[]>([]);
  
  // Новые состояния для создания чата
  const [createChatModalVisible, setCreateChatModalVisible] = useState(false);
  const [chatType, setChatType] = useState<'personal' | 'group'>('group');
  const [selectedEmployees, setSelectedEmployees] = useState<{id: string, name: string, selected: boolean}[]>([]);
  const [groupChatName, setGroupChatName] = useState('');

  // Рефы для анимаций
  const fadeAnim = useRef<Animated.Value>();
  const scaleAnim = useRef<Animated.Value>();
  const translateYAnim = useRef<Animated.Value>();
  const slideIn = useRef<Animated.Value>();
  const fabScaleAnim = useRef<Animated.Value>();
  const fabRotateAnim = useRef<Animated.Value>();
  const fabRotate = useMemo(() => {
    if (!fabRotateAnim.current) return '0deg';
    return fabRotateAnim.current.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg']
    });
  }, [fabRotateAnim.current]);

  // Инициализация анимаций
  useEffect(() => {
    // Создаем новые значения анимаций
    fadeAnim.current = new Animated.Value(0);
    scaleAnim.current = new Animated.Value(0.95);
    translateYAnim.current = new Animated.Value(20);
    slideIn.current = new Animated.Value(0);
    fabScaleAnim.current = new Animated.Value(0);
    fabRotateAnim.current = new Animated.Value(0);

    // Запускаем анимации
    const animations = Animated.stagger(100, [
      Animated.parallel([
        Animated.timing(fadeAnim.current, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim.current, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim.current, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideIn.current, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      
      Animated.spring(fabScaleAnim.current, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]);

    const rotationAnimation = Animated.loop(
      Animated.timing(fabRotateAnim.current, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Запускаем анимации
    animations.start();
    rotationAnimation.start();

    // Очистка при размонтировании
    return () => {
      animations.stop();
      rotationAnimation.stop();
      
      fadeAnim.current?.setValue(0);
      scaleAnim.current?.setValue(0.95);
      translateYAnim.current?.setValue(20);
      slideIn.current?.setValue(0);
      fabScaleAnim.current?.setValue(0);
      fabRotateAnim.current?.setValue(0);
    };
  }, []);

  useEffect(() => {
    // Загружаем данные при первом входе
    const loadData = async () => {
      try {
        console.log("Загрузка данных чата...");
        
        // Обновляем данные чатов
        if (refreshChatData) {
          await refreshChatData();
          console.log("Данные чатов обновлены");
        } else {
          console.warn("Функция refreshChatData не найдена");
        }
        
      setLoading(false);
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    // Формируем список сотрудников
    if (user) {
      const employees = DEMO_EMPLOYEES
        .filter(emp => emp.id !== user.id)
        .map(emp => ({
          id: emp.id,
          name: emp.name,
          avatarUrl: emp.avatarUrl,
          position: emp.position,
          isOnline: emp.isOnline,
          type: 'employee'
        }));
      
      // Добавляем специальные групповые чаты
      const specialChats = [
        {
          id: 'general-chat',
          name: 'Общий чат',
          isGroup: true,
          type: 'special-chat',
          description: 'Чат для всей команды'
        },
        {
          id: 'meetings-chat',
          name: 'Чат митингов',
          isGroup: true,
          type: 'special-chat',
          description: 'Обсуждение предстоящих встреч'
        }
      ];
      
      setEmployeesList([...specialChats, ...employees]);
    }
  }, [user]);

  // Безопасная функция проверки непрочитанных сообщений
  const getUnreadCountForRoom = useCallback((roomId) => {
    try {
      if (!user || !messages) return 0;
      
      const chatRoom = chatRooms?.find(room => room.id === roomId);
      if (!chatRoom) return 0;
      
      const roomMessages = messages.filter(message => {
        if (chatRoom.isGroupChat) {
          return message.chatRoomId === roomId || 
                (message.receiverId === null && chatRoom.participants.includes(message.senderId));
      } else {
          const participants = chatRoom.participants;
          return (message.chatRoomId === roomId) || 
                (participants.includes(message.senderId) && 
                participants.includes(message.receiverId || '') && 
                participants.length === 2);
        }
      });
      
      // Считаем непрочитанные сообщения для текущего пользователя в этой комнате
      return roomMessages.filter(msg => 
        !msg.isRead && msg.senderId !== user.id && 
        (msg.receiverId === user.id || msg.receiverId === null)
      ).length;
    } catch (error) {
      console.error('Error in getUnreadCountForRoom:', error);
      return 0;
    }
  }, [user, messages, chatRooms]);

  // Безопасное получение предпросмотра последнего сообщения
  const getLastMessagePreview = useCallback((room) => {
    try {
      if (!room || !messages || !user) {
        return { text: 'Нет сообщений', sender: '', timestamp: new Date() };
      }
      
      // Если у комнаты уже есть lastMessage как объект
      if (room.lastMessage && typeof room.lastMessage === 'object' && room.lastMessage.text) {
        return {
          text: room.lastMessage.text,
          sender: room.lastMessage.senderId === user.id ? 'Вы: ' : '',
          timestamp: room.lastMessage.timestamp || new Date(),
        };
      }
      
      // Если lastMessage - это строка
      if (room.lastMessage && typeof room.lastMessage === 'string') {
      return {
          text: room.lastMessage,
          sender: '',
          timestamp: room.timestamp || room.updatedAt || new Date(),
      };
    }
    
    // Находим сообщения для этой комнаты
    const roomMessages = messages.filter(msg => {
        if (!room.id) return false;
        
      if (room.isGroupChat) {
          return msg.chatRoomId === room.id || 
                (msg.receiverId === null && room.participants?.includes(msg.senderId));
      } else {
          const participants = room.participants || [];
        return (msg.chatRoomId === room.id) || 
               (participants.includes(msg.senderId) && 
                participants.includes(msg.receiverId || '') && 
                participants.length === 2);
      }
    });
    
    // Сортируем по времени и берем последнее
      const sortedMessages = [...roomMessages].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      const lastRoomMessage = sortedMessages.length > 0 ? sortedMessages[0] : null;
    
    if (lastRoomMessage) {
      return {
          text: lastRoomMessage.text || 'Новое сообщение',
          sender: lastRoomMessage.senderId === user.id ? 'Вы: ' : '',
          timestamp: lastRoomMessage.timestamp || new Date(),
        };
      }
      
      return { 
        text: 'Нет сообщений', 
        sender: '', 
        timestamp: room.updatedAt || new Date() 
      };
    } catch (error) {
      console.error('Error in getLastMessagePreview:', error);
      return { text: 'Нет сообщений', sender: '', timestamp: new Date() };
    }
  }, [messages, user]);

  useEffect(() => {
    // Фильтруем чаты для текущего пользователя
    if (user && chatRooms && Array.isArray(chatRooms)) {
      try {
        console.log(`Обработка ${chatRooms.length} чатов для пользователя ${user.id}`);
        // Проверяем наличие чатов с участием текущего пользователя
        const userChatRooms = chatRooms.filter(room => {
          const isUserParticipant = room.participants?.includes(user.id);
          if (!isUserParticipant) {
            console.log(`Чат ${room.id} не включает текущего пользователя`);
          }
          return isUserParticipant;
        });
        
        console.log(`Найдено ${userChatRooms.length} чатов с участием пользователя`);
        
      // Сортируем чаты: сначала с непрочитанными сообщениями, затем по времени последнего сообщения
        const sortedChatRooms = userChatRooms.sort((a, b) => {
          // Проверяем наличие непрочитанных сообщений
          const unreadCountA = getUnreadCountForRoom(a.id);
          const unreadCountB = getUnreadCountForRoom(b.id);
          
          // Если у чата A есть непрочитанные, а у B нет - A выше
          if (unreadCountA > 0 && unreadCountB === 0) return -1;
          // Если у чата B есть непрочитанные, а у A нет - B выше
          if (unreadCountB > 0 && unreadCountA === 0) return 1;
          
          // В остальных случаях сортируем по времени последнего обновления (в обратном порядке)
          const timeA = a.lastMessage?.timestamp 
            ? new Date(a.lastMessage.timestamp).getTime() 
            : new Date(a.updatedAt || Date.now()).getTime();
          const timeB = b.lastMessage?.timestamp 
            ? new Date(b.lastMessage.timestamp).getTime() 
            : new Date(b.updatedAt || Date.now()).getTime();
          
          return timeB - timeA;
        });
      
      // Применяем поиск по названию чата
        let filteredRooms = sortedChatRooms;
        let filteredEmployees = employeesList;
        
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
          
          // Фильтруем чаты
          filteredRooms = sortedChatRooms.filter(room => 
            (room.name && room.name.toLowerCase().includes(query))
          );
          
          // Фильтруем сотрудников и специальные чаты
          filteredEmployees = employeesList.filter(item => 
            (item.name && item.name.toLowerCase().includes(query)) ||
            (item.description && item.description.toLowerCase().includes(query))
          );
        }
        
        // Проверяем список чатов перед установкой
        console.log(`После фильтрации осталось ${filteredRooms.length} чатов`);
        
        setFilteredChatRooms(filteredRooms);
        
        // Создаем секционированные данные
        const sections = [];
        
        // Находим специальные чаты среди фильтрованных сотрудников
        const specialChats = filteredEmployees.filter(item => item.type === 'special-chat');
        const regularEmployees = filteredEmployees.filter(item => item.type === 'employee');
        
        // Добавляем секцию специальных чатов, если есть специальные чаты и нет поискового запроса или есть совпадения
        if (specialChats.length > 0 && (!searchQuery.trim() || specialChats.some(chat => 
          (chat.name && chat.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (chat.description && chat.description.toLowerCase().includes(searchQuery.toLowerCase()))
        ))) {
          sections.push({
            title: 'Общие чаты',
            data: specialChats
          });
        }
        
        // Добавляем секцию сотрудников, если есть сотрудники
        if (regularEmployees.length > 0) {
          sections.push({
            title: 'Сотрудники',
            data: regularEmployees
          });
        }
        
        // Добавляем секцию чатов, если есть чаты
        if (filteredRooms.length > 0) {
          sections.push({
            title: 'Чаты',
            data: filteredRooms.map(room => ({...room, type: 'chat'}))
          });
        }
        
        console.log(`Создано ${sections.length} секций данных`);
        setSectionedData(sections);
      } catch (error) {
        console.error("Error processing chat rooms:", error);
        setSectionedData([]);
      }
    }
    
    setRefreshing(false);
  }, [chatRooms, user, searchQuery, employeesList]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (refreshChatData) {
    await refreshChatData();
    } else {
      setRefreshing(false);
    }
  };

  const handleResetChats = async () => {
    setLoading(true);
    try {
      if (resetAndRefreshChatData) {
      await resetAndRefreshChatData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Обновляем функцию getChatById для более надежного поиска
  const getChatById = useCallback((chatId) => {
    if (!chatRooms || !Array.isArray(chatRooms) || !chatId) return null;
    
    // Ищем чат по точному совпадению ID
    const exactMatch = chatRooms.find(room => room.id === chatId);
    if (exactMatch) return exactMatch;
    
    // Ищем чат по приблизительному совпадению ID (для совместимости)
    return chatRooms.find(room => room.id && room.id.includes(chatId)) || null;
  }, [chatRooms]);

  // Функция для получения или создания имени чата
  const getChatName = useCallback((chat) => {
    // Если имя уже задано, используем его
    if (chat.name) return chat.name;
    
    try {
      // Если это личный чат (2 участника), используем имя другого участника
      if (chat.participants?.length === 2 && !chat.isGroupChat && user) {
        // Находим ID другого участника
        const otherParticipantId = chat.participants.find(id => id !== user.id);
        if (!otherParticipantId) return 'Чат без названия';
        
        // Находим информацию о другом участнике
        const otherParticipant = DEMO_EMPLOYEES.find(emp => emp.id === otherParticipantId);
        return otherParticipant?.name || 'Пользователь';
      }
      
      // Если это групповой чат без названия
      if (chat.isGroupChat) {
        return 'Групповой чат';
      }
      
      return 'Чат без названия';
      } catch (error) {
      console.error('Ошибка при определении имени чата:', error);
      return 'Чат';
    }
  }, [user]);

  // Обновляем функцию handleChatRoomPress для дополнительной безопасности
  const handleChatRoomPress = useCallback((chatRoomId: string) => {
    // Проверяем существование чата перед переходом
    const chatExists = getChatById(chatRoomId);
    
    if (!chatExists) {
      console.warn(`Попытка перехода в несуществующий чат с ID: ${chatRoomId}`);
      // Если чат не существует, просто показываем сообщение об ошибке
      alert('Чат не найден. Попробуйте обновить список чатов.');
      return;
    }
    
    // Если чат существует, просто переходим к нему без анимации затемнения
    router.push(`/(tabs)/chat/${chatRoomId}`);
  }, [chatRooms, router, getChatById]);

  // Функция для форматирования временных меток
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: ru });
    } else if (isYesterday(date)) {
      return 'Вчера';
    } else {
      return format(date, 'dd MMM', { locale: ru });
      }
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return '';
    }
  };

  const renderChatItem = useCallback(({ item }) => {
    try {
      // Проверяем существование необходимых полей
      if (!item || !item.id || typeof item !== 'object') {
        console.warn("Невалидный объект чата:", JSON.stringify(item));
        return null;
      }

      // Получаем предварительный просмотр последнего сообщения безопасным способом
      let messagePreview = 'Нет сообщений';
      let timestamp = new Date();
      
      const lastMsgInfo = getLastMessagePreview(item);
      messagePreview = lastMsgInfo.text;
      timestamp = lastMsgInfo.timestamp;
      
      // Применяем анимации для каждого элемента списка
      const animatedStyle = {
        opacity: fadeAnim.current,
        transform: [{ scale: scaleAnim.current }, { translateY: translateYAnim.current }]
      };
      
      const unreadCount = getUnreadCountForRoom(item.id);

      // Определяем цвета аватара для чата на основе имени
      const getRandomColor = (name) => {
        const colors = [
          ['#FF6B6B', '#FF8E53'], // красный
          ['#4776E6', '#8E54E9'], // синий-фиолетовый
          ['#00B09B', '#96C93D'], // зеленый
          ['#FDC830', '#F37335'], // оранжевый
          ['#667EEA', '#764BA2'], // фиолетовый
          ['#EC008C', '#FC6767'], // розовый
          ['#1FA2FF', '#12D8FA']  // голубой
        ];
        
        // Используем имя для определения стабильного индекса цвета
        if (!name) return colors[0];
        const charSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        return colors[charSum % colors.length];
      };
      
      // Получаем имя чата
      const chatName = getChatName(item);
      
      // Определяем цвета аватара на основе имени
      const avatarColors = getRandomColor(chatName);
      
      // ИСПРАВЛЕНИЕ: создание Animated.Value должно происходить в хуке useEffect или useState, а не напрямую в функции рендеринга
      // const itemScaleAnim = useRef(new Animated.Value(1)).current;
      
      // Используем общую анимацию вместо создания новой для каждого элемента
      const itemScaleValue = 1;
      
      // Обработчик нажатия с анимацией только для этого элемента
      const handlePress = () => {
        // Вместо анимации локальной для элемента списка просто переходим в чат
        router.push(`/(tabs)/chat/${item.id}`);
    };

    return (
        <Animated.View style={[styles.chatItemContainer, animatedStyle]}>
          <Animated.View>
            <Pressable
              style={({ pressed }) => [
            styles.chatItem,
                pressed && styles.chatItemPressed,
                isDark ? styles.chatItemDark : styles.chatItemLight
          ]}
              onPress={handlePress}
              android_ripple={{color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}}
        >
              <View style={styles.avatarContainer}>
            {item.isGroupChat ? (
                  <View style={styles.groupAvatarStack}>
              <LinearGradient
                      colors={avatarColors}
                      style={[styles.groupAvatar, styles.groupAvatar1]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.avatarFallback}>
                        {chatName.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
                    <View style={[styles.groupAvatar, styles.groupAvatar2, {backgroundColor: isDark ? '#333' : '#DDD'}]}>
                      <MaterialCommunityIcons 
                        name="account-group" 
                        size={18} 
                        color={isDark ? '#AAA' : '#666'} 
                      />
                    </View>
                  </View>
                ) : (
                  item.avatar ? (
                    <Image 
                      source={{ uri: item.avatar }} 
                      style={styles.avatarImage} 
                    />
              ) : (
                <LinearGradient
                      colors={avatarColors}
                      style={styles.avatar}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.avatarFallback}>
                        {chatName.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              )
            )}
                {item.isOnline && !item.isGroup && (
                  <View style={[styles.statusIndicator, {
                    borderColor: isDark ? '#1E1E1E' : '#FFFFFF'
                  }]} />
            )}
          </View>
          
              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
              <Text 
                style={[
                  styles.chatName, 
                      isDark ? styles.textDark : styles.textLight,
                      unreadCount > 0 && styles.boldText
                ]} 
                numberOfLines={1}
              >
                {chatName}
              </Text>
              <Text 
                style={[
                      styles.timestamp, 
                      isDark ? styles.mutedTextDark : styles.mutedTextLight
                ]}
              >
                    {formatTimestamp(timestamp)}
              </Text>
            </View>
            
                <View style={styles.messagePreviewContainer}>
              <Text 
                style={[
                      styles.messagePreview, 
                      isDark ? styles.mutedTextDark : styles.mutedTextLight,
                      unreadCount > 0 && styles.boldText
                ]} 
                numberOfLines={1}
              >
                    {lastMsgInfo.sender + messagePreview}
              </Text>
              
              {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                  )}
                </View>
                
                {item.isMuted && (
                  <MaterialIcons 
                    name="volume-off" 
                    size={16} 
                    color={isDark ? '#888' : '#999'} 
                    style={styles.mutedIcon} 
                  />
              )}
            </View>
            </Pressable>
          </Animated.View>
        </Animated.View>
      );
    } catch (error) {
      console.error("Error rendering chat item:", error);
      return null; // Возвращаем null в случае ошибки рендеринга
    }
  }, [fadeAnim, scaleAnim, translateYAnim, getUnreadCountForRoom, getLastMessagePreview, getChatName, isDark, router]);

  // Функция для генерации случайных цветов градиента
  const getRandomGradientColors = () => {
    const colors = [
      ['#FF6B6B', '#FF8E53'],
      ['#4776E6', '#8E54E9'],
      ['#00B09B', '#96C93D'],
      ['#FDC830', '#F37335'],
      ['#667EEA', '#764BA2'],
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Получение инициалов из имени
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Функция для получения инициалов аватара
  const getAvatarInitial = (item: ChatRoom) => {
    return getInitials(item.name);
  };

  // Функция для определения цветов градиента по ID чата
  const getGradientColors = (chatId: string) => {
    // Используем ID для генерации стабильных цветов
    const hashCode = chatId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // Выбираем индекс из нашего массива цветов на основе хеша
    const colors = [
      ['#FF6B6B', '#FF8E53'],
      ['#4776E6', '#8E54E9'],
      ['#00B09B', '#96C93D'],
      ['#FDC830', '#F37335'],
      ['#667EEA', '#764BA2'],
      ['#EC008C', '#FC6767'],
      ['#1FA2FF', '#12D8FA'],
      ['#4CA1AF', '#2C3E50'],
      ['#C33764', '#1D2671'],
      ['#3A1C71', '#D76D77']
    ];
    
    const index = Math.abs(hashCode) % colors.length;
    return colors[index];
  };

  const handleEmployeePress = useCallback((employee) => {
    // Находим личный чат с этим сотрудником
    if (!user) return;
    
    setLoading(true);
    console.log(`Проверяем наличие чата с сотрудником ${employee.name} (ID: ${employee.id})`);
    
    // Ищем существующий чат с сотрудником
    const existingChat = chatRooms.find(room => 
            !room.isGroupChat && 
      room.participants.includes(user.id) && 
      room.participants.includes(employee.id) && 
            room.participants.length === 2
          );
          
    if (existingChat) {
      console.log(`Найден существующий чат с сотрудником: ${existingChat.id}`);
      setLoading(false);
      // Если чат существует, переходим в него
      router.push(`/(tabs)/chat/${existingChat.id}`);
        } else {
      console.log(`Создаем новый чат с сотрудником ${employee.name}`);
      // Если чата нет, создаем его
      createChatWithEmployee(employee)
        .then(createdChatId => {
          setLoading(false);
          if (createdChatId) {
            // После создания чата, переходим в него
            setTimeout(() => {
              router.push(`/(tabs)/chat/${createdChatId}`);
            }, 500);
          } else {
            alert('Не удалось создать чат с сотрудником');
          }
        })
        .catch(error => {
          console.error('Ошибка при создании чата с сотрудником:', error);
          setLoading(false);
          alert('Ошибка при создании чата с сотрудником');
        });
    }
  }, [user, chatRooms, router]);

  // Функция для создания чата с конкретным сотрудником
  const createChatWithEmployee = useCallback(async (employee) => {
    if (!user || !createGroupChat) {
      console.error('Отсутствует пользователь или функция создания чата');
      return null;
    }
    
    try {
      console.log(`Начинаем создание чата с сотрудником ${employee.name}`);
      // Создаем личный чат с сотрудником
      const createdChatId = await createGroupChat(
        employee.name, 
        [user.id, employee.id],
        null, // использовать автоматически сгенерированный ID
        false // не групповой чат
      );
      
      // Обновляем данные чатов
      if (resetAndRefreshChatData) {
        await resetAndRefreshChatData();
      } else if (refreshChatData) {
        await refreshChatData();
      }
      
      console.log(`Чат с сотрудником ${employee.name} создан, ID: ${createdChatId}`);
      return createdChatId;
      } catch (error) {
      console.error('Ошибка при создании чата с сотрудником:', error);
      throw error;
    }
  }, [user, createGroupChat, refreshChatData, resetAndRefreshChatData]);

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderContent}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#333333' }]}>
          {section.title}
                  </Text>
        {section.title === 'Чаты' && (
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{section.data.length}</Text>
                </View>
              )}
            </View>
          </View>
  );

  const renderItem = useCallback(({ item }) => {
    // Проверяем, что item существует, прежде чем пытаться рендерить
    if (!item || !item.id) {
      console.warn("Получен неверный элемент для рендеринга:", item);
      return null;
    }
    
    if (item.type === 'employee') {
      return renderEmployeeItem(item);
    } else if (item.type === 'special-chat') {
      return renderSpecialChatItem(item);
    } else {
      return renderChatItem({ item });
    }
  }, [renderEmployeeItem, renderSpecialChatItem, renderChatItem]);

  const renderEmployeeItem = useCallback((employee) => {
    try {
      if (!employee || !employee.id || typeof employee !== 'object') {
        console.warn("Невалидный объект сотрудника:", JSON.stringify(employee));
        return null;
      }

      // Определяем цвета аватара для сотрудника на основе имени
      const getRandomColor = (name) => {
        const colors = [
          ['#FF6B6B', '#FF8E53'], // красный
          ['#4776E6', '#8E54E9'], // синий-фиолетовый
          ['#00B09B', '#96C93D'], // зеленый
          ['#FDC830', '#F37335'], // оранжевый
          ['#667EEA', '#764BA2'], // фиолетовый
          ['#EC008C', '#FC6767'], // розовый
          ['#1FA2FF', '#12D8FA']  // голубой
        ];
        
        // Используем имя для определения стабильного индекса цвета
        if (!name) return colors[0];
        const charSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        return colors[charSum % colors.length];
      };
      
      const avatarColors = getRandomColor(employee.name || 'Employee');
      const employeeName = employee.name || 'Сотрудник';

  return (
        <Animated.View style={[styles.chatItemContainer, {
          opacity: fadeAnim.current,
          transform: [{ scale: scaleAnim.current }, { translateY: translateYAnim.current }]
        }]}>
          <TouchableOpacity 
            style={[styles.chatItem, isDark ? styles.chatItemDark : styles.chatItemLight]}
            onPress={() => handleEmployeePress(employee)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              {employee.avatarUrl ? (
                <Image source={{ uri: employee.avatarUrl }} style={styles.avatarImage} />
              ) : (
      <LinearGradient
                  colors={avatarColors}
                  style={styles.avatar}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.avatarFallback}>
                    {employeeName.charAt(0).toUpperCase()}
          </Text>
                </LinearGradient>
              )}
              <View style={[
                styles.statusIndicator, 
                { 
                  backgroundColor: employee.isOnline ? '#4CAF50' : '#9E9E9E',
                  borderColor: isDark ? '#1E1E1E' : '#FFFFFF',
                }
              ]} />
            </View>
            
            <View style={styles.chatInfo}>
                  <Text style={[
                styles.chatName, 
                { color: isDark ? '#FFFFFF' : '#333333' }
                  ]}>
                {employeeName}
                  </Text>
              {employee.position && (
                  <Text style={[
                  styles.messagePreview,
                  { color: isDark ? '#BBBBBB' : '#666666' }
                  ]}>
                  {employee.position}
                  </Text>
              )}
            </View>
          
          <TouchableOpacity 
              style={styles.chatNowButton}
              onPress={() => handleEmployeePress(employee)}
            >
              <MaterialCommunityIcons 
                name="chat" 
                size={20} 
                color="#0080FF" 
              />
          </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      );
    } catch (error) {
      console.error("Error rendering employee item:", error);
      return null;
    }
  }, [fadeAnim, scaleAnim, translateYAnim, isDark, handleEmployeePress]);

  const renderSpecialChatItem = useCallback((item) => {
    try {
      const animatedStyle = {
        opacity: fadeAnim.current,
        transform: [{ scale: scaleAnim.current }, { translateY: translateYAnim.current }]
      };

      // Определяем различные иконки и цвета для разных специальных чатов
      let iconName = 'account-group';
      let gradientColors = ['#4776E6', '#8E54E9']; // Фиолетовый по умолчанию
      
      if (item.id === 'general-chat') {
        iconName = 'account-group';
        gradientColors = ['#4776E6', '#8E54E9']; // Фиолетовый
      } else if (item.id === 'meetings-chat') {
        iconName = 'calendar-clock';
        gradientColors = ['#FF6B6B', '#FF8E53']; // Оранжево-красный
      }
      
      // ИСПРАВЛЕНИЕ: Удаляем создание локальной анимации
      // const itemScaleAnim = useRef(new Animated.Value(1)).current;
      
      // Обработчик нажатия без локальной анимации
      const handlePress = () => {
        handleSpecialChatPress(item.id);
      };
      
      return (
        <Animated.View style={[styles.chatItemContainer, animatedStyle]}>
          <Animated.View>
            <Pressable
              style={({ pressed }) => [
                styles.chatItem,
                pressed && styles.chatItemPressed,
                isDark ? styles.chatItemDark : styles.chatItemLight
              ]}
              onPress={handlePress}
              android_ripple={{color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}}
            >
                <LinearGradient
                colors={gradientColors}
                style={styles.specialChatAvatar}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
              >
                <MaterialCommunityIcons 
                  name={iconName} 
                  size={26} 
                  color="white" 
                />
              </LinearGradient>
              
              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text 
                    style={[
                      styles.chatName, 
                      isDark ? styles.textDark : styles.textLight,
                      styles.boldText
                    ]}
                    numberOfLines={1}
                  >
                          {item.name}
                </Text>
                      </View>
                
                <View style={styles.messagePreviewContainer}>
                  <Text 
                    style={[
                      styles.messagePreview, 
                      isDark ? styles.mutedTextDark : styles.mutedTextLight
                    ]}
                    numberOfLines={1}
                  >
                    {item.description}
                  </Text>
              </View>
      </View>
      
              <View style={styles.specialChatArrow}>
                <MaterialIcons 
                  name="keyboard-arrow-right" 
                  size={24} 
                  color={isDark ? '#888' : '#999'} 
                />
        </View>
            </Pressable>
          </Animated.View>
        </Animated.View>
      );
    } catch (error) {
      console.error("Error rendering special chat item:", error);
      return null;
    }
  }, [fadeAnim, scaleAnim, translateYAnim, isDark, handleSpecialChatPress]);

  // Обновляем обработчик для специальных чатов
  const handleSpecialChatPress = useCallback((chatId) => {
    // Проверяем, существует ли уже чат с таким ID
    const existingChat = getChatById(chatId);
    
    if (existingChat) {
      // Если чат существует, просто переходим в него
      router.push(`/(tabs)/chat/${chatId}`);
    } else {
      // Если чата нет, создаем групповой чат с соответствующим названием
      setLoading(true);
      
      let chatName = 'Новый чат';
      if (chatId === 'general-chat') {
        chatName = 'Общий чат';
      } else if (chatId === 'meetings-chat') {
        chatName = 'Чат митингов';
      }
      
      // Создаем групповой чат со всеми сотрудниками
      const participants = [user?.id || ''];
      DEMO_EMPLOYEES.forEach(emp => {
        if (emp.id !== user?.id) {
          participants.push(emp.id);
        }
      });
      
      if (createGroupChat) {
        createGroupChat(chatName, participants, chatId, true) // Явно указываем, что это групповой чат
          .then(createdChatId => {
            if (resetAndRefreshChatData) {
              resetAndRefreshChatData().then(() => {
                setLoading(false);
                if (createdChatId) {
                  setTimeout(() => {
                    router.push(`/(tabs)/chat/${createdChatId}`);
                  }, 500); // Небольшая задержка для обновления UI
                }
              });
            } else if (refreshChatData) {
              refreshChatData().then(() => {
                setLoading(false);
                if (createdChatId) {
                  setTimeout(() => {
                    router.push(`/(tabs)/chat/${createdChatId}`);
                  }, 500); // Небольшая задержка для обновления UI
                }
              });
            } else {
              setLoading(false);
              if (createdChatId) {
                router.push(`/(tabs)/chat/${createdChatId}`);
              }
            }
          })
          .catch(error => {
            console.error('Ошибка при создании группового чата:', error);
            setLoading(false);
            alert('Ошибка при создании группового чата: ' + error.message);
          });
      } else {
        console.warn('Функция createGroupChat не найдена');
        setLoading(false);
        alert('Функция для создания чатов не найдена');
      }
    }
  }, [chatRooms, user, createGroupChat, refreshChatData, resetAndRefreshChatData, router, getChatById]);

  // Инициализация списка сотрудников при открытии модального окна
  const openCreateChatModal = () => {
    try {
      // Получаем ID сотрудников, с которыми у нас уже есть чаты
      const existingChatEmployeeIds = new Set<string>();
      
      if (user) {
        chatRooms
          .filter(room => !room.isGroupChat && room.participants.includes(user.id) && room.participants.length === 2)
          .forEach(room => {
            const otherParticipantId = room.participants.find(id => id !== user.id);
              if (otherParticipantId) {
              existingChatEmployeeIds.add(otherParticipantId);
            }
          });
      }
      
      // Инициализируем список сотрудников, исключая тех, с кем уже есть чаты
      const initialSelectedEmployees = DEMO_EMPLOYEES
        .filter(emp => emp.id !== user?.id && !existingChatEmployeeIds.has(emp.id))
        .map(emp => ({
          id: emp.id,
          name: emp.name,
          selected: false
        }));
      
      // Если нет новых сотрудников для личных чатов, сразу переключаемся на групповой чат
      if (initialSelectedEmployees.length === 0) {
        setChatType('group');
      }
      
      setSelectedEmployees(initialSelectedEmployees);
      setGroupChatName('');
      setCreateChatModalVisible(true);
    } catch (error) {
      console.error("Error opening create chat modal:", error);
      // Fallback на прямое открытие модального окна
      setCreateChatModalVisible(true);
    }
  };

  const handleCreateChatsWithAllEmployees = async () => {
    setLoading(true);
    try {
      console.log("Начинаем создание чатов со всеми сотрудниками...");
      
      // Проверяем, все ли сотрудники имеют личные чаты с текущим пользователем
      if (!user || !DEMO_EMPLOYEES) {
        console.error("Нет данных пользователя или списка сотрудников");
        alert('Ошибка: Нет данных о сотрудниках');
        return;
      }
      
      // Получаем идентификаторы всех сотрудников, кроме текущего пользователя
      const employeeIds = DEMO_EMPLOYEES
        .filter(emp => emp.id !== user.id)
        .map(emp => emp.id);
      
      console.log(`Найдено ${employeeIds.length} сотрудников для создания чатов`);
      
      // Создаем личные чаты с каждым сотрудником
      const createPromises = [];
      
      // Сначала обрабатываем специальные групповые чаты, чтобы они были созданы первыми
      const specialChats = [
        { id: 'general-chat', name: 'Общий чат' },
        { id: 'meetings-chat', name: 'Чат митингов' }
      ];
      
      for (const specialChat of specialChats) {
        const existingChat = chatRooms.find(room => room.id === specialChat.id);
        
        if (!existingChat) {
          console.log(`Создаю специальный чат: ${specialChat.name}`);
          if (createGroupChat) {
            // Создаем групповой чат со всеми сотрудниками
            const allParticipants = [user.id, ...employeeIds];
            const promise = createGroupChat(
              specialChat.name,
              allParticipants,
              specialChat.id,
              true // групповой чат
            );
            createPromises.push(promise);
          }
        } else {
          console.log(`Специальный чат ${specialChat.name} уже существует`);
        }
      }
      
      // Затем обрабатываем личные чаты с сотрудниками
      for (const employeeId of employeeIds) {
        // Получаем информацию о сотруднике
        const employee = DEMO_EMPLOYEES.find(emp => emp.id === employeeId);
        if (!employee) continue;
        
        // Проверяем, существует ли уже чат с этим сотрудником
        const existingChat = chatRooms.find(room => 
          !room.isGroupChat && 
          room.participants.includes(user.id) && 
          room.participants.includes(employeeId) && 
          room.participants.length === 2
        );
        
        if (!existingChat) {
          console.log(`Создаю чат с сотрудником ${employee.name}`);
          if (createGroupChat) {
            // Создаем личный чат с сотрудником
            const promise = createGroupChat(
              employee.name, 
              [user.id, employeeId],
              null, // использовать автоматически сгенерированный ID
              false // не групповой чат
            );
            createPromises.push(promise);
          }
        } else {
          console.log(`Чат с сотрудником ${employee.name} уже существует`);
        }
      }
      
      if (createPromises.length > 0) {
        // Дожидаемся создания всех чатов
        try {
          await Promise.all(createPromises);
          console.log(`Создано ${createPromises.length} новых чатов`);
          
          // Сначала делаем полный сброс данных
          if (resetAndRefreshChatData) {
            await resetAndRefreshChatData();
            console.log("Данные чатов полностью обновлены после сброса");
          } else if (refreshChatData) {
            // Если функция сброса недоступна, просто обновляем
            await refreshChatData();
            console.log("Данные чатов обновлены");
          }
          
          // Обязательно дожидаемся завершения обновления данных
          setTimeout(() => {
            setLoading(false);
            alert(`Создано ${createPromises.length} новых чатов`);
          }, 1000); // Даем время на полное обновление списка
        } catch (error) {
          console.error("Ошибка при создании чатов:", error);
          setLoading(false);
          alert('Ошибка при создании чатов: ' + error.message);
        }
      } else {
        console.log("Все чаты уже существуют");
        setLoading(false);
        alert('Все чаты уже созданы');
      }
    } catch (error) {
      console.error("Ошибка при создании чатов:", error);
      setLoading(false);
      alert('Ошибка при создании чатов: ' + error.message);
    }
  };

  // Создаем стили внутри компонента, чтобы иметь доступ к isDark
const styles = StyleSheet.create({
  container: {
    flex: 1,
      backgroundColor: isDark ? '#121212' : '#F8F9FA',
  },
  header: {
      backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
      paddingTop: 55,
      paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333333' : '#E0E0E0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 4,
      elevation: isDark ? 8 : 4,
    },
    searchContainer: {
    flexDirection: 'row',
      backgroundColor: isDark ? '#333333' : '#F0F0F5',
      borderRadius: 12,
    alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 12,
    marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 2,
      elevation: isDark ? 3 : 1,
    },
    searchIcon: {
      marginRight: 10,
      color: isDark ? '#AAAAAA' : '#777777',
    },
    searchInput: {
    flex: 1,
      fontSize: 16,
      color: isDark ? '#FFFFFF' : '#333333',
    },
    createAllChatsButton: {
      flexDirection: 'row',
    alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#5E60CE',
      borderRadius: 12,
      padding: 12,
      marginTop: 5,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 2,
    },
    createAllChatsText: {
      color: '#FFFFFF',
      marginLeft: 8,
      fontWeight: '600',
    fontSize: 14,
  },
    sectionHeader: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: isDark ? 'rgba(33, 33, 33, 0.95)' : 'rgba(240, 240, 245, 0.95)',
    borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333333' : '#E0E0E0',
  },
    sectionHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
    sectionTitle: {
      fontSize: 13,
    fontWeight: 'bold',
      color: isDark ? '#BBBBBB' : '#777777',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionBadge: {
      backgroundColor: '#0080FF',
      borderRadius: 12,
      paddingHorizontal: 6,
    },
    sectionBadgeText: {
      color: 'white',
      fontSize: 12,
    fontWeight: 'bold',
  },
    employeeItem: {
    flexDirection: 'row',
      padding: 15,
      marginHorizontal: 15,
      marginVertical: 6,
    borderRadius: 16,
      backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.1,
      shadowRadius: 4,
      elevation: isDark ? 4 : 2,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(51, 51, 51, 0.5)' : 'rgba(240, 240, 240, 0.5)',
  },
  avatarContainer: {
      marginRight: 15,
    position: 'relative',
  },
    avatar: {
      width: 55,
      height: 55,
      borderRadius: 27.5,
      backgroundColor: isDark ? '#333333' : '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#333333' : '#F0F0F0',
    },
    avatarImage: {
      width: 55,
      height: 55,
      borderRadius: 27.5,
    },
    avatarFallback: {
      fontSize: 20,
    fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#555555',
    },
    employeeInfo: {
      flex: 1,
    justifyContent: 'center',
  },
    employeeName: {
      fontSize: 16,
    fontWeight: 'bold',
      marginBottom: 3,
      color: isDark ? '#FFFFFF' : '#333333',
    },
    employeePosition: {
      fontSize: 14,
      color: isDark ? '#BBBBBB' : '#666666',
    },
    statusIndicator: {
    position: 'absolute',
      bottom: 0,
      right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
      borderColor: isDark ? '#1E1E1E' : '#FFFFFF',
    },
    chatNowButton: {
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? '#2A2A2A' : '#F0F0F5',
    },
    chatItemContainer: {
      marginHorizontal: 15,
      marginVertical: 6,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.1,
      shadowRadius: 4,
      elevation: isDark ? 4 : 2,
    },
    chatItem: {
      flexDirection: 'row',
      padding: 16,
      borderRadius: 16,
    },
    chatItemPressed: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    },
    chatItemLight: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: 'rgba(240, 240, 240, 0.5)',
    },
    chatItemDark: {
      backgroundColor: '#1E1E1E',
      borderWidth: 1,
      borderColor: 'rgba(51, 51, 51, 0.5)',
  },
  chatInfo: {
    flex: 1,
      justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
    boldText: {
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
  },
    messagePreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
    messagePreview: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
    textLight: {
      color: '#333333',
    },
    textDark: {
      color: '#F1F1F1',
    },
    mutedTextLight: {
      color: '#757575',
    },
    mutedTextDark: {
      color: '#A0A0A0',
    },
    groupAvatarStack: {
      width: 55,
      height: 55,
      position: 'relative',
    },
    groupAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
    },
    groupAvatar1: {
      position: 'absolute',
      top: 0,
      left: 0,
      borderColor: isDark ? '#1E1E1E' : '#FFFFFF',
    },
    groupAvatar2: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      borderColor: isDark ? '#1E1E1E' : '#FFFFFF',
    },
    onlineIndicator: {
      position: 'absolute',
      bottom: 3,
      right: 3,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#4caf50',
      borderWidth: 2,
      borderColor: '#1e1e1e',
  },
  unreadBadge: {
      backgroundColor: '#0080FF',
      borderRadius: 12,
      minWidth: 24,
      height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
    unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
    mutedIcon: {
      position: 'absolute',
      right: 0,
      bottom: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
      backgroundColor: isDark ? '#121212' : '#F8F9FA',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
      paddingVertical: 50,
      paddingHorizontal: 20,
      backgroundColor: isDark ? '#121212' : '#F8F9FA',
    },
    emptyIcon: {
      marginBottom: 20,
      color: isDark ? '#555555' : '#CCCCCC',
  },
  emptyText: {
      fontSize: 17,
    textAlign: 'center',
      color: isDark ? '#999999' : '#666666',
      marginBottom: 15,
    },
    createChatsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#5E60CE',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      marginTop: 16,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    createChatsButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      marginLeft: 8,
      fontSize: 16,
    },
    fabContainer: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#5E60CE',
    justifyContent: 'center',
    alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.5 : 0.3,
      shadowRadius: 6,
      elevation: 8,
    },
    specialChatAvatar: {
      width: 55,
      height: 55,
      borderRadius: 27.5,
      justifyContent: 'center',
    alignItems: 'center',
    },
    specialChatArrow: {
      position: 'absolute',
      right: 10,
      top: '50%',
      transform: [{ translateY: -12 }],
    },
    listContent: {
      paddingBottom: 80,
    },
    listHeaderSpace: {
      height: 10,
    },
    createAllChatsButtonFlat: {
    flexDirection: 'row',
    alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#5E60CE',
      borderRadius: 12,
      padding: 12,
      margin: 16,
      marginTop: 8,
    marginBottom: 8,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 2,
    },
    sectionHeaderFlat: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    paddingHorizontal: 16,
      paddingVertical: 8,
      marginTop: 8,
      marginBottom: 4,
    },
    sectionTitleFlat: {
      fontSize: 14,
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#333333',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionBadgeFlat: {
      backgroundColor: '#0080FF',
      borderRadius: 12,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: 20,
    },
    modalContainer: {
      width: '100%',
      maxHeight: '80%',
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
      padding: 16,
    borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333333' : '#EEEEEE',
    },
    modalTitle: {
      fontSize: 18,
    fontWeight: 'bold',
  },
    modalContent: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333333' : '#EEEEEE',
    },
    modalCancelButton: {
      padding: 12,
      borderRadius: 12,
      width: '48%',
    alignItems: 'center',
  },
    modalCreateButton: {
      padding: 12,
      borderRadius: 12,
      width: '48%',
    alignItems: 'center',
  },
    chatTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    chatTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
      padding: 10,
      borderRadius: 12,
      width: '48%',
      justifyContent: 'center',
  },
  chatTypeButtonActive: {
      borderWidth: 1,
      borderColor: '#0080FF',
    },
    chatTypeText: {
      marginLeft: 8,
      fontSize: 14,
    },
    chatTypeTextActive: {
    fontWeight: 'bold',
    },
    groupChatNameContainer: {
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    groupChatNameInput: {
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      fontSize: 16,
    },
    modalSectionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 8,
      marginTop: 4,
    },
    employeeSelectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
  },
    employeeSelectInfo: {
    flex: 1,
    },
    noEmployeesText: {
      textAlign: 'center',
      padding: 20,
      fontSize: 14,
  },
}); 

  // Функция для создания нового чата из модального окна
  const handleCreateChat = async () => {
    try {
      setLoading(true);
      setCreateChatModalVisible(false);
      
      if (chatType === 'personal') {
        // Находим выбранного сотрудника
        const selectedEmployee = selectedEmployees.find(emp => emp.selected);
        if (!selectedEmployee || !user) {
          setLoading(false);
          return;
        }
        
        // Находим существующий чат с этим сотрудником
        const existingChat = chatRooms.find(room => 
          !room.isGroupChat && 
          room.participants.includes(user.id) && 
          room.participants.includes(selectedEmployee.id) && 
          room.participants.length === 2
        );
        
        if (existingChat) {
          // Если чат существует, переходим в него
          router.push(`/(tabs)/chat/${existingChat.id}`);
          setLoading(false);
        } else {
          // Если чата нет, создаем его
          if (createGroupChat) {
            const employeeInfo = DEMO_EMPLOYEES.find(emp => emp.id === selectedEmployee.id);
            const chatName = employeeInfo?.name || 'Новый чат';
            
            const createdChatId = await createGroupChat(
              chatName, 
              [user.id, selectedEmployee.id],
              null, // использовать автоматически сгенерированный ID
              false // не групповой чат
            );
            
            // Обновляем данные чатов
            if (refreshChatData) {
              await refreshChatData();
            }
            
            // Переходим в созданный чат
            setTimeout(() => {
              router.push(`/(tabs)/chat/${createdChatId}`);
              setLoading(false);
            }, 500);
          } else {
            setLoading(false);
            alert('Функция для создания чатов не найдена');
          }
        }
      } else if (chatType === 'group') {
        // Создаем групповой чат
        if (!createGroupChat || !user || groupChatName.trim() === '') {
          setLoading(false);
          return;
        }
        
        // Получаем список выбранных сотрудников
        const selectedEmployeeIds = selectedEmployees
          .filter(emp => emp.selected)
          .map(emp => emp.id);
        
        if (selectedEmployeeIds.length === 0) {
          setLoading(false);
          return;
        }
        
        // Добавляем текущего пользователя в список участников
        const participants = [user.id, ...selectedEmployeeIds];
        
        // Создаем групповой чат
        const createdChatId = await createGroupChat(
          groupChatName.trim(), 
          participants,
          null, // использовать автоматически сгенерированный ID
          true  // групповой чат
        );
        
        // Обновляем данные чатов
        if (refreshChatData) {
          await refreshChatData();
        }
        
        // Переходим в созданный чат
        setTimeout(() => {
          router.push(`/(tabs)/chat/${createdChatId}`);
          setLoading(false);
        }, 500);
      }
    } catch (error) {
      console.error('Ошибка при создании чата:', error);
      setLoading(false);
      alert('Ошибка при создании чата: ' + error.message);
    }
  };

  // Рендеринг компонента
  if (loading) {
    return (
      <ThemedContainer style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5E9FFF" />
      </ThemedContainer>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск"
            placeholderTextColor={isDark ? '#888888' : '#999999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5E9FFF" />
        </View>
      ) : sectionedData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="chat-bubble-outline" size={80} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>
            {searchQuery ? 'Ничего не найдено' : 'У вас еще нет чатов'}
          </Text>
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: '#5E9FFF', fontSize: 16 }}>Очистить поиск</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.createChatsButton}
            onPress={handleCreateChatsWithAllEmployees}
          >
            <MaterialCommunityIcons name="account-multiple-plus" size={20} color="white" />
            <Text style={styles.createChatsButtonText}>Создать чаты со всеми сотрудниками</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={[
            // Добавляем кнопку "Создать чаты со всеми сотрудниками" как первый элемент
            { id: 'create-chats-button', type: 'button' },
            // Добавляем заголовок "Общие чаты"
            { id: 'general-chats-header', type: 'section-header', title: 'Общие чаты' },
            // Добавляем общие чаты с гарантированно уникальными ключами
            ...employeesList
              .filter(item => item.type === 'special-chat')
              .map(item => ({...item, uniqueKey: `special-chat-${item.id}`})),
            // Добавляем заголовок "Сотрудники"
            { id: 'employees-header', type: 'section-header', title: 'Сотрудники' },
            // Добавляем сотрудников с гарантированно уникальными ключами
            ...employeesList
              .filter(item => item.type === 'employee')
              .map(item => ({...item, uniqueKey: `employee-${item.id}`})),
            // Добавляем заголовок "Личные чаты"
            ...(filteredChatRooms.length > 0 ? [{ id: 'personal-chats-header', type: 'section-header', title: 'Личные чаты' }] : []),
            // Добавляем личные чаты с гарантированно уникальными ключами
            ...filteredChatRooms
              .map(room => ({...room, type: 'chat', uniqueKey: `chat-${room.id || Math.random().toString()}`})),
          ]}
          renderItem={({ item }) => {
            if (item.type === 'button') {
              return (
                <TouchableOpacity 
                  style={styles.createAllChatsButtonFlat}
                  onPress={handleCreateChatsWithAllEmployees}
                >
                  <MaterialCommunityIcons name="account-multiple-plus" size={20} color="#FFFFFF" />
                  <Text style={styles.createAllChatsText}>Создать чаты со всеми сотрудниками</Text>
                </TouchableOpacity>
              );
            } else if (item.type === 'section-header') {
              return (
                <View style={styles.sectionHeaderFlat}>
                  <Text style={styles.sectionTitleFlat}>{item.title}</Text>
                  {item.title === 'Личные чаты' && (
                    <View style={styles.sectionBadgeFlat}>
                      <Text style={styles.sectionBadgeText}>{filteredChatRooms.length}</Text>
                    </View>
                  )}
                </View>
              );
            } else if (item.type === 'employee') {
              return renderEmployeeItem(item);
            } else if (item.type === 'special-chat') {
              return renderSpecialChatItem(item);
            } else if (item.type === 'chat') {
              return renderChatItem({ item });
            }
            return null;
          }}
          keyExtractor={(item) => item.uniqueKey || item.id || `item-${Math.random().toString(36)}`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#5E9FFF']}
              tintColor={isDark ? '#5E9FFF' : '#5E9FFF'}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <Animated.View style={[styles.fabContainer, { transform: [{ scale: fabScaleAnim.current }] }]}>
        <TouchableOpacity 
          style={styles.fab}
          onPress={openCreateChatModal}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="message-plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Модальное окно создания чата */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={createChatModalVisible}
        onRequestClose={() => setCreateChatModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContainer, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#333333' }]}>
                Создать новый чат
              </Text>
              <TouchableOpacity onPress={() => setCreateChatModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={isDark ? '#BBBBBB' : '#666666'} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.chatTypeSelector}>
              <TouchableOpacity 
                style={[
                  styles.chatTypeButton, 
                  chatType === 'personal' && styles.chatTypeButtonActive,
                  { backgroundColor: isDark ? '#2A2A2A' : '#F0F0F5' }
                ]}
                onPress={() => setChatType('personal')}
              >
                <MaterialCommunityIcons 
                  name="account-outline" 
                  size={20} 
                  color={chatType === 'personal' ? '#0080FF' : (isDark ? '#BBBBBB' : '#666666')} 
                />
                <Text style={[
                  styles.chatTypeText,
                  chatType === 'personal' && styles.chatTypeTextActive,
                  { color: chatType === 'personal' ? '#0080FF' : (isDark ? '#BBBBBB' : '#666666') }
                ]}>
                  Личный чат
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.chatTypeButton, 
                  chatType === 'group' && styles.chatTypeButtonActive,
                  { backgroundColor: isDark ? '#2A2A2A' : '#F0F0F5' }
                ]}
                onPress={() => setChatType('group')}
              >
                <MaterialCommunityIcons 
                  name="account-group-outline" 
                  size={20} 
                  color={chatType === 'group' ? '#0080FF' : (isDark ? '#BBBBBB' : '#666666')} 
                />
                <Text style={[
                  styles.chatTypeText,
                  chatType === 'group' && styles.chatTypeTextActive,
                  { color: chatType === 'group' ? '#0080FF' : (isDark ? '#BBBBBB' : '#666666') }
                ]}>
                  Групповой чат
                </Text>
              </TouchableOpacity>
            </View>
            
            {chatType === 'group' && (
              <View style={styles.groupChatNameContainer}>
                <TextInput
                  style={[
                    styles.groupChatNameInput,
                    { 
                      backgroundColor: isDark ? '#2A2A2A' : '#F0F0F5',
                      color: isDark ? '#FFFFFF' : '#333333',
                      borderColor: isDark ? '#444444' : '#DDDDDD'
                    }
                  ]}
                  placeholder="Название группового чата"
                  placeholderTextColor={isDark ? '#888888' : '#999999'}
                  value={groupChatName}
                  onChangeText={setGroupChatName}
                />
              </View>
            )}
            
            <ScrollView style={styles.modalContent}>
              <Text style={[styles.modalSectionTitle, { color: isDark ? '#BBBBBB' : '#666666' }]}>
                {chatType === 'personal' ? 'Выберите пользователя' : 'Выберите участников'}
              </Text>
              
              {selectedEmployees.map((employee, index) => (
                <TouchableOpacity 
                  key={employee.id}
                  style={[
                    styles.employeeSelectItem,
                    { backgroundColor: isDark ? '#2A2A2A' : '#F0F0F5' }
                  ]}
                  onPress={() => {
                    const updatedEmployees = [...selectedEmployees];
                    updatedEmployees[index] = {
                      ...employee,
                      selected: !employee.selected
                    };
                    setSelectedEmployees(updatedEmployees);
                  }}
                >
                  <View style={styles.employeeSelectInfo}>
                    <Text style={{ color: isDark ? '#FFFFFF' : '#333333' }}>
                      {employee.name}
                    </Text>
                  </View>
                  
                  {chatType === 'group' ? (
                    <Checkbox
                      status={employee.selected ? 'checked' : 'unchecked'}
                      color="#0080FF"
                      onPress={() => {
                        const updatedEmployees = [...selectedEmployees];
                        updatedEmployees[index] = {
                          ...employee,
                          selected: !employee.selected
                        };
                        setSelectedEmployees(updatedEmployees);
                      }}
                    />
                  ) : (
                    <RadioButton
                      value={employee.id}
                      status={employee.selected ? 'checked' : 'unchecked'}
                      color="#0080FF"
                      onPress={() => {
                        // Для личного чата выбираем только одного сотрудника
                        const updatedEmployees = selectedEmployees.map(emp => ({
                          ...emp,
                          selected: emp.id === employee.id
                        }));
                        setSelectedEmployees(updatedEmployees);
                      }}
                    />
                  )}
                </TouchableOpacity>
              ))}
              
              {selectedEmployees.length === 0 && (
                <Text style={[styles.noEmployeesText, { color: isDark ? '#888888' : '#999999' }]}>
                  Нет доступных сотрудников для создания чата
                </Text>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalCancelButton, { backgroundColor: isDark ? '#2A2A2A' : '#F0F0F5' }]}
                onPress={() => setCreateChatModalVisible(false)}
              >
                <Text style={{ color: isDark ? '#BBBBBB' : '#666666' }}>Отмена</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalCreateButton, 
                  { 
                    backgroundColor: (
                      chatType === 'group' 
                        ? (selectedEmployees.some(e => e.selected) && groupChatName.trim() !== '')
                        : selectedEmployees.some(e => e.selected)
                    ) ? '#0080FF' : (isDark ? '#444444' : '#CCCCCC')
                  }
                ]}
                onPress={handleCreateChat}
                disabled={
                  chatType === 'group' 
                    ? !(selectedEmployees.some(e => e.selected) && groupChatName.trim() !== '')
                    : !selectedEmployees.some(e => e.selected)
                }
              >
                <Text style={{ color: '#FFFFFF' }}>Создать</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
} 