// app/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { signInWithEmailOrPhonePassword } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

const { width } = Dimensions.get("window");

export default function App() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const router = useRouter();

  const passwordInputRef = useRef<TextInput>(null);
  const kbTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: any) => {
      const h = e?.endCoordinates?.height ?? 0;
      Animated.timing(kbTranslateY, {
        toValue: h,
        duration: Platform.OS === "ios" ? (e?.duration ?? 250) : 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
      setKeyboardVisible(true);
    };

    const onHide = (e: any) => {
      Animated.timing(kbTranslateY, {
        toValue: 0,
        duration: Platform.OS === "ios" ? (e?.duration ?? 200) : 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
      setKeyboardVisible(false);
    };

    const subShow = Keyboard.addListener(showEvent, onShow);
    const subHide = Keyboard.addListener(hideEvent, onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [kbTranslateY]);

  async function handleLogin() {
    if (!emailOrPhone || !password) {
      Alert.alert(
        "Missing Information",
        "Please enter both email/phone and password.",
      );
      return;
    }

    if (!isSupabaseConfigured) {
      Alert.alert(
        "Supabase not configured",
        "Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable login.",
      );
      return;
    }

    setIsLoggingIn(true);
    const result = await signInWithEmailOrPhonePassword(emailOrPhone, password);
    setIsLoggingIn(false);

    if (!result.success) {
      Alert.alert("Login failed", result.error ?? "Unable to login.");
      return;
    } else {
      // After successful login:
      router.replace("/(tabs)/landing");
    }
  }

  const keyboardVerticalOffset = Platform.OS === "ios" ? insets.top : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4b4b4b" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={keyboardVerticalOffset}
        style={styles.flex}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.flex}>
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.logoArea}>
                <View style={styles.logoCircle}>
                  <Image
                    source={require("../../assets/logo-removebg-preview.png")}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.title}>Spacio</Text>
                <Text style={styles.subtitle}>EFFORTLESS PARKING</Text>
              </View>

              <View style={styles.inputsContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#999"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Email or Phone"
                    placeholderTextColor="#999"
                    style={styles.input}
                    value={emailOrPhone}
                    onChangeText={setEmailOrPhone}
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
                    onSubmitEditing={handleLogin}
                  />
                </View>
              </View>

              <View style={styles.bottomSheet}>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    isLoggingIn && styles.loginButtonDisabled,
                  ]}
                  onPress={handleLogin}
                  activeOpacity={0.85}
                  disabled={isLoggingIn}
                >
                  <Text style={styles.loginButtonText}>
                    {isLoggingIn ? "Logging in..." : "Login"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.orText}>or</Text>
                  <View style={styles.divider} />
                </View>

                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => router.push("../signup")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.createButtonText}>Create an account</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: insets.bottom + 20 }} />
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4b4b4b",
  },
  flex: { flex: 1 },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  logoArea: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  logoCircle: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: (width * 0.35) / 2,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  logoImage: {
    width: "65%",
    height: "65%",
  },
  title: {
    fontSize: 36,
    color: "#f2b134",
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 8,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 2,
    opacity: 0.9,
  },
  inputsContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: Platform.OS === "ios" ? 0 : 4,
  },
  bottomSheet: {
    backgroundColor: "#fff",
    borderRadius: 30,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 5,
    marginTop: 20,
  },
  forgotText: {
    color: "#6b6b6b",
    marginBottom: 20,
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  loginButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: "#f2b134",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    width: "100%",
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  orText: {
    marginHorizontal: 16,
    color: "#999",
    fontSize: 14,
    fontWeight: "500",
  },
  createButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#f2b134",
  },
  createButtonText: {
    color: "#f2b134",
    fontSize: 15,
    fontWeight: "600",
  },
});
