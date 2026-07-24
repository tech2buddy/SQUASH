export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  try {
    // Determine the API base URL based on environment.
    // In production on Vercel, relative paths work perfectly for Serverless Functions.
    // In local development, we might need to point to the Vercel dev server port.
    const isDev = import.meta.env.DEV;
    const baseUrl = isDev ? 'http://localhost:3000' : '';
    
    const response = await fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html, text }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export async function sendApplicationApprovedEmail(to: string, testerName: string, jobTitle: string) {
  const subject = `Your application for "${jobTitle}" was approved!`;
  const html = `
    <div style="font-family: sans-serif; max-w-xl; margin: 0 auto;">
      <h2 style="color: #10b981;">Application Approved</h2>
      <p>Hi ${testerName},</p>
      <p>Great news! Your application to test <strong>${jobTitle}</strong> has been approved.</p>
      <p>You can now log into SQUASH and begin testing to earn your payout.</p>
      <br/>
      <p>Happy testing,<br/>The SQUASH Team</p>
    </div>
  `;
  return sendEmail({ to, subject, html, text: `Hi ${testerName}, your application for ${jobTitle} was approved.` });
}

export async function sendApplicationRejectedEmail(to: string, testerName: string, jobTitle: string) {
  const subject = `Update on your application for "${jobTitle}"`;
  const html = `
    <div style="font-family: sans-serif; max-w-xl; margin: 0 auto;">
      <h2>Application Update</h2>
      <p>Hi ${testerName},</p>
      <p>Thank you for applying to test <strong>${jobTitle}</strong>.</p>
      <p>Unfortunately, the developer has selected other testers for this cycle, so your application was not accepted at this time.</p>
      <p>Keep applying to other exciting projects on SQUASH!</p>
      <br/>
      <p>Best regards,<br/>The SQUASH Team</p>
    </div>
  `;
  return sendEmail({ to, subject, html, text: `Hi ${testerName}, your application for ${jobTitle} was not accepted.` });
}

export async function sendSubmissionReviewedEmail(to: string, testerName: string, jobTitle: string, status: string, note?: string) {
  const isApproved = status === 'approved' || status === 'paid';
  const isChangesRequested = status === 'changes_requested';
  
  let subject = `Your test submission for "${jobTitle}" was reviewed`;
  if (isApproved) subject = `Success! Your test submission for "${jobTitle}" was approved`;
  else if (isChangesRequested) subject = `Action Required: Changes requested for "${jobTitle}"`;

  const html = `
    <div style="font-family: sans-serif; max-w-xl; margin: 0 auto;">
      <h2 style="color: ${isApproved ? '#10b981' : isChangesRequested ? '#f59e0b' : '#ef4444'};">
        Submission ${isApproved ? 'Approved' : isChangesRequested ? 'Needs Changes' : 'Rejected'}
      </h2>
      <p>Hi ${testerName},</p>
      <p>The developer has reviewed your test submission for <strong>${jobTitle}</strong>.</p>
      
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${isApproved ? '#10b981' : isChangesRequested ? '#f59e0b' : '#ef4444'};">
        <p style="margin-top: 0; font-weight: bold;">Status: ${status.replace('_', ' ').toUpperCase()}</p>
        ${note ? `<p style="margin-bottom: 0;"><strong>Developer Note:</strong><br/>${note}</p>` : ''}
      </div>

      ${isChangesRequested ? '<p>Please log into SQUASH, review the feedback, and update your submission as soon as possible.</p>' : ''}
      ${isApproved ? '<p>Your payout has been secured and will be processed according to the schedule.</p>' : ''}
      
      <br/>
      <p>Best regards,<br/>The SQUASH Team</p>
    </div>
  `;
  return sendEmail({ to, subject, html, text: `Hi ${testerName}, your submission for ${jobTitle} was reviewed. Status: ${status}` });
}
