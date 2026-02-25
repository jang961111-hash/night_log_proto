export const colors = {
  bg: "#EEF1F4",
  surface: "#F9FBFC",
  surfaceStrong: "#E4E9EE",
  text: "#14222E",
  mutedText: "#5B6B79",
  primary: "#39A6D1",
  primaryDeep: "#1F7FA8",
  accent: "#E4C63D",
  success: "#56C8A8",
  danger: "#DB6666",
  border: "#BFD1DE",
  shadow: "rgba(9, 31, 45, 0.1)",
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
  md: 16,
  lg: 24,
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
