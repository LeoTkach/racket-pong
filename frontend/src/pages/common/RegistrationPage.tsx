import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tournament } from "../../components/tournaments/TournamentCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Checkbox } from "../../components/ui/checkbox";
import { Badge } from "../../components/ui/badge";
import { ArrowLeft, Calendar, MapPin, Users, Trophy, CheckCircle2, DollarSign, Loader2, UserPlus, Mail } from "lucide-react";
import { ImageWithFallback } from "../../components/common/image/ImageWithFallback";
import Aurora from "../../components/common/backgrounds/Aurora";
import { SportBackground } from "../../components/common/backgrounds/sport-background/SportBackground";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { apiClient } from "../../api/client";
import { typography } from "../../utils/typography";
import { cn } from "../../components/ui/utils";

interface RegistrationPageProps {
  tournament: Tournament;
  onBack: () => void;
  isLoggedIn?: boolean;
}

export function RegistrationPage({ tournament, onBack, isLoggedIn = false }: RegistrationPageProps) {
  const { user } = useAuth();
  const [showAccountPrompt, setShowAccountPrompt] = useState(!isLoggedIn);
  const [registrationType, setRegistrationType] = useState<'account' | 'guest' | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    country: "",
    agreedToTerms: false,
  });
  const [isRegistering, setIsRegistering] = useState(false);

  // Determine theme for Aurora
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return !document.documentElement.classList.contains('light');
    }
    return true; // Default for SSR
  });

  // Track theme changes
  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = !document.documentElement.classList.contains('light');
      setIsDark(isDarkMode);
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const handleQuickRegistration = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to register");
      return;
    }

    try {
      setIsRegistering(true);
      await apiClient.registerForTournament(tournament.id, user.id);
      toast.success(`Successfully registered for ${tournament.name}!`, {
        description: "You will receive a confirmation email shortly.",
      });
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err: any) {
      console.error('Error registering for tournament:', err);
      toast.error(err.message || "Failed to register for tournament. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreedToTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    try {
      setIsRegistering(true);
      
      const guestData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        country: formData.country,
      };

      await apiClient.registerGuestForTournament(tournament.id, guestData);
      
      toast.success("Registration submitted successfully!", {
        description: "You will receive a confirmation email shortly with tournament details and your certificate after the event.",
      });

      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err: any) {
      console.error('Error registering as guest:', err);
      toast.error(err.message || "Failed to register. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Format date and time helpers
  const formatDate = (dateString: string) => {
    if (dateString.includes(" at ")) {
      const datePart = dateString.split(" at ")[0];
      try {
        return new Date(datePart).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        return datePart;
      }
    }
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string, tournamentTime?: string) => {
    if (dateString.includes(" at ")) {
      const timePart = dateString.split(" at ")[1];
      if (timePart) {
        try {
          if (timePart.includes(':')) {
            const [hours, minutes] = timePart.split(':');
            const date = new Date(`2000-01-01T${hours}:${minutes}`);
            return date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });
          }
          return timePart;
        } catch {
          return timePart;
        }
      }
      return "TBA";
    }
    return tournamentTime || "TBA";
  };

  // Quick registration for logged-in users
  if (isLoggedIn) {
    // Handle both Tournament and ApiTournament types
    const imageUrl = (tournament as any).image_url || tournament.imageUrl || "";
    const tournamentTime = (tournament as any).time || "";
    const participantCount = (tournament as any).participant_count || (tournament as any).current_participants || tournament.participants || 0;

    return (
      <div className="min-h-screen bg-background relative">
        {/* Aurora Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Aurora
            key={`aurora-${isDark ? 'dark' : 'light'}`}
            isDarkTheme={isDark}
            amplitude={1.5}
            blend={0.8}
            speed={0.6}
          />
        </div>

        {/* Header */}
        <motion.div
          className="border-b border-border/40 relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="max-w-7xl mx-auto px-8 py-6">
            <Button
              variant="ghost"
              onClick={onBack}
              className="hover:underline -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </motion.div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-8 py-16 relative z-10">
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Quick Registration Card */}
            <Card className="border-border/40 bg-card/95 backdrop-blur-sm shadow-lg">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold mb-4">Quick Registration</h2>
                  <div className="inline-block">
                    <h3 className="text-xl font-semibold text-primary mb-1">{tournament.name}</h3>
                    <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
                  </div>
                </div>

                {/* Compact Tournament Info */}
                <div className="flex flex-wrap items-center justify-center gap-y-3 text-sm text-muted-foreground mb-6 pb-6 border-b border-border/40">
                  <div className="flex items-center gap-2 px-3">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(tournament.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 border-l border-border/40">
                    <MapPin className="w-4 h-4" />
                    <span>{tournament.location}</span>
                  </div>
                </div>

                {/* User Info */}
                <div className="bg-muted border border-border p-4 rounded-lg mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium mb-1">Registering as: {user?.full_name || user?.username || 'Alex Johnson'}</h4>
                      <p className="text-sm text-muted-foreground">
                        Your profile information will be used
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={handleQuickRegistration}
                    disabled={isRegistering}
                    className="bg-gradient-to-r from-primary to-primary/80 text-black hover:from-primary/75 hover:to-primary/55 h-12 shadow-xl hover:shadow-2xl"
                    style={{
                      paddingLeft: '2.5rem',
                      paddingRight: '2.5rem',
                    }}
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Confirm Registration
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onBack}
                    className="h-12"
                    style={{
                      paddingLeft: '2.5rem',
                      paddingRight: '2.5rem',
                    }}
                  >
                    Cancel
                  </Button>
                </div>

                {/* Terms Notice */}
                <p className="text-xs text-muted-foreground text-center mt-4">
                  By confirming, you agree to the tournament rules
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Account creation prompt for non-logged-in users
  if (showAccountPrompt && !registrationType) {
    return (
      <div className="min-h-screen bg-background relative">
        {/* Aurora Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Aurora
            key={`aurora-${isDark ? 'dark' : 'light'}`}
            isDarkTheme={isDark}
            amplitude={1.5}
            blend={0.8}
            speed={0.6}
          />
        </div>

        {/* Header */}
        <motion.div
          className="border-b border-border/40 relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="max-w-7xl mx-auto px-8 py-6">
            <Button
              variant="ghost"
              onClick={onBack}
              className="hover:underline -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </motion.div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-8 py-16 relative z-10">
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Account Prompt Card */}
            <Card className="border-border/40 bg-card/95 backdrop-blur-sm shadow-lg">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold mb-4">Tournament Registration</h2>
                  <div className="inline-block">
                    <h3 className="text-xl font-semibold text-primary mb-1">{tournament.name}</h3>
                    <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
                  </div>
                </div>

                {/* Compact Tournament Info */}
                <div className="flex flex-wrap items-center justify-center gap-y-3 text-sm text-muted-foreground mb-8 pb-6 border-b border-border/40">
                  <div className="flex items-center gap-2 px-3">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(tournament.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 border-l border-border/40">
                    <MapPin className="w-4 h-4" />
                    <span>{tournament.location}</span>
                  </div>
                </div>

                {/* Registration Options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-center mb-6">Choose Registration Method</h3>
                  
                  {/* Create Account Option */}
                  <div 
                    className="p-6 border-2 border-primary/20 rounded-lg hover:border-primary/40 transition-colors cursor-pointer bg-primary/5"
                    onClick={() => {
                      // Navigate to signup page with return URL
                      window.location.href = `/signup?return=/tournaments/${tournament.id}/register`;
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <UserPlus className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2 text-lg">Create Account & Register</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Get full access to the platform, track your tournament history, view statistics, and manage your profile.
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            Track all your tournaments
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            View detailed statistics and ratings
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            Unlock achievements and badges
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Guest Registration Option */}
                  <div 
                    className="p-6 border-2 border-border/40 rounded-lg hover:border-border/60 transition-colors cursor-pointer"
                    onClick={() => {
                      setRegistrationType('guest');
                      setShowAccountPrompt(false);
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <Mail className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2 text-lg">Quick Guest Registration</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Register for this tournament only. You'll receive tournament updates and certificates via email.
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                            Participate in this tournament
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                            Receive email updates and certificates
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                            No account required
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Guest registration form
  return (
    <div className="min-h-screen bg-background relative">
      {/* Aurora Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Aurora
          key={`aurora-${isDark ? 'dark' : 'light'}`}
          isDarkTheme={isDark}
          amplitude={1.5}
          blend={0.8}
          speed={0.6}
        />
      </div>

      {/* Header */}
      <motion.div
        className="border-b border-border/40 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-7xl mx-auto px-8 py-6">
          <Button
            variant="ghost"
            onClick={() => {
              if (registrationType === 'guest') {
                setRegistrationType(null);
                setShowAccountPrompt(true);
              } else {
                onBack();
              }
            }}
            className="hover:underline -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-8 py-16 relative z-10">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-border/40 bg-card/95 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle>Guest Registration</CardTitle>
                  <CardDescription>
                    Fill in your details to register for {tournament.name}
                  </CardDescription>
                </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleChange("firstName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleChange("lastName", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleChange("country", e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.agreedToTerms}
                      onCheckedChange={(checked: boolean | "indeterminate") => handleChange("agreedToTerms", !!checked)}
                    />
                    <Label htmlFor="terms" className="text-sm cursor-pointer">
                      I agree to the tournament rules and regulations
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full bg-gradient-to-r from-primary to-primary/80 text-black hover:from-primary/75 hover:to-primary/55 shadow-xl hover:shadow-2xl"
                    size="lg"
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Complete Registration
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    You will receive tournament updates and your participation certificate via email after the event.
                  </p>
                </form>
              </CardContent>
            </Card>
        </motion.div>
      </div>
    </div>
  );
}
