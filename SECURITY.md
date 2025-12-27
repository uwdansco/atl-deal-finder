# Security Policy - Cheap Memphis Flights

## 🔒 Security Overview

This document outlines the security measures, policies, and procedures for the Cheap Memphis Flights platform.

## 🛡️ Security Features

### Authentication & Authorization

#### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Maximum 128 characters

#### Session Management
- Session timeout: 7 days of inactivity
- Secure session tokens (httpOnly, secure, sameSite)
- Automatic session refresh
- Single sign-out across all devices

#### Email Verification
- Required before accessing full features
- Verification links expire after 24 hours
- Rate limited to prevent abuse (5 requests/hour per IP)

### Authorization

#### Role-Based Access Control (RBAC)
- **User Role**: Access to own destinations, alerts, and preferences
- **Admin Role**: Full access to all data and admin dashboard

#### Row-Level Security (RLS)
All database tables have RLS policies:
- Users can only access their own data
- Admins can access all data
- Public tables (destinations, price_history) readable by all
- Sensitive operations require authentication

### API Security

#### Rate Limiting
Implemented at multiple levels:

| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth (login/signup) | 5 requests | 1 minute |
| Email verification | 5 requests | 1 hour |
| API endpoints | 60 requests | 1 minute |
| Price checks | 100 requests | 1 hour |

#### Input Validation
All user inputs are validated using Zod schemas:
- Email addresses
- Passwords
- Names (no special characters except hyphens and apostrophes)
- Price thresholds (positive numbers, max $10,000)
- UUIDs

#### SQL Injection Prevention
- All queries use parameterized statements
- No string concatenation in SQL queries
- Supabase client library handles escaping

#### XSS Prevention
- All user input is sanitized before display
- React's automatic escaping
- No dangerouslySetInnerHTML with user content
- Content Security Policy (CSP) headers

#### CSRF Protection
- CSRF tokens for all state-changing operations
- Tokens stored in session storage
- Tokens validated on server-side
- SameSite cookie attribute set

### Data Protection

#### Encryption
- **In Transit**: HTTPS everywhere (TLS 1.3)
- **At Rest**: Database encryption via Supabase
- **Secrets**: Encrypted environment variables

#### Sensitive Data Handling
Never logged or exposed:
- Passwords
- API keys
- Session tokens
- Password reset tokens
- Verification tokens

#### Data Retention
- User data: Retained until account deletion
- Audit logs: 90 days
- Email queue: 30 days
- Rate limit records: 1 hour
- Price history: Indefinite (anonymized)

### Email Security

#### Spam Prevention
- SPF record configured
- DKIM signing enabled
- DMARC policy enforced
- Unsubscribe in every email
- Rate limiting on sending

#### Phishing Prevention
- Verified sender domain
- Clear branding in all emails
- No suspicious links
- Plain text versions included

### Privacy & Compliance

#### GDPR Compliance
- Clear privacy policy
- Cookie consent (optional, no tracking cookies currently)
- Right to access data
- Right to delete data
- Right to export data
- Data processing agreement

#### CAN-SPAM Compliance
- Unsubscribe link in every email
- Honor unsubscribe immediately
- Physical address in footer
- Clear "From" address
- Accurate subject lines

## 🔐 Security Best Practices

### For Developers

1. **Never commit secrets**
   - Use environment variables
   - Add .env to .gitignore
   - Use Supabase secrets for sensitive data

2. **Always validate input**
   - Use Zod schemas
   - Sanitize before display
   - Validate on both client and server

3. **Use parameterized queries**
   - Never concatenate SQL strings
   - Use Supabase client library methods

4. **Implement proper error handling**
   - Don't expose stack traces in production
   - Log errors securely
   - Show user-friendly error messages

5. **Keep dependencies updated**
   ```bash
   npm audit
   npm audit fix
   ```

6. **Review RLS policies**
   - Test with different user roles
   - Use `auth.uid()` for user-specific access
   - Use `is_admin()` function for admin checks

### For Admins

1. **Use strong passwords**
   - Follow password requirements
   - Use password manager
   - Enable 2FA (when available)

2. **Monitor audit logs**
   - Review weekly
   - Investigate suspicious activity
   - Check for unauthorized access

3. **Review user accounts**
   - Remove inactive accounts
   - Verify admin access is needed
   - Check for suspicious signups

4. **Monitor email deliverability**
   - Check bounce rates
   - Review spam complaints
   - Maintain sender reputation

## 🚨 Incident Response

### Security Incident Severity Levels

#### Critical (P0)
- Data breach
- Admin account compromise
- SQL injection vulnerability
- System-wide outage

**Response Time**: Immediate (< 1 hour)

#### High (P1)
- User account compromise
- Unauthorized access attempt
- XSS vulnerability
- Service degradation

**Response Time**: 4 hours

#### Medium (P2)
- Suspicious login activity
- Rate limit bypass
- Minor vulnerability

**Response Time**: 24 hours

#### Low (P3)
- Security policy violation
- Outdated dependency
- Non-critical bug

**Response Time**: 7 days

### Incident Response Procedure

1. **Detect**: Monitor logs, error tracking, user reports
2. **Assess**: Determine severity and scope
3. **Contain**: Limit damage (disable accounts, block IPs)
4. **Investigate**: Root cause analysis
5. **Remediate**: Fix vulnerability
6. **Recover**: Restore normal operations
7. **Document**: Update incident log
8. **Review**: Post-mortem and improvements

### Security Contacts

- **Security Issues**: security@cheapmemphisflights.com
- **Data Privacy**: privacy@cheapmemphisflights.com
- **On-Call Developer**: [Phone number]

## 🔍 Vulnerability Reporting

### Responsible Disclosure

If you discover a security vulnerability:

1. **DO NOT** disclose publicly
2. Email security@cheapmemphisflights.com with:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (optional)
3. Allow 90 days for fix before public disclosure
4. We'll acknowledge within 48 hours
5. We'll provide updates every 7 days

### Scope

**In Scope:**
- Authentication bypass
- SQL injection
- XSS vulnerabilities
- CSRF vulnerabilities
- Sensitive data exposure
- Privilege escalation
- RLS policy bypass

**Out of Scope:**
- DDoS attacks
- Social engineering
- Physical attacks
- Third-party service vulnerabilities (Supabase, Resend, Amadeus)

### Recognition

We thank security researchers who help us keep our platform secure. Acknowledged researchers:
- [Your Name] - [Vulnerability Found] - [Date]

## 📋 Security Checklist

### Monthly Security Review

- [ ] Review audit logs for suspicious activity
- [ ] Check for failed login attempts
- [ ] Review admin access list
- [ ] Update dependencies (`npm audit`)
- [ ] Review RLS policies
- [ ] Check email bounce/spam rates
- [ ] Review rate limit logs
- [ ] Check SSL certificate expiry
- [ ] Review error logs
- [ ] Test backup restoration

### Quarterly Security Audit

- [ ] Penetration testing
- [ ] Code security review
- [ ] Dependency vulnerability scan
- [ ] RLS policy audit
- [ ] Access control review
- [ ] Encryption verification
- [ ] Privacy policy update
- [ ] Security training for team

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [GDPR Compliance Guide](https://gdpr.eu/)
- [CAN-SPAM Act](https://www.ftc.gov/tips-advice/business-center/guidance/can-spam-act-compliance-guide-business)

---

**Last Updated**: [Current Date]
**Next Review**: [Date + 3 months]

For questions or concerns, contact: security@cheapmemphisflights.com
