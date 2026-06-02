import { Client } from '@langchain/langgraph-sdk';
import { AgentClientBase } from './agent-client-base';

let clientInstance: AgentClientBase | null = null;

export const createServerClient = () => {
  if (clientInstance) {
    return clientInstance;
  }

  const apiUrl = process.env.NEXT_PUBLIC_LANGGRAPH_API_URL;
  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_LANGGRAPH_API_URL is not set');
  }

  const apiKey = process.env.LANGCHAIN_API_KEY;
  const client = new Client({
    apiUrl,
    ...(apiKey
      ? {
          defaultHeaders: {
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey,
          },
        }
      : {}),
  });

  clientInstance = new AgentClientBase(client);
  return clientInstance;
};

/** Server-side LangGraph client (API routes). Lazily initialized on first use. */
export const getServerAgentClient = () => createServerClient();
