import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

type IconProps = {
  name: string;
  size?: number;
  color: string;
  style?: StyleProp<TextStyle>;
};

export function Icon({ name, size = 24, color, style }: IconProps) {
  return <Feather name={name} size={size} color={color} style={style} />;
} 