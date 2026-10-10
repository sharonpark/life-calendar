import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  pages: { signIn: "/login" },
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.AUTH_EMAIL_FROM,
      // This is an invite-only app — sign-in is not sign-up. Only send a
      // magic link if the email already belongs to a User created via the
      // invite flow (src/app/(auth)/invite/[token]). Anyone else's request
      // is silently dropped so the app can't be used to enumerate members.
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (!existingUser) return;

        const { Resend: ResendClient } = await import("resend");
        const resend = new ResendClient(provider.apiKey as string);
        await resend.emails.send({
          from: provider.from as string,
          to: email,
          subject: "Sign in to Life Calendar",
          html: `<p><a href="${url}">Sign in to Life Calendar</a></p><p>This link expires shortly and can only be used once.</p>`,
        });
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.isOwner = (user as { isOwner?: boolean }).isOwner ?? false;
      }
      return session;
    },
  },
});
