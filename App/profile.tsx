// app/profile.tsx
import { MainLayout } from "@/components/MainLayout";
import { getSupabaseClient } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";

type ProfileState = {
  name: string;
  email: string;
  phone: string;
  permanentAddress: string;
  presentAddress: string;
  gender: string;
};

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
};

const normalizeGender = (value: string | null | undefined) => {
  if (!value) return "";

  const normalized = value.trim().toLowerCase();

  if (normalized === "male") return "Male";
  if (normalized === "female") return "Female";
  if (normalized === "other") return "Other";

  return value;
};

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [originalProfile, setOriginalProfile] = useState<ProfileState | null>(null);
  const [profile, setProfile] = useState<ProfileState>({
    name: "",
    email: "",
    phone: "",
    permanentAddress: "",
    presentAddress: "",
    gender: "",
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!userId) {
      Alert.alert("Error", "No active session found.");
      return;
    }

    setIsSaving(true);

    try {
      const supabase = getSupabaseClient();
      
      // IMPORTANT: Table name is 'profiles' (lowercase, plural)
      const { error } = await supabase.from("profiles").upsert(
        {
          id: userId,
          name: profile.name || null,
          email: profile.email || null,
          phone: profile.phone || null,
          presentaddress: profile.presentAddress || null,
          permentaddress: profile.permanentAddress || null,
          gender: profile.gender?.toLowerCase() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      setOriginalProfile(profile);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile.";
      Alert.alert("Error", message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (originalProfile) {
      setProfile(originalProfile);
    }
  };

  const loadProfile = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        throw new Error("Unable to load user session.");
      }

      const activeUserId = data.user.id;
      
      // IMPORTANT: Table name is 'profiles' (lowercase, plural)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, email, phone, presentaddress, permentaddress, gender")
        .eq("id", activeUserId)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw profileError;
      }

      // Build profile state from fetched data
      const nextProfile: ProfileState = {
        name: profileData?.name ?? "",
        email: profileData?.email ?? data.user.email ?? "",
        phone: profileData?.phone ?? "",
        permanentAddress: profileData?.permentaddress ?? "",
        presentAddress: profileData?.presentaddress ?? "",
        gender: normalizeGender(profileData?.gender) ?? "",
      };

      setUserId(profileData?.id ?? activeUserId);
      setProfile(nextProfile);
      setOriginalProfile(nextProfile);
      setLoadError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load profile.";
      setLoadError(message);
      console.error("Load profile error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const InputField = ({ label, value, onChangeText, multiline = false }: InputFieldProps) => (
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

  if (isLoading) {
    return (
      <MainLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f2b134" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {loadError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{loadError}</Text>
            <TouchableOpacity onPress={loadProfile} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity
            onPress={isEditing ? handleSave : handleEdit}
            style={styles.editButton}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#010101" />
            ) : (
              <>
                <Ionicons name={isEditing ? "checkmark-done" : "create-outline"} size={24} color="#010101" />
                <Text style={styles.editButtonText}>{isEditing ? "Save" : "Edit"}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Image Placeholder */}
        <View style={styles.imageSection}>
          <View style={styles.profileImagePlaceholder}>
            <Ionicons name="person" size={60} color="#fff" />
          </View>
        </View>

        {/* Profile Details Card */}
        <View style={styles.card}>
          <InputField
            label="Full Name"
            value={profile.name}
            onChangeText={(text: string) => setProfile({ ...profile, name: text })}
          />

          <InputField
            label="Email"
            value={profile.email}
            onChangeText={(text: string) => setProfile({ ...profile, email: text })}
          />

          <InputField
            label="Phone Number"
            value={profile.phone}
            onChangeText={(text: string) => setProfile({ ...profile, phone: text })}
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
                  onPress={() => isEditing && setProfile({ ...profile, gender: option })}
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
            onChangeText={(text: string) => setProfile({ ...profile, permanentAddress: text })}
            multiline
          />

          <InputField
            label="Present Address"
            value={profile.presentAddress}
            onChangeText={(text: string) => setProfile({ ...profile, presentAddress: text })}
            multiline
          />
        </View>

        {/* Cancel Button (only shows when editing) */}
        {isEditing && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={isSaving}>
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  errorBanner: {
    backgroundColor: "#ffe8e8",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: "#b00020",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#b00020",
    borderRadius: 6,
  },
  retryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: "#f5f5f5",
    marginLeft: 20,
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#010101",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  editButtonText: {
    color: "#090909",
    fontSize: 14,
    fontWeight: "600",
  },
  imageSection: {
    alignItems: "center",
    marginTop: -40,
    marginBottom: 20,
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
