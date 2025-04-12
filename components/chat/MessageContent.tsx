import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { MessageType } from '../../types/chatTypes';

export interface MessageContentProps {
  content: string;
  type: MessageType;
  metadata?: any;
  isDark: boolean;
}

const MessageContent = ({ 
  content, 
  type, 
  metadata,
  isDark
}: MessageContentProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  const toggleAudioPlayback = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } else if (metadata?.uri) {
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: metadata.uri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
      } catch (error) {
        console.error('Error loading sound:', error);
      }
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        if (sound) {
          sound.setPositionAsync(0);
        }
      }
    }
  };

  const formatDuration = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleFileOpen = async () => {
    if (metadata?.uri) {
      try {
        const fileExists = await FileSystem.getInfoAsync(metadata.uri);
        if (fileExists.exists) {
          await Linking.openURL(metadata.uri);
        } else {
          console.error('File does not exist:', metadata.uri);
        }
      } catch (error) {
        console.error('Error opening file:', error);
      }
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'text':
        return (
          <Text style={[styles.textContent, isDark && styles.textContentDark]}>
            {content}
          </Text>
        );
        
      case 'image':
        return (
          <TouchableOpacity 
            style={styles.imageContainer} 
            onPress={() => metadata?.uri && Linking.openURL(metadata.uri)}
          >
            <Image 
              source={{ uri: metadata?.uri }} 
              style={styles.image} 
              resizeMode="cover" 
            />
          </TouchableOpacity>
        );
        
      case 'file':
        return (
          <TouchableOpacity 
            style={[styles.fileContainer, isDark && styles.fileContainerDark]} 
            onPress={handleFileOpen}
          >
            <View style={styles.fileIconContainer}>
              <MaterialCommunityIcons 
                name="file-document-outline" 
                size={24} 
                color={isDark ? "#FFFFFF" : "#007AFF"} 
              />
            </View>
            <View style={styles.fileInfo}>
              <Text 
                style={[styles.fileName, isDark && styles.fileNameDark]} 
                numberOfLines={1}
              >
                {metadata?.name || 'Документ'}
              </Text>
              <Text 
                style={[styles.fileSize, isDark && styles.fileSizeDark]}
              >
                {metadata?.size ? `${(metadata.size / 1024).toFixed(1)} KB` : 'Неизвестный размер'}
              </Text>
            </View>
            <MaterialCommunityIcons 
              name="download" 
              size={20} 
              color={isDark ? "#0A84FF" : "#007AFF"} 
            />
          </TouchableOpacity>
        );
        
      case 'voice':
        return (
          <View style={[styles.voiceContainer, isDark && styles.voiceContainerDark]}>
            <TouchableOpacity 
              style={[styles.playButton, isPlaying && styles.pauseButton, isDark && styles.playButtonDark]} 
              onPress={toggleAudioPlayback}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={16} 
                color={isDark ? "#000000" : "#FFFFFF"} 
              />
            </TouchableOpacity>
            
            <View style={styles.audioInfoContainer}>
              <View style={[styles.waveform, isDark && styles.waveformDark]}>
                <View 
                  style={[
                    styles.waveformProgress, 
                    isDark && styles.waveformProgressDark,
                    { width: `${duration > 0 ? (position / duration) * 100 : 0}%` }
                  ]} 
                />
              </View>
              <Text style={[styles.audioDuration, isDark && styles.audioDurationDark]}>
                {formatDuration(metadata?.duration || duration)}
              </Text>
            </View>
          </View>
        );
        
      case 'emoji':
        return (
          <Text style={styles.emojiContent}>
            {content}
          </Text>
        );
        
      default:
        return (
          <Text style={[styles.textContent, isDark && styles.textContentDark]}>
            {content}
          </Text>
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  textContent: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
  },
  textContentDark: {
    color: '#FFFFFF',
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 4,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
  },
  fileContainerDark: {
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
    marginRight: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  fileNameDark: {
    color: '#FFFFFF',
  },
  fileSize: {
    fontSize: 12,
    color: '#8E8E93',
  },
  fileSizeDark: {
    color: '#BBBBBB',
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 18,
    padding: 8,
    paddingRight: 16,
    marginVertical: 4,
  },
  voiceContainerDark: {
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  playButtonDark: {
    backgroundColor: '#0A84FF',
  },
  pauseButton: {
    backgroundColor: '#34C759',
  },
  audioInfoContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  waveform: {
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  waveformDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  waveformProgress: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  waveformProgressDark: {
    backgroundColor: '#0A84FF',
  },
  audioDuration: {
    fontSize: 12,
    color: '#8E8E93',
    alignSelf: 'flex-end',
  },
  audioDurationDark: {
    color: '#BBBBBB',
  },
  emojiContent: {
    fontSize: 48,
  },
});

export default MessageContent;