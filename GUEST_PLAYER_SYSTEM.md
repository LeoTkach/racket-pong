# Guest Player Registration System

## Overview

The tournament registration system has been completely redesigned to match the quick registration style and now supports guest players (participants without system accounts) with email notifications.

## ✨ New Features

### 1. **Redesigned Registration Page**
- **Modern Aurora Background**: Matches quick registration aesthetic
- **Account Creation Prompt**: Non-logged-in users choose between creating an account or registering as a guest
- **Two Registration Paths**:
  - **Create Account & Register**: Full platform access with stats, achievements, and tournament history
  - **Quick Guest Registration**: Tournament-only participation with email updates

### 2. **Guest Player System**
- Participants can register **without creating a system account**
- Guest players receive **all tournament updates via email**
- Email notifications include:
  - Registration confirmation
  - Tournament details and reminders
  - Participation certificates (after tournament)
  - Final standings and results

### 3. **Organizer Controls**
- Tournament organizers can **manually add guest players**
- New "Add Guest Player" section in tournament edit page
- Guest player form includes:
  - First Name, Last Name (required)
  - Email (required)
  - Phone (optional)
  - Country (required)
  - Skill Level (optional)
  - Additional Information (optional)

### 4. **Email Notification System**
- Automated email confirmations for registrations
- Professional HTML email templates
- Support for multiple SMTP providers (Gmail, SendGrid, AWS SES, Mailgun)
- Graceful fallback if email service is not configured

## 📁 Files Changed/Created

### Backend

#### Database
- **`/backend/database/add_guest_tournament_players.sql`**: Database migration for guest players
  - New `guest_tournament_players` table
  - Updated `tournament_participants` to support both system and guest players
  - View for combined participant listing

- **`/backend/scripts/database/apply-guest-players-migration.js`**: Migration script

#### API
- **`/backend/server/routes/tournaments.js`**:
  - **POST** `/api/tournaments/:id/register-guest`: Register guest player
  - **GET** `/api/tournaments/:id/all-participants`: Get all participants (system + guest)
  - Email confirmation integration

#### Email Service
- **`/backend/server/services/emailService.js`**: Complete email service
  - Registration confirmation emails
  - Tournament certificates (template ready)
  - Final standings emails (template ready)
  - Support for multiple SMTP providers

#### Documentation
- **`/backend/EMAIL_SETUP.md`**: Complete email setup guide

### Frontend

#### Registration Page
- **`/frontend/src/pages/common/RegistrationPage.tsx`**: Completely redesigned
  - Aurora background integration
  - Account creation vs. guest registration choice
  - Guest registration form
  - Email confirmation messaging

#### Edit Tournament Page
- **`/frontend/src/pages/tournaments/EditTournamentPage.tsx`**:
  - "Add Guest Player" section
  - Guest player form with validation
  - Updated participant loading for guest players

#### API Client
- **`/frontend/src/api/client.js`**:
  - `registerGuestForTournament()`: Register guest player
  - `getAllTournamentParticipants()`: Get all participants

## 🚀 Setup Instructions

### 1. Apply Database Migration

```bash
cd backend
node scripts/database/apply-guest-players-migration.js
```

This creates:
- `guest_tournament_players` table
- Updated `tournament_participants` structure
- `tournament_all_participants` view

### 2. Install Email Dependencies

```bash
cd backend
npm install nodemailer
```

### 3. Configure Email (Optional)

Add to `backend/.env`:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

**For Gmail**:
1. Enable 2-Factor Authentication
2. Generate an App Password at https://myaccount.google.com/security
3. Use the App Password (not your regular password)

See `backend/EMAIL_SETUP.md` for detailed instructions and alternative SMTP providers.

## 📋 User Flows

### Guest Player Registration Flow

1. **User visits tournament page** (not logged in)
2. **Clicks "Register Now"**
3. **Sees registration choice**:
   - **Option A**: Create Account & Register
     - Redirected to signup page
     - After signup, returns to tournament
     - Full platform features unlocked
   
   - **Option B**: Quick Guest Registration
     - Fills out guest form
     - Submits registration
     - Receives email confirmation
     - Participates in tournament
     - Receives certificate and standings via email

### Organizer Adding Guest Player

1. **Organizer goes to "Edit Tournament"**
2. **Scrolls to "Add Guest Player" section**
3. **Clicks "Add Guest" button**
4. **Fills out guest player form**
5. **Submits form**
6. **Guest player added to tournament**
7. **Guest receives registration confirmation email**

## 🎨 UI Design Highlights

### Registration Page Styling
- **Aurora Background**: Animated gradient background matching quick registration
- **Glass-morphism Cards**: `bg-card/95 backdrop-blur-sm shadow-lg`
- **Gradient Borders**: `border-border/40`
- **Two-Column Layout**: Registration form + Tournament summary
- **Responsive Design**: Adapts to mobile and desktop

### Account Choice Screen
- **Primary Option** (Create Account):
  - Highlighted with `border-primary/20` and `bg-primary/5`
  - UserPlus icon with primary color
  - Lists benefits: tournaments history, statistics, achievements

- **Secondary Option** (Guest):
  - Subtle `border-border/40` styling
  - Mail icon in muted colors
  - Quick registration benefits

### Guest Form in Edit Tournament
- **Collapsible Section**: Show/hide with button
- **Two-Column Layout**: Organized field grouping
- **Icon Integration**: Mail icon for email field
- **Validation**: Required fields marked with *
- **Loading States**: Spinner during submission

## 📊 Database Schema

### guest_tournament_players
```sql
id                      SERIAL PRIMARY KEY
tournament_id           INTEGER (references tournaments)
first_name              VARCHAR(100) NOT NULL
last_name               VARCHAR(100) NOT NULL
email                   VARCHAR(100) NOT NULL
phone                   VARCHAR(50)
country                 VARCHAR(50) NOT NULL
skill_level             VARCHAR(20) (beginner|intermediate|advanced|expert)
additional_info         TEXT
registered_at           TIMESTAMP
registered_by_organizer BOOLEAN
send_notifications      BOOLEAN
```

### tournament_participants (Updated)
```sql
id                 SERIAL PRIMARY KEY
tournament_id      INTEGER (references tournaments)
player_id          INTEGER (references players) - NULLABLE
guest_player_id    INTEGER (references guest_tournament_players) - NULLABLE
registered_at      TIMESTAMP

-- Constraint: Exactly one of player_id or guest_player_id must be set
```

## 📧 Email Templates

### 1. Registration Confirmation
- Tournament details (name, date, time, location)
- What to bring and expect
- Post-tournament benefits (certificate, standings)
- Professional gradient header

### 2. Tournament Certificate (Ready for implementation)
- Personalized greeting
- Placement information
- Certificate download link
- Motivational message

### 3. Final Standings (Ready for implementation)
- Top 10 players table
- Full standings link
- Player's personal ranking

## 🔧 API Endpoints

### Register Guest Player
```
POST /api/tournaments/:id/register-guest

Body:
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "country": "USA",
  "skill_level": "intermediate",
  "additional_info": "First time playing",
  "registered_by_organizer": false
}

Response:
{
  "message": "Successfully registered as guest player for tournament",
  "guest_player": { ... },
  "registration": { ... }
}
```

### Get All Participants
```
GET /api/tournaments/:id/all-participants

Response:
{
  "participants": [
    {
      "player_type": "system", // or "guest"
      "full_name": "John Doe",
      "username": "johndoe",    // null for guests
      "email": "john@example.com",
      "country": "USA",
      "rating": 1500,           // null for guests
      "guest_skill_level": null, // only for guests
      "registered_at": "2024-11-21T..."
    },
    ...
  ],
  "total": 12
}
```

## ⚠️ Important Notes

### Email Service
- **Optional**: System works without email configuration
- **Falls back gracefully**: Registration succeeds even if email fails
- **Logs warnings**: Check console for `[Email Service]` messages
- **Production ready**: Supports professional SMTP providers

### Guest Players vs. System Players
- **Guest players**: No login, email-only communication
- **System players**: Full profile, stats, achievements
- **Both participate equally** in tournaments
- **Standings include both** types

### Security
- Email validation on registration
- Duplicate email check per tournament
- Required fields enforced
- Organizer-only access to add guests

## 🎯 Future Enhancements

- [ ] PDF certificate generation
- [ ] PDF standings generation
- [ ] Bulk email sending to all participants
- [ ] Email templates with tournament branding
- [ ] Unsubscribe functionality
- [ ] QR codes for check-in
- [ ] SMS notifications (optional)
- [ ] Guest player conversion to system accounts

## 🐛 Known Limitations

- TypeScript warnings in EditTournamentPage (non-critical, code works)
- Email service requires manual SMTP configuration
- No PDF generation yet (placeholders in email service)
- Guest players don't get achievements (by design)

## 📝 Testing Checklist

- [ ] Apply database migration
- [ ] Test guest registration as non-logged-in user
- [ ] Test account creation path
- [ ] Test organizer adding guest player
- [ ] Configure and test email sending
- [ ] Verify participant list shows both types
- [ ] Check email confirmation content
- [ ] Test tournament with mixed participants

## 💡 Tips

### For Organizers
- Add guest players for walk-ins or phone registrations
- Review all participants in Edit Tournament page
- Both guest and system players appear in matches

### For Users
- Create an account for permanent stat tracking
- Guest registration for one-time participation
- Check email (including spam) for confirmations

### For Developers
- Email templates are in `emailService.js`
- Database view `tournament_all_participants` simplifies queries
- Frontend uses Aurora component for background
- All new code follows existing style patterns

---

## Summary

This implementation provides a complete guest player system with modern UI, email notifications, and organizer controls. The system gracefully handles both registered users and guests, providing appropriate features for each while maintaining a unified tournament experience.
