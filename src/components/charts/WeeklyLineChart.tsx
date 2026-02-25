import { StyleSheet, Text, View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";

import type { WeeklyPoint } from "../../lib/insights";
import { colors, spacing, typography } from "../../theme/tokens";

type WeeklyLineChartProps = {
  points: WeeklyPoint[];
  width?: number;
  height?: number;
};

function buildPath(points: WeeklyPoint[], width: number, height: number): string {
  if (points.length === 0) {
    return "";
  }

  const min = 0;
  const max = Math.max(100, ...points.map((item) => item.value));
  const xStep = points.length > 1 ? width / (points.length - 1) : 0;

  return points
    .map((point, index) => {
      const x = xStep * index;
      const ratio = (point.value - min) / (max - min || 1);
      const y = height - ratio * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function WeeklyLineChart({
  points,
  width = 320,
  height = 160,
}: WeeklyLineChartProps) {
  if (points.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>주간 데이터가 없습니다.</Text>
      </View>
    );
  }

  const path = buildPath(points, width, height - 16);

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <Line x1={0} y1={height - 16} x2={width} y2={height - 16} stroke="#2A3B48" strokeWidth={1.5} />
        <Line x1={0} y1={0} x2={0} y2={height - 16} stroke="#2A3B48" strokeWidth={1.5} />
        <Path d={path} stroke="#2A3B48" strokeWidth={2.2} fill="none" />
      </Svg>
      <View style={styles.labelRow}>
        {points.map((point) => (
          <Text key={point.label} style={styles.label}>
            {point.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.sm,
  },
  empty: {
    borderRadius: 16,
    backgroundColor: "#E3E9EE",
    padding: spacing.md,
  },
  emptyText: {
    color: colors.mutedText,
    fontFamily: typography.family.regular,
    fontSize: typography.body,
  },
  labelRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  label: {
    fontSize: typography.caption,
    color: colors.mutedText,
    fontFamily: typography.family.regular,
  },
});
