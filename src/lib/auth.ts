// NextAuth configuration — email/password login with bcrypt, JWT session strategy.
// Attaches userId, role and subscription to every JWT so API routes can call
// getServerSession(authOptions) to identify the caller without a DB lookup.
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import prisma from './prisma'

export const authOptions: NextAuthOptions = {
  // `as any` cast needed because @auth/prisma-adapter v2 types don't exactly match NextAuth v4 Adapter interface
  adapter: PrismaAdapter(prisma) as any,
  // JWT strategy keeps sessions stateless — no DB session table needed
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user || !user.password) return null
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null
        // Return only safe fields — never expose password hash to session
        return {
          id: user.id, email: user.email, name: user.name,
          role: user.role, subscription: user.subscription, company: user.company,
          emailVerified: user.emailVerified, emailSignature: (user as any).emailSignature,
        }
      },
    }),
  ],
  callbacks: {
    // Persist extra fields into the JWT token on first sign-in
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.subscription = (user as any).subscription
        token.company = (user as any).company
        token.emailVerified = (user as any).emailVerified
      }
      return token
    },
    // Copy JWT fields to the session object so client components can read them
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
