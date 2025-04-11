import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { MessageContent, MessageType } from './MessageContent';
import dayjs from 'dayjs';

export interface MessageProps {
  id: string;
  content: string;
  type: MessageType;
  metadata?: {
    fileName?: string;
    fileType?: string;
    duration?: number;
    size?: number;
  };
  createdAt: string | Date;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  isOutgoing: boolean;
}

export const Message: React.FC<MessageProps> = ({
  content,
  type,
  metadata,
  createdAt,
  isOutgoing,
  sender
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Форматирование времени
  const formatTime = (date: string | Date) => {
    return dayjs(date).format('HH:mm');
  };
  
  return (
    <View style={[
      styles.container,
      isOutgoing ? styles.outgoingContainer : styles.incomingContainer
    ]}>
      {/* Контент сообщения */}
      <View style={[
        styles.bubble,
        isOutgoing 
          ? [styles.outgoingBubble, { backgroundColor: isDark ? '#0b93f6' : '#3478f6' }]
          : [styles.incomingBubble, { backgroundColor: isDark ? '#282828' : '#e5e5ea' }]
      ]}>
        {/* Имя отправителя для входящих сообщений в групповых чатах */}
        {!isOutgoing && (
          <Text style={[
            styles.senderName, 
            { color: isDark ? '#ccc' : '#666' }
          ]}>
            {sender.name}
          </Text>
        )}
        
        {/* Содержимое сообщения */}
        <MessageContent
          content={content}
          type={type}
          metadata={metadata}
          isDark={isDark}
          isOutgoing={isOutgoing}
        />
        
        {/* Время сообщения */}
        <Text style={[
          styles.timestamp, 
          { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }
        ]}>
          {formatTime(createdAt)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    marginVertical: 4,
    width: '100%',
  },
  outgoingContainer: {
    alignItems: 'flex-end',
  },
  incomingContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 2,
  },
  outgoingBubble: {
    borderTopRightRadius: 4,
  },
  incomingBubble: {
    borderTopLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
}); 