import * as React from 'https://esm.sh/react@18.3.1';

interface VerificationEmailProps {
  verificationUrl: string;
  email: string;
  unsubscribeUrl: string;
}

// Simple HTML email template without react-email components
export const VerificationEmail = ({
  verificationUrl,
  email,
  unsubscribeUrl,
}: VerificationEmailProps) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style={main}>
        <div style={container}>
          {/* Header */}
          <div style={header}>
            <h1 style={h1}>✈️ Cheap Singapore Flights</h1>
          </div>

          {/* Main Content */}
          <div style={content}>
            <h2 style={h2}>Welcome to Cheap Singapore Flights!</h2>
            <p style={paragraph}>
              Thanks for subscribing! We're excited to help you find the best flight deals from Singapore.
            </p>
            <p style={paragraph}>
              Click the button below to confirm your email address and start receiving daily deal alerts:
            </p>

            <div style={buttonContainer}>
              <a style={button} href={verificationUrl}>
                Verify Email Address
              </a>
            </div>

            <p style={paragraph}>
              Or copy and paste this URL into your browser:
            </p>
            <p style={link}>
              <a href={verificationUrl} style={linkText}>
                {verificationUrl}
              </a>
            </p>

            <p style={smallText}>
              This link will expire in 24 hours. If you didn't subscribe to Cheap Singapore Flights,
              you can safely ignore this email.
            </p>
          </div>

          {/* Footer */}
          <div style={footer}>
            <p style={footerText}>
              Cheap Singapore Flights - Your source for the best flight deals from SIN
            </p>
            <p style={footerText}>
              <a href={unsubscribeUrl} style={footerLink}>
                Unsubscribe
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};

export default VerificationEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const header = {
  backgroundColor: '#0066CC',
  padding: '24px 0',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const content = {
  padding: '0 48px',
};

const h2 = {
  color: '#333333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '32px 0 16px',
};

const paragraph = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  margin: '16px 0',
};

const buttonContainer = {
  padding: '27px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#FF6B35',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const link = {
  color: '#0066CC',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};

const linkText = {
  color: '#0066CC',
  fontSize: '14px',
  textDecoration: 'underline',
};

const smallText = {
  color: '#737373',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0',
};

const footer = {
  backgroundColor: '#f6f9fc',
  padding: '24px 48px',
  textAlign: 'center' as const,
  marginTop: '32px',
};

const footerText = {
  color: '#737373',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '4px 0',
};

const footerLink = {
  color: '#0066CC',
  textDecoration: 'underline',
};
