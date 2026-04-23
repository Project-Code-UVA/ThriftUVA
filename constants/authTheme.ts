import { Platform } from 'react-native'

export const AUTH_COLORS = {
  uvaBlue: '#232D4B',
  uvaOrange: '#E57200',
  white: '#FFFFFF',
  lightBackgroundTint: '#F8FAFC',
  softBlueTint: '#EEF4FF',
  softOrangeTint: '#FFF4E8',
  border: '#D9E2EC',
  mutedText: '#6B7A90',
  headingText: '#1E2A4A',
  error: '#B91C1C',
} as const

export const AUTH_SPACING = {
  screenHorizontal: 24,
  heroTop: 56,
  heroBottom: 28,
  cardRadius: 28,
  cardPadding: 28,
  cardOverlap: -18,
  inputRadius: 14,
  inputVertical: 18,
  inputHorizontal: 18,
  sectionGap: 20,
} as const

export const AUTH_SHADOWS = {
  card: Platform.select({
    ios: {
      shadowColor: '#1E2A4A',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    android: {
      elevation: 10,
    },
    default: {},
  }),
  social: Platform.select({
    ios: {
      shadowColor: '#1E2A4A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  primaryButton: Platform.select({
    ios: {
      shadowColor: '#232D4B',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 12,
    },
    android: {
      elevation: 6,
    },
    default: {},
  }),
}
