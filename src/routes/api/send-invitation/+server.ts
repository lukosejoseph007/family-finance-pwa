import { json } from '@sveltejs/kit';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// Initialize Resend only if API key is available
let resend: Resend | null = null;
if (env.PRIVATE_RESEND_API_KEY && env.PRIVATE_RESEND_API_KEY !== 're_demo_key_placeholder') {
	resend = new Resend(env.PRIVATE_RESEND_API_KEY);
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		console.log('🚀 Email API called');
		console.log('🔑 API Key available:', !!env.PRIVATE_RESEND_API_KEY);
		console.log('🔑 API Key value:', env.PRIVATE_RESEND_API_KEY?.substring(0, 10) + '...');
		
		const { familyName, inviteCode, recipientEmail, senderName, appUrl } = await request.json();

		console.log('📧 Sending invitation email:', { familyName, inviteCode, recipientEmail, senderName });

		// Check if Resend is configured
		if (!resend) {
			console.log('⚠️ Resend not configured - providing development fallback');
			console.log('📧 Email content (development mode - not actually sent):');
			console.log(`To: ${recipientEmail}`);
			console.log(`Subject: Join "${familyName}" on Family Finance`);
			console.log(`Invite Code: ${inviteCode}`);
			console.log(`From: ${senderName}`);
			console.log('📝 To enable real email sending:');
			console.log('1. Sign up at https://resend.com');
			console.log('2. Get your API key');
			console.log('3. Set PRIVATE_RESEND_API_KEY in your .env file');
			
			return json({
				success: true,
				messageId: 'dev-mode-placeholder',
				message: 'Email sent (development mode - check console for details)'
			});
		}

		// Create professional HTML email template
		const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Join ${familyName} on Family Finance</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .invite-code { background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
        .invite-code-text { font-size: 24px; font-weight: bold; color: #1e293b; letter-spacing: 2px; font-family: monospace; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
        .steps { background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .steps h3 { margin-top: 0; color: #475569; }
        .steps ol { margin: 10px 0; padding-left: 20px; }
        .steps li { margin: 8px 0; }
        .footer { text-align: center; padding: 20px; font-size: 14px; color: #64748b; background-color: #f8fafc; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>You're Invited!</h1>
            <p>Join ${familyName} on Family Finance</p>
        </div>
        
        <div class="content">
            <p>Hi there!</p>
            
            <p><strong>${senderName}</strong> has invited you to join their family "<strong>${familyName}</strong>" on Family Finance - a secure platform for managing family finances together.</p>
            
            <div class="invite-code">
                <p style="margin: 0; font-size: 14px; color: #64748b; margin-bottom: 10px;">Your Invite Code:</p>
                <div class="invite-code-text">${inviteCode}</div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}/signup?invite=${inviteCode}" class="button">Join Family →</a>
                <a href="${appUrl}/login" class="button" style="background: #6b7280;">Already Have Account →</a>
            </div>
            
            <div class="steps">
                <h3>How to Join:</h3>
                <ol>
                    <li><strong>New User:</strong> Click "Join Family" above and create your account</li>
                    <li><strong>Existing User:</strong> Log in and enter invite code: <strong>${inviteCode}</strong></li>
                    <li><strong>Manual Entry:</strong> Visit ${appUrl}/signup and enter the invite code</li>
                </ol>
            </div>
            
            <p>Family Finance helps families track expenses, manage budgets, and reach financial goals together using the proven YNAB methodology.</p>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                This invitation was sent by ${senderName}. If you didn't expect this invitation, you can safely ignore this email.
            </p>
        </div>
        
        <div class="footer">
            <p>Family Finance - Secure Family Budget Management</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
`;

		// Plain text version for email clients that don't support HTML
		const textContent = `
Join "${familyName}" on Family Finance

Hi there!

${senderName} has invited you to join their family "${familyName}" on Family Finance.

Your invite code is: ${inviteCode}

To join:
1. Visit: ${appUrl}/signup
2. Create an account (or log in if you have one)
3. Enter the invite code: ${inviteCode}

If you already have an account:
1. Log in at: ${appUrl}/login
2. Go to family settings and use the invite code

Family Finance helps families track expenses, manage budgets, and reach financial goals together.

Best regards,
Family Finance Team

---
This invitation was sent by ${senderName}. If you didn't expect this invitation, you can safely ignore this email.
`;

		// Send email using Resend with default domain for development
		const { data, error } = await resend.emails.send({
			from: 'Family Finance <onboarding@resend.dev>',
			to: [recipientEmail],
			subject: `Join "${familyName}" on Family Finance`,
			html: htmlContent,
			text: textContent,
			headers: {
				'X-Entity-Ref-ID': `invite-${inviteCode}-${Date.now()}`,
			},
		});

		if (error) {
			console.error('❌ Email send error:', error);
			return json({ success: false, error: error.message }, { status: 500 });
		}

		console.log('✅ Email sent successfully:', data);
		return json({ success: true, messageId: data?.id });

	} catch (error) {
		console.error('❌ Email API error:', error);
		return json({ 
			success: false, 
			error: error instanceof Error ? error.message : 'Failed to send email' 
		}, { status: 500 });
	}
};