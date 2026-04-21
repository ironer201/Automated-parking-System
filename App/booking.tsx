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
