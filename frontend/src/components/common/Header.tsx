import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { Logo } from "./logo/Logo";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "../ui/button";
import { useAuth } from "../../contexts/AuthContext";
import { typography } from "../../utils/typography";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <nav className="border-b bg-card sticky top-0 z-[100]" style={{ willChange: 'auto', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
            <Logo />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className={typography.navLink}>Home</Link>
            <Link to="/tournaments" className={typography.navLink}>Tournaments</Link>
            <Link to="/leaderboard" className={typography.navLink}>Leaderboard</Link>
            <Link to="/profile" className={typography.navLink}>Profile</Link>
            <ThemeToggle />
            {!user && (
              <Button size="sm" onClick={() => navigate('/signin')} className="hover:underline">Sign In</Button>
            )}
          </div>
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-card/95 backdrop-blur-lg border-b shadow-xl md:hidden z-[100] animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col p-4 space-y-1">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={typography.navLinkMobile}>Home</Link>
            <Link to="/tournaments" onClick={() => setIsMobileMenuOpen(false)} className={typography.navLinkMobile}>Tournaments</Link>
            <Link to="/leaderboard" onClick={() => setIsMobileMenuOpen(false)} className={typography.navLinkMobile}>Leaderboard</Link>
            <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className={typography.navLinkMobile}>Profile</Link>
            {!user && (
              <div className="pt-2">
                <Button size="sm" className="w-full h-11 hover:underline" onClick={() => { navigate('/signin'); setIsMobileMenuOpen(false); }}>Sign In</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

