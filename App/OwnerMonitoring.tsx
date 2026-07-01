// app/(tabs)/owner-monitoring.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { MainLayout } from "../../components/MainLayout"; // ← Fixed Import Path

const LandOwnerMonitoring = () => {
  return (
    <MainLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header} />

        {/* Stats */}
        <View style={styles.profileSection}>
          <View style={styles.statsCards}>
            <View style={styles.statsCard}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Vehicles</Text>
            </View>
            <View style={styles.statsCard}>
              <Text style={styles.statValue}>52</Text>
              <Text style={styles.statLabel}>Slots</Text>
            </View>
          </View>
        </View>

        {/* Earnings Cards */}
        <View style={styles.earningsContainer}>
          <View style={styles.earningCard}>
            <Text style={styles.earningLabel}>Today</Text>
            <Text style={styles.earningAmount}>৳4,85</Text>
            <Text style={styles.growthPositive}>+18%</Text>
          </View>

          <View style={styles.earningCard}>
            <Text style={styles.earningLabel}>This Month</Text>
            <Text style={styles.earningAmount}>৳78,20</Text>
            <Text style={styles.growthPositive}>+12%</Text>
          </View>

          <View style={styles.earningCard}>
            <Text style={styles.earningLabel}>Total</Text>
            <Text style={styles.earningAmount}>৳412,60</Text>
            <Text style={styles.updateText}>Updated: 10 Mar</Text>
          </View>
        </View>

        {/* Today's Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today&apos;s Bookings</Text>
            <Text style={styles.sectionSubtitle}>
              Overview of active sessions
            </Text>
          </View>

          <View style={styles.activeBadge}>
            <Text style={styles.activeText}>8 Active</Text>
          </View>

          <View style={styles.bookingCard}>
            <View>
              <Text style={styles.vehicleId}>ABC-1234 (Sedan)</Text>
              <Text style={styles.entryTime}>Entry: 14:32 • 2h 45m</Text>
            </View>
            <View style={styles.statusContainer}>
              <Text style={styles.amount}>৳180</Text>
              <View style={[styles.statusBadge, styles.activeStatus]}>
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
          </View>

          <View style={styles.bookingCard}>
            <View>
              <Text style={styles.vehicleId}>DEF-5678 (SUV)</Text>
              <Text style={styles.entryTime}>Entry: 15:10 • 1h 20m</Text>
            </View>
            <View style={styles.statusContainer}>
              <Text style={styles.amount}>৳120</Text>
              <View style={[styles.statusBadge, styles.activeStatus]}>
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
          </View>

          <View style={styles.bookingCard}>
            <View>
              <Text style={styles.vehicleId}>GHI-9012 (Bike)</Text>
              <Text style={styles.entryTime}>Completed 15:45</Text>
            </View>
            <View style={styles.statusContainer}>
              <Text style={styles.amount}>৳80</Text>
              <View style={[styles.statusBadge, styles.doneStatus]}>
                <Text style={styles.statusText}>Done</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Entry & Exit */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Entry & Exit</Text>
            <Text style={styles.latestActivity}>Latest activity</Text>
          </View>

          <View style={styles.activityItem}>
            <Ionicons name="arrow-forward-circle" size={24} color="#10b981" />
            <Text style={styles.activityText}>Entry - JKL-3456 at 16:05</Text>
          </View>

          <View style={[styles.activityItem, styles.exitItem]}>
            <Ionicons name="arrow-back-circle" size={24} color="#ef4444" />
            <Text style={styles.activityText}>Exit - MNO-7890 at 15:58</Text>
          </View>

          <View style={styles.activityItem}>
            <Ionicons name="arrow-forward-circle" size={24} color="#10b981" />
            <Text style={styles.activityText}>Entry - PQR-1122 at 15:40</Text>
          </View>
        </View>

        {/* Security & Status */}
        <View style={styles.securitySection}>
          <View>
            <Text style={styles.securityTitle}>Security & Status</Text>
            <Text style={styles.securitySubtitle}>
              Occupancy and quick preferences
            </Text>
          </View>
          <View style={styles.alertBadge}>
            <Text style={styles.alertText}>2 Alerts</Text>
          </View>
        </View>
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
  },
  profileSection: {
    padding: 20,
    backgroundColor: "white",
    marginBottom: 12,
  },
  statsCards: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    alignItems: "center",
  },
  statValue: { fontSize: 18, fontWeight: "700", color: "#10b981" },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 2 },

  earningsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  earningCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  earningLabel: { fontSize: 13, color: "#64748b", marginBottom: 8 },
  earningAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e2937",
    marginBottom: 4,
  },
  growthPositive: { color: "#10b981", fontSize: 13, fontWeight: "600" },
  updateText: { color: "#64748b", fontSize: 12 },

  section: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1e2937" },
  sectionSubtitle: { color: "#64748b", fontSize: 13 },

  activeBadge: {
    position: "absolute",
    right: 20,
    top: 20,
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  activeText: { color: "white", fontWeight: "600", fontSize: 13 },

  bookingCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  vehicleId: { fontSize: 16, fontWeight: "600", color: "#1e2937" },
  entryTime: { fontSize: 13, color: "#64748b", marginTop: 2 },
  statusContainer: { alignItems: "flex-end" },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e2937",
    marginBottom: 6,
  },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
  activeStatus: { backgroundColor: "#10b981" },
  doneStatus: { backgroundColor: "#94a3b8" },
  statusText: { color: "white", fontSize: 12, fontWeight: "600" },

  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  exitItem: {
    backgroundColor: "#fef2f2",
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  activityText: { marginLeft: 12, fontSize: 15, color: "#334155" },
  latestActivity: { color: "#64748b", fontSize: 13 },

  securitySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
  },
  securityTitle: { fontSize: 17, fontWeight: "700", color: "#1e2937" },
  securitySubtitle: { color: "#64748b", fontSize: 13 },
  alertBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  alertText: { color: "white", fontWeight: "600", fontSize: 14 },
});

export default LandOwnerMonitoring;
