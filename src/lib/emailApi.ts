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
