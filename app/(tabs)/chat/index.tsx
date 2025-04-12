import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, Image } from 'react-native';
import { Searchbar, FAB, Avatar, Badge, Divider, ActivityIndicator, Button, Checkbox, TextInput, RadioButton } from 'react-native-paper';
import { useChat } from '../../../context/ChatContext';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { ChatRoom } from '../../../types';
import { format, isToday, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedContainer } from '@/components/ThemedContainer';
import { Colors } from '@/constants/Colors';
import { getEmployeeInfo, DEMO_EMPLOYEES } from '../../../context/ChatContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChatListScreen() {
  const { chatRooms, messages, getUnreadCount, refreshChatData, resetAndRefreshChatData, createGroupChat } = useChat();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChatRooms, setFilteredChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Новые состояния для создания чата
  const [createChatModalVisible, setCreateChatModalVisible] = useState(false);
  const [chatType, setChatType] = useState<'personal' | 'group'>('group'); // Теперь по умолчанию групповой чат
  const [selectedEmployees, setSelectedEmployees] = useState<{id: string, name: string, selected: boolean}[]>([]);
  const [groupChatName, setGroupChatName] = useState('');

  // Проверяем, есть ли уже чаты со всеми сотрудниками
  const hasChatsWithAllEmployees = () => {
    if (!user) return false;
    
    // Получаем ID всех сотрудников (кроме текущего пользователя)
    const employeeIds = DEMO_EMPLOYEES
      .filter(emp => emp.id !== user.id)
      .map(emp => emp.id);
    
    // Проверяем, есть ли для каждого сотрудника личный чат
    return employeeIds.every(empId => {
      return chatRooms.some(room => 
        !room.isGroupChat && 
        room.participants.includes(user.id) && 
        room.participants.includes(empId) &&
        room.participants.length === 2
      );
    });
  };

  useEffect(() => {
    // Загружаем данные при первом входе
    refreshChatData().then(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    // Фильтруем чаты для текущего пользователя
    if (user) {
      // Сортируем чаты: сначала с непрочитанными сообщениями, затем по времени последнего сообщения
      const userChatRooms = chatRooms
        .filter(room => room.participants.includes(user.id))
        .sort((a, b) => {
          // Проверяем наличие непрочитанных сообщений
          const unreadCountA = getUnreadCountForRoom(a.id);
          const unreadCountB = getUnreadCountForRoom(b.id);
          
          // Если у чата A есть непрочитанные, а у B нет - A выше
          if (unreadCountA > 0 && unreadCountB === 0) return -1;
          // Если у чата B есть непрочитанные, а у A нет - B выше
          if (unreadCountB > 0 && unreadCountA === 0) return 1;
          
          // В остальных случаях сортируем по времени последнего обновления (в обратном порядке)
          const timeA = a.lastMessage ? a.lastMessage.timestamp.getTime() : a.updatedAt.getTime();
          const timeB = b.lastMessage ? b.lastMessage.timestamp.getTime() : b.updatedAt.getTime();
          return timeB - timeA;
        });
      
      // Применяем поиск по названию чата
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const filtered = userChatRooms.filter(room => 
          room.name.toLowerCase().includes(query)
        );
        setFilteredChatRooms(filtered);
      } else {
        setFilteredChatRooms(userChatRooms);
      }
    }
    
    setRefreshing(false);
  }, [chatRooms, user, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshChatData();
  };

  const handleResetChats = async () => {
    setLoading(true);
    try {
      await resetAndRefreshChatData();
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleChatRoomPress = (chatRoomId: string) => {
    router.push(`/(tabs)/chat/${chatRoomId}`);
  };

  const getLastMessagePreview = (room: ChatRoom) => {
    // Если у комнаты уже есть lastMessage, используем его
    if (room.lastMessage) {
      return {
        text: room.lastMessage.text,
        sender: room.lastMessage.senderId === user?.id ? 'Вы: ' : '',
        timestamp: room.lastMessage.timestamp,
      };
    }
    
    // Находим сообщения для этой комнаты
    const roomMessages = messages.filter(msg => {
      if (room.isGroupChat) {
        return msg.chatRoomId === room.id || (msg.receiverId === null && room.participants.includes(msg.senderId));
      } else {
        const participants = room.participants;
        return (msg.chatRoomId === room.id) || 
               (participants.includes(msg.senderId) && 
                participants.includes(msg.receiverId || '') && 
                participants.length === 2);
      }
    });
    
    // Сортируем по времени и берем последнее
    const lastRoomMessage = roomMessages.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    )[0];
    
    if (lastRoomMessage) {
      return {
        text: lastRoomMessage.text,
        sender: lastRoomMessage.senderId === user?.id ? 'Вы: ' : '',
        timestamp: lastRoomMessage.timestamp,
      };
    }
    
    return { text: 'Нет сообщений', sender: '', timestamp: room.updatedAt };
  };

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: ru });
    } else if (isYesterday(date)) {
      return 'Вчера';
    } else {
      return format(date, 'dd MMM', { locale: ru });
    }
  };

  const getUnreadCountForRoom = (roomId: string) => {
    if (!user) return 0;
    
    // Получаем сообщения для этой комнаты
    const roomMessages = messages.filter(message => {
      const chatRoom = chatRooms.find(room => room.id === roomId);
      if (!chatRoom) return false;
      
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
    return roomMessages.filter(
      message => !message.isRead && message.receiverId === user.id
    ).length;
  };

  // Инициализация списка сотрудников при открытии модального окна
  const openCreateChatModal = () => {
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
  };

  const closeCreateChatModal = () => {
    setCreateChatModalVisible(false);
  };

  // Переключение выбора сотрудника
  const toggleEmployeeSelection = (id: string) => {
    // Для личного чата выбираем только одного сотрудника
    if (chatType === 'personal') {
      setSelectedEmployees(
        selectedEmployees.map(emp => ({
          ...emp,
          selected: emp.id === id
        }))
      );
    } else {
      // Для группового чата можно выбрать нескольких сотрудников
      setSelectedEmployees(
        selectedEmployees.map(emp => 
          emp.id === id ? { ...emp, selected: !emp.selected } : emp
        )
      );
    }
  };

  // Создание нового чата
  const handleCreateChat = async () => {
    // Получаем выбранных сотрудников
    const selected = selectedEmployees.filter(emp => emp.selected);
    
    if ((chatType === 'personal' && selected.length === 1) || 
        (chatType === 'group' && selected.length > 0 && groupChatName.trim())) {
      
      try {
        if (chatType === 'personal') {
          // Для личного чата ищем существующий чат с этим пользователем
          const selectedUserId = selected[0].id;
          
          // Чата нет, создаем новый
          alert(`Чат с ${selected[0].name} будет создан при первом сообщении`);
          
          // Перезагружаем данные, чтобы создать новый чат
          await refreshChatData();
          
          // Ищем новый чат
          const newChat = chatRooms.find(room => 
            !room.isGroupChat && 
            room.participants.includes(user?.id || '') &&
            room.participants.includes(selectedUserId) &&
            room.participants.length === 2
          );
          
          if (newChat) {
            // Переход в новый чат
            router.push(`/(tabs)/chat/${newChat.id}`);
          }
        } else {
          // Для группового чата используем createGroupChat
          const participantIds = selected.map(emp => emp.id);
          const newChatId = await createGroupChat(groupChatName, participantIds);
          
          // Обновляем список чатов перед переходом
          await refreshChatData();
          
          // Переходим в созданный чат
          router.push(`/(tabs)/chat/${newChatId}`);
        }
        
        closeCreateChatModal();
      } catch (error) {
        console.error('Ошибка при создании чата:', error);
        alert('Не удалось создать чат. Пожалуйста, попробуйте еще раз.');
      }
    } else {
      // Показываем ошибку валидации
      if (chatType === 'personal' && selected.length === 0) {
        alert('Выберите пользователя для чата');
      } else if (chatType === 'group') {
        if (selected.length === 0) {
          alert('Выберите хотя бы одного участника для группового чата');
        } else if (!groupChatName.trim()) {
          alert('Введите название группового чата');
        }
      }
    }
  };

  const renderChatItem = ({ item }: { item: ChatRoom }) => {
    if (!user) return null;

    // Получаем превью последнего сообщения
    const messagePreview = getLastMessagePreview(item);
    
    // Определяем имя чата
    let chatName = item.name;
    let avatarUrl: string | null = null;
    
    // Если это не групповой чат, получаем имя собеседника
    if (!item.isGroupChat && item.participants.length === 2) {
      const otherParticipantId = item.participants.find(id => id !== user.id);
      if (otherParticipantId) {
        const employeeInfo = getEmployeeInfo(otherParticipantId);
        if (employeeInfo) {
          chatName = employeeInfo.name;
          avatarUrl = employeeInfo.avatarUrl;
        }
      }
    }
    
    // Получаем количество непрочитанных сообщений
    const unreadCount = getUnreadCountForRoom(item.id);
    
    // Определяем, является ли последнее сообщение непрочитанным
    const hasUnread = unreadCount > 0;
    
    // Проверяем, является ли данный чат активным (были сообщения за последние 24 часа)
    const isActiveChat = messagePreview.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Выбираем цвета градиента в зависимости от активности чата
    const gradientColors = isDark 
      ? (isActiveChat ? ['#1c2a3d', '#1a232e'] : ['#232323', '#262626']) 
      : (isActiveChat ? ['#ffffff', '#f8f9ff'] : ['#ffffff', '#f9f9f9']);
    
    // Создаем инициалы для аватара (если нет фото)
    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
    };
    
    // Генерируем яркий цвет для аватара группового чата
    const getGroupChatColor = (chatId: string) => {
      // Используем ID чата для генерации стабильного цвета
      const colorOptions = [
        ['#F44336', '#D32F2F'], // красный
        ['#E91E63', '#C2185B'], // розовый
        ['#9C27B0', '#7B1FA2'], // фиолетовый
        ['#673AB7', '#512DA8'], // глубокий фиолетовый
        ['#3F51B5', '#303F9F'], // индиго
        ['#2196F3', '#1976D2'], // синий
        ['#00BCD4', '#0097A7'], // сине-зеленый
        ['#009688', '#00796B'], // бирюзовый
        ['#4CAF50', '#388E3C'], // зеленый
        ['#FF9800', '#F57C00'], // оранжевый
      ];
      
      // Простой способ получить стабильный индекс на основе ID чата
      const index = chatId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colorOptions.length;
      
      return colorOptions[index];
    };

    return (
      <TouchableOpacity 
        style={styles.chatItemTouchable} 
        onPress={() => handleChatRoomPress(item.id)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={gradientColors}
          style={[
            styles.chatItem,
            isDark ? styles.chatItemDark : styles.chatItemLight,
          ]}
        >
          <View style={styles.chatItemAvatarContainer}>
            {item.isGroupChat ? (
              <LinearGradient
                colors={getGroupChatColor(item.id)}
                style={styles.groupAvatarGradient}
              >
                <Text style={styles.groupAvatarText}>
                  {getInitials(chatName)}
                </Text>
              </LinearGradient>
            ) : (
              avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.chatAvatar} />
              ) : (
                <LinearGradient
                  colors={['#4c669f', '#3b5998', '#192f6a']}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarText}>
                    {getInitials(chatName)}
                  </Text>
                </LinearGradient>
              )
            )}
            
            {/* Индикатор онлайн статуса (для примера) */}
            {!item.isGroupChat && Math.random() > 0.5 && (
              <View style={styles.onlineIndicator} />
            )}
          </View>
          
          <View style={styles.chatItemContentContainer}>
            <View style={styles.chatItemHeader}>
              <Text 
                style={[
                  styles.chatName, 
                  isDark ? styles.chatNameDark : styles.chatNameLight,
                  hasUnread && styles.chatNameBold
                ]} 
                numberOfLines={1}
              >
                {chatName}
              </Text>
              <Text 
                style={[
                  styles.chatTime,
                  isDark ? styles.chatTimeDark : styles.chatTimeLight
                ]}
              >
                {formatMessageTime(messagePreview.timestamp)}
              </Text>
            </View>
            
            <View style={styles.chatItemPreviewContainer}>
              <Text 
                style={[
                  styles.chatPreview, 
                  isDark ? styles.chatPreviewDark : styles.chatPreviewLight,
                  hasUnread && styles.chatPreviewBold
                ]} 
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {messagePreview.sender}{messagePreview.text}
              </Text>
              
              {unreadCount > 0 && (
                <View style={styles.unreadBadgeContainer}>
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>
                      {unreadCount}
                    </Text>
                  </View>
                </View>
              )}
            </View>
            
            {/* Индикаторы чата */}
            <View style={styles.chatIndicators}>
              {item.isGroupChat && (
                <View style={styles.chatIndicator}>
                  <MaterialCommunityIcons name="account-group" size={14} color={isDark ? '#aaaaaa' : '#666666'} />
                  <Text style={[styles.indicatorText, isDark ? styles.indicatorTextDark : styles.indicatorTextLight]}>
                    {item.participants.length}
                  </Text>
                </View>
              )}
              
              {/* Дополнительные индикаторы, если нужно */}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Рендеринг компонента
  if (loading) {
    return (
      <ThemedContainer style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </ThemedContainer>
    );
  }

  return (
    <ThemedContainer style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#1c1c1e', '#252527'] : ['#ffffff', '#f9f9f9']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, isDark ? styles.headerTitleDark : styles.headerTitleLight]}>
            Сообщения
          </Text>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleResetChats}
          >
            <MaterialCommunityIcons name="refresh" size={24} color={isDark ? Colors.dark.tint : Colors.light.tint} />
          </TouchableOpacity>
        </View>
        
        <Searchbar
          placeholder="Поиск чатов..."
          onChangeText={handleSearchChange}
          value={searchQuery}
          style={[
            styles.searchBar,
            isDark ? styles.searchBarDark : styles.searchBarLight
          ]}
          inputStyle={[
            styles.searchInput,
            isDark ? styles.searchInputDark : styles.searchInputLight
          ]}
          iconColor={isDark ? '#999' : '#666'}
          placeholderTextColor={isDark ? '#888' : '#999'}
        />
      </LinearGradient>
      
      <View style={styles.chatListContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDark ? Colors.dark.tint : Colors.light.tint} />
          </View>
        ) : (
          <FlatList
            data={filteredChatRooms}
            renderItem={renderChatItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.chatList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[isDark ? Colors.dark.tint : Colors.light.tint]}
                tintColor={isDark ? Colors.dark.tint : Colors.light.tint}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <LinearGradient
                  colors={isDark ? ['#2c2c2e', '#1c1c1e'] : ['#f0f0f0', '#e0e0e0']}
                  style={styles.emptyIconContainer}
                >
                  <MaterialCommunityIcons name="chat-outline" size={44} color={isDark ? Colors.dark.tint : Colors.light.tint} />
                </LinearGradient>
                <Text style={[styles.emptyText, isDark ? styles.emptyTextDark : styles.emptyTextLight]}>
                  {searchQuery.trim() ? 
                    'Чаты не найдены, измените запрос поиска' : 
                    'У вас пока нет активных чатов'}
                </Text>
                <Button 
                  mode="contained" 
                  onPress={openCreateChatModal}
                  style={styles.emptyButton}
                  buttonColor={isDark ? Colors.dark.tint : Colors.light.tint}
                  icon="chat-plus"
                >
                  Создать чат
                </Button>
              </View>
            }
          />
        )}
      </View>
      
      <FAB
        style={[styles.fab, { backgroundColor: isDark ? Colors.dark.tint : Colors.light.tint }]}
        icon="chat-plus"
        color="#fff"
        onPress={openCreateChatModal}
      />
      
      {/* Модальное окно создания чата... */}
    </ThemedContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerTitleLight: {
    color: '#222222',
  },
  headerTitleDark: {
    color: '#ffffff',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  searchBar: {
    height: 40,
    elevation: 0,
    borderRadius: 10,
  },
  searchBarLight: {
    backgroundColor: '#f0f0f0',
  },
  searchBarDark: {
    backgroundColor: '#2c2c2e',
  },
  searchInput: {
    fontSize: 14,
  },
  searchInputLight: {
    color: '#333333',
  },
  searchInputDark: {
    color: '#e0e0e0',
  },
  chatListContainer: {
    flex: 1,
  },
  chatList: {
    paddingVertical: 8,
  },
  chatItemTouchable: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
  },
  chatItemLight: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chatItemDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  chatItemAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
  },
  avatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  groupAvatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  onlineIndicator: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4caf50',
    borderWidth: 2,
    borderColor: 'white',
    bottom: 0,
    right: 0,
  },
  chatItemContentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  chatItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    flex: 1,
    marginRight: 4,
  },
  chatNameLight: {
    color: '#222222',
  },
  chatNameDark: {
    color: '#ffffff',
  },
  chatNameBold: {
    fontWeight: 'bold',
  },
  chatTime: {
    fontSize: 12,
  },
  chatTimeLight: {
    color: '#888888',
  },
  chatTimeDark: {
    color: '#a0a0a0',
  },
  chatItemPreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatPreview: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  chatPreviewLight: {
    color: '#666666',
  },
  chatPreviewDark: {
    color: '#cccccc',
  },
  chatPreviewBold: {
    fontWeight: '500',
  },
  unreadBadgeContainer: {
    alignItems: 'flex-end',
  },
  unreadBadge: {
    backgroundColor: '#007aff',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatIndicators: {
    flexDirection: 'row',
    marginTop: 4,
  },
  chatIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  indicatorText: {
    fontSize: 12,
    marginLeft: 2,
  },
  indicatorTextLight: {
    color: '#666666',
  },
  indicatorTextDark: {
    color: '#aaaaaa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 16,
  },
  emptyTextLight: {
    color: '#666666',
  },
  emptyTextDark: {
    color: '#cccccc',
  },
  emptyButton: {
    paddingHorizontal: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  // ... остальные стили в вашем файле
}); 