import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'https://esm.sh/@react-email/components@0.0.22';
import * as React from 'https://esm.sh/react@18.3.1';

interface DealAlertEmailProps {
  destination_city: string;
  destination_country: string;
  current_price: number;
  user_threshold: number;
  outbound_date: string;
  return_date: string;
  booking_link: string;
  unsubscribeUrl?: string;
  deal_quality?: string;
  savings_percent?: number;
  recommendation?: string;
  urgency?: string;
  avg_90day?: number;
  all_time_low?: number;
  current_percentile?: number;
  price_source?: string;
}

export const DealAlertEmail = ({
  destination_city,
  destination_country,
  current_price,
  user_threshold,
  outbound_date,
  return_date,
  booking_link,
  unsubscribeUrl = '#',
  deal_quality = '👍 GOOD',
  savings_percent = 0,
  recommendation = '',
  urgency = 'moderate',
  avg_90day,
  all_time_low,
  current_percentile = 50,
  price_source = 'google_flights'
}: DealAlertEmailProps) => {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };
  
  const savings = avg_90day ? Math.round(avg_90day - current_price) : 0;
  const urgencyColor = urgency === 'high' ? '#dc2626' : urgency === 'moderate' ? '#f59e0b' : '#10b981';
  const urgencyText = urgency === 'high' ? '🔴 HIGH URGENCY - Book within 24 hours' : 
                      urgency === 'moderate' ? '🟡 MODERATE - Book within 3 days' : 
                      '🟢 LOW - You have time to consider';

  return (
    <Html>
      <Head>
        <title>Flight Price Alert</title>
      </Head>
      <Preview>🎉 {deal_quality} Deal: Memphis to {destination_city} - ${Math.round(current_price).toString()}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>✈️ Cheap Memphis Flights</Heading>
            <Text style={dealBadge}>{deal_quality}</Text>
          </Section>

          <Section style={heroSection}>
            <Text style={heroText}>
              ✈️ Your flight to {destination_city} just got cheaper!
            </Text>
          </Section>

          <Section style={content}>
            <Heading style={destinationHeading}>
              Memphis → {destination_city}
            </Heading>
            <Text style={countryText}>{destination_country}</Text>

            {/* Price Context Box */}
            <Section style={priceContextBox}>
              <Text style={priceBoxTitle}>PRICE BREAKDOWN</Text>
              <Hr style={divider} />
              <Text style={priceRow}>
                <strong>Current Price:</strong> <span style={priceHighlight}>${Math.round(current_price)}</span>
              </Text>
              <Text style={priceRow}>
                <strong>Your Threshold:</strong> ${Math.round(user_threshold)}
              </Text>
              {avg_90day && (
                <Text style={priceRow}>
                  <strong>90-Day Average:</strong> ${Math.round(avg_90day)}
                </Text>
              )}
              {all_time_low && (
                <Text style={priceRow}>
                  <strong>All-Time Low:</strong> ${Math.round(all_time_low)}
                </Text>
              )}
              {savings > 0 && (
                <Text style={savingsRow}>
                  <strong>Your Savings:</strong> <span style={savingsHighlight}>${savings} ({savings_percent}%)</span>
                </Text>
              )}
              <Text style={priceRow}>
                <strong>Deal Quality:</strong> {deal_quality}
              </Text>
              <Text style={priceRow}>
                <strong>Source:</strong> {price_source === 'google_flights' ? 'Google Flights' : 'Airline API'}
              </Text>
            </Section>

            {/* Urgency Indicator */}
            <Section style={{...urgencyBox, borderColor: urgencyColor}}>
              <Text style={{...urgencyTextStyle, color: urgencyColor}}>{urgencyText}</Text>
            </Section>

            {/* Recommendation */}
            {recommendation && (
              <Text style={recommendationText}>{recommendation}</Text>
            )}

            <Section style={detailsBox}>
              <Text style={detailRow}>
                <strong>✈️ Departure:</strong> {formatDate(outbound_date)}
              </Text>
              <Text style={detailRow}>
                <strong>🏠 Return:</strong> {formatDate(return_date)}
              </Text>
              <Text style={detailRow}>
                <strong>📍 From:</strong> Memphis (MEM)
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={booking_link}>
                🎫 View Flights on Google →
              </Button>
              <Text style={ctaSubtext}>
                Click to search flights with your dates pre-filled
              </Text>
              <Text style={disclaimerText}>
                * Prices are checked every 2 hours and may vary slightly based on availability when you click through.
              </Text>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this because you subscribed to Cheap Memphis Flights price alerts.
            </Text>
            <Text style={footerLinks}>
              <Link href={unsubscribeUrl} style={footerLink}>Unsubscribe</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default DealAlertEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#0066CC',
  padding: '24px',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const dealBadge = {
  backgroundColor: '#FF6B35',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '6px 16px',
  borderRadius: '20px',
  margin: '0',
};

const heroSection = { 
  padding: '24px 48px',
  backgroundColor: '#f0f9ff',
  textAlign: 'center' as const,
};

const heroText = {
  color: '#1E40AF',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0',
};
const content = { padding: '32px 48px' };

const destinationHeading = {
  color: '#333333',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const countryText = {
  color: '#737373',
  fontSize: '18px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const priceContextBox = {
  backgroundColor: '#f8fafc',
  border: '2px solid #e2e8f0',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const priceBoxTitle = {
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#64748b',
  letterSpacing: '1px',
  marginBottom: '12px',
};

const priceRow = {
  fontSize: '14px',
  color: '#334155',
  margin: '8px 0',
};

const priceHighlight = {
  color: '#059669',
  fontSize: '20px',
  fontWeight: 'bold',
};

const savingsRow = {
  fontSize: '16px',
  margin: '12px 0',
  fontWeight: 'bold',
};

const savingsHighlight = {
  color: '#059669',
  fontSize: '18px',
};

const urgencyBox = {
  border: '2px solid',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px 0',
  textAlign: 'center' as const,
};

const urgencyTextStyle = {
  fontSize: '16px',
  fontWeight: 'bold',
  margin: 0,
};

const recommendationText = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#475569',
  backgroundColor: '#fff7ed',
  padding: '16px',
  borderLeft: '4px solid #f59e0b',
  borderRadius: '4px',
  margin: '20px 0',
};

const divider = { borderColor: '#e2e8f0', margin: '12px 0' };

const detailsBox = {
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const detailRow = {
  fontSize: '16px',
  margin: '8px 0',
  color: '#333333',
};

const buttonContainer = {
  padding: '32px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#FF6B35',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 48px',
};

const footer = {
  backgroundColor: '#f6f9fc',
  padding: '32px 48px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#737373',
  fontSize: '14px',
  margin: '8px 0',
};

const footerLinks = {
  fontSize: '14px',
  margin: '16px 0 0',
};

const footerLink = {
  color: '#0066CC',
  textDecoration: 'underline',
};

const ctaSubtext = {
  color: '#737373',
  fontSize: '14px',
  margin: '12px 0 0',
  textAlign: 'center' as const,
};

const disclaimerText = {
  color: '#9ca3af',
  fontSize: '12px',
  fontStyle: 'italic' as const,
  margin: '16px 0 0',
  textAlign: 'center' as const,
};
