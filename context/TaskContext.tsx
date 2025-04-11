import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskPriority, TaskStatus } from '../types';

// Временные примеры задач
const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Разработать макет для нового проекта',
    description: 'Создать прототип пользовательского интерфейса для мобильного приложения',
    deadline: new Date(Date.now() + 86400000 * 2), // через 2 дня
    priority: TaskPriority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    assignedTo: '3',
    createdBy: '2',
    createdAt: new Date(Date.now() - 86400000), // вчера
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Подготовить отчет по продажам',
    description: 'Подготовить квартальный отчет по продажам для совета директоров',
    deadline: new Date(Date.now() + 86400000 * 5), // через 5 дней
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.ASSIGNED,
    assignedTo: '3',
    createdBy: '1',
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: '3',
    title: 'Запланировать встречу с клиентом',
    description: 'Организовать встречу с представителями ABC Corp для обсуждения нового контракта',
    deadline: new Date(Date.now() + 86400000 * 3),
    priority: TaskPriority.URGENT,
    status: TaskStatus.ASSIGNED,
    assignedTo: '2',
    createdBy: '1',
    createdAt: new Date(Date.now() - 86400000 * 1),
    updatedAt: new Date(Date.now() - 86400000 * 1),
  },
  {
    id: '4',
    title: 'Обновить документацию',
    description: 'Обновить техническую документацию для проекта XYZ',
    deadline: new Date(Date.now() + 86400000 * 10),
    priority: TaskPriority.LOW,
    status: TaskStatus.COMPLETED,
    assignedTo: '3',
    createdBy: '2',
    createdAt: new Date(Date.now() - 86400000 * 15),
    updatedAt: new Date(Date.now() - 86400000 * 2),
  },
];

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('@tasks');
      if (storedTasks) {
        // Преобразуем строки дат обратно в объекты Date
        const parsedTasks = JSON.parse(storedTasks, (key, value) => {
          if (key === 'deadline' || key === 'createdAt' || key === 'updatedAt') {
            return new Date(value);
          }
          return value;
        });
        setTasks(parsedTasks);
      } else {
        // Если задач еще нет, используем начальные демо-задачи
        setTasks(INITIAL_TASKS);
        await AsyncStorage.setItem('@tasks', JSON.stringify(INITIAL_TASKS));
      }
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
      // В случае ошибки используем начальные демо-задачи
      setTasks(INITIAL_TASKS);
    }
  };

  const saveTasks = async (updatedTasks: Task[]) => {
    try {
      await AsyncStorage.setItem('@tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      console.error('Ошибка сохранения задач:', error);
    }
  };

  const addTask = async (task: Omit<Task, 'id'>) => {
    try {
      const newTask = {
        ...task,
        id: Date.now().toString() // Генерируем уникальный ID
      } as Task;
      
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      await saveTasks(updatedTasks);
    } catch (error) {
      console.error('Ошибка добавления задачи:', error);
    }
  };

  const updateTask = async (updatedTask: Task) => {
    try {
      const updatedTasks = tasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      );
      setTasks(updatedTasks);
      await saveTasks(updatedTasks);
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      setTasks(updatedTasks);
      await saveTasks(updatedTasks);
    } catch (error) {
      console.error('Ошибка удаления задачи:', error);
    }
  };

  const refreshTasks = async () => {
    await loadTasks();
  };

  return (
    <TaskContext.Provider 
      value={{ 
        tasks, 
        addTask, 
        updateTask, 
        deleteTask,
        refreshTasks
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
}; 