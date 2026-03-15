import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = getUserFromRequest(req);
    // In a real app, you might want to protect this route
    // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Placeholder Logic: Fetch businesses for the user or all businesses
    // const results = await query('SELECT * FROM businesses');
    
    const businesses = [
      { id: 1, name: "Voxy AI Solutions", sector: "Tech" },
      { id: 2, name: "VoiceConnect", sector: "Communication" }
    ];

    return NextResponse.json({ success: true, data: businesses });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, sector } = body;

    // Placeholder Logic: Insert into DB
    // const result = await query('INSERT INTO businesses (name, sector) VALUES ($1, $2) RETURNING *', [name, sector]);

    return NextResponse.json({ 
      success: true, 
      message: "Business created", 
      data: { id: Date.now(), name, sector } 
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
