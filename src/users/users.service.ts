import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AgentSourceSchema,
  MeSummary,
  ProfileRanks,
  ProfileResponse,
  tierFor,
} from '@tokenaires/contracts';
import { toPublicUser } from '../auth/auth.service';
import { BoardsRepository } from '../boards/boards.repository';
import { UsageRepository } from '../usage/usage.repository';
import { currentStreak } from './streak';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly users: UsersRepository,
    private readonly boards: BoardsRepository,
    private readonly usage: UsageRepository,
  ) {}

  async profile(handle: string): Promise<ProfileResponse> {
    const user = await this.users.findVisibleByHandle(handle);
    if (!user)
      throw new NotFoundException('No one with that handle is on the list yet');
    const [totals, bySource, byModel, daily, ranks] = await Promise.all([
      this.users.totals(user.id),
      this.users.bySource(user.id),
      this.users.byModel(user.id),
      this.users.daily(user.id),
      this.ranks(user.id),
    ]);
    const total = Number(totals.total);
    return {
      user: toPublicUser(user),
      joinedAt: user.createdAt.toISOString(),
      lastSyncedAt: user.lastSyncedAt?.toISOString() ?? null,
      tier: tierFor(total),
      status: user.status,
      totals: {
        input: Number(totals.input),
        output: Number(totals.output),
        cacheRead: Number(totals.cacheRead),
        cacheWrite: Number(totals.cacheWrite),
        reasoning: Number(totals.reasoning),
        total,
      },
      ranks,
      bySource: bySource.flatMap((row) => {
        const source = AgentSourceSchema.safeParse(row.source);
        return source.success
          ? [{ source: source.data, tokens: Number(row.tokens) }]
          : [];
      }),
      byModel: byModel.map((row) => ({
        model: row.model,
        tokens: Number(row.tokens),
      })),
      daily: daily.map((row) => ({ day: row.day, tokens: Number(row.tokens) })),
      streakDays: currentStreak(
        daily.map((row) => row.day),
        new Date(),
      ),
      activeDays: Number(totals.activeDays),
    };
  }

  async me(userId: string): Promise<MeSummary> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException();
    const [totals, ranks, cursors] = await Promise.all([
      this.users.totals(userId),
      this.ranks(userId),
      this.usage.cursors(userId),
    ]);
    const totalTokens = Number(totals.total);
    return {
      user: toPublicUser(user),
      tier: tierFor(totalTokens),
      status: user.status,
      totalTokens,
      ranks,
      cursors: cursors.map((cursor) => ({
        source: cursor.source,
        lastOccurredAt: cursor.lastOccurredAt?.toISOString() ?? null,
      })),
    };
  }

  private async ranks(userId: string): Promise<ProfileRanks> {
    const [all, month, week] = await Promise.all([
      this.boards.rankOf(userId, 'all'),
      this.boards.rankOf(userId, 'month'),
      this.boards.rankOf(userId, 'week'),
    ]);
    return { all, month, week };
  }
}
