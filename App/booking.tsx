import { MainLayout } from "@/components/MainLayout";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
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
import { WebView } from "react-native-webview";

const VEHICLE_TYPES = [
  "4 Seated Car",
  "SUV",
  "Station Wagon",
  "Jeep",
  "Racing or Sports",
];
const PAYMENT_METHODS = [
  "Bkash",
  "Nagad",
  "Rocket",
  "Cash",
  "Card",
  "Mobile Banking",
];
const DURATION_OPTIONS = [
  "Short time",
  "Long time",
  "More than Hour",
  "Less than Hour",
];
const PRICING_TYPES = ["Fixed Payment", "Pay as you Stay"] as const;
const BOOKINGS_TABLE = "parking_bookings";
const MAP_DELTA = 0.01;

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

const isValidCoordinate = (latitude: number, longitude: number) =>
  latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;

const toDbPaymentType = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, "_");

const toReadableErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const message =
      typeof maybeError.message === "string" ? maybeError.message : "";
    const details =
      typeof maybeError.details === "string" ? maybeError.details : "";
    const hint = typeof maybeError.hint === "string" ? maybeError.hint : "";
    const code = typeof maybeError.code === "string" ? maybeError.code : "";

    const merged = [message, details, hint, code].filter(Boolean).join(" | ");
    if (merged) {
      return merged;
    }
  }

  return "Unable to submit booking right now.";
};

export default function BookingPage() {
  const [latitude, setLatitude] = useState("23.8103");
  const [longitude, setLongitude] = useState("90.4125");
  const [showMap, setShowMap] = useState(false);
  const [mapReloadKey, setMapReloadKey] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [vehicleCount, setVehicleCount] = useState(1);
  const [vehicleType, setVehicleType] = useState("4 Seated Car");
  const [durationType, setDurationType] = useState("Short time");
  const [pricingType, setPricingType] =
    useState<(typeof PRICING_TYPES)[number]>("Fixed Payment");
  const [paymentMethod, setPaymentMethod] = useState("Bkash");
  const [amount, setAmount] = useState("");
  const [bookingDate, setBookingDate] = useState(formatDate(new Date()));
  const [startTime, setStartTime] = useState("10:00");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCoords = useMemo(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      !isValidCoordinate(lat, lng)
    ) {
      return null;
    }

    return { latitude: lat, longitude: lng };
  }, [latitude, longitude]);

  const mapHtml = useMemo(() => {
    if (!selectedCoords) {
      return "";
    }

    const selectedLat = selectedCoords.latitude;
    const selectedLng = selectedCoords.longitude;
    const hasCurrentLocation = Boolean(currentLocation);
    const currentLat = currentLocation?.latitude ?? selectedLat;
    const currentLng = currentLocation?.longitude ?? selectedLng;

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin=""
    />
    <style>
      html, body, #map {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      crossorigin=""></script>
    <script>
      const map = L.map("map", {
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const bookingMarker = L.marker([${selectedLat}, ${selectedLng}]).addTo(map);
      bookingMarker.bindPopup("Booking pin");

      ${
        hasCurrentLocation
          ? `const currentMarker = L.circleMarker([${currentLat}, ${currentLng}], {
            radius: 8,
            color: "#1d4ed8",
            fillColor: "#3b82f6",
            fillOpacity: 0.9,
            weight: 2,
          }).addTo(map);
          currentMarker.bindPopup("Present location");

          const group = L.featureGroup([bookingMarker, currentMarker]);
          map.fitBounds(group.getBounds().pad(0.35));`
          : `map.setView([${selectedLat}, ${selectedLng}], 16);`
      }
    </script>
  </body>
</html>`;
  }, [selectedCoords, currentLocation]);

  const openMap = () => {
    if (!selectedCoords) {
      Alert.alert(
        "Invalid coordinates",
        "Please enter valid latitude and longitude.",
      );
      return;
    }

    setCurrentLocation(null);
    setMapReloadKey((prev) => prev + 1);
    setShowMap(true);
  };

  const pinPresentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission denied", "Location permission is required.");
      return;
    }

    setIsLocating(true);
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = Number(position.coords.latitude.toFixed(6));
      const lng = Number(position.coords.longitude.toFixed(6));

      setCurrentLocation({ latitude: lat, longitude: lng });
      setMapReloadKey((prev) => prev + 1);
      setShowMap(true);
    } catch {
      Alert.alert("Location error", "Unable to fetch your current location.");
    } finally {
      setIsLocating(false);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    setBookingDate(formatDate(selectedDate));
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }

    if (event.type === "dismissed" || !selectedTime) {
      return;
    }

    const hours = selectedTime.getHours().toString().padStart(2, "0");
    const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
    setStartTime(`${hours}:${minutes}`);
  };

  const submitBooking = async () => {
    if (!amount) {
      Alert.alert("Missing amount", "Please enter booking amount.");
      return;
    }

    const numericAmount = Number(amount.replace(/,/g, "").trim());
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid payment amount.");
      return;
    }

    if (!selectedCoords) {
      Alert.alert(
        "Invalid location",
        "Please enter valid latitude and longitude.",
      );
      return;
    }

    if (!isSupabaseConfigured) {
      Alert.alert(
        "Supabase not configured",
        "Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY first.",
      );
      return;
    }

    const [hours, minutes] = startTime.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      Alert.alert("Invalid time", "Please select a valid start time.");
      return;
    }

    const formattedTimeOnly = `${String(hours).padStart(2, "0")}:${String(
      minutes,
    ).padStart(2, "0")}:00`;
    const startTimeIso = `${bookingDate}T${formattedTimeOnly}`;

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user?.id) {
        Alert.alert("Not signed in", "Please log in to submit a booking.");
        return;
      }

      const basePayload = {
        user_id: user.id,
        latitude: Number(selectedCoords.latitude),
        longitude: Number(selectedCoords.longitude),
        vehicle_number: Number(vehicleCount),
        vehicle_type: vehicleType,
        duration_of_stay: durationType,
        payment_amount: numericAmount,
        pricing_type: pricingType,
        booking_date: bookingDate,
      };

      let firstTry = await supabase.from(BOOKINGS_TABLE).insert({
        ...basePayload,
        payment_type: toDbPaymentType(paymentMethod),
        start_time: formattedTimeOnly,
      });

      if (
        firstTry.error &&
        /type time|timestamp|datetime|invalid input syntax/i.test(
          firstTry.error.message,
        )
      ) {
        firstTry = await supabase.from(BOOKINGS_TABLE).insert({
          ...basePayload,
          payment_type: toDbPaymentType(paymentMethod),
          start_time: startTimeIso,
        });
      }

      const insertError = firstTry.error;

      if (insertError) {
        throw insertError;
      }

      Alert.alert(
        "Booking Created",
        `Your booking for ${vehicleCount} vehicle(s) has been submitted.`,
      );
    } catch (error) {
      const rawMessage = toReadableErrorMessage(error);
      const message = /row-level security|permission denied|policy/i.test(
        rawMessage,
      )
        ? "Supabase rejected this request (RLS policy). Please allow insert for authenticated users on parking_bookings."
        : rawMessage;
      Alert.alert("Booking Failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create Parking Booking</Text>
        <Text style={styles.subtitle}>
          Set location, vehicle details, pricing and payment.
        </Text>

        {/* Location Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Location Coordinates</Text>

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

          <View style={styles.mapActionRow}>
            <TouchableOpacity style={styles.mapButton} onPress={openMap}>
              <Ionicons name="location" size={18} color="#fff" />
              <Text style={styles.mapButtonText}>Preview on Map</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mapButton, styles.mapButtonSecondary]}
              onPress={pinPresentLocation}
              disabled={isLocating}
            >
              <Ionicons name="locate" size={18} color="#0f766e" />
              <Text style={styles.mapButtonSecondaryText}>
                {isLocating ? "Pinning..." : "Use My Location"}
              </Text>
            </TouchableOpacity>
          </View>

          {showMap && selectedCoords && mapHtml && (
            <View
              style={styles.mapFrame}
              onTouchStart={() => setScrollEnabled(false)}
              onTouchEnd={() => setScrollEnabled(true)}
              onTouchCancel={() => setScrollEnabled(true)}
            >
              <WebView
                key={`map-${mapReloadKey}`}
                source={{ html: mapHtml }}
                originWhitelist={["*"]}
                style={styles.map}
                nestedScrollEnabled
              />
            </View>
          )}
        </View>

        {/* Vehicle Counter */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Number of Vehicles</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setVehicleCount((prev) => Math.max(1, prev - 1))}
            >
              <Ionicons name="remove" size={22} color="#1d4ed8" />
            </TouchableOpacity>

            <Text style={styles.counterValue}>{vehicleCount}</Text>

            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setVehicleCount((prev) => Math.min(10, prev + 1))}
            >
              <Ionicons name="add" size={22} color="#1d4ed8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle Type */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vehicle Type</Text>
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

        {/* Duration */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Duration of Stay</Text>
          <View style={styles.optionWrap}>
            {DURATION_OPTIONS.map((item) => {
              const selected = durationType === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setDurationType(item)}
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

        {/* Pricing Type */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pricing Type</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                pricingType === "Fixed Payment" && styles.toggleButtonActive,
              ]}
              onPress={() => setPricingType("Fixed Payment")}
            >
              <Text
                style={[
                  styles.toggleText,
                  pricingType === "Fixed Payment" && styles.toggleTextActive,
                ]}
              >
                Fixed Payment
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                pricingType === "Pay as you Stay" && styles.toggleButtonActive,
              ]}
              onPress={() => setPricingType("Pay as you Stay")}
            >
              <Text
                style={[
                  styles.toggleText,
                  pricingType === "Pay as you Stay" && styles.toggleTextActive,
                ]}
              >
                Pay as you Stay
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Method */}
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

        {/* Amount and Date/Time */}
        <View style={styles.card}>
          <Text style={styles.label}>Payment Amount (৳)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount"
            keyboardType="numeric"
          />

          <Text style={[styles.label, styles.topSpace]}>Booking Date</Text>
          <TouchableOpacity
            style={styles.dateInputButton}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.dateInputText}>{bookingDate}</Text>
            <Ionicons name="calendar-outline" size={18} color="#4b5563" />
          </TouchableOpacity>

          <Text style={[styles.label, styles.topSpace]}>Start Time</Text>
          <TouchableOpacity
            style={styles.dateInputButton}
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.dateInputText}>{startTime}</Text>
            <Ionicons name="time-outline" size={18} color="#4b5563" />
          </TouchableOpacity>

          {showDatePicker && (
            <View style={styles.datePickerWrap}>
              <DateTimePicker
                value={parseDate(bookingDate)}
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

          {showTimePicker && (
            <View style={styles.datePickerWrap}>
              <DateTimePicker
                value={(() => {
                  const [hours, minutes] = startTime.split(":").map(Number);
                  const date = new Date();
                  date.setHours(hours, minutes, 0);
                  return date;
                })()}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onTimeChange}
              />
              {Platform.OS === "ios" && (
                <TouchableOpacity
                  style={styles.dateDoneButton}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text style={styles.dateDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={submitBooking}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? "Submitting..." : "Submit Booking"}
          </Text>
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
  mapActionRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  mapButton: {
    flex: 1,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0f766e",
    borderRadius: 10,
    paddingVertical: 12,
  },
  mapButtonSecondary: {
    backgroundColor: "#ecfeff",
    borderWidth: 1,
    borderColor: "#99f6e4",
  },
  mapFrame: {
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d1d5db",
    height: 240,
  },
  map: {
    flex: 1,
  },
  mapButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  mapButtonSecondaryText: {
    color: "#0f766e",
    fontWeight: "700",
    fontSize: 13,
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
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  counterValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    minWidth: 64,
    textAlign: "center",
  },
});
import { MainLayout } from "@/components/MainLayout";
import * as Location from "expo-location";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { WebView } from "react-native-webview";

const MAX_DURATION_MINUTES = 5 * 60;
const MAP_DELTA = 0.01;

const DEFAULT_COORDS = {
  latitude: 23.8103,
  longitude: 90.4125,
};

const getCurrentTime12h = (date: Date) =>
  date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

const toEmbedMapUrl = (latitude: number, longitude: number) => {
  const left = longitude - MAP_DELTA;
  const right = longitude + MAP_DELTA;
  const bottom = latitude - MAP_DELTA;
  const top = latitude + MAP_DELTA;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;
};

export default function RentPage() {
  const [showMap, setShowMap] = useState(false);
  const [now, setNow] = useState(new Date());
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [mapUrl, setMapUrl] = useState(
    toEmbedMapUrl(DEFAULT_COORDS.latitude, DEFAULT_COORDS.longitude),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const totalMinutes = useMemo(() => hours * 60 + minutes, [hours, minutes]);
  const duration = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  const increaseHours = () => {
    setHours((prev) => Math.min(5, prev + 1));
  };

  const decreaseHours = () => {
    setHours((prev) => Math.max(0, prev - 1));
  };

  const increaseMinutes = () => {
    setMinutes((prevMinutes) => {
      const nextMinutes = prevMinutes + 5;
      const nextTotal = hours * 60 + nextMinutes;

      if (nextTotal > MAX_DURATION_MINUTES) {
        return prevMinutes;
      }

      return nextMinutes > 55 ? 55 : nextMinutes;
    });
  };

  const decreaseMinutes = () => {
    setMinutes((prev) => Math.max(0, prev - 5));
  };

  const useMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission denied", "Location permission is required.");
      return;
    }

    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setMapUrl(
        toEmbedMapUrl(current.coords.latitude, current.coords.longitude),
      );
      setShowMap(true);
    } catch {
      Alert.alert("Location error", "Unable to fetch your location.");
    }
  };

  const handleSubmit = () => {
    if (totalMinutes === 0) {
      Alert.alert("Duration required", "Please set a parking duration.");
      return;
    }

    Alert.alert("Submitted", `Stay duration set to ${duration}.`);
  };

  return (
    <MainLayout>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Rent</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>OpenStreetMap</Text>
          <Text style={styles.sectionSubtitle}>
            Open map directly inside the app.
          </Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowMap((prev) => !prev)}
            >
              <Text style={styles.actionButtonText}>
                {showMap ? "Hide Map" : "Open OpenStreetMap"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={useMyLocation}
            >
              <Text style={styles.secondaryButtonText}>My Location</Text>
            </TouchableOpacity>
          </View>

          {showMap && (
            <View style={styles.mapFrame}>
              <WebView source={{ uri: mapUrl }} style={styles.map} />
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Current Time</Text>
          <View style={styles.clockBox}>
            <Text style={styles.clockText}>{getCurrentTime12h(now)}</Text>
            <Text style={styles.clockHint}>12-hour format</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>How many hour will you stay</Text>

          <View style={styles.counterWrap}>
            <View style={styles.counterUnit}>
              <Text style={styles.counterLabel}>Hour</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={decreaseHours}
                >
                  <Text style={styles.counterButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>
                  {String(hours).padStart(2, "0")}
                </Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={increaseHours}
                >
                  <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.timeColon}>:</Text>

            <View style={styles.counterUnit}>
              <Text style={styles.counterLabel}>Minute</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={decreaseMinutes}
                >
                  <Text style={styles.counterButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>
                  {String(minutes).padStart(2, "0")}
                </Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={increaseMinutes}
                >
                  <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={styles.helperText}>
            Format: {duration}, max limit: 05:00
          </Text>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#ececec",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  actionButton: {
    backgroundColor: "#1274e7",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#1274e7",
  },
  secondaryButtonText: {
    color: "#1274e7",
    fontWeight: "700",
    fontSize: 14,
  },
  mapFrame: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d5d5d5",
    height: 240,
  },
  map: {
    flex: 1,
  },
  clockBox: {
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: "#eef4ff",
    borderWidth: 1,
    borderColor: "#d5e4ff",
    alignItems: "center",
  },
  clockText: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0f2957",
    letterSpacing: 0.5,
  },
  clockHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#35558a",
  },
  counterWrap: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e7e7e7",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  counterUnit: {
    flex: 1,
    alignItems: "center",
  },
  counterLabel: {
    fontSize: 12,
    color: "#555",
    marginBottom: 6,
    fontWeight: "600",
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1274e7",
  },
  counterButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 20,
  },
  counterValue: {
    minWidth: 34,
    textAlign: "center",
    fontSize: 24,
    color: "#1a1a1a",
    fontWeight: "700",
  },
  timeColon: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2a2a2a",
    paddingHorizontal: 6,
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
  },
  submitButton: {
    backgroundColor: "#0a8f4b",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
