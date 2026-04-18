// components/SideMenu.tsx
import React, { useRef, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  PanResponder,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MENU_WIDTH = SCREEN_WIDTH * 0.75;

export interface MenuItem {  
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  danger?: boolean;
}

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
  menuItems?: MenuItem[];
}

export const SideMenu: React.FC<SideMenuProps> = ({ 
  visible, 
  onClose, 
  menuItems 
}) => {
  const translateX = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const router = useRouter();

  useEffect(() => {
    if (visible) {
      openMenu();
    } else {
      closeMenu();
    }
  }, [visible]);

  const openMenu = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeMenu = () => {
    Animated.spring(translateX, {
      toValue: -MENU_WIDTH,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
    setTimeout(() => {
      if (visible) onClose();
    }, 200);
  };

  const defaultMenuItems: MenuItem[] = [
    {
      icon: 'person-outline',
      title: 'Profile',
      onPress: () => {
        router.push('/profile' as any);
        onClose();
      },
    },
    {
      icon: 'car-outline',
      title: 'My Vehicles',
      onPress: () => {
        router.push('/vehicles' as any); 
        onClose();
      },
    },
    {
      icon: 'time-outline',
      title: 'Parking History',
      onPress: () => {
        router.push('/history' as any);
        onClose();
      },
    },
    {
      icon: 'settings-outline',
      title: 'Settings',
      onPress: () => {
        router.push('/settings' as any);
        onClose();
      },
    },
    {
      icon: 'log-out-outline',
      title: 'Logout',
      onPress: () => {
        // Handle logout
        onClose();
      },
      danger: true,
    },
  ];

  const items = menuItems || defaultMenuItems;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx > 0 && visible) {
        const newX = Math.min(0, -MENU_WIDTH + gestureState.dx);
        translateX.setValue(newX);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > MENU_WIDTH * 0.3) {
        closeMenu();
      } else {
        openMenu();
      }
    },
  });

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={closeMenu}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        
        <Animated.View 
          style={[
            styles.menuContainer,
            { transform: [{ translateX }] }
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Ionicons name="person-circle" size={60} color="#f2b134" />
              <Text style={styles.userName}>John Doe</Text>
              <Text style={styles.userEmail}>john@example.com</Text>
            </View>
            <TouchableOpacity onPress={closeMenu} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.menuItems}>
            {items.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <Ionicons 
                  name={item.icon} 
                  size={24} 
                  color={item.danger ? '#ff4444' : '#333'} 
                />
                <Text style={[
                  styles.menuText,
                  item.danger && styles.dangerText
                ]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContainer: {
    position: 'absolute', // Add this
    left: 0, // Add this
    top: 0, // Add this
    width: MENU_WIDTH,
    backgroundColor: '#fff',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    padding: 5,
  },
  menuItems: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  dangerText: {
    color: '#ff4444',
  },
});
