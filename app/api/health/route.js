import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/db';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getAdminDb();
    const storageClient = createAdminClient();

    // 1. Check DB Connection by fetching table count or basic select
    const { data: tables, error: dbError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (dbError) throw new Error(`Database Error: ${dbError.message}`);

    // 2. Check Storage Buckets
    const { data: buckets, error: storageError } = await storageClient
      .storage
      .listBuckets();

    if (storageError) throw new Error(`Storage Error: ${storageError.message}`);

    const bucketNames = buckets.map(b => b.id);
    const requiredBuckets = ['avatars', 'conversations', 'documents'];
    const missingBuckets = requiredBuckets.filter(name => !bucketNames.includes(name));

    return NextResponse.json({
      success: true,
      message: "Successfully connected to Supabase",
      testId: "SUPABASE_VERIFIED_777",
      dbStatus: "Connected",
      storageStatus: missingBuckets.length === 0 ? "All buckets ready" : `Missing buckets: ${missingBuckets.join(', ')}`,
      foundBuckets: bucketNames,
      connectionVerifiedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return NextResponse.json({
      success: false,
      message: "Supabase connection failed",
      error: error.message
    }, { status: 500 });
  }
}

