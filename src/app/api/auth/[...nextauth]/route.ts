import NextAuth, { AuthOptions } from 'next-auth'
import Google from "next-auth/providers/google";

export const OPTIONS: AuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!
    }),
  ],
  debug: false,
  session: {strategy: 'jwt'}
}

const handler = NextAuth(OPTIONS);

export {handler as POST, handler as GET}