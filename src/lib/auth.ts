// NextAuth configuration — email/password login with bcrypt, JWT session strategy.
// Also supports Google and Microsoft SSO when client credentials are configured.
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import prisma from './prisma'

// Build the providers list dynamically — SSO providers only load when env vars are set
const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      try {
        if (!credentials?.email || !credentials?.password) {
          console.warn('[Auth] Missing credentials')
          return null
        }
        const email = credentials.email.toLowerCase()
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
          console.warn(`[Auth] No user found for email: ${email}`)
          return null
        }
        if (!user.password) {
          console.warn(`[Auth] User ${email} has no password set (likely SSO-only)`)
          return null
        }
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          console.warn(`[Auth] Invalid password for ${email}`)
          return null
        }
        if (user.suspended) {
          console.warn(`[Auth] Suspended user tried to log in: ${email}`)
          return null
        }
        console.log(`[Auth] Successful login: ${email} (role=${user.role}, plan=${user.subscription})`)
        return {
          id: user.id, email: user.email, name: user.name,
          role: user.role, subscription: user.subscription, company: user.company,
          emailVerified: user.emailVerified, emailSignature: (user as any).emailSignature,
        }
      } catch (e: any) {
        console.error('[Auth] authorize() threw:', e?.message || e)
        return null
      }
    },
  }),
]

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    allowDangerousEmailAccountLinking: true,
  }))
}

if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  providers.push(AzureADProvider({
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
    allowDangerousEmailAccountLinking: true,
  }))
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
  },
  providers,
  callbacks: {
    // SSO sign-in: create or update the user record with proper defaults
    async signIn({ user, account }) {
      if (account?.provider === 'google' || account?.provider === 'azure-ad') {
        if (!user.email) return false
        const email = user.email.toLowerCase()
        const existing = await prisma.user.findUnique({ where: { email } })
        if (!existing) {
          // First-time SSO user — create with Free plan and emailVerified set
          await prisma.user.create({
            data: {
              email,
              name: user.name || email.split('@')[0],
              role: 'recruiter',
              subscription: 'free',
              emailVerified: new Date(),
              image: user.image || null,
            },
          })
        } else if (!existing.emailVerified) {
          // Existing user with unverified email — mark as verified via SSO
          await prisma.user.update({
            where: { id: existing.id },
            data: { emailVerified: new Date() },
          })
        }
      }
      return true
    },
    // Persist extra fields into the JWT token on sign-in
    async jwt({ token, user, account }) {
      if (user) {
        // For SSO logins, fetch the DB user to get the role/subscription
        if (account?.provider === 'google' || account?.provider === 'azure-ad') {
          const dbUser = await prisma.user.findUnique({ where: { email: user.email!.toLowerCase() } })
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.subscription = dbUser.subscription
            token.company = dbUser.company
            token.emailVerified = dbUser.emailVerified
          }
        } else {
          token.id = user.id
          token.role = (user as any).role
          token.subscription = (user as any).subscription
          token.company = (user as any).company
          token.emailVerified = (user as any).emailVerified
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).subscription = token.subscription
        ;(session.user as any).company = token.company
        ;(session.user as any).emailVerified = token.emailVerified
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
