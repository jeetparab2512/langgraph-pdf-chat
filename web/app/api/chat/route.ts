import { qaStreamConfig } from '@/constants/agent-settings';
import { createServerClient } from '@/lib/agent-server-client';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { message, threadId } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }

    const assistantId = process.env.LANGGRAPH_RETRIEVAL_ASSISTANT_ID;
    if (!assistantId) {
      return NextResponse.json(
        { error: 'LANGGRAPH_RETRIEVAL_ASSISTANT_ID is not set' },
        { status: 500 },
      );
    }

    const serverClient = createServerClient();
    const stream = await serverClient.client.runs.stream(
      threadId,
      assistantId,
      {
        input: { query: message },
        streamMode: ['messages', 'updates'],
        config: { configurable: { ...qaStreamConfig } },
      },
    );

    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
            );
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: 'Streaming error occurred' })}\n\n`,
            ),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
