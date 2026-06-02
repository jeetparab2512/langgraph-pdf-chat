import {
  formatMaxFileSize,
  UPLOAD_LIMITS,
} from '@/constants/upload-limits';
import { processPDF } from '@/lib/pdf';
import { ingestDocumentsToSupabase } from '@/lib/vector-ingest';
import { Document } from '@langchain/core/documents';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files: File[] = [];

    for (const [key, value] of formData.entries()) {
      if (key === 'files' && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > UPLOAD_LIMITS.maxFiles) {
      return NextResponse.json(
        {
          error: `Too many files. Maximum ${UPLOAD_LIMITS.maxFiles} files allowed.`,
        },
        { status: 400 },
      );
    }

    const invalidFiles = files.filter(
      (file) =>
        !UPLOAD_LIMITS.allowedMimeTypes.includes(
          file.type as (typeof UPLOAD_LIMITS.allowedMimeTypes)[number],
        ) || file.size > UPLOAD_LIMITS.maxFileSizeBytes,
    );

    if (invalidFiles.length > 0) {
      return NextResponse.json(
        {
          error: `Only PDF files under ${formatMaxFileSize()} are allowed`,
          invalidFiles: invalidFiles.map((f) => f.name),
        },
        { status: 400 },
      );
    }

    const allDocs: Document[] = [];
    const failedFiles: string[] = [];

    for (const file of files) {
      try {
        const docs = await processPDF(file);
        allDocs.push(...docs);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        failedFiles.push(file.name);
      }
    }

    if (!allDocs.length) {
      return NextResponse.json(
        {
          error: 'No valid documents extracted from uploaded files',
          failedFiles,
        },
        { status: 500 },
      );
    }

    await ingestDocumentsToSupabase(allDocs);

    return NextResponse.json({
      message: 'Documents ingested successfully',
      documentCount: allDocs.length,
      fileCount: files.length,
      ...(failedFiles.length > 0 ? { failedFiles } : {}),
    });
  } catch (error) {
    console.error('Error processing files:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (
      message.includes('quota') ||
      message.includes('InsufficientQuota') ||
      message.includes('exceeded your current quota')
    ) {
      return NextResponse.json(
        {
          error: 'OpenAI quota exceeded',
          details:
            'Add billing/credits at https://platform.openai.com/account/billing then try again.',
        },
        { status: 500 },
      );
    }

    if (
      message.includes('Incorrect API key') ||
      message.includes('invalid_api_key') ||
      message.includes('OPENAI_API_KEY')
    ) {
      return NextResponse.json(
        {
          error: 'Invalid OpenAI API key',
          details:
            'Update OPENAI_API_KEY in agent/.env with a new key from https://platform.openai.com/api-keys (no quotes or spaces), then restart npm run dev:web.',
        },
        { status: 500 },
      );
    }

    const hint =
      message.includes('documents') || message.includes('match_documents')
        ? ' Run the Supabase SQL from the README (documents table + match_documents).'
        : '';

    return NextResponse.json(
      { error: 'Failed to process files', details: message + hint },
      { status: 500 },
    );
  }
}
