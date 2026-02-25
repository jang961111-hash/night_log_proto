import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { colors, typography } from "../theme/tokens";

type BrandMarkProps = {
  size?: number;
  labelSize?: number;
};

export function BrandMark({ size = 160, labelSize = 44 }: BrandMarkProps) {
  return (
    <View style={[styles.shell, { width: size, height: size, borderRadius: size / 2 }]}>
      <LinearGradient
        colors={["#8EDBFA", "#39A6D1", "#1F7FA8"]}
        start={{ x: 0.2, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={[styles.gradient, { borderRadius: size / 2 }]}
      >
        <View style={styles.innerCircle}>
          <Text style={[styles.label, { fontSize: labelSize }]}>N</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  gradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: "58%",
    height: "58%",
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
  },
  label: {
    color: "#FFFFFF",
    fontFamily: typography.family.bold,
    letterSpacing: 1.2,
  },
});
