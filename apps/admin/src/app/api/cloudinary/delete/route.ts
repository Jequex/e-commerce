import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to delete images from Cloudinary
 * Requires server-side authentication with API key and secret
 */
export async function POST(request: NextRequest) {
  try {
    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { error: 'publicId is required' },
        { status: 400 }
      );
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Missing Cloudinary credentials');
      return NextResponse.json(
        { error: 'Cloudinary credentials not configured' },
        { status: 500 }
      );
    }

    // Generate signature for authenticated request
    const timestamp = Math.round(new Date().getTime() / 1000);
    const crypto = await import('crypto');
    
    const signature = crypto
      .createHash('sha1')
      .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    // Create form data for deletion request
    const formData = new URLSearchParams();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    // Call Cloudinary API
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    const data = await response.json();

    if (data.result === 'ok' || data.result === 'not found') {
      return NextResponse.json({ 
        success: true, 
        result: data.result,
        message: data.result === 'ok' ? 'Image deleted successfully' : 'Image not found (already deleted)'
      });
    }

    return NextResponse.json(
      { error: 'Failed to delete image', details: data },
      { status: 500 }
    );
  } catch (error) {
    console.error('Cloudinary delete API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
