// components/MenuButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MenuButtonProps {
  onPress: () => void;
  color?: string;
  size?: number;
}

export const MenuButton: React.FC<MenuButtonProps> = ({ 
  onPress, 
  color = '#333', 
  size = 24 
}) => {
  return (
    <TouchableOpacity 
      style={styles.menuButton} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="menu" size={size} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    padding: 10,
    marginLeft: 10,
  },
});
