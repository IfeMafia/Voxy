import { NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';
import { getDb } from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function POST(req) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { transcript, business_id } = await req.json();

    if (!transcript) {
      return NextResponse.json({ success: false, message: "No transcript provided" }, { status: 400 });
    }

    // 1. Process with Gemini
    const model = getGeminiModel();
    const prompt = `Process the following voice transcript for a customer assistant: "${transcript}"`;
    const aiResponse = "This is a placeholder Gemini response to: " + transcript;

    // 2. Log to Supabase Database
    const supabase = await getDb();
    const { data: conversation, error: dbError } = await supabase
      .from('conversations')
      .insert({
        business_id: business_id || null,
        user_message: transcript,
        ai_response: aiResponse,
        language: 'en'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to log conversation:', dbError);
    }

    return NextResponse.json({ 
      success: true, 
      aiResponse,
      conversation_id: conversation?.id,
      action: "NFI" 
    });

  } catch (error) {
    console.error('Assistant Voice API Error:', error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

