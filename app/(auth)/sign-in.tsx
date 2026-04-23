import { AuthCard } from '@/components/auth/AuthCard'
import { AuthDivider } from '@/components/auth/AuthDivider'
import { AuthFooterLink } from '@/components/auth/AuthFooterLink'
import { AuthInput } from '@/components/auth/AuthInput'
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton'
import { AuthScreenShell } from '@/components/auth/AuthScreenShell'
import { AuthTextButton } from '@/components/auth/AuthTextButton'
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'
import { VerificationCodeInput } from '@/components/auth/VerificationCodeInput'
import { AUTH_COPY } from '@/constants/authCopy'
import { AUTH_COLORS } from '@/constants/authTheme'
import { useSignIn } from '@clerk/expo'
import { type Href, useRouter } from 'expo-router'
import React from 'react'
import { StyleSheet, Text } from 'react-native'

export default function Page() {
  const { signIn, errors, fetchStatus } = useSignIn()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [code, setCode] = React.useState('')

  const handleSubmit = async () => {
    const { error } = await signIn.password({
      emailAddress,
      password,
    })
    if (error) {
      console.error(JSON.stringify(error, null, 2))
      return
    }

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            console.log(session?.currentTask)
            return
          }
          const url = decorateUrl('/')
          if (url.startsWith('http')) {
            window.location.href = url
          } else {
            router.push(url as Href)
          }
        },
      })
    } else if (signIn.status === 'needs_second_factor') {
      // MFA flow
    } else if (signIn.status === 'needs_client_trust') {
      const emailCodeFactor = signIn.supportedSecondFactors?.find(
        (factor: { strategy: string }) => factor.strategy === 'email_code',
      )
      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode()
      }
    } else {
      console.error('Sign-in attempt not complete:', signIn)
    }
  }

  const handleVerify = async () => {
    await signIn.mfa.verifyEmailCode({ code })

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            console.log(session?.currentTask)
            return
          }
          const url = decorateUrl('/')
          if (url.startsWith('http')) {
            window.location.href = url
          } else {
            router.push(url as Href)
          }
        },
      })
    } else {
      console.error('Sign-in attempt not complete:', signIn)
    }
  }

  if (signIn.status === 'needs_client_trust') {
    return (
      <AuthScreenShell
        eyebrow={AUTH_COPY.eyebrow}
        title="ThriftUVA"
        subtitle={AUTH_COPY.verification.subtitle}
        supportingText={AUTH_COPY.verification.supporting}
      >
        <AuthCard>
          <Text style={styles.cardTitle}>{AUTH_COPY.verification.title}</Text>
          <VerificationCodeInput
            value={code}
            onChangeText={setCode}
            editable={fetchStatus !== 'fetching'}
            errorText={errors?.fields?.code?.message}
          />
          <AuthPrimaryButton
            label={fetchStatus === 'fetching' ? 'Verifying…' : 'Verify'}
            onPress={handleVerify}
            disabled={fetchStatus === 'fetching' || !code.trim()}
          />
          <AuthTextButton
            label="Send new code"
            onPress={() => signIn.mfa.sendEmailCode()}
            disabled={fetchStatus === 'fetching'}
          />
        </AuthCard>
      </AuthScreenShell>
    )
  }

  return (
    <AuthScreenShell
      eyebrow={AUTH_COPY.eyebrow}
      title="ThriftUVA"
      subtitle={AUTH_COPY.signIn.subtitle}
      supportingText={AUTH_COPY.signIn.supporting}
    >
      <AuthCard>
        <SocialAuthButtons />
        <AuthDivider text={AUTH_COPY.divider} />
        <AuthInput
          label="Email address"
          autoCapitalize="none"
          autoCorrect={false}
          value={emailAddress}
          placeholder="you@example.com"
          onChangeText={setEmailAddress}
          keyboardType="email-address"
          editable={fetchStatus !== 'fetching'}
          errorText={errors?.fields?.identifier?.message}
        />
        <AuthInput
          label="Password"
          value={password}
          placeholder="Enter your password"
          secureTextEntry
          onChangeText={setPassword}
          editable={fetchStatus !== 'fetching'}
          errorText={errors?.fields?.password?.message}
        />
        <AuthPrimaryButton
          label={fetchStatus === 'fetching' ? 'Signing in…' : 'Continue'}
          onPress={handleSubmit}
          disabled={!emailAddress || !password || fetchStatus === 'fetching'}
        />
        <AuthFooterLink prompt="Don't have an account?" actionText="Sign up" href="/(auth)/sign-up" />
      </AuthCard>
    </AuthScreenShell>
  )
}

const styles = StyleSheet.create({
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AUTH_COLORS.uvaBlue,
    marginBottom: 20,
  },
})
