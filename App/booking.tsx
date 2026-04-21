import { MainLayout } from "@/components/MainLayout";
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

const VEHICLE_TYPES = ["Four-seater", "Sedan", "SUV", "Jeep", "Bike"];
const PAYMENT_METHODS = ["Bkash", "Nagad", "Rocket", "Card", "Cash"];
const DURATION_OPTIONS = [
  "Short time",
  "Long time",
  "More than Hour",
  "Less than Hour",
];
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

const toEmbedMapUrl = (latitude: number, longitude: number) => {
  const left = longitude - MAP_DELTA;
  const right = longitude + MAP_DELTA;
  const bottom = latitude - MAP_DELTA;
  const top = latitude + MAP_DELTA;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;
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
  const [vehicleType, setVehicleType] = useState("Four-seater");
  const [durationType, setDurationType] = useState("Short time");
  const [pricingType, setPricingType] = useState<"Fixed" | "Pay as you Go">(
    "Fixed",
  );
  const [paymentMethod, setPaymentMethod] = useState("Bkash");
  const [amount, setAmount] = useState("");
  const [availableFrom, setAvailableFrom] = useState("2026-04-10");
  const [showDatePicker, setShowDatePicker] = useState(false);

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

    setAvailableFrom(formatDate(selectedDate));
  };

  const submitBooking = () => {
    if (!amount) {
      Alert.alert("Missing amount", "Please enter booking amount.");
      return;
    }

    Alert.alert(
      "Booking created",
      `Your booking request has been submitted for ${durationType}.`,
    );
  };

  return (
    <MainLayout>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        scrollEnabled={scrollEnabled}
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

          <View style={styles.mapActionRow}>
            <TouchableOpacity style={styles.mapButton} onPress={openMap}>
              <Ionicons name="location" size={18} color="#fff" />
              <Text style={styles.mapButtonText}>
                Open OpenStreetMap in App
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mapButton, styles.mapButtonSecondary]}
              onPress={pinPresentLocation}
              disabled={isLocating}
            >
              <Ionicons name="locate" size={18} color="#0f766e" />
              <Text style={styles.mapButtonSecondaryText}>
                {isLocating ? "Pinning..." : "Present Location Pin"}
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
});
