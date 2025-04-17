import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, FlatList } from 'react-native';
import { Text, Button, IconButton, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Meeting } from '@/types/meeting';
import ThemedContainer from '@/components/ThemedContainer';

type VideoMeetingPageProps = {
  meetingId?: string;
};

export default function VideoMeetingScreen({ meetingId }: VideoMeetingPageProps) {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const theme = useTheme();
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Имитация участников
  const participants = [
    { id: '1', name: 'Вы (Организатор)', isMainUser: true },
    { id: '2', name: 'Анна Смирнова', isMainUser: false },
    { id: '3', name: 'Иван Петров', isMainUser: false },
    { id: '4', name: 'Мария Иванова', isMainUser: false },
  ];

  const handleEndMeeting = () => {
    router.back();
  };

  const renderParticipant = ({ item }: { item: any }) => (
    <View style={styles.participantCard}>
      <View style={styles.participantVideo}>
        <LinearGradient
          colors={['#2196F3', '#4CAF50']}
          style={styles.participantVideoPlaceholder}
        >
          <Text style={styles.participantInitials}>
            {item.name.split(' ').map((n: string) => n[0]).join('')}
          </Text>
        </LinearGradient>
        <Text style={styles.participantName}>{item.name}</Text>
      </View>
    </View>
  );

  return (
    <ThemedContainer style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Верхняя панель */}
      <View style={styles.header}>
        <View style={styles.meetingInfoContainer}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={handleEndMeeting}
          />
          <View>
            <Text style={styles.meetingTitle}>Видеоконференция</Text>
            <Text style={styles.meetingTime}>Активна: 00:05:32</Text>
          </View>
        </View>
        <IconButton
          icon="dots-vertical"
          size={24}
        />
      </View>
      
      {/* Основной вид */}
      <View style={styles.mainContent}>
        <FlatList
          data={participants}
          renderItem={renderParticipant}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.participantsList}
        />
      </View>
      
      {/* Нижняя панель с элементами управления */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.controlButton, isAudioMuted && styles.controlButtonActive]}
          onPress={() => setIsAudioMuted(!isAudioMuted)}
        >
          <MaterialIcons 
            name={isAudioMuted ? "mic-off" : "mic"} 
            size={24} 
            color={isAudioMuted ? "#fff" : isDark ? "#fff" : "#000"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, isVideoMuted && styles.controlButtonActive]}
          onPress={() => setIsVideoMuted(!isVideoMuted)}
        >
          <MaterialIcons 
            name={isVideoMuted ? "videocam-off" : "videocam"} 
            size={24} 
            color={isVideoMuted ? "#fff" : isDark ? "#fff" : "#000"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, isScreenSharing && styles.controlButtonActive]}
          onPress={() => setIsScreenSharing(!isScreenSharing)}
        >
          <MaterialIcons 
            name="screen-share" 
            size={24} 
            color={isScreenSharing ? "#fff" : isDark ? "#fff" : "#000"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, isChatOpen && styles.controlButtonActive]}
          onPress={() => setIsChatOpen(!isChatOpen)}
        >
          <MaterialIcons 
            name="chat" 
            size={24} 
            color={isChatOpen ? "#fff" : isDark ? "#fff" : "#000"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.endCallButton}
          onPress={handleEndMeeting}
        >
          <MaterialIcons name="call-end" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </ThemedContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 60,
  },
  meetingInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  meetingTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  mainContent: {
    flex: 1,
    padding: 8,
  },
  participantsList: {
    padding: 8,
  },
  participantCard: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  participantVideo: {
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
  },
  participantVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantInitials: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  participantName: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
  controlButtonActive: {
    backgroundColor: '#2196F3',
  },
  endCallButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F44336',
  },
}); 