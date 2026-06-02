import { Client } from '@langchain/langgraph-sdk';
import { AgentClientBase } from './agent-client-base';

let clientInstance: AgentClientBase | null = null;

export const createBrowserClient = () => {
  if (clientInstance) {
    return clientInstance;
  }

  const apiUrl = process.env.NEXT_PUBLIC_LANGGRAPH_API_URL;
  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_LANGGRAPH_API_URL is not set');
  }

  const client = new Client({ apiUrl });
  clientInstance = new AgentClientBase(client);
  return clientInstance;
};

/** Lazy browser client — avoids throwing during SSR module init. */
export const getBrowserAgentClient = () => createBrowserClient();
