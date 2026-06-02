import { Client } from '@langchain/langgraph-sdk';
import dotenv from 'dotenv';

dotenv.config();

const assistant_id = 'document_qa';

async function runDemo() {
  const client = new Client({
    apiUrl: process.env.LANGGRAPH_API_URL || 'http://localhost:2024',
  });

  console.log('Creating new thread...');
  const thread = await client.threads.create({
    metadata: { demo: 'document-qa' },
  });
  console.log('Thread created with ID:', thread.thread_id);

  const question = 'What is this document about?';
  console.log('\n=== Streaming Example ===');
  console.log('Question:', question);

  try {
    const stream = await client.runs.stream(thread.thread_id, assistant_id, {
      input: { query: question },
      streamMode: ['values', 'messages', 'updates'],
    });

    for await (const chunk of stream) {
      if (chunk.event === 'updates') {
        console.log('Update data:', JSON.stringify(chunk.data, null, 2));
      }
    }
    console.log('\nStream completed.');
  } catch (error) {
    console.error('Error in streaming run:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
  }
}

runDemo().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
