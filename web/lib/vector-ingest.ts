import type { Document } from '@langchain/core/documents';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import { loadAgentEnv } from './load-agent-env';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(
      `${name} is not set. Add it to agent/.env (see agent/.env.example).`,
    );
  }
  return value.trim();
}

/** Index PDF chunks in Supabase (bypasses LangGraph dev server for reliability). */
export async function ingestDocumentsToSupabase(
  docs: Document[],
  threadId: string,
): Promise<void> {
  loadAgentEnv();

  const supabaseUrl = requireEnv('SUPABASE_URL');
  const supabaseKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  requireEnv('OPENAI_API_KEY');

  const taggedDocs = docs.map((doc) => ({
    ...doc,
    metadata: {
      ...doc.metadata,
      thread_id: threadId,
    },
  }));

  const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-small',
  });

  const supabaseClient = createClient(supabaseUrl, supabaseKey);
  const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabaseClient,
    tableName: 'documents',
    queryName: 'match_documents',
  });

  await vectorStore.addDocuments(taggedDocs);
}
