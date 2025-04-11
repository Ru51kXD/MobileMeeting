import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Platform, 
  Modal,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Animated,
  Alert
} from 'react-native';
import { TextInput, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
// Временно отключаем Audio
// import { Audio } from 'expo-av';
import { EmojiPicker } from './EmojiPicker';

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSendMessage: () => void;
  onSendVoice?: (uri: string, duration: number) => void;
  onSendFile?: (uri: string, name: string, type: string) => void;
  onSendImage?: (uri: string, caption?: string) => void;
  onSendEmoji?: (emoji: string) => void;
  isDark: boolean;
  isSending: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChangeText,
  onSendMessage,
  onSendVoice,
  onSendFile,
  onSendImage,
  onSendEmoji,
  isDark,
  isSending
}) => {
  const [isAttachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [isEmojiPickerVisible, setEmojiPickerVisible] = useState(false);
  // Отключаем запись голосовых сообщений временно
  // const [isRecording, setIsRecording] = useState(false);
  // const [recordingDuration, setRecordingDuration] = useState(0);
  // const [recordingInstance, setRecordingInstance] = useState<Audio.Recording | null>(null);
  
  // const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const attachmentMenuAnimation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Запрашиваем разрешения при монтировании компонента
    (async () => {
      if (Platform.OS !== 'web') {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        // Отключаем запрос разрешения на аудио
        // const { status: audioStatus } = await Audio.requestPermissionsAsync();
        
        if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
          Alert.alert(
            'Требуются разрешения',
            'Для полноценной работы чата необходимы разрешения на доступ к камере и галерее'
          );
        }
      }
    })();
    
    // Очищаем таймеры при размонтировании
    // return () => {
    //   if (recordingTimer.current) {
    //     clearInterval(recordingTimer.current);
    //   }
    // };
  }, []);

  // Функции для работы с меню вложений
  const toggleAttachmentMenu = () => {
    if (isAttachmentMenuVisible) {
      Animated.timing(attachmentMenuAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setAttachmentMenuVisible(false));
    } else {
      setAttachmentMenuVisible(true);
      Animated.timing(attachmentMenuAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  // Функция для выбора изображения из галереи
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        // В реальном приложении здесь должна быть логика загрузки изображения на сервер
        const imageUri = result.assets[0].uri;
        
        // Для демонстрации просто имитируем отправку изображения
        if (onSendImage) {
          onSendImage(imageUri, value.trim() || undefined);
          onChangeText(''); // Очищаем поле ввода
        }
      }
    } catch (error) {
      console.error('Ошибка выбора изображения:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    } finally {
      toggleAttachmentMenu();
    }
  };

  // Функция для захвата фото с камеры
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        // В реальном приложении здесь должна быть логика загрузки изображения на сервер
        const imageUri = result.assets[0].uri;
        
        // Для демонстрации просто имитируем отправку изображения
        if (onSendImage) {
          onSendImage(imageUri, value.trim() || undefined);
          onChangeText(''); // Очищаем поле ввода
        }
      }
    } catch (error) {
      console.error('Ошибка захвата фото:', error);
      Alert.alert('Ошибка', 'Не удалось сделать фото');
    } finally {
      toggleAttachmentMenu();
    }
  };

  // Функция для выбора файла
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync();
      
      if (result.canceled === false && result.assets[0]) {
        const { uri, name, mimeType } = result.assets[0];
        
        // В реальном приложении здесь должна быть логика загрузки файла на сервер
        
        // Для демонстрации просто имитируем отправку файла
        if (onSendFile && name && mimeType) {
          onSendFile(uri, name, mimeType);
        }
      }
    } catch (error) {
      console.error('Ошибка выбора файла:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать файл');
    } finally {
      toggleAttachmentMenu();
    }
  };

  // Отключаем функции для работы с голосовыми сообщениями
  // const startRecording = async () => {
  //   try {
  //     // Настраиваем Audio
  //     await Audio.setAudioModeAsync({
  //       allowsRecordingIOS: true,
  //       playsInSilentModeIOS: true,
  //     });
  //     
  //     // Создаем новую запись
  //     const { recording } = await Audio.Recording.createAsync(
  //       Audio.RecordingOptionsPresets.HIGH_QUALITY
  //     );
  //     
  //     setRecordingInstance(recording);
  //     setIsRecording(true);
  //     setRecordingDuration(0);
  //     
  //     // Запускаем таймер для отображения длительности записи
  //     recordingTimer.current = setInterval(() => {
  //       setRecordingDuration(prev => prev + 1);
  //     }, 1000);
  //   } catch (error) {
  //     console.error('Ошибка начала записи:', error);
  //     Alert.alert('Ошибка', 'Не удалось начать запись');
  //   }
  // };

  // const stopRecording = async () => {
  //   try {
  //     if (!recordingInstance) return;
  //     
  //     // Останавливаем таймер
  //     if (recordingTimer.current) {
  //       clearInterval(recordingTimer.current);
  //       recordingTimer.current = null;
  //     }
  //     
  //     // Останавливаем запись
  //     await recordingInstance.stopAndUnloadAsync();
  //     await Audio.setAudioModeAsync({
  //       allowsRecordingIOS: false,
  //     });
  //     
  //     // Получаем URI записи
  //     const uri = recordingInstance.getURI();
  //     const duration = recordingDuration;
  //     
  //     // Сбрасываем состояние
  //     setRecordingInstance(null);
  //     setIsRecording(false);
  //     
  //     // Отправляем голосовое сообщение
  //     if (uri && onSendVoice) {
  //       onSendVoice(uri, duration);
  //     }
  //   } catch (error) {
  //     console.error('Ошибка остановки записи:', error);
  //     Alert.alert('Ошибка', 'Не удалось завершить запись');
  //     setIsRecording(false);
  //     setRecordingInstance(null);
  //   }
  // };

  // Обработка выбора эмодзи
  const handleEmojiSelect = (emoji: string) => {
    if (onSendEmoji && emoji.length === 2) { // Проверяем, что это одиночный эмодзи
      onSendEmoji(emoji);
    } else {
      // Добавляем эмодзи к тексту
      onChangeText(value + emoji);
    }
    setEmojiPickerVisible(false);
  };

  // Отрисовка меню вложений
  const renderAttachmentMenu = () => {
    const translateY = attachmentMenuAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [100, 0],
    });
    
    const opacity = attachmentMenuAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });
    
    return (
      <Modal
        transparent={true}
        visible={isAttachmentMenuVisible}
        animationType="none"
        onRequestClose={toggleAttachmentMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={toggleAttachmentMenu}>
          <Animated.View 
            style={[
              styles.attachmentMenuContainer, 
              { 
                transform: [{ translateY }],
                opacity,
                backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
              }
            ]}
          >
            <TouchableOpacity style={styles.attachmentOption} onPress={pickImage}>
              <MaterialCommunityIcons name="image" size={24} color={isDark ? '#ccc' : '#666'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentOption} onPress={takePhoto}>
              <MaterialCommunityIcons name="camera" size={24} color={isDark ? '#ccc' : '#666'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentOption} onPress={pickDocument}>
              <MaterialCommunityIcons name="file-document" size={24} color={isDark ? '#ccc' : '#666'} />
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
    );
  };

  // Отрисовка пикера эмодзи
  const renderEmojiPicker = () => {
    return (
      <Modal
        transparent={true}
        visible={isEmojiPickerVisible}
        animationType="slide"
        onRequestClose={() => setEmojiPickerVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setEmojiPickerVisible(false)}
        >
          <View 
            style={[
              styles.emojiPickerContainer, 
              { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }
            ]}
          >
            <EmojiPicker onEmojiSelect={handleEmojiSelect} isDark={isDark} />
          </View>
        </Pressable>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]}>
      {/* Кнопки для вложений и эмодзи */}
      <View style={styles.inputActionsContainer}>
        <IconButton
          icon="paperclip"
          size={24}
          onPress={toggleAttachmentMenu}
          iconColor={isDark ? '#aaa' : '#666'}
        />
        <IconButton
          icon="emoticon-outline"
          size={24}
          onPress={() => setEmojiPickerVisible(true)}
          iconColor={isDark ? '#aaa' : '#666'}
        />
      </View>
      
      {/* Поле ввода сообщения */}
      <TextInput
        style={[styles.input, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder="Введите сообщение..."
        placeholderTextColor={isDark ? '#888' : '#999'}
        mode="flat"
        multiline
        theme={{ colors: { primary: '#2196F3' } }}
      />

      {/* Кнопка отправки */}
      <IconButton
        icon="send"
        size={24}
        onPress={onSendMessage}
        disabled={!value.trim() || isSending}
        iconColor={!value.trim() || isSending ? '#ccc' : '#2196F3'}
      />
      
      {/* Модальные окна для вложений и эмодзи */}
      {renderAttachmentMenu()}
      {renderEmojiPicker()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  inputActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  attachmentMenuContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  attachmentOption: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
  emojiPickerContainer: {
    height: 300,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  }
}); 