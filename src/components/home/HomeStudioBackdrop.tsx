import { StyleSheet, View } from "react-native";

import { colors, radius, shadows } from "../../theme/tokens";

type HomeStudioBackdropProps = {
  compact: boolean;
};

function GarlandRow({ top }: { top: number }) {
  return (
    <View style={[styles.garlandRow, { top }]}>
      <View style={styles.garlandArcRow}>
        <View style={styles.garlandArc} />
        <View style={styles.garlandArc} />
        <View style={styles.garlandArc} />
      </View>
      <View style={styles.flagRow}>
        {Array.from({ length: 9 }).map((_, index) => (
          <View
            key={`flag-${index}`}
            style={[
              styles.flag,
              index % 2 === 0 ? styles.flagTiltLeft : styles.flagTiltRight,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export function HomeStudioBackdrop({ compact }: HomeStudioBackdropProps) {
  return (
    <View
      style={styles.wrap}
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <View style={styles.ropeLeft} />
      <View style={styles.ropeRight} />
      <View style={styles.bulbWrap}>
        <View style={styles.bulbCap} />
        <View style={styles.bulbGlass} />
      </View>

      <View style={styles.wallPanel} />
      <GarlandRow top={compact ? 114 : 124} />
      {!compact ? <GarlandRow top={286} /> : null}

      <View style={[styles.calendarIcon, compact && styles.calendarIconCompact]}>
        <View style={styles.calendarBar} />
        <View style={styles.calendarPins}>
          <View style={styles.calendarPin} />
          <View style={styles.calendarPin} />
        </View>
        <View style={styles.calendarGrid}>
          {Array.from({ length: 18 }).map((_, index) => (
            <View
              key={`cell-${index}`}
              style={styles.calendarCell}
            />
          ))}
        </View>
      </View>

      <View style={[styles.tableWrap, compact && styles.tableWrapCompact]}>
        <View style={styles.tableTop} />
        <View style={styles.tableLegLeft} />
        <View style={styles.tableLegRight} />
        <View style={styles.chairSeat} />
        <View style={styles.chairLegLeft} />
        <View style={styles.chairLegRight} />
        <View style={styles.inkBottle} />
        <View style={styles.quill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
  },
  ropeLeft: {
    position: "absolute",
    left: -64,
    top: -62,
    width: 180,
    height: 2,
    backgroundColor: "#5A5A5A",
    transform: [{ rotate: "66deg" }],
    opacity: 0.55,
  },
  ropeRight: {
    position: "absolute",
    right: -64,
    top: -62,
    width: 180,
    height: 2,
    backgroundColor: "#5A5A5A",
    transform: [{ rotate: "-66deg" }],
    opacity: 0.55,
  },
  bulbWrap: {
    position: "absolute",
    top: 42,
    alignSelf: "center",
    alignItems: "center",
  },
  bulbCap: {
    width: 22,
    height: 10,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    backgroundColor: "#2B2B2B",
  },
  bulbGlass: {
    width: 34,
    height: 44,
    borderRadius: 22,
    marginTop: -2,
    borderWidth: 3,
    borderColor: "#262626",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  wallPanel: {
    position: "absolute",
    top: 102,
    left: "8%",
    right: "8%",
    bottom: 132,
    borderRadius: 22,
    backgroundColor: "#DDE3E8",
    borderWidth: 1,
    borderColor: "#D2D8DE",
    ...shadows.soft,
  },
  garlandRow: {
    position: "absolute",
    left: "9%",
    right: "9%",
  },
  garlandArcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  garlandArc: {
    width: "33%",
    height: 32,
    borderBottomWidth: 4,
    borderColor: "#8A6B53",
    borderBottomLeftRadius: 46,
    borderBottomRightRadius: 46,
  },
  flagRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  flag: {
    width: 22,
    height: 40,
    borderRadius: 3,
    backgroundColor: "rgba(249, 251, 252, 0.92)",
  },
  flagTiltLeft: {
    transform: [{ rotate: "-24deg" }],
  },
  flagTiltRight: {
    transform: [{ rotate: "24deg" }],
  },
  calendarIcon: {
    position: "absolute",
    top: "34%",
    left: "16%",
    width: 106,
    height: 112,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: colors.primary,
    backgroundColor: "rgba(57, 166, 209, 0.12)",
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 7,
  },
  calendarIconCompact: {
    top: "30%",
    width: 94,
    height: 100,
  },
  calendarBar: {
    height: 18,
    marginHorizontal: -10,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: colors.primary,
  },
  calendarPins: {
    position: "absolute",
    top: -8,
    left: 18,
    right: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calendarPin: {
    width: 8,
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: "#6CBFE3",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 2,
  },
  calendarCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: "#8BC4E0",
  },
  tableWrap: {
    position: "absolute",
    left: "22%",
    right: "10%",
    bottom: 208,
    height: 176,
  },
  tableWrapCompact: {
    left: "20%",
    right: "12%",
    bottom: 178,
    height: 136,
  },
  tableTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 30,
    backgroundColor: "#C69A75",
    borderRadius: 1,
  },
  tableLegLeft: {
    position: "absolute",
    left: 8,
    top: 30,
    width: 14,
    height: "78%",
    backgroundColor: "#8D684D",
  },
  tableLegRight: {
    position: "absolute",
    right: 8,
    top: 30,
    width: 14,
    height: "78%",
    backgroundColor: "#8D684D",
  },
  chairSeat: {
    position: "absolute",
    bottom: 56,
    left: "34%",
    right: "34%",
    height: 22,
    borderRadius: radius.md,
    backgroundColor: "#D9AE8A",
  },
  chairLegLeft: {
    position: "absolute",
    bottom: 0,
    left: "43%",
    width: 9,
    height: 58,
    borderRadius: radius.md,
    backgroundColor: "#C8966C",
    transform: [{ rotate: "12deg" }],
  },
  chairLegRight: {
    position: "absolute",
    bottom: 0,
    right: "43%",
    width: 9,
    height: 58,
    borderRadius: radius.md,
    backgroundColor: "#C8966C",
    transform: [{ rotate: "-12deg" }],
  },
  inkBottle: {
    position: "absolute",
    top: -16,
    right: "18%",
    width: 24,
    height: 22,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: "#131313",
  },
  quill: {
    position: "absolute",
    top: -88,
    right: "20%",
    width: 8,
    height: 90,
    borderRadius: radius.pill,
    backgroundColor: "#181818",
    transform: [{ rotate: "24deg" }],
  },
});
