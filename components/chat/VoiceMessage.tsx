import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Icon } from '@/components/Icon';

interface VoiceMessageProps {
  uri: string;
  duration: number;
  isDark: boolean;
  isOutgoing: boolean;
}

export function VoiceMessage({ uri, duration, isDark, isOutgoing }: VoiceMessageProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [barAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    // Загружаем звуковой файл при монтировании
    const loadSound = async () => {
      try {
        setLoadingAudio(true);
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false, progressUpdateIntervalMillis: 100 },
          onPlaybackStatusUpdate
        );
        setSound(sound);
        setLoadingAudio(false);
      } catch (error) {
        console.error('Ошибка при загрузке звука:', error);
        setLoadingAudio(false);
      }
    };

    loadSound();

    // Очистка при размонтировании
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [uri]);

  // Обработчик обновления статуса воспроизведения
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis / 1000);
      setIsPlaying(status.isPlaying);
      
      if (status.didJustFinish) {
        // Сброс после окончания воспроизведения
        setIsPlaying(false);
        setPlaybackPosition(0);
        barAnimation.setValue(0);
      } else if (status.isPlaying) {
        // Анимация прогресс-бара
        Animated.timing(barAnimation, {
          toValue: status.positionMillis / (duration * 1000),
          duration: 100,
          useNativeDriver: false,
        }).start();
      }
    }
  };

  // Воспроизведение/пауза
  const togglePlayback = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        // Если мы в конце, начинаем с начала
        if (playbackPosition >= duration) {
          await sound.setPositionAsync(0);
        }
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Ошибка при воспроизведении:', error);
    }
  };

  // Форматирование времени
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const progressBarWidth = barAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[
          styles.playButton, 
          {
            backgroundColor: isOutgoing 
              ? (isDark ? '#1e88e5' : '#2196F3') 
              : (isDark ? '#555' : '#e0e0e0')
          }
        ]} 
        onPress={togglePlayback}
        disabled={loadingAudio}
      >
        <Icon 
          name={loadingAudio ? 'loader' : isPlaying ? 'pause' : 'play'} 
          size={20} 
          color="#fff" 
        />
      </TouchableOpacity>
      
      <View style={styles.contentContainer}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: isDark ? '#555' : '#e0e0e0' }]}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { 
                  width: progressBarWidth, 
                  backgroundColor: isOutgoing 
                    ? (isDark ? '#1e88e5' : '#2196F3') 
                    : (isDark ? '#aaa' : '#9e9e9e') 
                }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.timeInfoContainer}>
          <Icon name="mic" size={14} color={isDark ? '#aaa' : '#999'} style={styles.micIcon} />
          <Text style={[styles.durationText, { color: isDark ? '#aaa' : '#999' }]}>
            {isPlaying ? formatTime(playbackPosition) : formatTime(duration)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 4,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  progressContainer: {
    width: '100%',
    height: 20,
    justifyContent: 'center',
  },
  progressBar: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  micIcon: {
    marginRight: 4,
  },
  durationText: {
    fontSize: 12,
  },
}); 