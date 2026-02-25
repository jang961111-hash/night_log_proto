import { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { ScreenFadeIn } from "../components/ScreenFadeIn";
import { SelectChip } from "../components/SelectChip";
import { colors, spacing, typography } from "../theme/tokens";

const defaultInterests = [
  "스포츠",
  "노래",
  "게임",
  "도서",
  "패션",
  "아이돌",
  "뷰티",
  "강좌",
  "병맛",
  "영화",
  "드라마",
  "여행",
  "사진",
  "요리",
  "건강",
  "러닝",
  "전시",
  "재테크",
  "커리어",
  "명상",
  "언어",
  "테크",
  "창작",
  "스타트업",
];

type InterestScreenProps = {
  initialSelected: string[];
  onSkip: () => void;
  onConfirm: (selected: string[]) => void;
};

export function InterestScreen({ initialSelected, onSkip, onConfirm }: InterestScreenProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));

  const selectedArray = useMemo(() => Array.from(selected), [selected]);

  const toggle = (interest: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(interest)) {
        next.delete(interest);
      } else {
        next.add(interest);
      }
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenFadeIn style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>관심사를 선택해주세요</Text>
          <Text style={styles.subtitle}>추천 문장과 일정 후보를 더 정확하게 맞춰드려요.</Text>
          <Text style={styles.counter}>선택됨 {selectedArray.length}개</Text>
        </View>

        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {defaultInterests.map((interest) => (
            <View key={interest} style={styles.cell}>
              <SelectChip
                label={interest}
                selected={selected.has(interest)}
                onPress={() => toggle(interest)}
              />
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <AppButton label="SKIP" onPress={onSkip} variant="outline" style={styles.footerButton} />
          <AppButton
            label={selectedArray.length > 0 ? `확인 (${selectedArray.length})` : "확인"}
            onPress={() => onConfirm(selectedArray)}
            style={styles.footerButton}
          />
        </View>
      </ScreenFadeIn>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  content: {
    flex: 1,
    gap: spacing.md,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: typography.section,
    color: colors.text,
    fontFamily: typography.family.bold,
  },
  subtitle: {
    color: colors.mutedText,
    fontFamily: typography.family.regular,
    fontSize: typography.body,
  },
  counter: {
    marginTop: 2,
    color: colors.primaryDeep,
    fontFamily: typography.family.medium,
    fontSize: typography.caption,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  cell: {
    width: "32%",
    alignSelf: "flex-start",
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  footerButton: {
    flex: 1,
  },
});