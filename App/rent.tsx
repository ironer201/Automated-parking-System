import { MainLayout } from "@/components/MainLayout";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
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
const NEARBY_RADIUS_KM = 2;

const DEFAULT_COORDS = {
  latitude: 23.8103,
  longitude: 90.4125,
};

type MarkerPoint = {
  latitude: number;
  longitude: number;
  label: string;
  popupHtml?: string;
};

type BookingMapRow = {
  user_id?: string;
  user_uuid?: string;
  latitude: number;
  longitude: number;
  name?: string;
  phone?: string;
  vehicle_number?: string;
  vehicle_type?: string;
  duration_of_stay?: string;
  payment_type?: string;
  payment_amount?: number | string;
  pricing_type?: string;
  booking_date?: string;
  start_time?: string;
  profiles?:
    | {
        name?: string | null;
        phone?: string | null;
      }
    | Array<{
        name?: string | null;
        phone?: string | null;
      }>;
};

type ProfileRow = {
  id: string;
  name?: string | null;
  phone?: string | null;
};

const getCurrentTime12h = (date: Date) =>
  date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

const isValidCoordinate = (latitude: number, longitude: number) =>
  latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;

const toRadians = (value: number) => (value * Math.PI) / 180;

const distanceInKm = (
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
) => {
  const earthRadius = 6371;
  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(aLat)) *
      Math.cos(toRadians(bLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return earthRadius * c;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const toPopupHtml = (row: BookingMapRow) => {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const name = row.name ?? profile?.name ?? "N/A";
  const phone = row.phone ?? profile?.phone ?? "N/A";
  const vehicleNumber = row.vehicle_number ?? "N/A";
  const vehicleType = row.vehicle_type ?? "N/A";
  const duration = row.duration_of_stay ?? "N/A";
  const paymentType = row.payment_type ?? "N/A";
  const paymentAmount = row.payment_amount ?? "N/A";
  const pricing = row.pricing_type ?? "N/A";
  const bookingDate = row.booking_date ?? "N/A";

  return `<div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.45; min-width: 180px;">
    <div style="font-weight: 700; margin-bottom: 4px;">Rent Provider</div>
    <div><b>Name:</b> ${escapeHtml(String(name))}</div>
    <div><b>Phone:</b> ${escapeHtml(String(phone))}</div>
    <div><b>Vehicle #:</b> ${escapeHtml(String(vehicleNumber))}</div>
    <div><b>Vehicle:</b> ${escapeHtml(String(vehicleType))}</div>
    <div><b>Duration:</b> ${escapeHtml(String(duration))}</div>
    <div><b>Payment:</b> ${escapeHtml(String(paymentType))}</div>
    <div><b>Amount:</b> ${escapeHtml(String(paymentAmount))}</div>
    <div><b>Pricing:</b> ${escapeHtml(String(pricing))}</div>
    <div><b>Date:</b> ${escapeHtml(String(bookingDate))}</div>
  </div>`;
};

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as { message?: unknown };
    if (typeof maybeError.message === "string") {
      return maybeError.message;
    }
  }

  return "Unable to load saved coordinates.";
};

export default function RentPage() {
  const [showMap, setShowMap] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [searchCenter, setSearchCenter] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [now, setNow] = useState(new Date());
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [dbMarkers, setDbMarkers] = useState<MarkerPoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState<MarkerPoint | null>(
    null,
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const totalMinutes = useMemo(() => hours * 60 + minutes, [hours, minutes]);
  const duration = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  const mapHtml = useMemo(() => {
    const mergedMarkers = [
      ...dbMarkers,
      ...(currentLocation ? [currentLocation] : []),
    ];
    const markerJson = JSON.stringify(mergedMarkers);

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

      const points = ${markerJson};
      if (points.length === 0) {
        map.setView([${DEFAULT_COORDS.latitude}, ${DEFAULT_COORDS.longitude}], 14);
      } else {
        const layers = points.map((point) => {
          const marker = L.marker([point.latitude, point.longitude]).addTo(map);
          marker.bindPopup(point.popupHtml || point.label || "Marker");
          return marker;
        });

        const group = L.featureGroup(layers);
        map.fitBounds(group.getBounds().pad(0.35));
      }
    </script>
  </body>
</html>`;
  }, [dbMarkers, currentLocation]);

  const fetchCoordinates = async (center?: {
    latitude: number;
    longitude: number;
  }) => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_COORDINATES_API_URL;

      if (apiUrl) {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const rows = (await response.json()) as BookingMapRow[];

        const points = rows
          .filter((item) => isValidCoordinate(item.latitude, item.longitude))
          .map((item, index) => ({
            latitude: Number(item.latitude),
            longitude: Number(item.longitude),
            label: item.name ?? `Marker ${index + 1}`,
            popupHtml: toPopupHtml(item),
          }));

        const finalPoints = center
          ? points.filter(
              (point) =>
                distanceInKm(
                  center.latitude,
                  center.longitude,
                  point.latitude,
                  point.longitude,
                ) <= NEARBY_RADIUS_KM,
            )
          : points;

        if (center && finalPoints.length === 0 && points.length > 0) {
          setDbMarkers(points);
        } else {
          setDbMarkers(finalPoints);
        }
        return;
      }

      if (!isSupabaseConfigured) {
        setDbMarkers([]);
        return;
      }

      const supabase = getSupabaseClient();
      const { data: bookingData, error: bookingError } = await supabase
        .from("parking_bookings")
        .select(
          "user_id,latitude,longitude,vehicle_number,vehicle_type,duration_of_stay,payment_type,payment_amount,pricing_type,booking_date,start_time",
        );

      if (bookingError) {
        throw bookingError;
      }

      if (!bookingData || bookingData.length === 0) {
        setDbMarkers([]);
        Alert.alert(
          "No visible pins",
          "No booking rows are visible for this user. Check Supabase SELECT policy (RLS) or API filtering.",
        );
        return;
      }

      const userIds = Array.from(
        new Set(
          (bookingData ?? [])
            .map((item) => item.user_id)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      let profileByUserId: Record<string, { name?: string; phone?: string }> =
        {};

      if (userIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id,name,phone")
          .in("id", userIds);

        if (!profileError) {
          profileByUserId = (profileData as ProfileRow[]).reduce<
            Record<string, { name?: string; phone?: string }>
          >((acc, profile) => {
            acc[profile.id] = {
              name: profile.name ?? undefined,
              phone: profile.phone ?? undefined,
            };
            return acc;
          }, {});
        }
      }

      const mergedRows = (bookingData ?? []).map((item) => ({
        ...item,
        name: item.user_id ? profileByUserId[item.user_id]?.name : undefined,
        phone: item.user_id ? profileByUserId[item.user_id]?.phone : undefined,
      }));

      const points = mergedRows
        .filter((item) =>
          isValidCoordinate(Number(item.latitude), Number(item.longitude)),
        )
        .map((item, index) => ({
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
          label: item.name ?? `Marker ${index + 1}`,
          popupHtml: toPopupHtml(item as BookingMapRow),
        }));

      const finalPoints = center
        ? points.filter(
            (point) =>
              distanceInKm(
                center.latitude,
                center.longitude,
                point.latitude,
                point.longitude,
              ) <= NEARBY_RADIUS_KM,
          )
        : points;

      if (center && finalPoints.length === 0 && points.length > 0) {
        setDbMarkers(points);
      } else {
        setDbMarkers(finalPoints);
      }
    } catch (error) {
      Alert.alert("Map data error", toErrorMessage(error));
    }
  };

  const openNearestPinsMap = async () => {
    if (showMap) {
      setShowMap(false);
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission denied", "Location permission is required.");
      return;
    }

    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const center = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };

      setCurrentLocation({
        latitude: center.latitude,
        longitude: center.longitude,
        label: "My location",
      });

      setSearchCenter(center);
      setShowMap(true);
    } catch {
      Alert.alert("Location error", "Unable to fetch your location.");
    }
  };

  useEffect(() => {
    if (showMap) {
      fetchCoordinates(searchCenter ?? undefined);
    }
  }, [showMap, searchCenter]);

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

      setCurrentLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        label: "My location",
      });
      setSearchCenter(null);
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
        scrollEnabled={scrollEnabled}
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
              onPress={openNearestPinsMap}
            >
              <Text style={styles.actionButtonText}>
                {showMap ? "Close Map" : "Open OpenStreetMap"}
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
            <View
              style={styles.mapFrame}
              onTouchStart={() => setScrollEnabled(false)}
              onTouchEnd={() => setScrollEnabled(true)}
              onTouchCancel={() => setScrollEnabled(true)}
            >
              <WebView
                source={{ html: mapHtml }}
                originWhitelist={["*"]}
                style={styles.map}
                nestedScrollEnabled
              />
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
