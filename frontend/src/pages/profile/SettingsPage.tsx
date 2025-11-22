import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { Separator } from "../../components/ui/separator";
import { SportBackground } from "../../components/common/backgrounds/sport-background/SportBackground";
import { ChangePasswordDialog } from "../../components/common/profile/modals/ChangePasswordDialog";
import { Settings, Bell, Shield, Lock, Trash2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import { typography } from "../../utils/typography";
import { cn } from "../../components/ui/utils";

interface SettingsPageProps {
  onBack?: () => void;
  onNavigateToResetPassword?: () => void;
}

export function SettingsPage({ onBack, onNavigateToResetPassword }: SettingsPageProps) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("utc+0");
  
  const [tournamentNotifications, setTournamentNotifications] = useState(true);
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [achievementNotifications, setAchievementNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [statsVisibility, setStatsVisibility] = useState(true);
  const [matchHistory, setMatchHistory] = useState(false);
  const [achievementsVisibility, setAchievementsVisibility] = useState(true);
  
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  
  // Load settings
  useEffect(() => {
    if (user?.id) {
      loadSettings();
    }
  }, [user]);
  
  const loadSettings = async () => {
    try {
      setLoading(true);
      console.log('[SettingsPage] Loading settings for user:', user!.id);
      const settings = await apiClient.getUserSettings(user!.id);
      console.log('[SettingsPage] Loaded settings from server:', settings);
      
      setLanguage(settings.language || "en");
      setTimezone(settings.timezone || "utc+0");
      setTournamentNotifications(settings.tournament_notifications ?? true);
      setMatchNotifications(settings.match_notifications ?? true);
      setAchievementNotifications(settings.achievement_notifications ?? true);
      setEmailNotifications(settings.email_notifications ?? true);
      const profileVis = settings.profile_visibility ?? true;
      setProfileVisibility(profileVis);
      // Если профиль не публичный, все остальные настройки приватности должны быть выключены
      if (!profileVis) {
        setStatsVisibility(false);
        setMatchHistory(false);
        setAchievementsVisibility(false);
      } else {
        setStatsVisibility(settings.stats_visibility ?? true);
        setMatchHistory(settings.match_history_visibility ?? false);
        setAchievementsVisibility(settings.achievements_visibility ?? true);
      }
      
      console.log('[SettingsPage] State after loading:', {
        language: settings.language || "en",
        timezone: settings.timezone || "utc+0",
        tournamentNotifications: settings.tournament_notifications ?? true,
        matchNotifications: settings.match_notifications ?? true,
        achievementNotifications: settings.achievement_notifications ?? true,
        emailNotifications: settings.email_notifications ?? true,
        profileVisibility: profileVis,
        statsVisibility: !profileVis ? false : (settings.stats_visibility ?? true),
        matchHistory: !profileVis ? false : (settings.match_history_visibility ?? false),
        achievementsVisibility: !profileVis ? false : (settings.achievements_visibility ?? true),
      });
    } catch (error) {
      console.error("[SettingsPage] Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };
  
  const saveSettingsWithData = async (settingsData?: {
    language?: string;
    timezone?: string;
    tournament_notifications?: boolean;
    match_notifications?: boolean;
    achievement_notifications?: boolean;
    email_notifications?: boolean;
    profile_visibility?: boolean;
    stats_visibility?: boolean;
    match_history_visibility?: boolean;
    achievements_visibility?: boolean;
  }) => {
    if (!user?.id) return;
    
    const settingsToSave = settingsData || {
      language,
      timezone,
      tournament_notifications: tournamentNotifications,
      match_notifications: matchNotifications,
      achievement_notifications: achievementNotifications,
      email_notifications: emailNotifications,
      profile_visibility: profileVisibility,
      stats_visibility: statsVisibility,
      match_history_visibility: matchHistory,
      achievements_visibility: achievementsVisibility,
    };
    
    console.log('[SettingsPage] Saving settings for user:', user.id);
    console.log('[SettingsPage] Settings to save:', settingsToSave);
    
    try {
      setSaving(true);
      const savedSettings = await apiClient.updateUserSettings(user.id, settingsToSave);
      console.log('[SettingsPage] Settings saved, response from server:', savedSettings);
      
      // Обновляем состояние из ответа сервера - используем значения из savedSettings напрямую
      if (savedSettings) {
        console.log('[SettingsPage] Updating state from server response:', savedSettings);
        
        // Используем значения из settingsData если они переданы, иначе из savedSettings
        const finalLanguage = settingsData?.language ?? savedSettings.language ?? language;
        const finalTimezone = settingsData?.timezone ?? savedSettings.timezone ?? timezone;
        const finalTournamentNotifications = settingsData?.tournament_notifications ?? savedSettings.tournament_notifications ?? tournamentNotifications;
        const finalMatchNotifications = settingsData?.match_notifications ?? savedSettings.match_notifications ?? matchNotifications;
        const finalAchievementNotifications = settingsData?.achievement_notifications ?? savedSettings.achievement_notifications ?? achievementNotifications;
        const finalEmailNotifications = settingsData?.email_notifications ?? savedSettings.email_notifications ?? emailNotifications;
        const finalProfileVisibility = settingsData?.profile_visibility ?? savedSettings.profile_visibility ?? profileVisibility;
        const finalStatsVisibility = settingsData?.stats_visibility ?? savedSettings.stats_visibility ?? statsVisibility;
        const finalMatchHistory = settingsData?.match_history_visibility ?? savedSettings.match_history_visibility ?? matchHistory;
        const finalAchievementsVisibility = settingsData?.achievements_visibility ?? savedSettings.achievements_visibility ?? achievementsVisibility;
        
        setLanguage(finalLanguage);
        setTimezone(finalTimezone);
        setTournamentNotifications(finalTournamentNotifications);
        setMatchNotifications(finalMatchNotifications);
        setAchievementNotifications(finalAchievementNotifications);
        setEmailNotifications(finalEmailNotifications);
        setProfileVisibility(finalProfileVisibility);
        setStatsVisibility(finalStatsVisibility);
        setMatchHistory(finalMatchHistory);
        setAchievementsVisibility(finalAchievementsVisibility);
        
        console.log('[SettingsPage] Final achievementsVisibility:', finalAchievementsVisibility);
        console.log('[SettingsPage] State updated from server response');
      }
      
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("[SettingsPage] Error saving settings:", error);
      toast.error("Failed to save settings");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    await saveSettingsWithData();
  };

  const navigate = useNavigate();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void | Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    action: () => {},
  });

  const handleNotificationChange = async (
    type: string,
    value: boolean,
    setter: (value: boolean) => void
  ) => {
    setter(value);
    // Обновляем состояние немедленно и сохраняем
    const updatedSettings = {
      language,
      timezone,
      tournament_notifications: type === "event registration" ? value : tournamentNotifications,
      match_notifications: type === "match results" ? value : matchNotifications,
      achievement_notifications: type === "achievement" ? value : achievementNotifications,
      email_notifications: type === "email" ? value : emailNotifications,
      profile_visibility: profileVisibility,
      stats_visibility: statsVisibility,
      match_history_visibility: matchHistory,
      achievements_visibility: achievementsVisibility,
    };
    
    console.log('[SettingsPage] handleNotificationChange - type:', type, 'value:', value);
    console.log('[SettingsPage] Updated settings to save:', updatedSettings);
    
    await saveSettingsWithData(updatedSettings);
    toast.success(`${type} notifications ${value ? "enabled" : "disabled"}`);
  };

  const handlePrivacyChange = async (
    type: string,
    value: boolean,
    setter: (value: boolean) => void
  ) => {
    // Если пытаются включить настройку приватности, но профиль не публичный - запрещаем
    if (type !== "public profile" && value && !profileVisibility) {
      toast.error("Please enable public profile first");
      return;
    }
    
    // Если отключается публичный профиль - показываем модалку подтверждения
    if (type === "public profile" && !value) {
      setConfirmDialog({
        open: true,
        title: "Disable Public Profile",
        description: "Are you sure you want to make your profile private? This will disable all other privacy settings (statistics, match history, achievements) and hide your profile from other players.",
        action: async () => {
          setter(value);
          setStatsVisibility(false);
          setMatchHistory(false);
          setAchievementsVisibility(false);
          
          const updatedSettings = {
            language,
            timezone,
            tournament_notifications: tournamentNotifications,
            match_notifications: matchNotifications,
            achievement_notifications: achievementNotifications,
            email_notifications: emailNotifications,
            profile_visibility: value,
            stats_visibility: false,
            match_history_visibility: false,
            achievements_visibility: false,
          };
          
          console.log('[SettingsPage] handlePrivacyChange (disable profile) - updated settings:', updatedSettings);
          await saveSettingsWithData(updatedSettings);
          toast.success(`${type} ${value ? "enabled" : "disabled"}`);
        },
      });
      return;
    }
    
    // Сначала формируем обновленные настройки с новым значением
    const updatedSettings = {
      language,
      timezone,
      tournament_notifications: tournamentNotifications,
      match_notifications: matchNotifications,
      achievement_notifications: achievementNotifications,
      email_notifications: emailNotifications,
      profile_visibility: type === "public profile" ? value : profileVisibility,
      stats_visibility: type === "statistics visibility" ? value : statsVisibility,
      match_history_visibility: type === "match history" ? value : matchHistory,
      achievements_visibility: type === "achievements visibility" ? value : achievementsVisibility,
    };
    
    console.log('[SettingsPage] handlePrivacyChange - type:', type, 'value:', value);
    console.log('[SettingsPage] Current achievementsVisibility state:', achievementsVisibility);
    console.log('[SettingsPage] Updated settings to save:', updatedSettings);
    
    // Обновляем состояние и сохраняем
    setter(value);
    await saveSettingsWithData(updatedSettings);
    
    console.log('[SettingsPage] After setter, achievementsVisibility should be:', value);
    toast.success(`${type} ${value ? "enabled" : "disabled"}`);
  };

  const handleDeleteAccount = () => {
    setConfirmDialog({
      open: true,
      title: "Delete Account",
      description: "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.",
      action: () => {
        toast.error("Account deletion initiated. You will receive a confirmation email.");
      },
    });
  };

  const handlePasswordChange = () => {
    toast.success("Password change link sent to your email");
  };

  const handleLogout = () => {
    setConfirmDialog({
      open: true,
      title: "Logout",
      description: "Are you sure you want to sign out of your account?",
      action: () => {
        logout();
        toast.success("Logged out successfully");
        navigate("/");
      },
    });
  };


  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SportBackground variant="profile" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 hover:underline">
            ← Back
          </Button>
          <h1 className={typography.settingsPageTitle}>
            <Settings className="w-8 h-8" />
            Settings
          </h1>
          <p className={typography.settingsPageDescription}>
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Account Settings
              </CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={async (value) => { 
                    setLanguage(value);
                    await saveSettingsWithData({
                      language: value,
                      timezone,
                      tournament_notifications: tournamentNotifications,
                      match_notifications: matchNotifications,
                      achievement_notifications: achievementNotifications,
                      email_notifications: emailNotifications,
                      profile_visibility: profileVisibility,
                      stats_visibility: statsVisibility,
                      match_history_visibility: matchHistory,
                      achievements_visibility: achievementsVisibility,
                    });
                  }}>
                    <SelectTrigger id="language" className="mt-2">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ru">Русский (Russian)</SelectItem>
                      <SelectItem value="uk">Українська (Ukrainian)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={async (value) => { 
                    setTimezone(value);
                    await saveSettingsWithData({
                      language,
                      timezone: value,
                      tournament_notifications: tournamentNotifications,
                      match_notifications: matchNotifications,
                      achievement_notifications: achievementNotifications,
                      email_notifications: emailNotifications,
                      profile_visibility: profileVisibility,
                      stats_visibility: statsVisibility,
                      match_history_visibility: matchHistory,
                      achievements_visibility: achievementsVisibility,
                    });
                  }}>
                    <SelectTrigger id="timezone" className="mt-2">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="utc-12">UTC-12 (Baker Island)</SelectItem>
                      <SelectItem value="utc-11">UTC-11 (American Samoa)</SelectItem>
                      <SelectItem value="utc-10">UTC-10 (Hawaii)</SelectItem>
                      <SelectItem value="utc-9">UTC-9 (Alaska)</SelectItem>
                      <SelectItem value="utc-8">UTC-8 (Pacific Time)</SelectItem>
                      <SelectItem value="utc-7">UTC-7 (Mountain Time)</SelectItem>
                      <SelectItem value="utc-6">UTC-6 (Central Time)</SelectItem>
                      <SelectItem value="utc-5">UTC-5 (Eastern Time)</SelectItem>
                      <SelectItem value="utc-4">UTC-4 (Atlantic Time)</SelectItem>
                      <SelectItem value="utc-3">UTC-3 (Buenos Aires, São Paulo)</SelectItem>
                      <SelectItem value="utc-2">UTC-2 (Mid-Atlantic)</SelectItem>
                      <SelectItem value="utc-1">UTC-1 (Azores)</SelectItem>
                      <SelectItem value="utc+0">UTC+0 (GMT, London)</SelectItem>
                      <SelectItem value="utc+1">UTC+1 (Central European Time)</SelectItem>
                      <SelectItem value="utc+2">UTC+2 (Eastern European Time, Kyiv)</SelectItem>
                      <SelectItem value="utc+3">UTC+3 (Moscow, Istanbul)</SelectItem>
                      <SelectItem value="utc+4">UTC+4 (Dubai)</SelectItem>
                      <SelectItem value="utc+5">UTC+5 (Pakistan)</SelectItem>
                      <SelectItem value="utc+5:30">UTC+5:30 (India)</SelectItem>
                      <SelectItem value="utc+6">UTC+6 (Bangladesh)</SelectItem>
                      <SelectItem value="utc+7">UTC+7 (Bangkok, Jakarta)</SelectItem>
                      <SelectItem value="utc+8">UTC+8 (China, Singapore)</SelectItem>
                      <SelectItem value="utc+9">UTC+9 (Japan, Korea)</SelectItem>
                      <SelectItem value="utc+10">UTC+10 (Sydney, Melbourne)</SelectItem>
                      <SelectItem value="utc+11">UTC+11 (Solomon Islands)</SelectItem>
                      <SelectItem value="utc+12">UTC+12 (New Zealand)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="tournament-notifications">Event Registration</Label>
                  <p className={typography.settingsOptionDescription}>
                    Get notified about successful event registration
                  </p>
                </div>
                <Switch
                  id="tournament-notifications"
                  checked={tournamentNotifications}
                  onCheckedChange={(value: boolean) =>
                    handleNotificationChange("event registration", value, setTournamentNotifications)
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="match-notifications">Match Results</Label>
                  <p className={typography.settingsOptionDescription}>
                    Receive updates about your match results
                  </p>
                </div>
                <Switch
                  id="match-notifications"
                  checked={matchNotifications}
                  onCheckedChange={(value: boolean) =>
                    handleNotificationChange("match results", value, setMatchNotifications)
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="achievement-notifications">Achievements</Label>
                  <p className={typography.settingsOptionDescription}>
                    Get notified when you earn new achievements
                  </p>
                </div>
                <Switch
                  id="achievement-notifications"
                  checked={achievementNotifications}
                  onCheckedChange={(value: boolean) =>
                    handleNotificationChange("achievement", value, setAchievementNotifications)
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className={typography.settingsOptionDescription}>
                    Receive email updates for important events
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={(value: boolean) =>
                    handleNotificationChange("email", value, setEmailNotifications)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security
              </CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-3 block">Password</Label>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowChangePasswordDialog(true)}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
                <p className={cn(typography.settingsOptionDescription, "mt-2")}>
                  Update your password to keep your account secure. If you forgot your password,{" "}
                  <button 
                    onClick={onNavigateToResetPassword}
                    className="text-primary text-sm hover:underline font-normal cursor-pointer"
                  >
                    reset it here
                  </button> or contact support.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <Label className="mb-3 block">Logout</Label>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Logout
                </Button>
                <p className={cn(typography.settingsOptionDescription, "mt-2")}>
                  Sign out of your account
                </p>
              </div>
              
              <Separator />
              
              <div>
                <Label className="mb-3 block">Delete Account</Label>
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleDeleteAccount}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
                <p className={cn(typography.settingsOptionDescription, "mt-2")}>
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy
              </CardTitle>
              <CardDescription>Manage your privacy preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="profile-visibility">Public Profile</Label>
                  <p className={typography.settingsOptionDescription}>
                    Make your profile visible to other players
                  </p>
                </div>
                <Switch
                  id="profile-visibility"
                  checked={profileVisibility}
                  onCheckedChange={(value: boolean) =>
                    handlePrivacyChange("public profile", value, setProfileVisibility)
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="stats-visibility">Show Statistics</Label>
                  <p className={typography.settingsOptionDescription}>
                    Display your match statistics publicly
                  </p>
                </div>
                <Switch
                  id="stats-visibility"
                  checked={statsVisibility}
                  disabled={!profileVisibility}
                  onCheckedChange={(value: boolean) =>
                    handlePrivacyChange("statistics visibility", value, setStatsVisibility)
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="match-history">Match History Visibility</Label>
                  <p className={typography.settingsOptionDescription}>
                    Allow others to see your match history
                  </p>
                </div>
                <Switch
                  id="match-history"
                  checked={matchHistory}
                  disabled={!profileVisibility}
                  onCheckedChange={(value: boolean) =>
                    handlePrivacyChange("match history", value, setMatchHistory)
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="achievements-visibility">Achievements Visibility</Label>
                  <p className={typography.settingsOptionDescription}>
                    Allow others to see your achievements
                  </p>
                </div>
                <Switch
                  id="achievements-visibility"
                  checked={achievementsVisibility}
                  disabled={!profileVisibility}
                  onCheckedChange={(value: boolean) =>
                    handlePrivacyChange("achievements visibility", value, setAchievementsVisibility)
                  }
                />
              </div>
            </CardContent>
          </Card>


        </div>
      </div>

      {/* Confirmation Dialog */}
  <AlertDialog open={confirmDialog.open} onOpenChange={(open: boolean) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent className="sm:max-w-[425px] w-[90%] mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              {confirmDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await confirmDialog.action();
                setConfirmDialog({ ...confirmDialog, open: false });
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={showChangePasswordDialog}
        onOpenChange={setShowChangePasswordDialog}
      />
    </div>
  );
}
