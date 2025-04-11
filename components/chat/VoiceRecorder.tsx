import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Icon } from '@/components/Icon';

interface VoiceRecorderProps {
  onRecordComplete: (audioUri: string, duration: number) => void;
  onCancel: () => void;
  visible: boolean;
  isDark: boolean;
}

export function VoiceRecorder({ onRecordComplete, onCancel, visible, isDark }: VoiceRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [recordingAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRecording) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
      
      // Анимация пульсации
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnimation, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(recordingAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      recordingAnimation.setValue(1);
      if (interval) {
        clearInterval(interval);
      }
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);

  useEffect(() => {
    if (!visible) {
      stopRecording(true);
    }
  }, [visible]);

  const startRecording = async () => {
    try {
      // Запрашиваем разрешение на запись аудио
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.error('Разрешение на запись аудио не предоставлено');
        return;
      }
      
      // Настраиваем качество аудио
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      
      // Создаем новую запись
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      
      setRecording(recording);
      setIsRecording(true);
      setTimer(0);
    } catch (error) {
      console.error('Ошибка при начале записи:', error);
    }
  };

  const stopRecording = async (cancelled = false) => {
    if (!recording) return;
    
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      
      if (!cancelled) {
        const uri = recording.getURI();
        if (uri) {
          const info = await FileSystem.getInfoAsync(uri);
          if (info.exists) {
            onRecordComplete(uri, timer);
          }
        }
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      setRecording(null);
    } catch (error) {
      console.error('Ошибка при остановке записи:', error);
    }
  };

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1e1e1e' : '#f0f0f0' }]}>
      <View style={styles.content}>
        <View style={styles.timerContainer}>
          <Animated.View
            style={[
              styles.recordIndicator,
              { backgroundColor: '#FF4136', transform: [{ scale: recordingAnimation }] },
            ]}
          />
          <Text style={[styles.timerText, { color: isDark ? '#fff' : '#333' }]}>
            {`${Math.floor(timer / 60)
              .toString()
              .padStart(2, '0')}:${(timer % 60).toString().padStart(2, '0')}`}
          </Text>
        </View>
        
        <View style={styles.controlsContainer}>
          {isRecording ? (
            <>
              <TouchableOpacity 
                style={[styles.controlButton, { backgroundColor: '#e74c3c' }]} 
                onPress={() => stopRecording(true)}
              >
                <Icon name="trash-2" size={24} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.controlButton, styles.mainButton, { backgroundColor: '#2ecc71' }]} 
                onPress={() => stopRecording(false)}
              >
                <Icon name="check" size={28} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.controlButton, { backgroundColor: '#e74c3c' }]} 
                onPress={onCancel}
              >
                <Icon name="x" size={24} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.controlButton, styles.mainButton, { backgroundColor: '#3498db' }]} 
                onPress={startRecording}
              >
                <Icon name="mic" size={28} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      
      <Text style={[styles.helpText, { color: isDark ? '#aaa' : '#666' }]}>
        {isRecording 
          ? 'Нажмите галочку, чтобы отправить запись' 
          : 'Нажмите на микрофон, чтобы начать запись'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mainButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  helpText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 14,
  },
}); 