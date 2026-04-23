import React from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
} from 'react-native'
import { AUTH_COLORS, AUTH_SPACING } from '@/constants/authTheme'
import { AuthHero } from './AuthHero'

type AuthScreenShellProps = {
  eyebrow: string
  title: string
  subtitle: string
  supportingText: string
  children: React.ReactNode
  scrollProps?: ScrollViewProps
}

export function AuthScreenShell({
  eyebrow,
  title,
  subtitle,
  supportingText,
  children,
  scrollProps,
}: AuthScreenShellProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.heroWrapper}>
        <View style={styles.blobLayer}>
          <View style={styles.blobBlue} />
          <View style={styles.blobOrange} />
        </View>
        <AuthHero
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          supportingText={supportingText}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          {children}
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AUTH_COLORS.white,
  },
  heroWrapper: {
    paddingTop: AUTH_SPACING.heroTop,
    paddingHorizontal: AUTH_SPACING.screenHorizontal,
    paddingBottom: AUTH_SPACING.heroBottom,
    overflow: 'hidden',
  },
  blobLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 360,
    zIndex: 1,
  },
  blobBlue: {
    position: 'absolute',
    top: -105,
    left: -85,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: AUTH_COLORS.uvaBlue,
    opacity: 0.14,
  },
  blobOrange: {
    position: 'absolute',
    top: -70,
    right: -95,
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: AUTH_COLORS.uvaOrange,
    opacity: 0.14,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: AUTH_SPACING.screenHorizontal,
    paddingBottom: 40,
  },
  keyboardView: {
    flex: 1,
  },
})
