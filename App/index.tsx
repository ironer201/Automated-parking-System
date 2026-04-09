// App.js

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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

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

  // Smooth animation for floating footer above keyboard
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
    }

    router.replace("/(tabs)/landing");
  }

  function handleCreateAccount() {
    Alert.alert("Create account pressed");
  }

  function handleForgotPassword() {
    Alert.alert("Forgot password pressed");
  }

  const keyboardVerticalOffset = insets.top; // adjust if you have a custom header height

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#4b4b4b" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={keyboardVerticalOffset}
        style={styles.flex}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.flex}>
            {/* Scrollable content to keep inputs visible and allow layout to adapt */}
            <ScrollView
              style={styles.flex}
              contentContainerStyle={[
                styles.contentContainer,
                { paddingBottom: 24 + insets.bottom },
              ]}
              keyboardShouldPersistTaps="handled"
              contentInsetAdjustmentBehavior="automatic"
              showsVerticalScrollIndicator={false}
            >
              {/* Top three dots */}
              {/* <View style={styles.topRight}>
                <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
              </View> */}

              {/* Big circular logo area */}
              <View style={styles.logoArea}>
                <View style={styles.logoCircle}>
                  <Image
                    source={require("../../assets/logo-removebg-preview.png")}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.title}>Spacio</Text>
                <Text style={styles.subtitle}>EFFORTLESS{"\n"}PARKING</Text>
              </View>

              {/* Inputs */}
              <View style={styles.inputsContainer}>
                {/* email/phone input */}
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#bfbfbf"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Email or Phone"
                    placeholderTextColor="#bfbfbf"
                    style={styles.input}
                    value={emailOrPhone}
                    onChangeText={setEmailOrPhone}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                </View>

                {/* password input */}
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#bfbfbf"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="#bfbfbf"
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    returnKeyType="done"
                  />
                </View>
              </View>

              {/* Spacer so content can scroll above footer if needed */}
              <View style={{ height: 140 }} />
            </ScrollView>

            {/* Animated floating footer (hidden when typing) */}
            {!keyboardVisible && (
              <Animated.View
                style={[
                  styles.bottomSheet,
                  {
                    paddingBottom: 10 + insets.bottom,
                    transform: [
                      { translateY: Animated.multiply(kbTranslateY, -1) },
                    ],
                  },
                ]}
              >
                <TouchableOpacity onPress={handleForgotPassword}>
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

                <Text style={styles.orText}>or</Text>

                <TouchableOpacity
                  style={styles.createButton}
                  onPress={handleCreateAccount}
                  activeOpacity={0.85}
                >
                  <Text style={styles.createButtonText}>Create an account</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: "#4b4b4b", // dark gray background
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  topRight: {
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: "flex-end",
  },
  logoArea: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 8,
  },
  logoCircle: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: (width * 0.4) / 2,
    backgroundColor: "#9fc6c1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 6,
  },
  logoImage: {
    width: "60%",
    height: "70%",
  },
  title: {
    marginTop: 0,
    fontSize: 40,
    color: "#f2b134",
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    color: "#000000ff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 1,
  },
  inputsContainer: {
    paddingHorizontal: 8,
    marginBottom: 5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#d9d9d9",
    borderWidth: 1.6,
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 8,
    marginBottom: 20,
    backgroundColor: "white",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 36,
    color: "#000",
    fontSize: 15,
    // Keep the typed text vertically centered (especially on Android)
    textAlignVertical: "center",
    paddingTop: Platform.OS === "android" ? 2 : 0,
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0, // base position; animated above keyboard
    backgroundColor: "#f9f9f9ff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 8,
    elevation: 10,
  },
  forgotText: {
    color: "#5b5b5b",
    marginBottom: 10,
    fontSize: 13,
  },
  loginButton: {
    width: width * 0.82,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: "#6a6a6a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#cfcfcf",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  orText: {
    marginTop: 12,
    marginBottom: 12,
    color: "#7a7a7a",
    fontSize: 14,
  },
  createButton: {
    width: width * 0.82,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: "#5b6e6a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.6,
    borderColor: "#91bdb6",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
