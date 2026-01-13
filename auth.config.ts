import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config for middleware
// This config does NOT include any providers that use Node.js APIs (database, bcrypt, etc.)
// The full auth config with all providers is in auth.ts

export const authConfig: NextAuthConfig = {
  providers: [], // Providers are configured in auth.ts, not here
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnChat = nextUrl.pathname.startsWith('/chat');
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnAuth = nextUrl.pathname.startsWith('/auth');
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      const isOnRegister = nextUrl.pathname.startsWith('/register');
      const isOnSetup = nextUrl.pathname.startsWith('/setup');
      const isOnApi = nextUrl.pathname.startsWith('/api');

      // Allow API routes to handle their own auth
      if (isOnApi) {
        return true;
      }

      // Allow setup, auth, login, and register pages
      if (isOnSetup || isOnAuth || isOnLogin || isOnRegister) {
        return true;
      }

      // Protect chat and admin routes
      if (isOnChat || isOnAdmin) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }

      return true;
    },
  },
};
