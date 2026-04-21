import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
  BackHandler, 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MainLayout } from '@/components/MainLayout';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback , useEffect} from 'react';

const { width } = Dimensions.get('window');

interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  bgColor: string;
  route?: string;
}

const LandingPage = () => {
  const router = useRouter();

useEffect(() => {
  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    router.replace('/landing');
    return true;
  });

  return () => {
    backHandler.remove(); // This works in newer React Native
    // OR try this if above fails:
    // BackHandler.removeEventListener('hardwareBackPress', () => {});
  };
}, [router]);

  const quickActions: QuickAction[] = [
    { id: '1', title: 'Find Parking', icon: 'search', bgColor: '#4A90E2', route: '/rent' },
    { id: '2', title: 'Secure Entry', icon: 'lock-closed', bgColor: '#50C878', route: '/secure-entry' },
    { id: '3', title: 'Book Slot', icon: 'calendar', bgColor: '#FF6B6B', route: '/booking' },
    { id: '4', title: 'Smart Alerts', icon: 'notifications', bgColor: '#FFB347', route: '/alerts' },
    { id: '5', title: 'Payment', icon: 'card', bgColor: '#9B59B6', route: '/payment' },
    { id: '6', title: 'Data', icon: 'bar-chart', bgColor: '#3498DB', route: '/data' },
    { id: '7', title: 'Support', icon: 'headset', bgColor: '#E67E22', route: '/support' },
  ];

  const handleQuickAction = (action: QuickAction) => {
    if (action.route) {
      try {
        router.push(action.route as any);
      } catch (error) {
        console.error('Navigation failed:', error);
        Alert.alert('Coming Soon', `${action.title} feature will be available soon`);
      }
    } else {
      Alert.alert('Coming Soon', `${action.title} feature will be available soon`);
    }
  };

  return (
    <MainLayout>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome back!</Text>
          <Text style={styles.welcomeSubtitle}>
            Find and book parking spots easily
          </Text>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => handleQuickAction(action)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconContainer, { backgroundColor: action.bgColor }]}>
                  <Ionicons name={action.icon} size={24} color="#FFF" />
                </View>
                <Text style={styles.actionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Extra padding at bottom for better scrolling */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    paddingBottom: 20,
    marginTop: 80,
  },
  welcomeSection: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 60) / 3, // Restored 3 columns with space-between
    marginBottom: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 20,
  },
});

export default LandingPage;
