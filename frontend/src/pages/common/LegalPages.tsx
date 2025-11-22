import React, { useLayoutEffect } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { SportBackground } from "../../components/common/backgrounds/sport-background/SportBackground";
import { FileText, Shield, Cookie } from "lucide-react";
import { typography } from "../../utils/typography";

interface LegalPagesProps {
  page: "terms" | "privacy" | "cookies";
  onBack: () => void;
}

export function LegalPages({ page, onBack }: LegalPagesProps) {
  // Прокручиваем страницу вверх при открытии (без анимации, до рендера)
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);
  if (page === "terms") {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <SportBackground variant="legal" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <Button variant="ghost" onClick={onBack} className="mb-4 hover:underline">
            ← Back
          </Button>
          <h1 className={typography.legalPageTitle}>
            <FileText className="w-8 h-8" />
            Terms of Service
          </h1>
          <p className={typography.legalPageDescription}>
            Last updated: October 12, 2025
          </p>

          <Card>
            <CardContent className="pt-6 space-y-6">
              <section>
                <h2 className={typography.legalSectionTitle}>1. Acceptance of Terms</h2>
                <p className={typography.legalParagraph}>
                  By accessing and using Racket Pong, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className={typography.legalSectionTitle}>2. User Accounts</h2>
                <p className={typography.legalParagraph}>
                  You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                </p>
              </section>

              <section>
                <h2 className={typography.legalSectionTitle}>3. Tournament Registration</h2>
                <p className={typography.legalParagraph}>
                  By registering for a tournament, you agree to abide by the tournament rules and regulations. Entry fees are non-refundable except in cases of tournament cancellation.
                </p>
              </section>

              <section>
                <h2 className={typography.legalSectionTitle}>4. Code of Conduct</h2>
                <p className={typography.legalParagraph}>
                  Users must maintain respectful behavior towards other players, organizers, and staff. Harassment, cheating, or unsportsmanlike conduct will result in account suspension or termination.
                </p>
              </section>

              <section>
                <h2 className={typography.legalSectionTitle}>5. Intellectual Property</h2>
                <p className={typography.legalParagraph}>
                  All content on Racket Pong, including text, graphics, logos, and software, is the property of Racket Pong and protected by copyright laws.
                </p>
              </section>

              <section>
                <h2 className={typography.legalSectionTitle}>6. Limitation of Liability</h2>
                <p className={typography.legalParagraph}>
                  Racket Pong shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of our services.
                </p>
              </section>

              <section>
                <h2 className={typography.legalSectionTitle}>7. Changes to Terms</h2>
                <p className={typography.legalParagraph}>
                  We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (page === "privacy") {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <SportBackground variant="legal" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <Button variant="ghost" onClick={onBack} className="mb-4 hover:underline">
            ← Back
          </Button>
          <h1 className={typography.legalPageTitle}>
            <Shield className="w-8 h-8" />
            Privacy Policy
          </h1>
          <p className={typography.legalPageDescription}>
            Last updated: October 12, 2025
          </p>

          <Card>
            <CardContent className="pt-6 space-y-6">
              <section>
                <h2 className={typography.legalSectionTitle}>1. Information We Collect</h2>
                <p className={typography.legalParagraph}>
                  We collect information you provide directly to us, including name, email address, profile information, and tournament registration details. We also collect usage data and analytics.
                </p>
              </section>

              <section>
                <h2 className={typography.legalSectionTitle}>2. How We Use Your Information</h2>
                <p className={typography.legalParagraph}>
                  We use your information to provide and improve our services, process tournament registrations, communicate with you, and personalize your experience.
                </p>
              </section>

              <section>
                <h2 className={typography.legalSectionTitle}>3. Information Sharing</h2>
                <p className={typography.legalParagraph}>
                  We do not sell your personal information. We may share information with tournament organizers, service providers, and as required by law.
                </p>
              </section>

              <section>
                <h2 className={typography.legalSectionTitle}>4. Data Security</h2>
                <p className={typography.legalParagraph}>
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, or destruction.
                </p>
              </section>

              <section>
                <h2 className={typography.legalSectionTitle}>5. Your Rights</h2>
                <p className={typography.legalParagraph}>
                  You have the right to access, update, or delete your personal information. You can also opt-out of marketing communications at any time.
                </p>
              </section>

              <section>
                <h2 className={typography.legalSectionTitle}>6. Cookies and Tracking</h2>
                <p className={typography.legalParagraph}>
                  We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content. See our Cookie Policy for more details.
                </p>
              </section>

              <section>
                <h2 className={typography.legalSectionTitle}>7. Children's Privacy</h2>
                <p className={typography.legalParagraph}>
                  Our services are not intended for children under 13. We do not knowingly collect personal information from children.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Cookies page
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SportBackground variant="legal" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <Button variant="ghost" onClick={onBack} className="mb-4 hover:underline">
          ← Back
        </Button>
        <h1 className={typography.legalPageTitle}>
          <Cookie className="w-8 h-8" />
          Cookie Policy
        </h1>
        <p className={typography.legalPageDescription}>
          Last updated: October 12, 2025
        </p>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <section>
              <h2 className={typography.legalSectionTitle}>1. What Are Cookies</h2>
              <p className={typography.legalParagraph}>
                Cookies are small text files stored on your device when you visit our website. They help us provide you with a better experience and understand how you use our services.
              </p>
            </section>

            <section>
              <h2 className={typography.legalSectionTitle}>2. Types of Cookies We Use</h2>
              <div className="space-y-3">
                <p className={typography.legalParagraph}><strong>Essential Cookies:</strong> Required for the website to function properly, including authentication and security.</p>
                <p className={typography.legalParagraph}><strong>Performance Cookies:</strong> Help us understand how visitors interact with our website by collecting anonymous information.</p>
                <p className={typography.legalParagraph}><strong>Functional Cookies:</strong> Remember your preferences and personalize your experience.</p>
                <p className={typography.legalParagraph}><strong>Analytics Cookies:</strong> Help us analyze website traffic and improve our services.</p>
              </div>
            </section>

            <section>
              <h2 className={typography.legalSectionTitle}>3. Third-Party Cookies</h2>
              <p className={typography.legalParagraph}>
                We may use third-party services (such as analytics providers) that also use cookies. These cookies are subject to the respective privacy policies of these external services.
              </p>
            </section>

            <section>
              <h2 className={typography.legalSectionTitle}>4. Managing Cookies</h2>
              <p className={typography.legalParagraph}>
                You can control and manage cookies through your browser settings. However, disabling cookies may affect the functionality of our website.
              </p>
            </section>

            <section>
              <h2 className={typography.legalSectionTitle}>5. Cookie Consent</h2>
              <p className={typography.legalParagraph}>
                By continuing to use our website, you consent to our use of cookies as described in this policy. You can withdraw consent at any time by adjusting your browser settings.
              </p>
            </section>

            <section>
              <h2 className={typography.legalSectionTitle}>6. Updates to This Policy</h2>
              <p className={typography.legalParagraph}>
                We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
