import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, Image, SafeAreaView, Dimensions, ScrollView, Platform, FlatList, KeyboardAvoidingView, TextInput as RNTextInput } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar, Button, Badge, IconButton, Surface, Chip } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Типы сообщений
interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
}

export default function MeetingRoomScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const params = useLocalSearchParams();
  const { meetingId, meetingTitle, organizer } = params;
  const insets = useSafeAreaInsets();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [activeView, setActiveView] = useState<'grid' | 'speaker'>('grid');

  // Анимация для панели управления
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  // Состояние для чата
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatScrollRef = useRef<ScrollView>(null);
  
  // Состояние для индикации говорящего пользователя
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingInterval = useRef<NodeJS.Timeout | null>(null);

  // Состояние для модального окна профиля участника
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Расширенная имитация участников
  const participants = [
    { 
      id: '1', 
      name: 'Вы', 
      avatarUrl: user?.avatarUrl || 'https://i.pravatar.cc/150?img=1', 
      isActive: true, 
      isSpeaking: isSpeaking,
      position: 'Инженер-разработчик',
      department: 'Отдел разработки',
      email: user?.email || 'you@example.com',
      phone: '+7 (900) 123-45-67'
    },
    { 
      id: '2', 
      name: 'Менеджер Проектов', 
      avatarUrl: 'https://i.pravatar.cc/150?img=2', 
      isActive: true, 
      isSpeaking: !isSpeaking && Math.random() > 0.7,
      position: 'Менеджер проектов',
      department: 'Отдел управления',
      email: 'manager@example.com',
      phone: '+7 (900) 123-45-68'
    },
    { 
      id: '3', 
      name: 'Сотрудник Компании', 
      avatarUrl: 'https://i.pravatar.cc/150?img=3', 
      isActive: true, 
      isSpeaking: false,
      position: 'Младший аналитик',
      department: 'Аналитический отдел',
      email: 'analyst@example.com',
      phone: '+7 (900) 123-45-69'
    },
    { 
      id: '4', 
      name: 'Дизайнер Фронтенд', 
      avatarUrl: 'https://i.pravatar.cc/150?img=4', 
      isActive: false, 
      isSpeaking: false,
      position: 'UI/UX дизайнер',
      department: 'Отдел дизайна',
      email: 'designer@example.com',
      phone: '+7 (900) 123-45-70'
    },
    { 
      id: '5', 
      name: 'Руководитель Отдела', 
      avatarUrl: 'https://i.pravatar.cc/150?img=5', 
      isActive: true, 
      isSpeaking: false,
      position: 'Руководитель отдела',
      department: 'Администрация',
      email: 'head@example.com',
      phone: '+7 (900) 123-45-71'
    },
    { 
      id: '6', 
      name: 'QA Специалист', 
      avatarUrl: 'https://i.pravatar.cc/150?img=6', 
      isActive: true, 
      isSpeaking: false,
      position: 'Специалист по тестированию',
      department: 'Отдел контроля качества',
      email: 'qa@example.com',
      phone: '+7 (900) 123-45-72'
    },
    { 
      id: '7', 
      name: 'Маркетолог', 
      avatarUrl: 'https://i.pravatar.cc/150?img=7', 
      isActive: true, 
      isSpeaking: false,
      position: 'Маркетолог',
      department: 'Отдел маркетинга',
      email: 'marketing@example.com',
      phone: '+7 (900) 123-45-73'
    },
    { 
      id: '8', 
      name: 'Бизнес-аналитик', 
      avatarUrl: 'https://i.pravatar.cc/150?img=8', 
      isActive: false, 
      isSpeaking: false,
      position: 'Бизнес-аналитик',
      department: 'Аналитический отдел',
      email: 'analyst2@example.com',
      phone: '+7 (900) 123-45-74'
    },
  ];

  // Демо сообщения чата
  const demoMessages: ChatMessage[] = [
    {
      id: '1',
      senderId: '2',
      senderName: 'Менеджер Проектов',
      text: 'Всем добрый день! Начнем нашу встречу.',
      timestamp: new Date(Date.now() - 1000 * 60 * 5)
    },
    {
      id: '2',
      senderId: '5',
      senderName: 'Руководитель Отдела',
      text: 'Давайте обсудим статус текущих проектов.',
      timestamp: new Date(Date.now() - 1000 * 60 * 3)
    },
    {
      id: '3',
      senderId: '3',
      senderName: 'Сотрудник Компании',
      text: 'У меня готов отчет по первому проекту.',
      timestamp: new Date(Date.now() - 1000 * 60 * 2)
    }
  ];

  // Таймер для отсчета времени звонка
  useEffect(() => {
    const timer = setInterval(() => {
      setCallTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Скрытие/показ элементов управления
  useEffect(() => {
    showControls();
    
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, []);

  const showControls = () => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    controlsTimeout.current = setTimeout(() => {
      Animated.timing(controlsOpacity, {
        toValue: 0.2,
        duration: 500,
        useNativeDriver: true,
      }).start();
    },
    5000);
  };

  // Форматирование времени звонка
  const formatCallTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Обработчики кнопок
  const toggleMute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsVideoOff(!isVideoOff);
  };

  const toggleScreenShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSharingScreen(!isSharingScreen);
    
    if (!isSharingScreen) {
      Alert.alert(
        'Демо-режим',
        'В демо-версии демонстрация экрана недоступна',
        [{ text: 'Понятно' }]
      );
    }
  };

  const endMeeting = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.back();
  };

  const toggleParticipants = () => {
    setShowParticipants(!showParticipants);
    setShowChat(false);
  };

  const toggleChat = () => {
    setShowChat(!showChat);
    setShowParticipants(false);
  };

  const toggleFullscreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const toggleView = () => {
    setActiveView(activeView === 'grid' ? 'speaker' : 'grid');
  };

  // Загрузка демо-сообщений при монтировании
  useEffect(() => {
    setChatMessages(demoMessages);
  }, []);
  
  // Инициализация имитации говорящего пользователя
  useEffect(() => {
    // Имитируем случайное включение/выключение микрофона пользователя
    speakingInterval.current = setInterval(() => {
      setIsSpeaking(prev => {
        // 30% вероятность изменения состояния (говорит или нет)
        if (Math.random() > 0.7) {
          return !prev;
        }
        return prev;
      });
    }, 3000);
    
    return () => {
      if (speakingInterval.current) {
        clearInterval(speakingInterval.current);
      }
    };
  }, []);
  
  // Добавление автоматических ответов на сообщения пользователя
  useEffect(() => {
    if (chatMessages.length > 0 && chatMessages[chatMessages.length - 1].senderId === '1') {
      // Если последнее сообщение от текущего пользователя, имитируем ответ
      const timer = setTimeout(() => {
        const responders = participants.filter(p => p.id !== '1' && p.isActive);
        if (responders.length > 0) {
          const responder = responders[Math.floor(Math.random() * responders.length)];
          const responses = [
            'Согласен с вами.',
            'Интересная мысль!',
            'Давайте обсудим это подробнее.',
            'Хорошее предложение.',
            'Нам нужно учесть еще несколько моментов.',
            'Я бы добавил пару комментариев к этому.',
            'Можно посмотреть на это с другой стороны.'
          ];
          
          const newMessage: ChatMessage = {
            id: Date.now().toString(),
            senderId: responder.id,
            senderName: responder.name,
            text: responses[Math.floor(Math.random() * responses.length)],
            timestamp: new Date()
          };
          
          setChatMessages(prev => [...prev, newMessage]);
          
          // Прокручиваем чат вниз
          if (chatScrollRef.current) {
            setTimeout(() => {
              chatScrollRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        }
      }, 2000 + Math.random() * 3000); // Отвечаем через 2-5 секунд
      
      return () => clearTimeout(timer);
    }
  }, [chatMessages]);
  
  // Функция отправки сообщения
  const sendMessage = () => {
    if (inputMessage.trim() === '') return;
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: '1', // ID текущего пользователя
      senderName: 'Вы',
      text: inputMessage.trim(),
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    
    // Прокручиваем чат вниз
    if (chatScrollRef.current) {
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    
    // Имитируем, что пользователь начинает говорить после отправки сообщения
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 2000);
  };
  
  // Форматирование времени сообщения
  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Функция для отрисовки участника в режиме сетки
  const renderParticipantGrid = ({ item, index }: { item: any, index: number }) => (
    <View 
      style={[
        styles.videoContainer,
        participants.length <= 2 ? styles.doubleVideo : 
        participants.length <= 4 ? styles.quadVideo : styles.multiVideo,
      ]}
    >
      {item.id === '1' && isVideoOff ? (
        <View style={[styles.videoOffIndicator, {backgroundColor: isDark ? '#2c2c2e' : '#3a3a3c'}]}>
          <FontAwesome name="video-slash" size={32} color="#ff3b30" />
          <Text style={styles.videoOffText}>Ваша камера выключена</Text>
        </View>
      ) : (
        <LinearGradient
          colors={
            item.isSpeaking
            ? ['#00c6ff', '#0072ff']
            : item.id === '1' 
            ? ['#5E60CE', '#6A64E8'] 
            : index % 3 === 0 
              ? ['#FF375F', '#FF5864']
              : index % 3 === 1 
                ? ['#007AFF', '#16A3FF'] 
                : ['#4caf50', '#2E8B57']
          }
          style={[
            styles.videoFeed,
            item.isSpeaking && styles.speakingIndicator
          ]}
        >
          <Image
            source={{ uri: item.avatarUrl }}
            style={styles.participantAvatar}
          />
          <View style={styles.participantNameBadge}>
            <Text style={styles.participantNameText}>{item.name}</Text>
            {!item.isActive && <MaterialIcons name="mic-off" size={12} color="#fff" style={{marginLeft: 4}} />}
          </View>
        </LinearGradient>
      )}
    </View>
  );

  // Функция для отрисовки участника в режиме докладчика
  const getSpeakerParticipant = () => {
    const speaker = participants.find(p => p.isSpeaking);
    return speaker || participants[0];
  };

  // Функция для открытия профиля участника
  const openParticipantProfile = (participant: any) => {
    setSelectedParticipant(participant);
    setShowProfileModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Функция для закрытия профиля участника
  const closeParticipantProfile = () => {
    setShowProfileModal(false);
    setSelectedParticipant(null);
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: isDark ? '#000000' : '#121212'}]}>
      <Stack.Screen
        options={{
          title: meetingTitle || 'Конференция',
          headerShown: false,
        }}
      />
      <StatusBar style="light" />
      
      {/* Кнопка закрытия в верхнем углу - вынесена из других элементов для лучшей доступности */}
      <TouchableOpacity 
        onPress={endMeeting} 
        style={[
          styles.closeButton, 
          { top: insets.top + 10, right: insets.right + 10 }
        ]}
      >
        <View style={styles.closeButtonCircle}>
          <MaterialIcons name="close" size={28} color="#fff" />
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.fullScreenContainer} activeOpacity={1} onPress={showControls}>
        {/* Верхняя панель */}
        <Animated.View style={[
          styles.header, 
          {
            opacity: controlsOpacity,
            paddingTop: insets.top + 10,
            paddingLeft: insets.left + 16
          }
        ]}>
          <View style={styles.meetingInfo}>
            <Text style={styles.meetingTitle}>{meetingTitle || 'Конференция'}</Text>
            <View style={styles.timerContainer}>
              <MaterialIcons name="timer" size={14} color="#fff" />
              <Text style={styles.timer}>{formatCallTime(callTime)}</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={toggleView} style={styles.viewToggleButton}>
              <MaterialIcons name={activeView === 'grid' ? "view-agenda" : "grid-view"} size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {/* Основная зона с видео */}
        {activeView === 'grid' ? (
          <FlatList
            data={participants}
            renderItem={renderParticipantGrid}
            keyExtractor={item => item.id}
            numColumns={participants.length <= 2 ? 1 : 2}
            contentContainerStyle={[
              styles.videoGrid,
              { 
                paddingTop: insets.top + 60,
                paddingBottom: insets.bottom + 80,
                paddingLeft: insets.left + 4,
                paddingRight: insets.right + 4
              }
            ]}
          />
        ) : (
          <View style={[
            styles.speakerView,
            {
              paddingTop: insets.top + 60,
              paddingBottom: insets.bottom + 80,
              paddingLeft: insets.left,
              paddingRight: insets.right
            }
          ]}>
            {/* Основной говорящий */}
            <View style={styles.speakerContainer}>
              <LinearGradient
                colors={['#00c6ff', '#0072ff']}
                style={styles.speakerVideoFeed}
              >
                <Image
                  source={{ uri: getSpeakerParticipant().avatarUrl }}
                  style={styles.speakerAvatar}
                />
                <View style={styles.speakerNameBadge}>
                  <Text style={styles.speakerNameText}>{getSpeakerParticipant().name}</Text>
                </View>
              </LinearGradient>
            </View>
            
            {/* Остальные участники в виде полосы снизу */}
            <ScrollView 
              horizontal 
              style={styles.otherParticipantsScroll}
              contentContainerStyle={[
                styles.otherParticipantsContainer,
                { paddingHorizontal: Math.max(12, insets.left, insets.right) }
              ]}
              showsHorizontalScrollIndicator={false}
            >
              {participants
                .filter(p => p.id !== getSpeakerParticipant().id)
                .map((participant, index) => (
                  <TouchableOpacity 
                    key={participant.id} 
                    style={styles.otherParticipantItem}
                    onPress={() => openParticipantProfile(participant)}
                  >
                    <LinearGradient
                      colors={
                        participant.id === '1' 
                        ? ['#5E60CE', '#6A64E8'] 
                        : index % 3 === 0 
                          ? ['#FF375F', '#FF5864']
                          : index % 3 === 1 
                            ? ['#007AFF', '#16A3FF'] 
                            : ['#4caf50', '#2E8B57']
                      }
                      style={styles.otherParticipantGradient}
                    >
                      <Image
                        source={{ uri: participant.avatarUrl }}
                        style={styles.otherParticipantAvatar}
                      />
                      {!participant.isActive && (
                        <View style={styles.micOffIndicator}>
                          <MaterialIcons name="mic-off" size={12} color="#fff" />
                        </View>
                      )}
                    </LinearGradient>
                    <Text style={styles.otherParticipantName} numberOfLines={1}>
                      {participant.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        )}
        
        {/* Боковая панель с участниками или чатом */}
        {(showParticipants || showChat) && (
          <View style={[
            styles.sidebar, 
            {
              backgroundColor: isDark ? 'rgba(28, 28, 30, 0.95)' : 'rgba(44, 44, 46, 0.95)',
              paddingTop: insets.top,
              paddingRight: insets.right
            }
          ]}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>{showParticipants ? 'Участники' : 'Чат'}</Text>
              <TouchableOpacity 
                onPress={() => showParticipants ? setShowParticipants(false) : setShowChat(false)}
                style={styles.closeSidebarButton}
              >
                <MaterialIcons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {showParticipants && (
              <ScrollView style={styles.participantsList}>
                {participants.map(participant => (
                  <View key={participant.id} style={styles.participantItem}>
                    <View style={styles.participantAvatarContainer}>
                      <Image source={{ uri: participant.avatarUrl }} style={styles.participantItemAvatar} />
                      {participant.isSpeaking && (
                        <View style={styles.speakingIndicatorDot} />
                      )}
                    </View>
                    <View style={styles.participantInfo}>
                      <View style={styles.participantNameRow}>
                        <Text style={styles.participantItemName}>
                          {participant.name}
                        </Text>
                        {participant.isSpeaking && (
                          <Text style={styles.speakingText}> · Говорит</Text>
                        )}
                      </View>
                      <Chip 
                        style={[
                          styles.statusChip, 
                          {backgroundColor: participant.isActive ? 'rgba(76, 217, 100, 0.2)' : 'rgba(255, 59, 48, 0.2)'}
                        ]}
                        textStyle={{
                          color: participant.isActive ? '#4cd964' : '#ff3b30',
                          fontSize: 12
                        }}
                      >
                        {participant.isActive ? 'Активен' : 'Без звука'}
                      </Chip>
                    </View>
                    <MaterialIcons
                      name={participant.isActive ? "mic" : "mic-off"}
                      size={20}
                      color={participant.isActive ? "#4cd964" : "#ff3b30"}
                    />
                  </View>
                ))}
              </ScrollView>
            )}
            
            {showChat && (
              <KeyboardAvoidingView 
                style={styles.chatContainer}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={100}
              >
                <ScrollView 
                  style={styles.chatMessages}
                  ref={chatScrollRef}
                  contentContainerStyle={styles.chatMessagesContent}
                >
                  {chatMessages.length === 0 ? (
                    <Text style={styles.chatPlaceholder}>История сообщений появится здесь</Text>
                  ) : (
                    chatMessages.map(message => (
                      <View 
                        key={message.id} 
                        style={[
                          styles.chatMessageContainer,
                          message.senderId === '1' ? styles.myMessageContainer : styles.otherMessageContainer
                        ]}
                      >
                        {message.senderId !== '1' && (
                          <Text style={styles.messageAuthor}>{message.senderName}</Text>
                        )}
                        <View style={[
                          styles.messageBubble,
                          message.senderId === '1' ? styles.myMessageBubble : styles.otherMessageBubble
                        ]}>
                          <Text style={styles.messageText}>{message.text}</Text>
                        </View>
                        <Text style={styles.messageTime}>
                          {formatMessageTime(message.timestamp)}
                        </Text>
                      </View>
                    ))
                  )}
                </ScrollView>
                
                <View style={styles.chatInputContainer}>
                  <RNTextInput 
                    style={styles.chatInput} 
                    placeholder="Написать сообщение..." 
                    placeholderTextColor="#8e8e93"
                    value={inputMessage}
                    onChangeText={setInputMessage}
                    onSubmitEditing={sendMessage}
                    returnKeyType="send"
                    multiline={false}
                    blurOnSubmit={true}
                  />
                  <TouchableOpacity 
                    style={[
                      styles.sendButton,
                      {opacity: inputMessage.trim() ? 1 : 0.5}
                    ]}
                    onPress={sendMessage}
                    disabled={!inputMessage.trim()}
                  >
                    <MaterialIcons 
                      name="send" 
                      size={24} 
                      color={isDark ? '#007aff' : '#007aff'} 
                    />
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            )}
          </View>
        )}
        
        {/* Нижняя панель управления */}
        <Animated.View style={[
          styles.controls, 
          {
            opacity: controlsOpacity, 
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(20, 20, 20, 0.9)',
            paddingBottom: Math.max(insets.bottom + 16, 24),
            paddingLeft: insets.left,
            paddingRight: insets.right
          }
        ]}>
          <View style={styles.controlButtons}>
            <TouchableOpacity onPress={toggleMute} style={styles.controlButton}>
              <View style={[styles.iconCircle, isMuted && styles.iconCircleActive]}>
                <MaterialIcons name={isMuted ? "mic-off" : "mic"} size={24} color="#fff" />
              </View>
              <Text style={styles.controlText}>{isMuted ? 'Вкл. звук' : 'Выкл. звук'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={toggleVideo} style={styles.controlButton}>
              <View style={[styles.iconCircle, isVideoOff && styles.iconCircleActive]}>
                <MaterialIcons name={isVideoOff ? "videocam-off" : "videocam"} size={24} color="#fff" />
              </View>
              <Text style={styles.controlText}>{isVideoOff ? 'Вкл. видео' : 'Выкл. видео'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={toggleChat} style={styles.controlButton}>
              <View style={[styles.iconCircle, showChat && styles.iconCircleActive]}>
                <MaterialIcons name="chat" size={24} color="#fff" />
              </View>
              <Text style={styles.controlText}>Чат</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={toggleParticipants} style={styles.controlButton}>
              <View style={[styles.iconCircle, showParticipants && styles.iconCircleActive]}>
                <MaterialIcons name="people" size={24} color="#fff" />
                <Badge style={styles.participantsBadge}>{participants.length}</Badge>
              </View>
              <Text style={styles.controlText}>Участники</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.endCallButton} onPress={endMeeting}>
            <LinearGradient colors={['#ff3b30', '#ff453a']} style={styles.endCallGradient}>
              <Text style={styles.endCallText}>Завершить</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>

      {/* Модальное окно с профилем участника */}
      {showProfileModal && selectedParticipant && (
        <TouchableOpacity
          style={styles.profileModalOverlay}
          activeOpacity={1}
          onPress={closeParticipantProfile}
        >
          <TouchableOpacity 
            activeOpacity={1}
            style={styles.profileModalContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.profileModalHeader}>
              <Text style={styles.profileModalTitle}>Профиль участника</Text>
              <TouchableOpacity onPress={closeParticipantProfile}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileModalBody}>
              <View style={styles.profileModalAvatarSection}>
                <LinearGradient
                  colors={['#5E60CE', '#6A64E8']}
                  style={styles.profileModalAvatarBg}
                >
                  <Image
                    source={{ uri: selectedParticipant.avatarUrl }}
                    style={styles.profileModalAvatar}
                  />
                </LinearGradient>
                <Text style={styles.profileModalName}>{selectedParticipant.name}</Text>
                <Text style={styles.profileModalPosition}>{selectedParticipant.position}</Text>
                
                <View style={styles.profileModalStatusContainer}>
                  <Badge 
                    style={{
                      backgroundColor: selectedParticipant.isActive ? '#4cd964' : '#ff3b30'
                    }}
                  />
                  <Text style={styles.profileModalStatus}>
                    {selectedParticipant.isActive ? 'В сети' : 'Не в сети'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.profileModalInfoSection}>
                <Text style={styles.profileModalSectionTitle}>Информация</Text>
                
                <View style={styles.profileModalInfoItem}>
                  <MaterialIcons name="business" size={20} color="#8e8e93" />
                  <Text style={styles.profileModalInfoLabel}>Отдел:</Text>
                  <Text style={styles.profileModalInfoValue}>{selectedParticipant.department}</Text>
                </View>
                
                <View style={styles.profileModalInfoItem}>
                  <MaterialIcons name="email" size={20} color="#8e8e93" />
                  <Text style={styles.profileModalInfoLabel}>Email:</Text>
                  <Text style={styles.profileModalInfoValue}>{selectedParticipant.email}</Text>
                </View>
                
                <View style={styles.profileModalInfoItem}>
                  <MaterialIcons name="phone" size={20} color="#8e8e93" />
                  <Text style={styles.profileModalInfoLabel}>Телефон:</Text>
                  <Text style={styles.profileModalInfoValue}>{selectedParticipant.phone}</Text>
                </View>
              </View>
              
              <View style={styles.profileModalActions}>
                <TouchableOpacity 
                  style={styles.profileModalActionButton}
                  onPress={() => {
                    closeParticipantProfile();
                    toggleChat();
                  }}
                >
                  <MaterialIcons name="chat" size={20} color="#fff" />
                  <Text style={styles.profileModalActionText}>Сообщение</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.profileModalActionButton, { backgroundColor: '#ff3b30' }]}
                  onPress={() => {
                    Alert.alert(
                      'Демо-режим',
                      'В демо-версии эта функция недоступна',
                      [{ text: 'Понятно' }]
                    );
                    closeParticipantProfile();
                  }}
                >
                  <MaterialIcons name="person-remove" size={20} color="#fff" />
                  <Text style={styles.profileModalActionText}>Отключить</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  fullScreenContainer: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    zIndex: 100,
    elevation: 100,
  },
  closeButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  meetingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meetingTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 12,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timer: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 56, // Освобождаем место для кнопки закрытия
  },
  viewToggleButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoGrid: {
    paddingTop: 60,
    paddingBottom: 80,
    paddingHorizontal: 4,
  },
  videoContainer: {
    overflow: 'hidden',
    borderRadius: 12,
    margin: 4,
  },
  doubleVideo: {
    width: width - 16,
    height: height / 2 - 100,
  },
  quadVideo: {
    width: width / 2 - 8,
    height: height / 2 - 100,
  },
  multiVideo: {
    width: width / 2 - 8,
    height: width / 2 - 8,
  },
  singleVideo: {
    width: '100%',
    height: '100%',
  },
  speakerView: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 80,
  },
  speakerContainer: {
    flex: 1,
    padding: 16,
  },
  speakerVideoFeed: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerAvatar: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: '#fff',
  },
  speakerNameBadge: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  speakerNameText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  otherParticipantsScroll: {
    maxHeight: 100,
    paddingBottom: 10,
  },
  otherParticipantsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
  },
  otherParticipantItem: {
    marginHorizontal: 8,
    alignItems: 'center',
    width: 70,
  },
  otherParticipantGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  otherParticipantAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  otherParticipantName: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  micOffIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoFeed: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakingIndicator: {
    borderWidth: 3,
    borderColor: '#00c6ff',
  },
  participantAvatar: {
    width: width / 2 - 30,
    height: width / 2 - 30,
    borderRadius: (width / 2 - 30) / 2,
    backgroundColor: '#ddd',
    margin: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  participantNameBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantNameText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  videoOffIndicator: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2c2c2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOffText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  controlButton: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircleActive: {
    backgroundColor: '#ff375f',
  },
  controlText: {
    color: '#ffffff',
    fontSize: 13,
  },
  participantsBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF375F',
  },
  endCallButton: {
    marginHorizontal: 20,
    borderRadius: 28,
    overflow: 'hidden',
  },
  endCallGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  endCallText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  sidebar: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: width * 0.85,
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    zIndex: 50,
    elevation: 50,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sidebarTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  closeSidebarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantsList: {
    flex: 1,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  participantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  participantItemAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  participantItemName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  speakingText: {
    color: '#4cd964',
    fontWeight: '400',
  },
  statusChip: {
    height: 24,
    alignSelf: 'flex-start',
  },
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  chatMessages: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatPlaceholder: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: Platform.OS === 'ios' ? 30 : 0,
  },
  chatInput: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 16,
    color: '#fff',
    marginRight: 8,
  },
  sendButton: {
    margin: 0,
  },
  participantAvatarContainer: {
    position: 'relative',
  },
  speakingIndicatorDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4cd964',
    borderWidth: 2,
    borderColor: '#fff',
  },
  participantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatMessagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  chatMessageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageAuthor: {
    color: '#8e8e93',
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 4,
  },
  myMessageBubble: {
    backgroundColor: '#0a84ff',
  },
  otherMessageBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageText: {
    color: '#fff',
    fontSize: 15,
  },
  messageTime: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    alignSelf: 'flex-end',
    marginRight: 4,
  },
  chatMessages: {
    flex: 1,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Стили для модального окна профиля
  profileModalOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  profileModalContainer: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  profileModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileModalBody: {
    padding: 16,
  },
  profileModalAvatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileModalAvatarBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileModalAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  profileModalName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileModalPosition: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 8,
  },
  profileModalStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileModalStatus: {
    fontSize: 14,
    color: '#8e8e93',
    marginLeft: 6,
  },
  profileModalInfoSection: {
    marginBottom: 24,
  },
  profileModalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  profileModalInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileModalInfoLabel: {
    fontSize: 14,
    color: '#8e8e93',
    marginLeft: 8,
    marginRight: 8,
    width: 80,
  },
  profileModalInfoValue: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  profileModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileModalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
  },
  profileModalActionText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 