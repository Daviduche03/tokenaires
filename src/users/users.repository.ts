import { Injectable } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import { PROFILE_DAILY_DAYS, PROFILE_TOP_MODELS } from '../config/constants';
import { DatabaseService } from '../database/database.service';
import { dailyUsage, users, UserRow } from '../database/schema';

const sumOf = (column: typeof dailyUsage.totalTokens) =>
  sql<string>`coalesce(sum(${column}), 0)`;

@Injectable()
export class UsersRepository {
  constructor(private readonly database: DatabaseService) {}

  async findVisibleByHandle(handle: string): Promise<UserRow | undefined> {
    const [row] = await this.database.db
      .select()
      .from(users)
      .where(
        sql`lower(${users.handle}) = lower(${handle}) and ${users.hidden} = false`,
      )
      .limit(1);
    return row;
  }

  async findById(id: string): Promise<UserRow | undefined> {
    const [row] = await this.database.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return row;
  }

  async totals(userId: string) {
    const [row] = await this.database.db
      .select({
        input: sumOf(dailyUsage.inputTokens),
        output: sumOf(dailyUsage.outputTokens),
        cacheRead: sumOf(dailyUsage.cacheReadTokens),
        cacheWrite: sumOf(dailyUsage.cacheWriteTokens),
        reasoning: sumOf(dailyUsage.reasoningTokens),
        total: sumOf(dailyUsage.totalTokens),
        activeDays: sql<string>`count(distinct ${dailyUsage.day})`,
      })
      .from(dailyUsage)
      .where(eq(dailyUsage.userId, userId));
    return row;
  }

  async bySource(userId: string) {
    const total = sumOf(dailyUsage.totalTokens);
    return this.database.db
      .select({ source: dailyUsage.source, tokens: total })
      .from(dailyUsage)
      .where(eq(dailyUsage.userId, userId))
      .groupBy(dailyUsage.source)
      .orderBy(desc(total));
  }

  async byModel(userId: string) {
    const total = sumOf(dailyUsage.totalTokens);
    return this.database.db
      .select({ model: dailyUsage.model, tokens: total })
      .from(dailyUsage)
      .where(eq(dailyUsage.userId, userId))
      .groupBy(dailyUsage.model)
      .orderBy(desc(total))
      .limit(PROFILE_TOP_MODELS);
  }

  async daily(userId: string) {
    const total = sumOf(dailyUsage.totalTokens);
    return this.database.db
      .select({ day: dailyUsage.day, tokens: total })
      .from(dailyUsage)
      .where(
        sql`${dailyUsage.userId} = ${userId} and ${dailyUsage.day} > current_date - ${PROFILE_DAILY_DAYS}::int`,
      )
      .groupBy(dailyUsage.day)
      .orderBy(dailyUsage.day);
  }
}
