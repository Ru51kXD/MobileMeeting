import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import MessageContent from './MessageContent';
import { Employee } from '../../context/ChatContext';
import { MessageType } from '../../types/chatTypes';

export interface MessageProps {
  id: string;
  content: string;
  type: MessageType;
  metadata?: any;
  createdAt: Date;
  isOutgoing: boolean;
  sender?: Employee;
  isLast?: boolean;
  showDate?: boolean;
  onUserPress?: (employeeId: string) => void;
}

const Message = ({ 
  id,
  content, 
  type, 
  metadata, 
  createdAt, 
  isOutgoing, 
  sender,
  isLast = false,
  showDate = false,
  onUserPress
}: MessageProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const formattedTime = format(new Date(createdAt), 'HH:mm');
  const formattedDate = format(new Date(createdAt), 'dd MMMM', { locale: ru });
  
  const handleUserPress = () => {
    if (sender && onUserPress) {
      onUserPress(sender.id);
    }
  };

  return (
    <View style={[styles.container, isOutgoing ? styles.outgoingContainer : styles.incomingContainer]}>
      {showDate && (
        <View style={styles.dateContainer}>
          <Text style={[styles.dateText, isDark && styles.dateTextDark]}>{formattedDate}</Text>
        </View>
      )}
      
      <View style={styles.messageRow}>
        {!isOutgoing && sender && (
          <TouchableOpacity onPress={handleUserPress} style={styles.avatarContainer}>
            <LinearGradient
              colors={['#4c669f', '#3b5998', '#192f6a']}
              style={styles.avatarBorder}
            >
              {sender.avatarUrl ? (
                <Image source={{ uri: sender.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, isDark && styles.avatarPlaceholderDark]}>
                  <Text style={styles.avatarText}>{sender.name.charAt(0)}</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
        
        <View style={[
          styles.messageContainer,
          isOutgoing ? styles.outgoingMessage : styles.incomingMessage,
          isDark && (isOutgoing ? styles.outgoingMessageDark : styles.incomingMessageDark)
        ]}>
          {!isOutgoing && sender && (
            <TouchableOpacity onPress={handleUserPress}>
              <Text style={[styles.senderName, isDark && styles.senderNameDark]}>{sender.name}</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.contentContainer}>
            <MessageContent 
              content={content} 
              type={type} 
              metadata={metadata} 
              isDark={isDark}
            />
          </View>
          
          <Text style={[styles.timestamp, isDark && styles.timestampDark]}>
            {formattedTime}
          </Text>
        </View>

        {isOutgoing && (
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, styles.statusDelivered, isDark && styles.statusDotDark]} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '100%',
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#7A7A7A',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateTextDark: {
    color: '#BBBBBB',
    backgroundColor: '#2C2C2E',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  outgoingContainer: {
    alignSelf: 'flex-end',
    marginLeft: 50,
  },
  incomingContainer: {
    alignSelf: 'flex-start',
    marginRight: 50,
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 8,
  },
  avatarBorder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E1E1E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderDark: {
    backgroundColor: '#3A3A3C',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6E6E6E',
  },
  messageContainer: {
    maxWidth: '100%',
    borderRadius: 20,
    padding: 12,
    paddingBottom: 8,
  },
  outgoingMessage: {
    backgroundColor: '#D0E8FF',
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  outgoingMessageDark: {
    backgroundColor: '#0A84FF',
  },
  incomingMessage: {
    backgroundColor: '#F2F2F7',
    borderBottomLeftRadius: 4,
  },
  incomingMessageDark: {
    backgroundColor: '#2C2C2E',
  },
  glassEffect: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  senderNameDark: {
    color: '#0A84FF',
  },
  contentContainer: {
    minWidth: 80,
  },
  timestamp: {
    fontSize: 11,
    color: '#8E8E93',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  timestampDark: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statusContainer: {
    marginLeft: 4,
    marginBottom: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34C759',
  },
  statusDelivered: {
    backgroundColor: '#007AFF',
  },
  statusDotDark: {
    opacity: 0.8,
  },
});

export default Message; 