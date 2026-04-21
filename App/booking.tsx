import { MainLayout } from "@/components/MainLayout";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as Linking from "expo-linking";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const VEHICLE_TYPES = ["Four-seater", "Sedan", "SUV", "Jeep", "Bike"];
const PAYMENT_METHODS = ["Bkash", "Nagad", "Rocket", "Card", "Cash"];

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return new Date();
  }

  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

export default function BookingPage() {
  const [latitude, setLatitude] = useState("23.8103");
  const [longitude, setLongitude] = useState("90.4125");
  const [vehicleType, setVehicleType] = useState("Four-seater");
  const [durationHours, setDurationHours] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [pricingType, setPricingType] = useState<"Fixed" | "Pay as you Go">(
    "Fixed",
  );
  const [paymentMethod, setPaymentMethod] = useState("Bkash");
  const [amount, setAmount] = useState("");
  const [availableFrom, setAvailableFrom] = useState("2026-04-10");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const duration = `${String(durationHours).padStart(2, "0")}:${String(durationMinutes).padStart(2, "0")}`;

  const mapUrl = useMemo(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return "";
    }

    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
  }, [latitude, longitude]);

  const openMap = async () => {
    if (!mapUrl) {
      Alert.alert(
        "Invalid coordinates",
        "Please enter valid latitude and longitude.",
      );
      return;
    }

    const supported = await Linking.canOpenURL(mapUrl);
    if (!supported) {
      Alert.alert(
        "Cannot open map",
        "OpenStreetMap link is not supported on this device.",
      );
      return;
    }

    await Linking.openURL(mapUrl);
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    setAvailableFrom(formatDate(selectedDate));
  };

  const increaseHours = () => {
    if (durationHours < 23) {
      setDurationHours(durationHours + 1);
    }
  };

  const decreaseHours = () => {
    if (durationHours > 0) {
      setDurationHours(durationHours - 1);
    }
  };

  const increaseMinutes = () => {
    if (durationMinutes < 55) {
      setDurationMinutes(durationMinutes + 5);
    } else {
      setDurationMinutes(0);
      if (durationHours < 23) {
        setDurationHours(durationHours + 1);
      }
    }
  };

  const decreaseMinutes = () => {
    if (durationMinutes > 0) {
      setDurationMinutes(durationMinutes - 5);
    } else {
      setDurationMinutes(55);
      if (durationHours > 0) {
        setDurationHours(durationHours - 1);
      }
    }
  };

  const submitBooking = () => {
    if (!amount) {
      Alert.alert("Missing amount", "Please enter booking amount.");
      return;
    }

    Alert.alert(
      "Booking created",
      `Your booking request has been submitted for ${duration} hours.`,
    );
  };

  return (
    <MainLayout>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create Booking</Text>
        <Text style={styles.subtitle}>
          Set location, vehicle details, pricing and payment.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Location (OpenStreetMap)</Text>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                value={latitude}
                onChangeText={setLatitude}
                style={styles.input}
                placeholder="e.g. 23.8103"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.half}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                value={longitude}
                onChangeText={setLongitude}
                style={styles.input}
                placeholder="e.g. 90.4125"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.mapButton} onPress={openMap}>
            <Ionicons name="location" size={18} color="#fff" />
            <Text style={styles.mapButtonText}>Open OpenStreetMap Pin</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Type of Vehicle</Text>
          <View style={styles.optionWrap}>
            {VEHICLE_TYPES.map((item) => {
              const selected = vehicleType === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setVehicleType(item)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.timerContainer}>
            <View style={styles.timerUnit}>
              <TouchableOpacity
                style={styles.timerButton}
                onPress={increaseHours}
              >
                <Ionicons name="chevron-up" size={24} color="#1d4ed8" />
              </TouchableOpacity>
              <Text style={styles.timerValue}>
                {String(durationHours).padStart(2, "0")}
              </Text>
              <TouchableOpacity
                style={styles.timerButton}
                onPress={decreaseHours}
              >
                <Ionicons name="chevron-down" size={24} color="#1d4ed8" />
              </TouchableOpacity>
              <Text style={styles.timerLabel}>Hours</Text>
            </View>

            <View style={styles.timerSeparator}>
              <Text style={styles.timerSeparatorText}>:</Text>
            </View>

            <View style={styles.timerUnit}>
              <TouchableOpacity
                style={styles.timerButton}
                onPress={increaseMinutes}
              >
                <Ionicons name="chevron-up" size={24} color="#1d4ed8" />
              </TouchableOpacity>
              <Text style={styles.timerValue}>
                {String(durationMinutes).padStart(2, "0")}
              </Text>
              <TouchableOpacity
                style={styles.timerButton}
                onPress={decreaseMinutes}
              >
                <Ionicons name="chevron-down" size={24} color="#1d4ed8" />
              </TouchableOpacity>
              <Text style={styles.timerLabel}>Mins</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pricing Type</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                pricingType === "Fixed" && styles.toggleButtonActive,
              ]}
              onPress={() => setPricingType("Fixed")}
            >
              <Text
                style={[
                  styles.toggleText,
                  pricingType === "Fixed" && styles.toggleTextActive,
                ]}
              >
                Fixed
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                pricingType === "Pay as you Go" && styles.toggleButtonActive,
              ]}
              onPress={() => setPricingType("Pay as you Go")}
            >
              <Text
                style={[
                  styles.toggleText,
                  pricingType === "Pay as you Go" && styles.toggleTextActive,
                ]}
              >
                Pay as you Go
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.optionWrap}>
            {PAYMENT_METHODS.map((method) => {
              const selected = paymentMethod === method;
              return (
                <TouchableOpacity
                  key={method}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {method}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount"
            keyboardType="numeric"
          />

          <Text style={[styles.label, styles.topSpace]}>Available from</Text>
          <TouchableOpacity
            style={styles.dateInputButton}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.dateInputText}>{availableFrom}</Text>
            <Ionicons name="calendar-outline" size={18} color="#4b5563" />
          </TouchableOpacity>

          {showDatePicker && (
            <View style={styles.datePickerWrap}>
              <DateTimePicker
                value={parseDate(availableFrom)}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={onDateChange}
              />
              {Platform.OS === "ios" && (
                <TouchableOpacity
                  style={styles.dateDoneButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.dateDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={submitBooking}>
          <Text style={styles.submitButtonText}>Submit Booking</Text>
        </TouchableOpacity>
      </ScrollView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 64 : 52,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 18,
    color: "#6b7280",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    color: "#4b5563",
    marginBottom: 6,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  half: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#fff",
    color: "#111827",
  },
  dateInputButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateInputText: {
    color: "#111827",
    fontSize: 15,
  },
  datePickerWrap: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  dateDoneButton: {
    alignSelf: "flex-end",
    marginRight: 12,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#1d4ed8",
  },
  dateDoneText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  iconInputWrap: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  iconInput: {
    flex: 1,
    paddingVertical: 11,
    paddingLeft: 8,
    color: "#111827",
  },
  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
  },
  chipSelected: {
    backgroundColor: "#1d4ed8",
    borderColor: "#1d4ed8",
  },
  chipText: {
    color: "#374151",
    fontWeight: "600",
  },
  chipTextSelected: {
    color: "#fff",
  },
  mapButton: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0f766e",
    borderRadius: 10,
    paddingVertical: 12,
  },
  mapButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  toggleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  toggleButtonActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  toggleText: {
    color: "#374151",
    fontWeight: "600",
  },
  toggleTextActive: {
    color: "#fff",
  },
  topSpace: {
    marginTop: 12,
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: "#f59e0b",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  timerUnit: {
    alignItems: "center",
    flex: 1,
  },
  timerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    marginVertical: 4,
  },
  timerValue: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1d4ed8",
    marginVertical: 8,
  },
  timerLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  timerSeparator: {
    paddingHorizontal: 16,
  },
  timerSeparatorText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#374151",
  },
});
