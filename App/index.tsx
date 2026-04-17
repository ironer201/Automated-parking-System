// components/MainLayout.tsx
import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { MenuButton } from './MenuButton';
import { useMenu } from '@/hooks/useMenu';
import { SideMenu } from './SideMenu';

interface MainLayoutProps {
  children: React.ReactNode;
  showMenuButton?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  showMenuButton = true 
}) => {
  const { isMenuVisible, openMenu, closeMenu } = useMenu();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Fixed Header - DOES NOT SCROLL */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          {showMenuButton && (
            <MenuButton onPress={openMenu} color="#333" size={24} />
          )}
          {/* You can add title or other header content here */}
        </View>
      </SafeAreaView>

      {/* Scrollable Content - ONLY THIS SCROLLS */}
      <View style={styles.content}>
        {children}
      </View>

      {/* Side Menu Overlay */}
      <SideMenu visible={isMenuVisible} onClose={closeMenu} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    marginTop:35,
  },
  headerSafeArea: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
  },
});
