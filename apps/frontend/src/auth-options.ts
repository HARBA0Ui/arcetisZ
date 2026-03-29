import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { env } from "@/server/config/env";

const googleClientId = env.AUTH_GOOGLE_ID;
const googleClientSecret = env.AUTH_GOOGLE_SECRET;

export const authOptions: NextAuthOptions = {
  secret: env.AUTH_SECRET,
  session: {
    strategy: "jwt"
  },
  providers:
    googleClientId && googleClientSecret
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret
          })
        ]
      : [],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "google") {
        token.googleId = account.providerAccountId;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.googleId = typeof token.googleId === "string" ? token.googleId : undefined;
      }

      return session;
    }
  }
};
