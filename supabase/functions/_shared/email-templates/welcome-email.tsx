import * as React from 'https://esm.sh/react@18.3.1';

interface WelcomeEmailProps {
  name: string;
  email: string;
  recentDeal?: {
    destination: string;
    price: number;
    dates: string;
  };
  unsubscribeUrl: string;
}

// Simple HTML email template without react-email components
export const WelcomeEmail = ({
  name,
  email,
  recentDeal,
  unsubscribeUrl,
}: WelcomeEmailProps) => {
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
            <h1 style={h1}>✈️ Cheap Atlanta Flights</h1>
          </div>

          {/* Main Content */}
          <div style={content}>
            <h2 style={h2}>Welcome aboard, {name || 'Traveler'}! 🎉</h2>
            <p style={paragraph}>
              Your 7-day free trial has started! You're all set to receive the best flight deals from Atlanta.
            </p>

            <div style={trialBox}>
              <h3 style={h3}>About Your Free Trial:</h3>
              <p style={bulletPoint}>🎉 You have 7 days of full access at no cost</p>
              <p style={bulletPoint}>💳 Your card is on file but won't be charged until after the trial</p>
              <p style={bulletPoint}>⏰ Cancel anytime during the trial at no cost</p>
              <p style={bulletPoint}>✅ No action needed - enjoy your trial!</p>
            </div>

            <div style={highlightBox}>
              <h3 style={h3}>What to Expect:</h3>
              <p style={bulletPoint}>✈️ Daily monitoring of any destination worldwide</p>
              <p style={bulletPoint}>⚡ Instant alerts when prices drop</p>
              <p style={bulletPoint}>💰 Exclusive deals sent straight to your inbox</p>
              <p style={bulletPoint}>📅 Flexible travel dates to maximize savings</p>
            </div>

            {recentDeal && (
              <>
                <h3 style={h3}>Check Out This Recent Deal:</h3>
                <div style={dealBox}>
                  <p style={dealDestination}>{recentDeal.destination}</p>
                  <p style={dealPrice}>${recentDeal.price}</p>
                  <p style={dealDetails}>roundtrip</p>
                  <p style={dealDates}>{recentDeal.dates}</p>
                </div>
                <p style={paragraph}>
                  Deals like this will be sent to you as soon as we find them!
                </p>
              </>
            )}

            <p style={paragraph}>
              We search for the best prices daily, so you don't have to. Just sit back, relax, and wait for the perfect deal to land in your inbox.
            </p>

            <div style={buttonContainer}>
              <a style={button} href="https://cheapatlantaflights.com/deals">
                Browse Current Deals
              </a>
            </div>

            <div style={socialSection}>
              <p style={paragraph}>
                Follow us for travel tips and inspiration:
              </p>
              <p style={socialLinks}>
                <a href="#" style={socialLink}>Twitter</a> • 
                <a href="#" style={socialLink}> Facebook</a> • 
                <a href="#" style={socialLink}> Instagram</a>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div style={footer}>
            <p style={footerText}>
              Happy travels!
            </p>
            <p style={footerText}>
              The Cheap Atlanta Flights Team
            </p>
            <p style={footerText}>
              <a href={unsubscribeUrl} style={footerLink}>
                Unsubscribe
              </a> • 
              <a href="mailto:support@cheapatlantaflights.com" style={footerLink}>
                {' '}Contact Us
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};



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

const h3 = {
  color: '#333333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '24px 0 12px',
};

const paragraph = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  margin: '16px 0',
};

const trialBox = {
  backgroundColor: '#f0fdf4',
  borderLeft: '4px solid #16a34a',
  padding: '20px',
  margin: '24px 0',
};

const highlightBox = {
  backgroundColor: '#f0f9ff',
  borderLeft: '4px solid #0066CC',
  padding: '20px',
  margin: '24px 0',
};

const bulletPoint = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '28px',
  margin: '0',
};

const dealBox = {
  backgroundColor: '#fff5f0',
  borderLeft: '4px solid #FF6B35',
  padding: '24px',
  margin: '16px 0',
  textAlign: 'center' as const,
};

const dealDestination = {
  color: '#333333',
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const dealPrice = {
  color: '#FF6B35',
  fontSize: '36px',
  fontWeight: 'bold',
  margin: '8px 0',
};

const dealDetails = {
  color: '#737373',
  fontSize: '14px',
  margin: '0',
};

const dealDates = {
  color: '#525252',
  fontSize: '16px',
  margin: '8px 0 0',
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

const socialSection = {
  marginTop: '32px',
  textAlign: 'center' as const,
};

const socialLinks = {
  fontSize: '16px',
  margin: '8px 0',
};

const socialLink = {
  color: '#0066CC',
  textDecoration: 'none',
  padding: '0 8px',
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
  padding: '0 4px',
};
