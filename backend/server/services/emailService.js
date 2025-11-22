/**
 * Email Service
 * Handles sending emails for tournament notifications, certificates, and standings
 */

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Check if email environment variables are set
      const emailUser = process.env.EMAIL_USER;
      const emailPassword = process.env.EMAIL_PASSWORD;
      const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
      const emailPort = parseInt(process.env.EMAIL_PORT || '587');

      if (!emailUser || !emailPassword) {
        console.warn('[Email Service] Email credentials not configured. Email notifications will be disabled.');
        console.warn('[Email Service] Set EMAIL_USER and EMAIL_PASSWORD in .env to enable emails.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailPort === 465, // true for 465, false for other ports
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });

      this.initialized = true;
      console.log('[Email Service] Email service initialized successfully');
    } catch (error) {
      console.error('[Email Service] Failed to initialize email service:', error);
      this.initialized = false;
    }
  }

  async sendEmail({ to, subject, html, text }) {
    if (!this.initialized) {
      console.warn('[Email Service] Email service not initialized. Skipping email to:', to);
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: `"Table Tennis Tournament" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text: text || '',
        html: html || text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('[Email Service] Email sent successfully to:', to);
      console.log('[Email Service] Message ID:', info.messageId);

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('[Email Service] Failed to send email to:', to, error);
      return { success: false, error: error.message };
    }
  }

  async sendTournamentRegistrationConfirmation({ email, playerName, tournamentName, tournamentDate, tournamentLocation }) {
    const subject = `Registration Confirmed: ${tournamentName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FACC15 0%, #FFA500 100%); color: #000; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
          .details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
          .detail-row:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #666; }
          .value { color: #000; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #FACC15; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏓 Registration Confirmed!</h1>
          </div>
          <div class="content">
            <p>Dear ${playerName},</p>
            <p>Thank you for registering for <strong>${tournamentName}</strong>! Your registration has been confirmed.</p>
            
            <div class="details">
              <h3>Tournament Details</h3>
              <div class="detail-row">
                <span class="label">Tournament:</span>
                <span class="value">${tournamentName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${tournamentDate}</span>
              </div>
              <div class="detail-row">
                <span class="label">Location:</span>
                <span class="value">${tournamentLocation}</span>
              </div>
            </div>

            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Arrive at least 30 minutes before the tournament start time</li>
              <li>Bring your own paddle if you prefer</li>
              <li>Check the tournament schedule closer to the event date</li>
            </ul>

            <p>After the tournament, you will receive:</p>
            <ul>
              <li>📄 Your participation certificate</li>
              <li>📊 Final standings and results</li>
              <li>🏆 Achievement notifications (if you earned any)</li>
            </ul>

            <p>We look forward to seeing you at the tournament!</p>
          </div>
          <div class="footer">
            <p>Questions? Contact the tournament organizer or visit our platform.</p>
            <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  async sendTournamentCertificate({ email, playerName, tournamentName, placement, certificateUrl }) {
    const subject = `Your Certificate: ${tournamentName}`;
    
    const placementText = placement ? `You finished in ${placement} place!` : 'Thank you for participating!';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FACC15 0%, #FFA500 100%); color: #000; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
          .certificate-box { background: #f9f9f9; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #FACC15; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #FACC15; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏆 Tournament Complete!</h1>
          </div>
          <div class="content">
            <p>Dear ${playerName},</p>
            <p>Thank you for participating in <strong>${tournamentName}</strong>!</p>
            <p>${placementText}</p>
            
            <div class="certificate-box">
              <h2>🎖️ Your Certificate</h2>
              <p>Your participation certificate is now available!</p>
              ${certificateUrl ? `<a href="${certificateUrl}" class="button">Download Certificate</a>` : '<p>Certificate will be available soon</p>'}
            </div>

            <p>Keep up the great work and we hope to see you at future tournaments!</p>
          </div>
          <div class="footer">
            <p>Questions? Contact us or visit our platform.</p>
            <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  async sendTournamentStandings({ email, playerName, tournamentName, standingsUrl, finalResults }) {
    const subject = `Final Standings: ${tournamentName}`;
    
    const resultsHtml = finalResults ? 
      finalResults.slice(0, 10).map((result, index) => 
        `<div class="detail-row">
          <span class="label">${index + 1}. ${result.player_name}</span>
          <span class="value">${result.wins}W - ${result.losses}L</span>
        </div>`
      ).join('') : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FACC15 0%, #FFA500 100%); color: #000; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
          .standings { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
          .detail-row:last-child { border-bottom: none; }
          .label { font-weight: bold; }
          .value { color: #666; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #FACC15; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Final Standings</h1>
          </div>
          <div class="content">
            <p>Dear ${playerName},</p>
            <p>The final standings for <strong>${tournamentName}</strong> are now available!</p>
            
            ${resultsHtml ? `
              <div class="standings">
                <h3>Top 10 Players</h3>
                ${resultsHtml}
              </div>
            ` : ''}

            ${standingsUrl ? `<p style="text-align: center;"><a href="${standingsUrl}" class="button">View Full Standings</a></p>` : ''}

            <p>Thank you for your participation!</p>
          </div>
          <div class="footer">
            <p>Visit our platform for more tournaments and events!</p>
            <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }
}

// Export singleton instance
module.exports = new EmailService();
