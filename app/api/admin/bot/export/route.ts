import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/db';
import { auth } from '@/auth';
import { eq, desc, or, ilike, and } from 'drizzle-orm';
import { bots } from '@/app/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'current' or 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '12');
    const searchQuery = searchParams.get('searchQuery') || undefined;

    let result;
    if (type === 'all') {
      result = await db.select()
        .from(bots)
        .where(eq(bots.creator, 'public'))
        .orderBy(desc(bots.createdAt));
    } else {
      const offset = (page - 1) * pageSize;

      if (searchQuery && searchQuery.trim()) {
        const searchCondition = or(
          ilike(bots.title, `%${searchQuery.trim()}%`),
          ilike(bots.desc, `%${searchQuery.trim()}%`)
        );
        result = await db.select()
          .from(bots)
          .where(searchCondition ? and(eq(bots.creator, 'public'), searchCondition) : eq(bots.creator, 'public'))
          .orderBy(desc(bots.createdAt))
          .limit(pageSize)
          .offset(offset);
      } else {
        result = await db.select()
          .from(bots)
          .where(eq(bots.creator, 'public'))
          .orderBy(desc(bots.createdAt))
          .limit(pageSize)
          .offset(offset);
      }
    }

    // Format data for export (remove unnecessary fields)
    const exportData = result.map(bot => ({
      title: bot.title,
      desc: bot.desc,
      prompt: bot.prompt,
      avatar: bot.avatar,
      avatarType: bot.avatarType
    }));

    const response = NextResponse.json({
      data: exportData,
      exportedAt: new Date().toISOString(),
      count: exportData.length
    });

    // Set filename for download
    const filename = type === 'all' ? 'all-bots.json' : `bots-page-${page}.json`;
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return response;
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
