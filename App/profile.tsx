// app/profile.tsx
import { MainLayout } from "@/components/MainLayout";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 234 567 8900",
    permanentAddress: "123 Main Street, Apt 4B, New York, NY 10001",
    presentAddress: "456 Park Avenue, Suite 789, Los Angeles, CA 90001",
    gender: "Male",
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Here you would save to your backend/supabase
    setIsEditing(false);
    Alert.alert("Success", "Profile updated successfully!");
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original data if needed
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please grant camera roll permissions to change profile picture",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const InputField = ({
    label,
    value,
    onChangeText,
    multiline = false,
  }: any) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        editable={isEditing}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor="#999"
      />
    </View>
  );

  return (
    <MainLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity
            onPress={isEditing ? handleSave : handleEdit}
            style={styles.editButton}
          >
            <Ionicons
              name={isEditing ? "checkmark-done" : "create-outline"}
              size={24}
              color="#010101"
            />
            <Text style={styles.editButtonText}>
              {isEditing ? "Save" : "Edit"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Image Section */}
        <View style={styles.imageSection}>
          <TouchableOpacity
            onPress={isEditing ? pickImage : undefined}
            disabled={!isEditing}
          >
            <View style={styles.profileImageContainer}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person" size={60} color="#fff" />
                </View>
              )}
              {isEditing && (
                <View style={styles.cameraIcon}>
                  <Ionicons name="camera" size={20} color="#fff" />
                </View>
              )}
            </View>
          </TouchableOpacity>
          {isEditing && (
            <Text style={styles.changePhotoText}>Tap to change photo</Text>
          )}
        </View>

        {/* Profile Details Card */}
        <View style={styles.card}>
          <InputField
            label="Full Name"
            value={profile.name}
            onChangeText={(text: string) =>
              setProfile({ ...profile, name: text })
            }
          />

          <InputField
            label="Email"
            value={profile.email}
            onChangeText={(text: string) =>
              setProfile({ ...profile, email: text })
            }
          />

          <InputField
            label="Phone Number"
            value={profile.phone}
            onChangeText={(text: string) =>
              setProfile({ ...profile, phone: text })
            }
          />

          {/* Gender Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              {["Male", "Female", "Other"].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.genderOption,
                    profile.gender === option && styles.genderOptionSelected,
                    !isEditing && styles.genderOptionDisabled,
                  ]}
                  onPress={() =>
                    isEditing && setProfile({ ...profile, gender: option })
                  }
                  disabled={!isEditing}
                >
                  <Text
                    style={[
                      styles.genderText,
                      profile.gender === option && styles.genderTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <InputField
            label="Permanent Address"
            value={profile.permanentAddress}
            onChangeText={(text: string) =>
              setProfile({ ...profile, permanentAddress: text })
            }
            multiline
          />

          <InputField
            label="Present Address"
            value={profile.presentAddress}
            onChangeText={(text: string) =>
              setProfile({ ...profile, presentAddress: text })
            }
            multiline
          />
        </View>

        {/* Cancel Button (only shows when editing) */}
        {isEditing && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color="#f2b134" />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Parking Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="car" size={24} color="#f2b134" />
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>Vehicles</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color="#f2b134" />
            <Text style={styles.statNumber}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: "#f5f5f5",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginLeft:20,
    // marginTop: 55,
    marginBottom:40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#010101",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editButtonText: {
    color: "#090909",
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "600",
  },
  imageSection: {
    alignItems: "center",
    marginTop: -40,
    marginBottom: 20,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "#ddd",
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#9fc6c1",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#f2b134",
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },
  changePhotoText: {
    marginTop: 8,
    color: "#f2b134",
    fontSize: 12,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#fafafa",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  genderContainer: {
    flexDirection: "row",
    gap: 12,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  genderOptionSelected: {
    backgroundColor: "#f2b134",
    borderColor: "#f2b134",
  },
  genderOptionDisabled: {
    opacity: 0.7,
  },
  genderText: {
    color: "#666",
    fontWeight: "500",
  },
  genderTextSelected: {
    color: "#fff",
  },
  cancelButton: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#ff4444",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  statCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  bottomSpacing: {
    height: 30,
  },
});
