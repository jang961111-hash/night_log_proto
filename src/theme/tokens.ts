export const colors = {
  bg: "#F4F2F0",
  surface: "#FFFFFF",
  surfaceStrong: "#EFEEEC",
  text: "#2C2C2C",
  mutedText: "#8A8883",
  primary: "#73AB96",
  primaryDeep: "#5E9581",
  accent: "#E5C67A",
  success: "#73AB96",
  danger: "#D16D6D",
  border: "#DCD9D5",
  shadow: "rgba(25, 25, 25, 0.08)",
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
} as const;

export const radius = {
  sm: 10,
  md: 18,
  lg: 26,
  pill: 999,
} as const;

export const typography = {
  title: 34,
  section: 24,
  subtitle: 17,
  body: 15,
  caption: 13,
  overline: 11,
  family: {
    regular: "NotoSansKR_400Regular",
    medium: "NotoSansKR_500Medium",
    bold: "NotoSansKR_700Bold",
  },
} as const;

export const touchTarget = {
  minSize: 44,
  comfortable: 52,
  fab: 84,
} as const;

export const motion = {
  fast: 180,
  normal: 320,
  slow: 480,
} as const;

export const layer = {
  base: 0,
  floating: 10,
  overlay: 20,
  modal: 30,
} as const;

export const shadows = {
  soft: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 2,
  },
} as const;
