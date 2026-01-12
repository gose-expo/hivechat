import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Feishu from "@/app/auth/providers/feishu";
import Wecom from "@/app/auth/providers/wecom";
import Dingding from "@/app/auth/providers/dingding";

let authProviders: any[] = [];
if (process.env.FEISHU_AUTH_STATUS === 'ON') {
  const feishuAuth = Feishu({
    clientId: process.env.FEISHU_CLIENT_ID!,
    clientSecret: process.env.FEISHU_CLIENT_SECRET!,
  });
  authProviders.push(feishuAuth);
}
if (process.env.WECOM_AUTH_STATUS === 'ON') {
  const wecomAuth = Wecom({
    clientId: process.env.WECOM_CLIENT_ID!,
    clientSecret: process.env.WECOM_CLIENT_SECRET!,
  });
  authProviders.push(wecomAuth);
}
if (process.env.DINGDING_AUTH_STATUS === 'ON') {
  const dingdingAuth = Dingding({
    clientId: process.env.DINGDING_CLIENT_ID!,
    clientSecret: process.env.DINGDING_CLIENT_SECRET!,
  });
  authProviders.push(dingdingAuth);
}

export const authConfig: NextAuthConfig = {
  providers: [
    ...authProviders,
    // Credentials provider without authorize function for Edge compatibility
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
    }),
  ],
  pages: {
    error: '/auth/error',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnChat = nextUrl.pathname.startsWith('/chat');
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnAuth = nextUrl.pathname.startsWith('/auth');
      const isOnSetup = nextUrl.pathname.startsWith('/setup');
      const isOnApi = nextUrl.pathname.startsWith('/api');

      // Allow API routes to handle their own auth
      if (isOnApi) {
        return true;
      }

      // Allow setup and auth pages
      if (isOnSetup || isOnAuth) {
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
