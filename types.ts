export interface Message {
  id: string;
  senderId: string;
  receiverId: string | null;
  chatRoomId?: string; // ID комнаты чата
  text: string;
  timestamp: Date;
  isRead: boolean;
} 