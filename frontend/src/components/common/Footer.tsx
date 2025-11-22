import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "./logo/Logo";
import { typography } from "../../utils/typography";
import { cn } from "../ui/utils";

export function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-card border-t py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-row flex-wrap gap-6">
          <div className="max-w-[350px] min-w-[250px] flex-[0_1_auto]" style={{ maxWidth: '350px', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            <div className="mb-4">
              <Logo />
            </div>
            <p className={cn(typography.footerDescription, "break-words")}>
              The world's leading platform for table tennis tournament organization and registration.
            </p>
          </div>
          <div className="flex-1 min-w-[150px]">
            <h3 className={cn(typography.footerTitle, "mb-4")}>Quick Links</h3>
            <div className="space-y-0.5">
              <Link to="/" className={cn(typography.footerLink, "block")}>Home</Link>
              <Link to="/tournaments" className={cn(typography.footerLink, "block")}>Browse Tournaments</Link>
              <Link to="/leaderboard" className={cn(typography.footerLink, "block")}>Leaderboard</Link>
              <Link to="/profile" className={cn(typography.footerLink, "block")}>Profile</Link>
            </div>
          </div>
          <div className="flex-1 min-w-[150px]">
            <div className={cn(typography.footerTitle, "mb-4 opacity-0 pointer-events-none")} style={{ lineHeight: '1.5rem', height: '1.5rem' }}>
              &nbsp;
            </div>
            <div className="space-y-0.5">
              <Link to="/settings" className={cn(typography.footerLink, "block")}>Settings</Link>
              <Link to="/create-tournament" className={cn(typography.footerLink, "block")}>Create Tournament</Link>
              <Link to="/my-tournaments" className={cn(typography.footerLink, "block")}>My Tournaments</Link>
            </div>
          </div>
          <div className="flex-1 min-w-[150px]">
            <h3 className={cn(typography.footerTitle, "mb-4")}>Support</h3>
            <div className="space-y-0.5">
              <button onClick={() => navigate('/support/help')} className={cn(typography.footerLink, "block")}>Help Center</button>
              <button onClick={() => navigate('/support/contact')} className={cn(typography.footerLink, "block")}>Contact Us</button>
              <button onClick={() => navigate('/support/faq')} className={cn(typography.footerLink, "block")}>FAQs</button>
            </div>
          </div>
          <div className="flex-1 min-w-[150px]">
            <h3 className={cn(typography.footerTitle, "mb-4")}>Legal</h3>
            <div className="space-y-0.5">
              <button onClick={() => navigate('/legal/terms')} className={cn(typography.footerLink, "block")}>Terms of Service</button>
              <button onClick={() => navigate('/legal/privacy')} className={cn(typography.footerLink, "block")}>Privacy Policy</button>
              <button onClick={() => navigate('/legal/cookies')} className={cn(typography.footerLink, "block")}>Cookie Policy</button>
            </div>
          </div>
        </div>
        <div className={cn("border-t mt-8 pt-8 text-center", typography.footerCopyright)}>
          <p>&copy; 2025 Racket Pong. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

