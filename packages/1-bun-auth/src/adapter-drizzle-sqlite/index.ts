import { and, eq, lte } from "drizzle-orm";
import type { Adapter } from "../define-auth";
import { accounts, sessions, users } from "./schema";
import type { UserInfoResponse } from "oauth4webapi";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

export type User = {
  id: string;
  name: string | null;
  email: string | null;
  picture: string | null;
};

export type Session = {
  user: User;
  expiresAt: number;
};

export class DrizzleSqliteAdapter implements Adapter<Session> {
  constructor(private db: BunSQLiteDatabase<any>) {}

  async getUserIdByProviderId(provider: string, providerAccountId: string) {
    const [account] = await this.db
      .select({ userId: accounts.userId })
      .from(accounts)
      .where(
        and(
          eq(accounts.provider, provider),
          eq(accounts.providerAccountId, providerAccountId)
        )
      );

    return account?.userId ?? null;
  }

  async createAccount(provider: string, userInfo: UserInfoResponse) {
    const { name, email, picture, sub, ...accountInfo } = userInfo;
    const [user] = await this.db
      .insert(users)
      .values({
        email: email,
        name: name,
        picture: picture,
      })
      .returning({
        id: users.id,
      });

    if (!user) {
      throw new Error("Failed to create user");
    }

    await this.db.insert(accounts).values({
      userId: user.id,
      provider,
      providerAccountId: sub,
      info: accountInfo,
    });

    return { userId: user.id };
  }

  async createSession(userId: string) {
    const expiresAt = Date.now() + 60 * 60 * 24 * 30; // 30 days in seconds
    const [session] = await this.db
      .insert(sessions)
      .values({
        userId,
        expiresAt,
      })
      .returning({
        id: sessions.id,
      });

    if (!session) {
      throw new Error("Failed to create session");
    }

    return session.id;
  }

  async getSession(sessionId: string) {
    const [session] = await this.db
      .select({
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          picture: users.picture,
        },
        expiresAt: sessions.expiresAt,
      })
      .from(users)
      .innerJoin(sessions, eq(users.id, sessions.userId))
      .where(eq(sessions.id, sessionId));

    if (!session) {
      return null;
    }

    if (session.expiresAt <= Date.now()) {
      await this.db.delete(sessions).where(lte(sessions.expiresAt, Date.now()));
      return null;
    }

    return session;
  }
}
