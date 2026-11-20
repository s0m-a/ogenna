export const theme = {
  colors: {
    primary100: "#fdf6f0",
    primary150: "#F5ECDA",
    primary200: "#f5e6d8",
    primary300: "#e8c9af",
    primary400: "#c2714f",
    primary500: "#a85c3c",
    primary600: "#8c4a2e",

    background: "#faf8f5",
    surface: "#ffffff",
    surfaceMuted: "#f4f1ec",

    textPrimary: "#2c1f14",
    textSecondary: "#6b5444",
    textInverse: "#fdf6f0",
    textNav: "#482511",

    border: "#e2d8cf",
    borderStrong: "#c8bdb5",

    success: "#4a7c59",
    successBg: "#edf5f0",
    warning: "#9c7a1e",
    warningBg: "#fdf8e8",
    danger: "#b03a2e",
    dangerBg: "#fdf0ee",

    clay: "#d7b69b",
    clayDark: "#a98068",

    terracotta: "#b46e5a",
    terracottaDark: "#9a5d4b",

    sage: "#c2c1af",
    sageDark: "#9ba58a",

    sand: "#ede3d8",

    // Overlays for text and chrome laid over photography.
    scrim: "rgba(44, 31, 20, 0.55)",
    scrimSoft: "rgba(44, 31, 20, 0.18)",
    hairlineInverse: "rgba(253, 246, 240, 0.35)",
  },

  fonts: {
    heading: "var(--font-petrona), Georgia, serif",
    body: "var(--font-petrona), Georgia, serif",
    nav: "var(--font-lora), Georgia, serif",
    ui: "var(--font-inter), 'PingFang SC', system-ui, sans-serif",
  },

  fontSizes: {
    xs: "0.6875rem",
    sm: "0.8125rem",
    base: "0.9375rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3.0625rem",
    display: "clamp(2.5rem, 1.3rem + 4vw, 5rem)",
  },

  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeights: {
    tight: 1.25,
    snug: 1.4,
    normal: 1.6,
    relaxed: 1.75,
  },

  spacing: {
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
  },

  radii: {
    sm: "4px",
    md: "6px",
    lg: "10px",
    xl: "14px",
    full: "9999px",
  },

  shadows: {
    xs: "0 1px 2px rgba(44, 31, 20, 0.05)",
    sm: "0 1px 4px rgba(44, 31, 20, 0.07)",
    md: "0 4px 16px rgba(44, 31, 20, 0.09)",
    lg: "0 8px 32px rgba(44, 31, 20, 0.11)",
  },

  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
  },

  layout: {
    sidebarWidth: "248px",
    headerHeight: "60px",
    contentMaxWidth: "1400px",
    wideMaxWidth: "1920px",
    pagePaddingXWide: "1.5rem",
    pagePaddingX: "5rem",
    pagePaddingXMobile: "1.25rem",
    storefrontHeaderHeight: "96px",
    storefrontHeaderHeightMobile: "68px",
  },

  transitions: {
    fast: "120ms ease",
    base: "180ms ease",
    slow: "280ms ease",
  },

  motion: {
    easeOut: "cubic-bezier(0.22, 1, 0.36, 1)",
    revealDuration: "700ms",
    revealDistance: "16px",
    staggerMs: 90,
    easeDrape: "cubic-bezier(0.76, 0, 0.24, 1)",
    drapeDuration: "1400ms",
  },
} as const;

export type Theme = typeof theme
