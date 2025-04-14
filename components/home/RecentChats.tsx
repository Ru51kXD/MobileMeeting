import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Card } from 'react-native-paper';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '@/constants/Colors';

// Временные данные для недавних чатов
const DEMO_RECENT_CHATS = [
  {
    id: '1',
    name: 'Команда проекта Альфа',
    lastMessage: 'Алексей: Презентация готова, отправлю завтра',
    avatarUrl: 'https://ui-avatars.com/api/?name=Team+Alpha&background=5E35B1&color=fff',
    timestamp: new Date(Date.now() - 1800000), // 30 минут назад
    unreadCount: 2,
  },
  {
    id: '2',
    name: 'Елена Петрова',
    lastMessage: 'Вы: Хорошо, жду результаты тестирования',
    avatarUrl: 'https://ui-avatars.com/api/?name=Elena+Petrova&background=2E7D32&color=fff',
    timestamp: new Date(Date.now() - 43200000), // 12 часов назад
    unreadCount: 0,
  },
  {
    id: '3',
    name: 'Отдел разработки',
    lastMessage: 'Дмитрий: Обновил код в репозитории',
    avatarUrl: 'https://ui-avatars.com/api/?name=Dev+Team&background=00695C&color=fff',
    timestamp: new Date(Date.now() - 86400000), // 1 день назад
    unreadCount: 5,
  },
];

interface RecentChatsProps {
  onPress?: () => void;
}

const RecentChats: React.FC<RecentChatsProps> = ({ onPress }) => {
  const { isDark } = useTheme();

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 60) {
      return `${diffMin} мин. назад`;
    } else if (diffHours < 24) {
      return `${diffHours} ч. назад`;
    } else {
      return `${diffDays} д. назад`;
    }
  };

  const navigateToChat = (chatId: string) => {
    router.push({
      pathname: '/(tabs)/chats/[id]',
      params: { id: chatId }
    });
  };

  const navigateToAllChats = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/(tabs)/chats');
    }
  };

  return (
    <Card
      style={[
        styles.card,
        { backgroundColor: isDark ? Colors.dark.cardBackground : Colors.light.cardBackground }
      ]}
    >
      <Card.Title
        title="Недавние сообщения"
        titleStyle={[styles.cardTitle, { color: isDark ? Colors.dark.text : Colors.light.text }]}
      />
      <Card.Content style={styles.cardContent}>
        {DEMO_RECENT_CHATS.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            style={[
              styles.chatItem,
              {
                borderLeftWidth: chat.unreadCount > 0 ? 3 : 0,
                borderLeftColor: chat.unreadCount > 0 
                  ? (isDark ? Colors.dark.tint : Colors.light.tint) 
                  : 'transparent'
              }
            ]}
            onPress={() => navigateToChat(chat.id)}
          >
            <Image source={{ uri: chat.avatarUrl }} style={styles.avatar} />
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={[styles.chatName, { color: isDark ? Colors.dark.text : Colors.light.text }]}>
                  {chat.name}
                </Text>
                <Text style={styles.timestamp}>{formatTimestamp(chat.timestamp)}</Text>
              </View>
              <Text
                style={[styles.lastMessage, { color: isDark ? Colors.dark.subtext : Colors.light.subtext }]}
                numberOfLines={1}
              >
                {chat.lastMessage}
              </Text>
            </View>
            {chat.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{chat.unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </Card.Content>
      <Card.Actions style={styles.cardActions}>
        <TouchableOpacity
          style={[
            styles.viewAllButton,
            { backgroundColor: isDark ? Colors.dark.tint + '20' : Colors.light.tint + '20' }
          ]}
          onPress={navigateToAllChats}
        >
          <Text style={[styles.viewAllText, { color: isDark ? Colors.dark.tint : Colors.light.tint }]}>
            Все сообщения
          </Text>
        </TouchableOpacity>
      </Card.Actions>
    </Card>
  );
};

export default RecentChats;

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  cardContent: {
    paddingHorizontal: 8,
  },
  cardActions: {
    justifyContent: 'center',
    paddingBottom: 8,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  lastMessage: {
    fontSize: 14,
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#007aff',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 