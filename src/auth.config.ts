import type { NextAuthConfig } from "next-auth";

const APP_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/proposals",
  "/clients",
  "/library",
  "/settings",
];

export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 14,
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const needsAuth = APP_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      );
      if (!needsAuth) return true;
      return Boolean(auth?.user);
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = String(token.id);
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
