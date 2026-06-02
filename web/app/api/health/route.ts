import { NextResponse } from 'next/server';

export async function GET() {
  const agentUrl = process.env.NEXT_PUBLIC_LANGGRAPH_API_URL;
  const checks: Record<string, { ok: boolean; detail?: string }> = {
    web: { ok: true },
    env: {
      ok: Boolean(agentUrl),
      detail: agentUrl ? undefined : 'NEXT_PUBLIC_LANGGRAPH_API_URL is not set',
    },
  };

  if (agentUrl) {
    try {
      const response = await fetch(`${agentUrl.replace(/\/$/, '')}/info`, {
        signal: AbortSignal.timeout(5000),
      });
      checks.agent = {
        ok: response.ok,
        detail: response.ok ? undefined : `Agent returned ${response.status}`,
      };
    } catch (error) {
      checks.agent = {
        ok: false,
        detail:
          error instanceof Error ? error.message : 'Agent unreachable',
      };
    }
  } else {
    checks.agent = { ok: false, detail: 'Agent URL not configured' };
  }

  const healthy = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    { status: healthy ? 'ok' : 'degraded', checks },
    { status: healthy ? 200 : 503 },
  );
}
