import { NextRequest, NextResponse } from 'next/server';

const ALPHA_BACKEND_URL = process.env.ALPHA_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, horizon_years = 5 } = body;

    if (!symbol || typeof symbol !== 'string') {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Proxy request to the Alpha backend
    const response = await fetch(`${ALPHA_BACKEND_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symbol: symbol.trim().toUpperCase(),
        horizon_years: typeof horizon_years === 'number' ? horizon_years : 5,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to generate report';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage;
        
        // Check for common database/table errors
        if (errorMessage.includes('table') || errorMessage.includes('Table') || errorMessage.includes('no such table')) {
          errorMessage = `Database error: ${errorMessage}. Please ensure the backend database is initialized.`;
        }
      } catch (e) {
        // If response is not JSON, try to get text
        const text = await response.text().catch(() => '');
        if (text) {
          errorMessage = text.length > 200 ? text.substring(0, 200) + '...' : text;
        }
      }
      
      console.error('Backend error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      });
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    
    let errorMessage = 'Failed to generate report';
    if (error.message) {
      errorMessage = error.message;
    } else if (error.cause) {
      errorMessage = `Network error: ${error.cause.message || 'Could not connect to backend'}`;
    }
    
    // Check if it's a connection error
    if (errorMessage.includes('fetch failed') || errorMessage.includes('ECONNREFUSED')) {
      errorMessage = `Cannot connect to backend at ${ALPHA_BACKEND_URL}. Please ensure the backend is running on port 8000.`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

