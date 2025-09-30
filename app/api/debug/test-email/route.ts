// app/api/debug/test-email/route.ts - Test email sending functionality
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  // Only allow in development or with a debug key
  const body = await request.json();
  const debugKey = body.debugKey;
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev && debugKey !== 'debug123') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const testEmail = body.email || 'test@example.com';

  try {
    console.log('🔍 Starting email test...');

    // Check environment variables
    const envCheck = {
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_PORT: !!process.env.SMTP_PORT,
      SMTP_SECURE: !!process.env.SMTP_SECURE,
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
      EMAIL_FROM: !!process.env.EMAIL_FROM,
    };

    console.log('📧 Environment variables check:', envCheck);

    // Create transporter with detailed logging
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      debug: true, // Enable debug logging
      logger: true, // Enable logger
    });

    console.log('🔧 Transporter created');

    // Verify SMTP connection
    console.log('🔗 Verifying SMTP connection...');
    const verified = await transporter.verify();
    console.log('✅ SMTP connection verified:', verified);

    // Send test email
    const mailOptions = {
      from: `"NativesForum Test" <${process.env.EMAIL_FROM}>`,
      to: testEmail,
      subject: 'Test Email from NativesForum',
      text: 'This is a test email to verify email functionality.',
      html: '<p>This is a test email to verify email functionality.</p>',
    };

    console.log('📤 Sending test email to:', testEmail);
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      envCheck,
      messageId: result.messageId,
      smtpVerified: true
    });

  } catch (error) {
    console.error('❌ Email test error:', error);

    // Get more detailed error information
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      command: (error as any)?.command,
      response: (error as any)?.response,
      responseCode: (error as any)?.responseCode,
    };

    return NextResponse.json({
      success: false,
      error: 'Email test failed',
      details: errorDetails,
      envCheck: {
        SMTP_HOST: !!process.env.SMTP_HOST,
        SMTP_PORT: !!process.env.SMTP_PORT,
        SMTP_SECURE: !!process.env.SMTP_SECURE,
        SMTP_USER: !!process.env.SMTP_USER,
        SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
        EMAIL_FROM: !!process.env.EMAIL_FROM,
      }
    }, { status: 500 });
  }
}