# Email Notification System Setup

This document explains how to configure and use the email notification system for tournament registrations, certificates, and standings.

## Overview

The email service sends automated notifications to tournament participants including:
- **Registration Confirmation**: Sent immediately after registration
- **Participation Certificates**: Sent after tournament completion
- **Final Standings**: Sent with tournament results

## Setup Instructions

### 1. Install Dependencies

The system uses `nodemailer` for sending emails. Install it if not already installed:

```bash
cd backend
npm install nodemailer
```

### 2. Configure Email Credentials

Add the following environment variables to your `backend/.env` file:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### 3. Gmail Setup (Recommended)

If using Gmail:

1. **Enable 2-Factor Authentication** on your Google Account
2. **Generate an App Password**:
   - Go to https://myaccount.google.com/security
   - Select "2-Step Verification"
   - Scroll down to "App passwords"
   - Generate a new app password for "Mail"
   - Use this password in `EMAIL_PASSWORD`

**Note**: Never use your actual Gmail password. Always use an App Password.

### 4. Alternative SMTP Providers

You can use other email providers by changing the SMTP settings:

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

#### AWS SES
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-aws-smtp-username
EMAIL_PASSWORD=your-aws-smtp-password
```

#### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-mailgun-smtp-username
EMAIL_PASSWORD=your-mailgun-smtp-password
```

## Email Templates

### 1. Registration Confirmation

Sent automatically when:
- A user registers for a tournament
- An organizer adds a guest player

**Content includes**:
- Tournament name, date, time, location
- What to bring and expect
- Next steps

### 2. Tournament Certificate

Sent after tournament completion:
- Participation certificate
- Placement information (if applicable)
- Download link for certificate PDF

### 3. Final Standings

Sent after tournament completion:
- Top 10 players
- Full standings link
- Player's personal ranking

## Testing Email Service

### Test Email Sending

Create a test script `backend/scripts/test-email.js`:

```javascript
const emailService = require('../server/services/emailService');

async function testEmail() {
  const result = await emailService.sendTournamentRegistrationConfirmation({
    email: 'test@example.com',
    playerName: 'John Doe',
    tournamentName: 'Test Tournament',
    tournamentDate: 'December 1, 2024 at 10:00 AM',
    tournamentLocation: 'Test Arena, New York, USA',
  });
  
  console.log('Email sent:', result);
}

testEmail();
```

Run the test:
```bash
node backend/scripts/test-email.js
```

## API Integration

### Guest Player Registration

The email is sent automatically when a guest player registers:

```javascript
POST /api/tournaments/:id/register-guest
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "country": "USA",
  "skill_level": "intermediate"
}
```

### Sending Certificates (To be implemented)

After tournament completion, you can send certificates:

```javascript
const emailService = require('./services/emailService');

await emailService.sendTournamentCertificate({
  email: 'player@example.com',
  playerName: 'John Doe',
  tournamentName: 'Championship 2024',
  placement: '1st',
  certificateUrl: 'https://yoursite.com/certificates/abc123.pdf'
});
```

### Sending Standings (To be implemented)

```javascript
await emailService.sendTournamentStandings({
  email: 'player@example.com',
  playerName: 'John Doe',
  tournamentName: 'Championship 2024',
  standingsUrl: 'https://yoursite.com/tournaments/123/results',
  finalResults: [
    { player_name: 'John Doe', wins: 5, losses: 0 },
    { player_name: 'Jane Smith', wins: 4, losses: 1 },
    // ... more results
  ]
});
```

## Troubleshooting

### Emails Not Sending

1. **Check console logs**: Look for `[Email Service]` messages
2. **Verify credentials**: Ensure EMAIL_USER and EMAIL_PASSWORD are correct
3. **Check firewall**: Ensure port 587 is not blocked
4. **Test SMTP connection**: Use a tool like `telnet smtp.gmail.com 587`

### Gmail "Less Secure Apps" Error

- **Don't use "Less secure app access"** - it's deprecated
- **Always use App Passwords** with 2FA enabled

### Rate Limiting

- Gmail: ~500 emails/day for free accounts
- Consider using SendGrid, Mailgun, or AWS SES for higher volumes

## Production Considerations

### Security
- Never commit `.env` files with real credentials
- Use environment variables in production
- Rotate App Passwords regularly

### Deliverability
- Set up SPF, DKIM, and DMARC records for your domain
- Use a verified sending domain
- Monitor bounce rates and spam complaints

### Scalability
- Consider using a dedicated email service (SendGrid, Mailgun, AWS SES)
- Implement email queuing for bulk sends
- Add retry logic for failed sends

## Future Enhancements

- [ ] PDF certificate generation
- [ ] Standings PDF generation
- [ ] Email templates with tournament branding
- [ ] Unsubscribe functionality
- [ ] Email scheduling
- [ ] Bulk email sending for all participants
- [ ] Email analytics and tracking
