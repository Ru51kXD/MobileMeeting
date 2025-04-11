import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  isDark: boolean;
}

// Набор популярных эмодзи
const emojiCategories = [
  {
    name: 'Смайлы',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔']
  },
  {
    name: 'Жесты',
    emojis: ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏']
  },
  {
    name: 'Животные',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦄', '🦓', '🦍', '🐘', '🦒', '🦘', '🦔']
  },
  {
    name: 'Еда',
    emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🌭', '🍔', '🍟', '🍕', '🌮', '🍣', '🍦', '🍩']
  },
  {
    name: 'Активности',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽']
  },
  {
    name: 'Путешествия',
    emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🛺', '🚔', '🚍', '🚘', '🚖', '✈️', '🚀', '🛸', '🚁', '🛶']
  },
  {
    name: 'Символы',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯']
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, isDark }) => {
  const [selectedCategory, setSelectedCategory] = React.useState(0);
  
  return (
    <View style={styles.container}>
      {/* Заголовок */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
        <Text style={[styles.headerText, { color: isDark ? '#fff' : '#000' }]}>Выберите эмодзи</Text>
      </View>
      
      {/* Категории */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={[styles.categoriesContainer, { borderBottomColor: isDark ? '#333' : '#eee' }]}
      >
        {emojiCategories.map((category, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.categoryButton,
              selectedCategory === index && { 
                borderBottomColor: isDark ? '#2196F3' : '#2196F3',
                borderBottomWidth: 2,
              }
            ]}
            onPress={() => setSelectedCategory(index)}
          >
            <Text style={[
              styles.categoryText, 
              { color: isDark ? '#ccc' : '#666' },
              selectedCategory === index && { color: isDark ? '#2196F3' : '#2196F3' }
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Сетка эмодзи */}
      <ScrollView style={styles.emojiGridContainer}>
        <View style={styles.emojiGrid}>
          {emojiCategories[selectedCategory].emojis.map((emoji, index) => (
            <TouchableOpacity
              key={index}
              style={styles.emojiButton}
              onPress={() => onEmojiSelect(emoji)}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoriesContainer: {
    padding: 5,
    borderBottomWidth: 1,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
  },
  categoryText: {
    fontSize: 14,
  },
  emojiGridContainer: {
    flex: 1,
    padding: 10,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  emojiButton: {
    width: '16.6%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  emojiText: {
    fontSize: 24,
  },
}); 