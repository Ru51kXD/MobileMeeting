import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { Button, ButtonGroup } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import Colors from '../constants/Colors';

export default function UIShowcaseScreen() {
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? Colors.dark.text : Colors.light.text }]}>
          UI Showcase
        </Text>
        <View style={styles.themeToggle}>
          <Text style={[styles.themeLabel, { color: isDark ? Colors.dark.text : Colors.light.text }]}>
            Dark Mode
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: Colors.primary }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? Colors.dark.text : Colors.light.text }]}>
          Text Fields
        </Text>
        
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon="mail-outline"
          variant="outlined"
          placeholder="Enter your email"
        />

        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          leftIcon="lock-closed-outline"
          rightIcon="eye-outline"
          variant="filled"
          placeholder="Enter your password"
        />

        <TextField
          label="Name"
          value={name}
          onChangeText={setName}
          leftIcon="person-outline"
          variant="underlined"
          placeholder="Enter your name"
        />

        <TextField
          label="Comment"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
          variant="plain"
          placeholder="Write your comment"
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? Colors.dark.text : Colors.light.text }]}>
          Buttons
        </Text>

        <Text style={[styles.subSectionTitle, { color: isDark ? Colors.dark.text : Colors.light.text }]}>
          Variants
        </Text>
        <View style={styles.row}>
          <Button title="Primary" onPress={() => {}} variant="primary" />
          <Button title="Secondary" onPress={() => {}} variant="secondary" />
          <Button title="Outlined" onPress={() => {}} variant="outlined" />
        </View>
        <View style={styles.row}>
          <Button title="Text" onPress={() => {}} variant="text" />
          <Button title="Destructive" onPress={() => {}} variant="destructive" />
        </View>

        <Text style={[styles.subSectionTitle, { color: isDark ? Colors.dark.text : Colors.light.text }]}>
          Sizes
        </Text>
        <View style={styles.row}>
          <Button title="Small" onPress={() => {}} size="small" />
          <Button title="Medium" onPress={() => {}} size="medium" />
          <Button title="Large" onPress={() => {}} size="large" />
        </View>

        <Text style={[styles.subSectionTitle, { color: isDark ? Colors.dark.text : Colors.light.text }]}>
          With Icons
        </Text>
        <View style={styles.row}>
          <Button title="Save" onPress={() => {}} leftIcon="save-outline" />
          <Button title="Delete" onPress={() => {}} rightIcon="trash-outline" variant="destructive" />
          <Button 
            title="Share" 
            onPress={() => {}} 
            leftIcon="share-outline" 
            variant="outlined" 
          />
        </View>

        <Text style={[styles.subSectionTitle, { color: isDark ? Colors.dark.text : Colors.light.text }]}>
          States
        </Text>
        <View style={styles.row}>
          <Button title="Disabled" onPress={() => {}} disabled />
          <Button title="Loading" onPress={() => {}} loading />
          <Button title="Rounded" onPress={() => {}} rounded />
        </View>

        <Text style={[styles.subSectionTitle, { color: isDark ? Colors.dark.text : Colors.light.text }]}>
          Button Group
        </Text>
        <ButtonGroup>
          <Button title="Left" onPress={() => {}} variant="outlined" />
          <Button title="Middle" onPress={() => {}} variant="primary" />
          <Button title="Right" onPress={() => {}} variant="outlined" />
        </ButtonGroup>

        <ButtonGroup spaceBetween style={styles.fullWidth}>
          <Button title="Cancel" onPress={() => {}} variant="text" />
          <Button title="Submit" onPress={() => {}} />
        </ButtonGroup>

        <Button 
          title="Full Width Button" 
          onPress={() => {}} 
          fullWidth 
          leftIcon="checkmark-outline"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeLabel: {
    marginRight: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  fullWidth: {
    width: '100%',
    marginVertical: 16,
  },
}); 