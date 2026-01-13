import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    // Also skip NextAuth routes so middleware doesn't refresh session cookies on signout/session endpoints.
    '/((?!api/auth|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
