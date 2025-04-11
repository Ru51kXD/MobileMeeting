import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Searchbar, FAB, Avatar, Badge, Divider, ActivityIndicator, Button, Checkbox, TextInput, RadioButton } from 'react-native-paper';
import { useChat } from '../../../context/ChatContext';
import { useAuth } from '../../../context/AuthContext';
import { ChatRoom } from '../../../types';
import { format, isToday, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChatRooms, setFilteredChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Новые состояния для создания чата
  const [createChatModalVisible, setCreateChatModalVisible] = useState(false);
  const [chatType, setChatType] = useState<'personal' | 'group'>('personal');
  const [selectedEmployees, setSelectedEmployees] = useState<{id: string, name: string, selected: boolean}[]>([]);
  const [groupChatName, setGroupChatName] = useState('');

  // Находим информацию о пользователе по ID
  const getUserInfo = (userId: string) => {
    return DEMO_EMPLOYEES.find(emp => emp.id === userId) || 
      { id: userId, name: 'Неизвестный пользователь', position: '', avatarUrl: 'https://ui-avatars.com/api/?name=Unknown' };
  };

  useEffect(() => {
    // Фильтруем чаты для текущего пользователя
    if (user) {
      const userChatRooms = chatRooms.filter(room => 
        room.participants.includes(user.id)
      );
      
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

  const renderChatRoomItem = ({ item }: { item: ChatRoom }) => {
    const lastMessage = getLastMessagePreview(item);
    const unreadCount = getUnreadCountForRoom(item.id);
    
    return (
      <TouchableOpacity 
        style={styles.chatRoomItem}
        onPress={() => handleChatRoomPress(item.id)}
      >
        <View style={styles.avatarContainer}>
          {item.isGroupChat ? (
            <Avatar.Icon
              size={56}
              icon="account-group"
              style={styles.groupAvatar}
            />
          ) : (
            <Avatar.Image
              size={56}
              source={{ uri: getUserInfo(item.participants.find(p => p !== user?.id) || '').avatarUrl }}
            />
          )}
          
          {unreadCount > 0 && (
            <Badge style={styles.unreadBadge}>{unreadCount}</Badge>
          )}
        </View>
        
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.timestamp}>{formatMessageTime(lastMessage.timestamp)}</Text>
          </View>
          
          <Text 
            style={[styles.lastMessage, unreadCount > 0 && styles.unreadMessage]} 
            numberOfLines={1}
          >
            {lastMessage.sender}{lastMessage.text}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Инициализация списка сотрудников при открытии модального окна
  const openCreateChatModal = () => {
    // Инициализируем список сотрудников
    const initialSelectedEmployees = DEMO_EMPLOYEES
      .filter(emp => emp.id !== user?.id) // Исключаем текущего пользователя
      .map(emp => ({
        id: emp.id,
        name: emp.name,
        selected: false
      }));
    
    setSelectedEmployees(initialSelectedEmployees);
    setGroupChatName('');
    setChatType('personal');
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
          const existingChat = chatRooms.find(room => 
            !room.isGroupChat && 
            room.participants.includes(user?.id || '') &&
            room.participants.includes(selectedUserId) &&
            room.participants.length === 2
          );
          
          if (existingChat) {
            // Если чат существует, переходим к нему
            router.push(`/(tabs)/chat/${existingChat.id}`);
          } else {
            // Если чата нет, создаем новый (обычно это делается через ChatContext)
            // Но для простоты сейчас просто закрываем модальное окно
            alert(`Чат с ${selected[0].name} будет создан при первом сообщении`);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Сообщения</Text>
        <Searchbar
          placeholder="Поиск чатов..."
          onChangeText={handleSearchChange}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#666"
        />
      </View>
      
      <FlatList
        data={filteredChatRooms}
        renderItem={renderChatRoomItem}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        contentContainerStyle={styles.chatList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2196F3']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="chat-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 
                'Чаты не найдены. Попробуйте изменить параметры поиска.' : 
                'У вас пока нет активных чатов.'}
            </Text>
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={openCreateChatModal}
        color="#ffffff"
      />
      
      {/* Модальное окно создания чата */}
      <Modal
        visible={createChatModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeCreateChatModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Создать новый чат</Text>
              <TouchableOpacity onPress={closeCreateChatModal}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Divider />
            
            <View style={styles.chatTypeSelector}>
              <Text style={styles.sectionTitle}>Тип чата:</Text>
              <RadioButton.Group 
                onValueChange={(value) => setChatType(value as 'personal' | 'group')} 
                value={chatType}
              >
                <View style={styles.radioOption}>
                  <RadioButton value="personal" />
                  <Text>Личный чат</Text>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="group" />
                  <Text>Групповой чат</Text>
                </View>
              </RadioButton.Group>
            </View>
            
            {chatType === 'group' && (
              <View style={styles.groupNameContainer}>
                <Text style={styles.sectionTitle}>Название группы:</Text>
                <TextInput
                  mode="outlined"
                  placeholder="Введите название группы"
                  value={groupChatName}
                  onChangeText={setGroupChatName}
                  style={styles.groupNameInput}
                />
              </View>
            )}
            
            <Text style={styles.sectionTitle}>
              {chatType === 'personal' ? 'Выберите пользователя:' : 'Выберите участников:'}
            </Text>
            
            <FlatList
              data={selectedEmployees}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.employeeItem}
                  onPress={() => toggleEmployeeSelection(item.id)}
                >
                  <View style={styles.employeeInfo}>
                    <Avatar.Image 
                      size={40} 
                      source={{ 
                        uri: DEMO_EMPLOYEES.find(emp => emp.id === item.id)?.avatarUrl || 
                             'https://ui-avatars.com/api/?name=Unknown&background=9E9E9E&color=fff'
                      }} 
                    />
                    <Text style={styles.employeeName}>{item.name}</Text>
                  </View>
                  {chatType === 'personal' ? (
                    <RadioButton
                      value={item.id}
                      status={item.selected ? 'checked' : 'unchecked'}
                      onPress={() => toggleEmployeeSelection(item.id)}
                    />
                  ) : (
                    <Checkbox
                      status={item.selected ? 'checked' : 'unchecked'}
                      onPress={() => toggleEmployeeSelection(item.id)}
                    />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              style={styles.employeeList}
            />
            
            <Divider />
            
            <View style={styles.modalFooter}>
              <Button onPress={closeCreateChatModal}>Отмена</Button>
              <Button 
                mode="contained" 
                onPress={handleCreateChat}
                disabled={
                  (chatType === 'personal' && !selectedEmployees.some(emp => emp.selected)) ||
                  (chatType === 'group' && (!groupChatName.trim() || !selectedEmployees.some(emp => emp.selected)))
                }
              >
                Создать
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
}); 