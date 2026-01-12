import NextAuth from "next-auth";
import { ZodError } from "zod";
import Credentials from "next-auth/providers/credentials";
import { signInSchema } from "@/app/lib/zod";
import { verifyPassword } from "@/app/utils/password";
import { db } from '@/app/db';
import { users } from '@/app/db/schema';
import Feishu from "@/app/auth/providers/feishu";
import Wecom from "@/app/auth/providers/wecom";
import Dingding from "@/app/auth/providers/dingding";
import { eq } from 'drizzle-orm';

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
export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    ...authProviders,
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        try {
          const { email, password } = await signInSchema.parseAsync(credentials);
          const user = await db.query.users
            .findFirst({
              where: eq(users.email, email)
            })
          if (!user || !user.password) {
            return null;
          }
          // 检查用户是否已被审核通过（管理员自动通过）
          if (!user.isApproved && !user.isAdmin) {
            throw new Error('账号正在审核中，请等待管理员审核');
          }
          const passwordMatch = await verifyPassword(password, user.password);
          if (passwordMatch) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              isAdmin: user.isAdmin || false,
              isApproved: user.isApproved || false,
            };
          } else {
            return null;
          }
        } catch (error) {
          if (error instanceof ZodError) {
            return null;
          }
          throw error;
        }
      },
    }),
  ],
  pages: {
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.isApproved = user.isApproved;
      }
      // 每次验证时重新检查用户审核状态
      if (token.id) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, String(token.id))
        });
        if (dbUser) {
          token.isApproved = dbUser.isApproved || dbUser.isAdmin || false;
        }
      }
      if (account?.provider === "credentials" && token.sub) {
        token.provider = 'credentials';
      }
      if (account?.provider === "feishu" && token.sub) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.feishuUserId, account.providerAccountId)
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.isAdmin = dbUser.isAdmin || false;
        }
        token.provider = 'feishu';
      }
      if (account?.provider === "wecom" && token.sub) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.wecomUserId, account.providerAccountId)
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.isAdmin = dbUser.isAdmin || false;
        }
        token.provider = 'wecom';
      }
      if (account?.provider === "dingding" && token.sub) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.dingdingUnionId, account.providerAccountId)
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.isAdmin = dbUser.isAdmin || false;
        }
        token.provider = 'dingding';
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: String(token.id),
          isAdmin: Boolean(token.isAdmin),
          isApproved: Boolean(token.isApproved),
          provider: token.provider as string,
        };
      }
      return session;
    },
  },
})