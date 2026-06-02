import { AgentConfiguration, IndexConfiguration } from '@/types/agent-types';

export const qaStreamConfig: AgentConfiguration = {
  queryModel: 'openai/gpt-4o-mini',
  retrieverProvider: 'supabase',
  k: 5,
};

export const ingestConfig: IndexConfiguration = {
  useSampleDocs: false,
  retrieverProvider: 'supabase',
};
