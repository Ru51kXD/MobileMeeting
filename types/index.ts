export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskStatus {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface User {
  id: string;
  email: string;
  name: string;
  position?: string;
  avatarUrl?: string;
  role: UserRole;
  department?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: Date | string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string; // User ID
  createdBy: string; // User ID
  createdAt: Date | string;
  updatedAt: Date | string;
  attachments?: string[]; // URLs to attachments
  comments?: Comment[];
  taskComments?: TaskComment[]; // Добавляем массив комментариев
}

export interface Comment {
  id: string;
  text: string;
  createdBy: string; // User ID
  createdAt: Date | string;
  taskId: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  organizer: string; // User ID
  participants: string[]; // User IDs
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'TASK' | 'MEETING' | 'SYSTEM';
  read: boolean;
  relatedItemId?: string; // ID of related task or meeting
  createdAt: Date | string;
  userId: string;
}

export interface Department {
  id: string;
  name: string;
  managerId?: string; // User ID
  parentDepartmentId?: string;
}

// Новый интерфейс для комментариев
export interface TaskComment {
  id: string;
  text: string;
  createdBy: string;
  createdAt: Date;
  authorName?: string; // Имя автора для отображения
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string | null; // null для общего чата
  text: string;
  timestamp: Date;
  isRead: boolean;
  attachments?: string[]; // URL вложений (если есть)
}

export interface ChatRoom {
  id: string;
  name: string;
  isGroupChat: boolean;
  participants: string[];
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: Date;
  updatedAt: Date;
} 