import { createServerClient } from '@/lib/agent-server-client';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const client = createServerClient();
    const thread = await client.createThread();
    return NextResponse.json({ threadId: thread.thread_id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'LangGraph agent is not reachable',
        details:
          'Start the agent with: npm run dev:agent (must be running on port 2024). ' +
          message,
      },
      { status: 503 },
    );
  }
}
