import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Типы для сообщений
export type MessageType = 'text' | 'image' | 'file' | 'emoji';

export interface MessageContentProps {
  content: string;
  type: MessageType;
  metadata?: {
    fileName?: string;
    fileType?: string;
    size?: number;
  };
  isDark: boolean;
  isOutgoing: boolean;
}

export const MessageContent: React.FC<MessageContentProps> = ({
  content,
  type,
  metadata,
  isDark,
  isOutgoing
}) => {
  // Функция для открытия файла
  const openFile = async () => {
    try {
      if (await Linking.canOpenURL(content)) {
        await Linking.openURL(content);
      } else {
        console.error('Невозможно открыть URL:', content);
      }
    } catch (error) {
      console.error('Ошибка при открытии файла:', error);
    }
  };

  // Определяем цвет текста в зависимости от темы и направления сообщения
  const textColor = isDark 
    ? (isOutgoing ? '#fff' : '#f0f0f0') 
    : (isOutgoing ? '#333' : '#000');

  // Отображаем разные типы сообщений
  switch (type) {
    case 'text':
      return (
        <Text style={[styles.textContent, { color: textColor }]}>
          {content}
        </Text>
      );
      
    case 'emoji':
      return (
        <Text style={styles.emojiContent}>
          {content}
        </Text>
      );
      
    case 'image':
      return (
        <View>
          <Image 
            source={{ uri: content }} 
            style={styles.imageContent} 
            resizeMode="cover"
          />
        </View>
      );
      
    case 'file':
      return (
        <TouchableOpacity style={styles.fileContainer} onPress={openFile}>
          <MaterialCommunityIcons 
            name="file-document-outline" 
            size={24} 
            color={isDark ? '#ccc' : '#666'} 
          />
          <View style={styles.fileInfo}>
            <Text style={{ color: textColor }}>
              {metadata?.fileName || 'Файл'}
            </Text>
            {metadata?.size && (
              <Text style={[styles.fileSize, { color: isDark ? '#aaa' : '#888' }]}>
                {Math.round(metadata.size / 1024)} КБ
              </Text>
            )}
          </View>
          <MaterialCommunityIcons 
            name="download" 
            size={20} 
            color={isDark ? '#ccc' : '#666'} 
          />
        </TouchableOpacity>
      );
      
    default:
      return <Text style={{ color: textColor }}>Неподдерживаемый тип сообщения</Text>;
  }
};

const styles = StyleSheet.create({
  textContent: {
    fontSize: 16,
    lineHeight: 22,
  },
  emojiContent: {
    fontSize: 48,
  },
  imageContent: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  }
}); 