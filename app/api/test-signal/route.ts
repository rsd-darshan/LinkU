import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Test signal received:', body);
    
    return Response.json({ 
      success: true, 
      message: 'Test signal received',
      data: body 
    });
  } catch (error) {
    console.error('Test signal error:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ 
    message: 'Test signal endpoint is working',
    timestamp: new Date().toISOString()
  });
}
