import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Searchbar, FAB, Avatar, Badge, Divider, ActivityIndicator, Button, Checkbox, TextInput, RadioButton } from 'react-native-paper';
import { useChat } from '../../../context/ChatContext';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { ChatRoom } from '../../../types';
import { format, isToday, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
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

export default function ChatListScreen() {
  const { chatRooms, messages, getUnreadCount, refreshChatData, createGroupChat } = useChat();
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

  // Находим информацию о пользователе по ID
  const getUserInfo = (userId: string) => {
    return DEMO_EMPLOYEES.find(emp => emp.id === userId) || 
      { id: userId, name: 'Неизвестный пользователь', position: '', avatarUrl: 'https://ui-avatars.com/api/?name=Unknown' };
  };

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
    
    setLoading(false);
    setRefreshing(false);
  }, [chatRooms, user, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshChatData();
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

  // Динамические стили для тёмной темы
  const dynamicStyles = {
    header: {
      backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
      borderBottomColor: isDark ? '#333' : '#e0e0e0',
    },
    headerTitle: {
      color: isDark ? Colors.dark.text : '#333',
    },
    searchBar: {
      backgroundColor: isDark ? '#2c2c2c' : '#f2f2f2',
    },
    chatRoomItem: {
      backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
      borderBottomColor: isDark ? '#333' : '#f0f0f0',
    },
    chatName: {
      color: isDark ? Colors.dark.text : '#333',
    },
    lastMessage: {
      color: isDark ? '#888' : '#666',
    },
    unreadMessage: {
      color: isDark ? Colors.dark.text : '#000',
      fontWeight: 'bold',
    },
    timestamp: {
      color: isDark ? '#777' : '#999',
    },
    modalContent: {
      backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
    },
    modalTitle: {
      color: isDark ? Colors.dark.text : '#333',
    },
    modalText: {
      color: isDark ? '#aaa' : '#666',
    },
    input: {
      backgroundColor: isDark ? '#2c2c2c' : '#f5f5f5',
      color: isDark ? Colors.dark.text : '#333',
    },
    employeeItem: {
      borderBottomColor: isDark ? '#333' : '#f0f0f0',
    },
    employeeName: {
      color: isDark ? Colors.dark.text : '#333',
    },
    employeePosition: {
      color: isDark ? '#888' : '#666',
    },
  };

  // Рендеринг модального окна создания чата
  const renderCreateChatModal = () => {
    return (
      <Modal
        visible={createChatModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeCreateChatModal}
      >
        <View style={[styles.modalContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)' }]}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#333333' }]}>
              Создать {chatType === 'personal' ? 'личный чат' : 'групповой чат'}
            </Text>
            
            {/* Переключатель типа чата (только для демонстрации, так как с каждым уже есть чат) */}
            {selectedEmployees.length > 0 && (
              <View style={styles.chatTypeSelector}>
                <TouchableOpacity
                  style={[
                    styles.chatTypeButton,
                    chatType === 'personal' && styles.chatTypeButtonActive,
                    { borderColor: isDark ? '#444' : '#ddd' }
                  ]}
                  onPress={() => setChatType('personal')}
                >
                  <Text style={[
                    styles.chatTypeButtonText,
                    chatType === 'personal' && styles.chatTypeButtonTextActive,
                    { color: isDark ? (chatType === 'personal' ? '#2196F3' : '#aaa') : (chatType === 'personal' ? '#2196F3' : '#666') }
                  ]}>
                    Личный чат
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.chatTypeButton,
                    chatType === 'group' && styles.chatTypeButtonActive,
                    { borderColor: isDark ? '#444' : '#ddd' }
                  ]}
                  onPress={() => setChatType('group')}
                >
                  <Text style={[
                    styles.chatTypeButtonText,
                    chatType === 'group' && styles.chatTypeButtonTextActive,
                    { color: isDark ? (chatType === 'group' ? '#2196F3' : '#aaa') : (chatType === 'group' ? '#2196F3' : '#666') }
                  ]}>
                    Групповой чат
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Название группового чата */}
            {chatType === 'group' && (
              <TextInput
                style={[styles.groupNameInput, { 
                  backgroundColor: isDark ? '#333' : '#f5f5f5',
                  color: isDark ? '#fff' : '#333',
                  borderColor: isDark ? '#444' : '#ddd'
                }]}
                placeholder="Название группового чата"
                placeholderTextColor={isDark ? '#aaa' : '#999'}
                value={groupChatName}
                onChangeText={setGroupChatName}
              />
            )}
            
            {/* Список сотрудников */}
            {selectedEmployees.length > 0 ? (
              <FlatList
                data={selectedEmployees}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.employeeItem, { borderBottomColor: isDark ? '#444' : '#eee' }]}
                    onPress={() => toggleEmployeeSelection(item.id)}
                  >
                    <View style={styles.employeeInfo}>
                      <Avatar.Image
                        size={40}
                        source={{ uri: getUserInfo(item.id).avatarUrl }}
                      />
                      <Text style={[styles.employeeName, { color: isDark ? '#fff' : '#333' }]}>
                        {item.name}
                      </Text>
                    </View>
                    {chatType === 'personal' ? (
                      <RadioButton
                        value={item.id}
                        status={item.selected ? 'checked' : 'unchecked'}
                        onPress={() => toggleEmployeeSelection(item.id)}
                        color="#2196F3"
                      />
                    ) : (
                      <Checkbox
                        status={item.selected ? 'checked' : 'unchecked'}
                        onPress={() => toggleEmployeeSelection(item.id)}
                        color="#2196F3"
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.noEmployeesContainer}>
                <Text style={[styles.noEmployeesText, { color: isDark ? '#aaa' : '#666' }]}>
                  У вас уже есть чаты со всеми сотрудниками.
                  {'\n'}Вы можете создать только групповой чат.
                </Text>
              </View>
            )}
            
            {/* Кнопки */}
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={closeCreateChatModal}
                style={[styles.modalButton, { borderColor: isDark ? '#555' : '#ddd' }]}
                textColor={isDark ? '#fff' : '#666'}
              >
                Отмена
              </Button>
              <Button
                mode="contained"
                onPress={handleCreateChat}
                style={[styles.modalButton, { backgroundColor: '#2196F3' }]}
                disabled={(chatType === 'personal' && selectedEmployees.filter(e => e.selected).length === 0) ||
                       (chatType === 'group' && (selectedEmployees.filter(e => e.selected).length === 0 || !groupChatName.trim()))}
              >
                Создать
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Чаты</Text>
      </View>
      
      <Searchbar
        placeholder="Поиск чатов"
        onChangeText={handleSearchChange}
        value={searchQuery}
        style={[styles.searchBar, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}
        inputStyle={{ color: isDark ? '#fff' : '#333' }}
        iconColor={isDark ? '#aaa' : '#666'}
        placeholderTextColor={isDark ? '#aaa' : '#999'}
      />
      
      {filteredChatRooms.length > 0 ? (
        <FlatList
          data={filteredChatRooms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const lastMessage = getLastMessagePreview(item);
            const unreadCount = getUnreadCountForRoom(item.id);
            
            // Для личных чатов используем имя другого участника
            let chatName = item.name;
            if (!item.isGroupChat && user) {
              const otherParticipantId = item.participants.find(id => id !== user.id);
              if (otherParticipantId) {
                const employeeInfo = getUserInfo(otherParticipantId);
                chatName = employeeInfo.name;
              }
            }
            
            return (
              <TouchableOpacity
                style={[
                  styles.chatItem,
                  { backgroundColor: isDark ? (unreadCount > 0 ? '#263238' : '#1e1e1e') : (unreadCount > 0 ? '#f5f8fa' : '#ffffff') }
                ]}
                onPress={() => handleChatRoomPress(item.id)}
              >
                <View style={styles.chatItemLeft}>
                  {item.isGroupChat ? (
                    <Avatar.Text
                      size={50}
                      label={item.name.substring(0, 2).toUpperCase()}
                      backgroundColor={isDark ? '#3949ab' : '#5c6bc0'}
                    />
                  ) : (
                    <Avatar.Image
                      size={50}
                      source={{ uri: getUserInfo(item.participants.find(id => id !== user?.id) || '').avatarUrl }}
                    />
                  )}
                </View>
                
                <View style={styles.chatItemMiddle}>
                  <View style={styles.chatItemHeader}>
                    <Text style={[styles.chatName, { color: isDark ? '#fff' : '#333' }]} numberOfLines={1}>
                      {chatName}
                    </Text>
                    <Text style={[styles.chatTime, { color: isDark ? '#aaa' : '#999' }]}>
                      {formatMessageTime(lastMessage.timestamp)}
                    </Text>
                  </View>
                  
                  <View style={styles.chatItemPreview}>
                    <Text style={[
                      styles.messagePreview,
                      { color: isDark ? (unreadCount > 0 ? '#e0e0e0' : '#bbb') : (unreadCount > 0 ? '#333' : '#666') },
                      unreadCount > 0 && { fontWeight: 'bold' }
                    ]} numberOfLines={1}>
                      {lastMessage.sender}{lastMessage.text}
                    </Text>
                    
                    {unreadCount > 0 && (
                      <Badge style={styles.unreadBadge}>{unreadCount}</Badge>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2196F3']}
              tintColor={isDark ? '#fff' : '#2196F3'}
            />
          }
          ItemSeparatorComponent={() => <Divider style={{ backgroundColor: isDark ? '#333' : '#f0f0f0' }} />}
          contentContainerStyle={{ flexGrow: 1 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="chat-remove" size={64} color={isDark ? '#555' : '#ccc'} />
              <Text style={[styles.emptyText, { color: isDark ? '#aaa' : '#666' }]}>
                {searchQuery ? 'Чаты не найдены' : 'У вас пока нет чатов'}
              </Text>
            </View>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="chat-remove" size={64} color={isDark ? '#555' : '#ccc'} />
          <Text style={[styles.emptyText, { color: isDark ? '#aaa' : '#666' }]}>
            {searchQuery ? 'Чаты не найдены' : 'У вас пока нет чатов'}
          </Text>
        </View>
      )}
      
      <FAB
        style={styles.fab}
        icon="plus"
        label="Новый чат"
        onPress={openCreateChatModal}
      />
      
      {renderCreateChatModal()}
    </ThemedContainer>
  );
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 24, // Для отступа от верхнего края экрана
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    height: 48,
  },
  chatList: {
    padding: 0,
    backgroundColor: '#fff',
  },
  chatRoomItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
    position: 'relative',
  },
  groupAvatar: {
    backgroundColor: '#2196F3',
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: -2,
    backgroundColor: '#f44336',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  unreadMessage: {
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    marginLeft: 88, // Ширина аватара + отступ
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    marginTop: 16,
    color: '#999',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatTypeSelector: {
    padding: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#555',
  },
  groupNameContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  groupNameInput: {
    backgroundColor: '#fff',
  },
  employeeList: {
    maxHeight: 300,
  },
  employeeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeName: {
    marginLeft: 12,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerButton: {
    flex: 1,
  },
  employeesList: {
    padding: 16,
  },
  employeeDetails: {
    flexDirection: 'column',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  chatItemLeft: {
    marginRight: 16,
  },
  chatItemMiddle: {
    flex: 1,
  },
  chatItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  chatTime: {
    fontSize: 12,
    color: '#666',
  },
  chatItemPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messagePreview: {
    flex: 1,
  },
  chatTypeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  chatTypeButtonActive: {
    borderColor: '#2196F3',
  },
  chatTypeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  chatTypeButtonTextActive: {
    color: '#2196F3',
  },
  noEmployeesContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noEmployeesText: {
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
  },
}); 