// lib/email.ts - Email service for welcome messages
import nodemailer from 'nodemailer';

interface WelcomeEmailData {
  email: string;
  firstName: string;
  lastName: string;
  membershipNumber: string;
}

// Create transporter (configure based on your email provider)
const createTransporter = () => {
  // Validate required environment variables
  const requiredEnvVars = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_SECURE',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'EMAIL_FROM'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required email environment variables:', missingVars);
    console.error('📋 Current env status:', {
      NODE_ENV: process.env.NODE_ENV,
      SMTP_HOST: process.env.SMTP_HOST ? 'SET' : 'MISSING',
      SMTP_PORT: process.env.SMTP_PORT ? 'SET' : 'MISSING',
      SMTP_SECURE: process.env.SMTP_SECURE ? 'SET' : 'MISSING',
      SMTP_USER: process.env.SMTP_USER ? 'SET' : 'MISSING',
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? 'SET' : 'MISSING',
      EMAIL_FROM: process.env.EMAIL_FROM ? 'SET' : 'MISSING',
    });
    throw new Error(`Missing email environment variables: ${missingVars.join(', ')}`);
  }

  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    debug: process.env.NODE_ENV === 'development', // Enable debug in development
    logger: process.env.NODE_ENV === 'development', // Enable logger in development
  };

  console.log('📧 Creating SMTP transporter with config:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user,
    hasPassword: !!config.auth.pass,
  });

  return nodemailer.createTransport(config);
};

// Welcome email template
const getWelcomeEmailHTML = (data: WelcomeEmailData) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to NativesForum</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: white;
          border: 2px solid #000;
        }
        .header {
          background-color: #000;
          color: white;
          padding: 30px;
          text-align: center;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
        }
        .content {
          padding: 30px;
        }
        .membership-card {
          background-color: #cdf556;
          border: 1px solid #000;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .membership-number {
          font-size: 28px;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          color: #000;
          letter-spacing: 2px;
          margin: 10px 0;
        }
        .highlight {
          color: #ea580c;
          font-weight: bold;
        }
        .button {
          display: inline-block;
          background-color: #ea580c;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          margin: 20px 0;
          border: none;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 14px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo"><img src="${process.env.FRONTEND_URL}/logo2.png" alt="NativesForum Logo" width="100" height="25" /></div>
          <h1>Welcome to the Movement!</h1>
        </div>
        
        <div class="content">
          <h2>Molo, ${data.firstName}!</h2>
          
          <p>Welcome to <strong>NativesForum</strong> - the platform dedicated to uniting South African natives around key socio-economic initiatives that will drive our collective empowerment.</p>
          
          <div class="membership-card">
            <h3 style="margin-top: 0; color: #000;">Your Membership Details</h3>
            <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
            <p><strong>Membership Number:</strong></p>
            <div class="membership-number">${data.membershipNumber}</div>
            <p style="font-size: 14px; color: #666; margin-bottom: 0;">
              Keep this number safe - you'll need it for verification and accessing member benefits
            </p>
          </div>
          
          <h3>What's Next?</h3>
          <ul>
            <li><strong>Explore Our Four Pillars:</strong> Learn about our strategic initiatives for economic empowerment</li>
            <li><strong>Join Active Discussions:</strong> Participate in polls, comment on proposals, and shape our collective future</li>
            <li><strong>Support Initiatives:</strong> Vote on and pledge support to key projects like our Commercial Bank</li>
            <li><strong>Build Consensus:</strong> Help us reach agreement on the policies that will transform our communities</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/initiatives" class="button">
              Explore Our Initiatives
            </a>
          </div>
          
          <h3>Our Mission</h3>
          <p>For too long, we've operated as individuals in an economy designed to extract wealth from our communities. <span class="highlight">Every rand we spend should circulate amongst ourselves.</span> This is the cornerstone of our native-centric socio-economic movement.</p>
          
          <p>Through our four strategic pillars - Commercial Bank, Informal Economy, Food Value Chain, and Industrial Development - we're building the foundation for true economic independence.</p>
          
          <p>Your voice matters. Your participation shapes our collective future. Together, we can create the change our communities deserve.</p>
          
          <p style="font-weight: bold;">Realeboga for joining us on this journey!</p>
        </div>
        
        <div class="footer">
          <p>
            <strong>NativesForum</strong><br>
            Building consensus for native empowerment<br>
            <a href="${process.env.FRONTEND_URL}">nativesforum.org</a>
          </p>
          <p style="font-size: 12px; margin-top: 20px;">
            This email was sent to ${data.email}. If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Plain text version for email clients that don't support HTML
const getWelcomeEmailText = (data: WelcomeEmailData) => {
  return `
Welcome to NativesForum, ${data.firstName}!

Your membership has been successfully created.

MEMBERSHIP DETAILS:
Name: ${data.firstName} ${data.lastName}
Membership Number: ${data.membershipNumber}

Keep this membership number safe - you'll need it for verification and accessing member benefits.

WHAT'S NEXT:
- Explore Our Four Pillars: Learn about our strategic initiatives for economic empowerment
- Join Active Discussions: Participate in polls, comment on proposals, and shape our collective future
- Support Initiatives: Vote on and pledge support to key projects like our Commercial Bank
- Build Consensus: Help us reach agreement on policies that will transform our communities

Visit: ${process.env.FRONTEND_URL}/initiatives

OUR MISSION:
For too long, we've operated as individuals in an economy designed to extract wealth from our communities. Every rand we spend should circulate amongst ourselves. This is the cornerstone of our native-centric socio-economic movement.

Through our four strategic pillars - Commercial Bank, Informal Economy, Food Value Chain, and Industrial Development - we're building the foundation for true economic independence.

Your voice matters. Your participation shapes our collective future. Together, we can create the change our communities deserve.

Realeboga for joining us on this journey!

---
Natives Forum
Building consensus for native empowerment
${process.env.FRONTEND_URL}

This email was sent to ${data.email}.
  `.trim();
};

// Send welcome email
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  try {
    console.log('🚀 Starting welcome email send process for:', data.email);

    const transporter = createTransporter();

    const mailOptions = {
      from: `"NativesForum" <${process.env.EMAIL_FROM}>`,
      to: data.email,
      subject: `Welcome to NativesForum - Membership #${data.membershipNumber}`,
      text: getWelcomeEmailText(data),
      html: getWelcomeEmailHTML(data),
    };

    console.log('📧 Mail options configured:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasText: !!mailOptions.text,
      hasHtml: !!mailOptions.html,
    });

    // Verify SMTP connection before sending
    console.log('🔗 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');

    console.log('📤 Sending email...');
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully to:', data.email);
    console.log('📧 Message ID:', result.messageId);
    console.log('📨 Response:', result.response);

    return true;
  } catch (error) {
    console.error('❌ Error sending welcome email to:', data.email);
    console.error('❌ Error details:', error);

    // Log specific error information
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
    }

    // Log additional SMTP error details if available
    const smtpError = error as any;
    if (smtpError.code) {
      console.error('❌ SMTP Error code:', smtpError.code);
    }
    if (smtpError.response) {
      console.error('❌ SMTP Response:', smtpError.response);
    }
    if (smtpError.responseCode) {
      console.error('❌ SMTP Response code:', smtpError.responseCode);
    }

    return false;
  }
}

// Send membership number reminder email
export async function sendMembershipReminderEmail(data: WelcomeEmailData): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"NativesForum" <${process.env.EMAIL_FROM}>`,
      to: data.email,
      subject: `Your NativesForum Membership Number`,
      text: `
Hi ${data.firstName},

Your NativesForum membership number is: ${data.membershipNumber}

Please keep this number safe as you'll need it for account verification and accessing member benefits.

Best regards,
NativesForum Team
      `.trim(),
      html: `
        <p>Hi ${data.firstName},</p>
        <p>Your Natives Forum membership number is: <strong style="font-family: 'Courier New', monospace; font-size: 18px;">${data.membershipNumber}</strong></p>
        <p>Please keep this number safe as you'll need it for account verification and accessing member benefits.</p>
        <p>Best regards,<br>NativesForum Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending membership reminder email:', error);
    return false;
  }
}