// app/api/debug/email-config/route.ts - Debug endpoint for email configuration
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Only allow in development or with a debug key
  const debugKey = request.nextUrl.searchParams.get('key');
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev && debugKey !== 'debug123') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    const config = {
      nodeEnv: process.env.NODE_ENV,
      smtpHost: process.env.SMTP_HOST ? 'SET' : 'MISSING',
      smtpPort: process.env.SMTP_PORT ? 'SET' : 'MISSING',
      smtpSecure: process.env.SMTP_SECURE ? 'SET' : 'MISSING',
      smtpUser: process.env.SMTP_USER ? 'SET' : 'MISSING',
      smtpPassword: process.env.SMTP_PASSWORD ? 'SET' : 'MISSING',
      emailFrom: process.env.EMAIL_FROM ? 'SET' : 'MISSING',
      frontendUrl: process.env.FRONTEND_URL ? 'SET' : 'MISSING',
      // Show actual values only in development
      ...(isDev && {
        actualValues: {
          smtpHost: process.env.SMTP_HOST,
          smtpPort: process.env.SMTP_PORT,
          smtpSecure: process.env.SMTP_SECURE,
          smtpUser: process.env.SMTP_USER,
          emailFrom: process.env.EMAIL_FROM,
          frontendUrl: process.env.FRONTEND_URL,
        }
      })
    };

    return NextResponse.json({
      message: 'Email configuration debug info',
      config
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}