import { signUpWithNameEmailPassword } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignUpPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const keyboardVerticalOffset = Platform.OS === "ios" ? insets.top : 0;

  const handleCreateAccount = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert(
        "Missing Information",
        "Please enter name, email, and password.",
      );
      return;
    }

    if (!isSupabaseConfigured) {
      Alert.alert(
        "Supabase not configured",
        "Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable sign up.",
      );
      return;
    }

    setIsSubmitting(true);
    const result = await signUpWithNameEmailPassword(name, email, password);
    setIsSubmitting(false);

    if (!result.success) {
      Alert.alert(
        "Sign up failed",
        result.error ?? "Unable to create account.",
      );
      return;
    }

    if (result.needsEmailConfirmation) {
      Alert.alert(
        "Check your email",
        "Your account was created. Please verify your email before logging in.",
        [{ text: "OK", onPress: () => router.replace("/(tabs)") }],
      );
      return;
    }

    Alert.alert(
      "Account created",
      "Your account has been created successfully.",
      [{ text: "Continue", onPress: () => router.replace("/(tabs)/landing") }],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4b4b4b" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={keyboardVerticalOffset}
        style={styles.flex}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Name, email and password are required.
          </Text>

          <View style={styles.formCard}>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#999"
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Full Name"
                placeholderTextColor="#999"
                style={styles.input}
                value={name}
                onChangeText={setName}
                returnKeyType="next"
                onSubmitEditing={() => emailInputRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#999"
                style={styles.inputIcon}
              />
              <TextInput
                ref={emailInputRef}
                placeholder="Email"
                placeholderTextColor="#999"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#999"
                style={styles.inputIcon}
              />
              <TextInput
                ref={passwordInputRef}
                placeholder="Password"
                placeholderTextColor="#999"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleCreateAccount}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleCreateAccount}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Creating..." : "Create Account"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4b4b4b",
  },
  flex: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    marginBottom: 18,
  },
  backText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    color: "#f2b134",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 8,
    color: "#fff",
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 24,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#e3e3e3",
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    marginBottom: 14,
    backgroundColor: "#fff",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#1f2937",
    fontSize: 16,
    paddingVertical: Platform.OS === "ios" ? 0 : 4,
  },
  submitButton: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: "#f2b134",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
