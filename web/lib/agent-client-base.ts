import { Client, Thread, ThreadState } from '@langchain/langgraph-sdk';

export class AgentClientBase {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async createThread(metadata?: Record<string, unknown>) {
    return this.client.threads.create({ metadata });
  }

  async getThread(threadId: string): Promise<Thread> {
    return this.client.threads.get(threadId);
  }

  async searchThreads(params: {
    metadata?: Record<string, unknown>;
    limit?: number;
    offset?: number;
  }): Promise<Thread[]> {
    return this.client.threads.search({
      metadata: params.metadata,
      limit: params.limit || 10,
      offset: params.offset || 0,
    });
  }

  async getThreadState<T extends Record<string, unknown> = Record<string, unknown>>(
    threadId: string,
  ): Promise<ThreadState<T>> {
    return this.client.threads.getState(threadId);
  }

  async updateThreadState(
    threadId: string,
    values: Record<string, unknown>,
    asNode?: string,
  ) {
    return this.client.threads.updateState(threadId, {
      values,
      asNode,
    });
  }

  async deleteThread(threadId: string) {
    return this.client.threads.delete(threadId);
  }

  async getThreadHistory(threadId: string, limit = 10) {
    return this.client.threads.getHistory(threadId, { limit });
  }

  isThreadInterrupted(thread: Thread): boolean {
    return !!(thread.interrupts && Object.keys(thread.interrupts).length > 0);
  }

  getThreadInterrupts(thread: Thread): unknown[] | undefined {
    if (!thread.interrupts) return undefined;

    return Object.values(thread.interrupts).flatMap((interrupt) => {
      if (Array.isArray(interrupt[0])) {
        return interrupt[0][1]?.value;
      }
      return interrupt.map((i) => i.value);
    });
  }

  async resumeThread(
    threadId: string,
    assistantId: string,
    resumeValue: unknown,
    config?: {
      configurable?: Record<string, unknown>;
    },
  ) {
    return this.client.runs.stream(threadId, assistantId, {
      command: { resume: resumeValue },
      config: {
        configurable: config?.configurable,
      },
    });
  }
}
