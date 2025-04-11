import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { Avatar, TextInput, Button, Card, Divider } from 'react-native-paper';
import { TaskComment } from '../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TaskCommentsProps {
  comments: TaskComment[];
  onAddComment: (text: string) => void;
  currentUserId: string;
}

const TaskComments = ({ comments, onAddComment, currentUserId }: TaskCommentsProps) => {
  const [newComment, setNewComment] = useState('');

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  const formatDateTime = (date: Date) => {
    return format(new Date(date), 'dd MMMM yyyy, HH:mm', { locale: ru });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Комментарии</Text>
      
      {comments.length > 0 ? (
        <View style={styles.commentsList}>
          {comments.map((comment, index) => (
            <Card key={comment.id || index} style={styles.commentCard}>
              <Card.Content>
                <View style={styles.commentHeader}>
                  <Avatar.Text 
                    size={36} 
                    label={comment.authorName?.substring(0, 2) || 'U'} 
                    style={comment.createdBy === currentUserId ? styles.currentUserAvatar : undefined}
                  />
                  <View style={styles.commentInfo}>
                    <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                    <Text style={styles.commentDate}>{formatDateTime(comment.createdAt)}</Text>
                  </View>
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyMessage}>Нет комментариев</Text>
      )}
      
      <Divider style={styles.divider} />
      
      <View style={styles.addCommentSection}>
        <TextInput
          label="Добавить комментарий"
          value={newComment}
          onChangeText={setNewComment}
          multiline
          style={styles.commentInput}
          mode="outlined"
        />
        <Button 
          mode="contained" 
          onPress={handleAddComment}
          disabled={!newComment.trim()}
          style={styles.addButton}
        >
          Отправить
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  commentsList: {
    marginBottom: 16,
  },
  commentCard: {
    marginBottom: 12,
    elevation: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentInfo: {
    marginLeft: 12,
  },
  commentAuthor: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  commentDate: {
    fontSize: 12,
    color: '#777',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyMessage: {
    fontStyle: 'italic',
    color: '#888',
    textAlign: 'center',
    marginVertical: 16,
  },
  divider: {
    marginVertical: 16,
  },
  addCommentSection: {
    marginBottom: 16,
  },
  commentInput: {
    marginBottom: 16,
  },
  addButton: {
    alignSelf: 'flex-end',
  },
  currentUserAvatar: {
    backgroundColor: '#2196F3',
  },
});

export default TaskComments; 