import { StyleSheet, Text, View } from "react-native";
import Svg, { Line, Polygon } from "react-native-svg";

import type { EmotionMetric } from "../../lib/schema";
import { colors, spacing, typography } from "../../theme/tokens";

type EmotionRadarProps = {
  metrics: EmotionMetric[];
  size?: number;
};

function pointAt(
  index: number,
  total: number,
  valueRatio: number,
  radius: number,
  center: number,
): [number, number] {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / total;
  const r = radius * valueRatio;
  const x = center + Math.cos(angle) * r;
  const y = center + Math.sin(angle) * r;
  return [x, y];
}

function toPointString(points: Array<[number, number]>): string {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

export function EmotionRadar({ metrics, size = 260 }: EmotionRadarProps) {
  if (metrics.length < 3) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>감정 데이터가 부족해 그래프를 만들지 못했어요.</Text>
      </View>
    );
  }

  const center = size / 2;
  const radius = size * 0.4;
  const total = metrics.length;

  const gridPolygons = [1, 2, 3, 4, 5].map((level) => {
    const ratio = level / 5;
    const points = metrics.map((_, index) => pointAt(index, total, ratio, radius, center));
    return toPointString(points);
  });

  const metricPoints = metrics.map((metric, index) =>
    pointAt(index, total, metric.value / 100, radius, center),
  );

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {gridPolygons.map((points, index) => (
          <Polygon
            key={`grid-${points}`}
            points={points}
            fill="transparent"
            stroke={index === 4 ? "#1F2B36" : "#A1B3C1"}
            strokeWidth={index === 4 ? 2.4 : 1}
          />
        ))}

        {metrics.map((_, index) => {
          const [x, y] = pointAt(index, total, 1, radius, center);
          return (
            <Line
              key={`axis-${index}`}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#A7BAC8"
              strokeWidth={1}
            />
          );
        })}

        <Polygon
          points={toPointString(metricPoints)}
          fill="rgba(228, 198, 61, 0.2)"
          stroke={colors.accent}
          strokeWidth={2.5}
        />
      </Svg>

      <View style={styles.labels}>
        {metrics.map((metric) => (
          <View key={metric.id} style={styles.labelRow}>
            <View style={[styles.dot, { backgroundColor: metric.color }]} />
            <Text style={styles.labelText}>{metric.label}</Text>
          </View>
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
    textAlign: "center",
  },
  labels: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  labelText: {
    color: colors.mutedText,
    fontFamily: typography.family.medium,
    fontSize: typography.caption,
  },
});
