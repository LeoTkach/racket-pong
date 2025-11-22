import React, { useLayoutEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { SportBackground } from "../../components/common/backgrounds/sport-background/SportBackground";
import { HelpCircle, Mail, MessageCircle, Send, ChevronDown } from "lucide-react";
import { typography } from "../../utils/typography";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";

interface SupportPagesProps {
  page: "help" | "contact" | "faq";
  onBack: () => void;
}

export function SupportPages({ page, onBack }: SupportPagesProps) {
  // Прокручиваем страницу вверх при открытии (без анимации, до рендера)
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);
  if (page === "help") {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <SportBackground variant="support" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24 relative z-10">
          <Button variant="ghost" onClick={onBack} className="mb-4 hover:underline">
            ← Back
          </Button>
          <h1 className={typography.supportPageTitle}>
            <HelpCircle className="w-8 h-8" />
            Help Center
          </h1>
          <p className={typography.supportPageDescription}>
            Find answers to common questions and learn how to use Racket Pong
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Learn the basics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className={typography.supportCardText}>• How to create an account</p>
                <p className={typography.supportCardText}>• Finding tournaments</p>
                <p className={typography.supportCardText}>• Registration process</p>
                <p className={typography.supportCardText}>• Understanding rankings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tournament Guide</CardTitle>
                <CardDescription>Everything about tournaments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className={typography.supportCardText}>• Tournament formats</p>
                <p className={typography.supportCardText}>• Rules and regulations</p>
                <p className={typography.supportCardText}>• Match scheduling</p>
                <p className={typography.supportCardText}>• Results submission</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile & Settings</CardTitle>
                <CardDescription>Manage your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className={typography.supportCardText}>• Updating profile information</p>
                <p className={typography.supportCardText}>• Privacy settings</p>
                <p className={typography.supportCardText}>• Notification preferences</p>
                <p className={typography.supportCardText}>• Achievement tracking</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Troubleshooting</CardTitle>
                <CardDescription>Common issues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className={typography.supportCardText}>• Login problems</p>
                <p className={typography.supportCardText}>• Registration errors</p>
                <p className={typography.supportCardText}>• Payment issues</p>
                <p className={typography.supportCardText}>• Technical support</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (page === "contact") {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <SportBackground variant="support" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24 relative z-10">
          <Button variant="ghost" onClick={onBack} className="mb-4 hover:underline">
            ← Back
          </Button>
          <h1 className={typography.supportPageTitle}>
            <Mail className="w-8 h-8" />
            Contact Us
          </h1>
          <p className={typography.supportPageDescription}>
            Have a question? We're here to help!
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
              <CardDescription>
                We'll get back to you as soon as possible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="your.email@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="What is this about?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us more..."
                    rows={6}
                  />
                </div>
                <Button className="w-full gap-2">
                  <Send className="w-4 h-4" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <Mail className="w-8 h-8 text-primary mb-2" />
                <h3 className={typography.supportContactTitle}>Email</h3>
                <p className={typography.supportContactText}>
                  support@racketpong.com
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <MessageCircle className="w-8 h-8 text-primary mb-2" />
                <h3 className={typography.supportContactTitle}>Live Chat</h3>
                <p className={typography.supportContactText}>
                  Available 24/7
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // FAQ page
  return (
    <div className="bg-background relative">
      <SportBackground variant="support" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-[600px] relative z-10">
        <Button variant="ghost" onClick={onBack} className="mb-4 hover:underline">
          ← Back
        </Button>
        <h1 className={typography.supportPageTitle}>
          <MessageCircle className="w-8 h-8" />
          Frequently Asked Questions
        </h1>
        <p className={typography.supportPageDescription}>
          Quick answers to questions you may have
        </p>

        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="item-1" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger>How do I register for a tournament?</AccordionTrigger>
            <AccordionContent>
              Browse tournaments, select one that interests you, and click the "Register" button. If you're logged in, registration is automatic. Otherwise, you'll need to fill out a registration form.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger>What are the different tournament formats?</AccordionTrigger>
            <AccordionContent>
              We support three formats: Single Elimination (knockout), Round Robin (everyone plays everyone), and Group Stage (groups followed by knockout).
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger>How is the ranking system calculated?</AccordionTrigger>
            <AccordionContent>
              Rankings are based on tournament performance, match wins, and consistency. Points are awarded based on tournament category and placement.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger>Can I cancel my tournament registration?</AccordionTrigger>
            <AccordionContent>
              Yes, you can cancel up to 48 hours before the tournament starts. Go to your profile, find the tournament in your upcoming events, and click "Cancel Registration".
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger>What's the difference between Professional and Amateur categories?</AccordionTrigger>
            <AccordionContent>
              Professional tournaments are for experienced players and typically have higher entry fees and prize pools. Amateur tournaments are designed for recreational players and beginners.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger>How do I earn achievements?</AccordionTrigger>
            <AccordionContent>
              Achievements are earned by reaching milestones like winning tournaments, maintaining win streaks, participating in multiple events, and improving your ranking. Check your profile to see all available achievements.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
            <AccordionContent>
              We accept major credit cards (Visa, MasterCard, American Express), PayPal, and various local payment methods depending on your region.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger>How do I update my profile information?</AccordionTrigger>
            <AccordionContent>
              Go to your profile page and click "Edit Profile". You can update your name, location, bio, and profile picture. Changes are saved automatically when you click "Save Changes".
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
