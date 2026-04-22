import { MainLayout } from "@/components/MainLayout";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface SettingOption {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const settingOptions: SettingOption[] = [
  { id: "profile", title: "Profile", icon: "person-outline" },
  { id: "password", title: "Password", icon: "lock-closed-outline" },
  { id: "vehicles", title: "Vehicles", icon: "car-outline" },
  {
    id: "rent-location",
    title: "Rent location setting",
    icon: "location-outline",
  },
  { id: "language", title: "Language", icon: "language-outline" },
];

export default function SettingPage() {
  const handleOptionPress = (title: string) => {
    Alert.alert("Coming Soon", `${title} settings will be available soon.`);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive" },
      ],
    );
  };

  return (
    <MainLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Manage your account preferences
          </Text>
        </View>

        <View style={styles.card}>
          {settingOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionRow}
              activeOpacity={0.8}
              onPress={() => handleOptionPress(option.title)}
            >
              <View style={styles.optionLeft}>
                <Ionicons name={option.icon} size={22} color="#444" />
                <Text style={styles.optionText}>{option.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          activeOpacity={0.85}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222",
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#666",
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#FFF",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ECECEC",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  deleteButton: {
    marginTop: 28,
    marginHorizontal: 16,
    marginBottom: 24,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#D32F2F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  deleteButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
