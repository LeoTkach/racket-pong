import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { SportBackground } from "../../components/common/backgrounds/sport-background/SportBackground";
import { toast } from "sonner";

interface ResetPasswordPageProps {
  onBack: () => void;
}

export function ResetPasswordPage({ onBack }: ResetPasswordPageProps) {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    // Simulate sending reset email
    setTimeout(() => {
      setIsSubmitted(true);
      toast.success("Password reset link sent!", {
        description: "Check your email for further instructions.",
      });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      <SportBackground variant="details" />
      
      <div className="max-w-md w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              {!isSubmitted 
                ? "Enter your email address and we'll send you a link to reset your password"
                : "Check your email"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12">
                  Send Reset Link
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Remember your password?{" "}
                  <button
                    type="button"
                    onClick={onBack}
                    className="text-primary hover:underline text-xs"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    We've sent a password reset link to:
                  </p>
                  <p className="font-medium mb-6">{email}</p>
                  
                  <p className="text-xs text-muted-foreground mb-4">
                    Didn't receive the email? Check your spam folder or{" "}
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="text-primary hover:underline font-medium"
                    >
                      try again
                    </button>
                  </p>
                </div>

                <Button variant="outline" onClick={onBack} className="w-full">
                  Back to Sign In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
