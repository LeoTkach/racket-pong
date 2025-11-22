import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Calendar } from "../../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { ArrowLeft, Upload, Calendar as CalendarIcon, Users, Loader2, Clock, MoreVertical, User, Trash2, Search, Send, UserPlus, Mail } from "lucide-react";
import { SportBackground } from "../../components/common/backgrounds/sport-background/SportBackground";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "../../contexts/AuthContext";
import { apiClient } from "../../api/client";

interface EditTournamentPageProps {
  tournamentId: number;
  onBack: () => void;
}

export function EditTournamentPage({ tournamentId, onBack }: EditTournamentPageProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [tournamentData, setTournamentData] = useState({
    name: "",
    description: "",
    location: "",
    date: undefined as Date | undefined,
    time: "",
    format: "",
    matchFormat: "",
    maxParticipants: "",
    numGroups: "",
    playersPerGroupAdvance: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [participants, setParticipants] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [removingParticipantId, setRemovingParticipantId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingInvitations, setSendingInvitations] = useState<Set<number>>(new Set());
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestFormData, setGuestFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    country: "",
  });
  const [addingGuest, setAddingGuest] = useState(false);

  // Загружаем данные турнира
  useEffect(() => {
    const fetchTournament = async () => {
      try {
        setFetching(true);
        const response = await apiClient.getTournament(tournamentId);
        const tournament = response.tournament;

        // Парсим дату
        let tournamentDate: Date | undefined;
        if (tournament.date) {
          tournamentDate = new Date(tournament.date);
        }

        // Обрабатываем время - обрезаем секунды если есть (HH:MM:SS -> HH:MM)
        let tournamentTime = tournament.time || "";
        if (tournamentTime && tournamentTime.length > 5) {
          // Если время в формате HH:MM:SS, берем только HH:MM
          tournamentTime = tournamentTime.substring(0, 5);
        }

        // Заполняем форму данными турнира
        setTournamentData({
          name: tournament.name || "",
          description: tournament.description || "",
          location: tournament.location || "",
          date: tournamentDate,
          time: tournamentTime,
          format: tournament.format || "",
          matchFormat: tournament.match_format || "",
          maxParticipants: tournament.max_participants?.toString() || "",
          numGroups: tournament.num_groups?.toString() || "",
          playersPerGroupAdvance: tournament.players_per_group_advance?.toString() || "",
        });

        // Устанавливаем превью изображения, если есть
        if (tournament.image_url) {
          // Если image_url начинается с /uploads, это относительный путь - используем его как есть
          // Если это полный URL, используем его
          const imageUrl = tournament.image_url.startsWith('http')
            ? tournament.image_url
            : `${window.location.protocol}//${window.location.host}${tournament.image_url.startsWith('/') ? '' : '/'}${tournament.image_url}`;
          setImagePreview(imageUrl);
          setExistingImageUrl(tournament.image_url);
        }

        // Загружаем участников турнира (both system and guest players)
        try {
          setLoadingParticipants(true);
          const participantsResponse = await apiClient.getAllTournamentParticipants(tournamentId);
          const participantsList = participantsResponse.participants || participantsResponse || [];
          setParticipants(participantsList);
        } catch (participantsErr: any) {
          console.warn('Failed to load participants:', participantsErr);
          setParticipants([]);
        } finally {
          setLoadingParticipants(false);
        }
      } catch (err: any) {
        console.error('Error fetching tournament:', err);
        toast.error(err.message || 'Failed to load tournament data');
        onBack();
      } finally {
        setFetching(false);
      }
    };

    fetchTournament();
  }, [tournamentId, onBack]);

  const handleSearchPlayers = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      console.log('[Search] Searching for players with query:', query);

      const response = await apiClient.getPlayers({
        search: query,
        limit: 20,
        page: 1
      });

      console.log('[Search] API response:', response);
      console.log('[Search] Players found:', response?.players?.length || 0);

      if (!response || !response.players) {
        console.warn('[Search] Invalid response structure:', response);
        toast.error('Invalid response from server');
        setSearchResults([]);
        return;
      }

      // Filter out players who are already participants
      const participantIds = new Set(participants.map(p => p.id));
      const filteredResults = response.players.filter(
        (player: any) => !participantIds.has(player.id)
      );

      console.log('[Search] Filtered results (excluding participants):', filteredResults.length);
      setSearchResults(filteredResults);

      if (filteredResults.length === 0 && response.players.length > 0) {
        toast.info('All found players are already registered in this tournament');
      }
    } catch (err: any) {
      console.error('[Search] Error searching players:', err);
      console.error('[Search] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      toast.error(err.message || 'Failed to search players. Please try again.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery, participants]);

  // Update search results when participants change
  useEffect(() => {
    if (searchResults.length > 0) {
      const participantIds = new Set(participants.map(p => p.id));
      setSearchResults(prev => prev.filter(p => !participantIds.has(p.id)));
    }
  }, [participants]);

  // Auto-search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      handleSearchPlayers();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearchPlayers]);

  const handleRemoveParticipant = async (participantId: number) => {
    try {
      setRemovingParticipantId(participantId);
      await apiClient.unregisterFromTournament(tournamentId, participantId);

      // Remove participant from local state
      setParticipants(prev => prev.filter(p => p.id !== participantId));

      toast.success("Participant removed from tournament", {
        description: "The player has been successfully removed.",
      });
    } catch (err: any) {
      console.error('Error removing participant:', err);
      toast.error(err.message || "Failed to remove participant. Please try again.");
    } finally {
      setRemovingParticipantId(null);
    }
  };

  const handleViewProfile = (username: string) => {
    // Navigate to player profile
    window.open(`/profile/${username}`, '_blank');
  };

  const handleSendInvitation = async (playerId: number, playerName: string) => {
    try {
      setSendingInvitations(prev => new Set(prev).add(playerId));
      await apiClient.sendTournamentInvitation(tournamentId, playerId, tournamentData.name);
      toast.success("Invitation sent!", {
        description: `Invitation has been sent to ${playerName}`,
      });
      // Remove from search results after sending
      setSearchResults(prev => prev.filter(p => p.id !== playerId));
    } catch (err: any) {
      console.error('Error sending invitation:', err);
      toast.error(err.message || "Failed to send invitation. Please try again.");
    } finally {
      setSendingInvitations(prev => {
        const newSet = new Set(prev);
        newSet.delete(playerId);
        return newSet;
      });
    }
  };

  const handleAddGuestPlayer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestFormData.firstName || !guestFormData.lastName || !guestFormData.email || !guestFormData.country) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setAddingGuest(true);
      
      const guestData = {
        first_name: guestFormData.firstName,
        last_name: guestFormData.lastName,
        email: guestFormData.email,
        country: guestFormData.country,
        registered_by_organizer: true,
      };

      await apiClient.registerGuestForTournament(tournamentId, guestData);
      
      toast.success("Guest player added successfully!", {
        description: `${guestFormData.firstName} ${guestFormData.lastName} has been added to the tournament.`,
      });

      // Reset form
      setGuestFormData({
        firstName: "",
        lastName: "",
        email: "",
        country: "",
      });
      setShowGuestForm(false);

      // Refresh participants list
      try {
        setLoadingParticipants(true);
        const participantsResponse = await apiClient.getAllTournamentParticipants(tournamentId);
        const participantsList = participantsResponse.participants || participantsResponse || [];
        setParticipants(participantsList);
      } catch (participantsErr: any) {
        console.warn('Failed to reload participants:', participantsErr);
      } finally {
        setLoadingParticipants(false);
      }
    } catch (err: any) {
      console.error('Error adding guest player:', err);
      toast.error(err.message || "Failed to add guest player. Please try again.");
    } finally {
      setAddingGuest(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only JPEG, PNG, GIF, and WebP images are allowed");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const oldValue = tournamentData.time;

    // Если удаляем символ - просто удаляем, не форматируем
    if (value.length < oldValue.length) {
      // Разрешаем удаление любых символов, включая ":"
      // Оставляем только цифры и существующие ":"
      value = value.replace(/[^\d:]/g, '');
      // Ограничиваем формат до HH:MM
      if (value.length > 5) {
        value = value.slice(0, 5);
      }
      setTournamentData({ ...tournamentData, time: value });
      return;
    }

    // При вводе - получаем только цифры
    const digitsOnly = value.replace(/[^\d]/g, '');

    // Автоматически добавляем ":" после двух цифр
    if (digitsOnly.length >= 2) {
      value = digitsOnly.slice(0, 2) + ':' + digitsOnly.slice(2, 4);
    } else {
      value = digitsOnly;
    }

    // Ограничиваем до 5 символов (HH:MM)
    if (value.length > 5) {
      value = value.slice(0, 5);
    }

    setTournamentData({ ...tournamentData, time: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error("You must be logged in to update a tournament");
      return;
    }

    const newErrors: Record<string, string> = {};
    let firstErrorField: string | null = null;

    // Validation - проверяем каждое обязательное поле и показываем конкретное сообщение
    if (!tournamentData.name || tournamentData.name.trim() === "") {
      const errorMsg = "Please enter tournament name";
      newErrors.name = errorMsg;
      if (!firstErrorField) firstErrorField = "name";
    }

    if (!tournamentData.location || tournamentData.location.trim() === "") {
      const errorMsg = "Please enter location";
      newErrors.location = errorMsg;
      if (!firstErrorField) firstErrorField = "location";
    }

    if (!tournamentData.date) {
      const errorMsg = "Please select tournament date";
      newErrors.date = errorMsg;
      if (!firstErrorField) firstErrorField = "date";
    } else {
      // Validate date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (tournamentData.date < today) {
        const errorMsg = "Tournament date cannot be in the past";
        newErrors.date = errorMsg;
        if (!firstErrorField) firstErrorField = "date";
      }
    }

    if (!tournamentData.format || tournamentData.format.trim() === "") {
      const errorMsg = "Please select tournament format";
      newErrors.format = errorMsg;
      if (!firstErrorField) firstErrorField = "format";
    }

    if (!tournamentData.matchFormat || tournamentData.matchFormat.trim() === "") {
      const errorMsg = "Please select match format";
      newErrors.matchFormat = errorMsg;
      if (!firstErrorField) firstErrorField = "matchFormat";
    }

    // Validate group stage settings if format is group-stage
    if (tournamentData.format === "group-stage") {
      if (!tournamentData.numGroups || tournamentData.numGroups.trim() === "") {
        const errorMsg = "Please enter number of groups";
        newErrors.numGroups = errorMsg;
        if (!firstErrorField) firstErrorField = "numGroups";
      } else {
        const numGroups = parseInt(tournamentData.numGroups);
        if (isNaN(numGroups) || numGroups < 2) {
          const errorMsg = "Number of groups must be at least 2";
          newErrors.numGroups = errorMsg;
          if (!firstErrorField) firstErrorField = "numGroups";
        }
      }

      if (!tournamentData.playersPerGroupAdvance || tournamentData.playersPerGroupAdvance.trim() === "") {
        const errorMsg = "Please enter number of players advancing per group";
        newErrors.playersPerGroupAdvance = errorMsg;
        if (!firstErrorField) firstErrorField = "playersPerGroupAdvance";
      } else {
        const playersPerGroupAdvance = parseInt(tournamentData.playersPerGroupAdvance);
        if (isNaN(playersPerGroupAdvance) || playersPerGroupAdvance < 1) {
          const errorMsg = "Players advancing per group must be at least 1";
          newErrors.playersPerGroupAdvance = errorMsg;
          if (!firstErrorField) firstErrorField = "playersPerGroupAdvance";
        }
      }
    }

    // Validate max participants
    if (!tournamentData.maxParticipants || tournamentData.maxParticipants.trim() === "") {
      const errorMsg = "Please enter maximum number of participants";
      newErrors.maxParticipants = errorMsg;
      if (!firstErrorField) firstErrorField = "maxParticipants";
    } else {
      const maxPart = parseInt(tournamentData.maxParticipants);
      if (isNaN(maxPart) || maxPart < 2) {
        const errorMsg = "Maximum participants must be at least 2";
        newErrors.maxParticipants = errorMsg;
        if (!firstErrorField) firstErrorField = "maxParticipants";
      }
    }

    // Validate time format if provided
    if (tournamentData.time && tournamentData.time.trim() !== "" && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(tournamentData.time)) {
      const errorMsg = "Please enter a valid time (HH:MM format)";
      newErrors.time = errorMsg;
      if (!firstErrorField) firstErrorField = "time";
    }

    if (Object.keys(newErrors).length > 0) {
      // Set errors immediately - React will re-render
      setErrors(newErrors);

      // Wait for React to update DOM and render error messages
      // Use double requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (firstErrorField) {
              const fieldId = firstErrorField === "date" ? null : firstErrorField;
              if (fieldId) {
                const element = document.getElementById(fieldId) as HTMLElement;
                if (element) {
                  // Explicitly blur any focused elements to prevent auto-focus
                  if (document.activeElement && document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }

                  // Find the parent container that includes both input and error message
                  const container = element.closest('.space-y-2');
                  if (container) {
                    // Scroll to show the entire container including error message
                    // Use 'nearest' to avoid aggressive scrolling
                    container.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    // Add small offset to ensure error message is visible
                    const containerRect = container.getBoundingClientRect();
                    if (containerRect.top < 100) {
                      window.scrollBy({ top: containerRect.top - 100, behavior: 'smooth' });
                    }
                  } else {
                    element.scrollIntoView({ behavior: "smooth", block: "nearest" });
                  }

                  // Prevent any automatic focusing - set tabIndex to -1 temporarily
                  const originalTabIndex = element.getAttribute('tabindex');
                  element.setAttribute('tabindex', '-1');

                  // Explicitly blur if element gets focused
                  const preventFocus = (e?: FocusEvent) => {
                    if (e) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                    if (document.activeElement === element) {
                      element.blur();
                    }
                  };

                  // Add multiple event listeners to prevent focus
                  element.addEventListener('focus', preventFocus, { capture: true, passive: false });
                  element.addEventListener('focusin', preventFocus, { capture: true, passive: false });

                  // Restore tabindex after error is visible (1 second)
                  setTimeout(() => {
                    if (originalTabIndex !== null) {
                      element.setAttribute('tabindex', originalTabIndex);
                    } else {
                      element.removeAttribute('tabindex');
                    }
                    element.removeEventListener('focus', preventFocus, { capture: true } as EventListenerOptions);
                    element.removeEventListener('focusin', preventFocus, { capture: true } as EventListenerOptions);
                  }, 1000);
                }
              } else if (firstErrorField === "date") {
                // For date field, try to find the button or the label container
                const dateButton = document.querySelector('button[aria-label*="date" i], button:has(svg), [data-slot]:has(svg[class*="calendar"])') as HTMLElement;
                if (dateButton) {
                  const dateContainer = dateButton.closest('.space-y-2');
                  if (dateContainer) {
                    dateContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
                  } else {
                    dateButton.scrollIntoView({ behavior: "smooth", block: "nearest" });
                  }
                } else {
                  // Try to find by label text
                  const labels = Array.from(document.querySelectorAll("label"));
                  const dateLabel = labels.find(label => label.textContent?.includes("Date"));
                  if (dateLabel) {
                    const dateContainer = dateLabel.closest(".space-y-2");
                    if (dateContainer) {
                      (dateContainer as HTMLElement).scrollIntoView({ behavior: "smooth", block: "nearest" });
                    }
                  }
                }
              }
            }
          }, 100);
        });
      });

      return;
    }

    // Clear errors if validation passed
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }

    try {
      setLoading(true);

      // Upload image first if there's a new image file
      let imageUrl: string | null = existingImageUrl;
      let shouldGenerateDefault = false;

      if (imageFile) {
        try {
          const uploadResult = await apiClient.uploadTournamentImage(imageFile);
          imageUrl = uploadResult.imageUrl;
        } catch (uploadError: any) {
          console.error('Error uploading image:', uploadError);
          toast.error(uploadError.message || 'Failed to upload image');
          setLoading(false);
          return;
        }
      } else if (!imagePreview) {
        // If no image preview (either removed or never had one), set to null and flag for generation
        imageUrl = null;
        shouldGenerateDefault = true;
      }

      // Format date as YYYY-MM-DD
      const formattedDate = format(tournamentData.date!, "yyyy-MM-dd");
      const maxPart = parseInt(tournamentData.maxParticipants);

      // Prepare tournament data for API
      const tournamentPayload: any = {
        name: tournamentData.name,
        description: tournamentData.description || null,
        location: tournamentData.location,
        venue: null, // Not used - location contains all information
        date: formattedDate,
        time: tournamentData.time || null,
        format: tournamentData.format,
        match_format: tournamentData.matchFormat,
        max_participants: maxPart,
        image_url: imageUrl,
      };

      // Add group stage settings if format is group-stage
      if (tournamentData.format === "group-stage") {
        tournamentPayload.num_groups = parseInt(tournamentData.numGroups);
        tournamentPayload.players_per_group_advance = parseInt(tournamentData.playersPerGroupAdvance);
      } else {
        // Clear group stage settings if format is not group-stage
        tournamentPayload.num_groups = null;
        tournamentPayload.players_per_group_advance = null;
      }

      await apiClient.updateTournament(tournamentId, tournamentPayload);

      // If tournament has no image, generate default image
      if (shouldGenerateDefault) {
        try {
          console.log('Generating default image for tournament', tournamentId);
          const { generateTournamentImage } = await import("../../utils/generateTournamentImage");
          const defaultImageFile = await generateTournamentImage(tournamentId);
          const uploadResult = await apiClient.uploadTournamentImage(defaultImageFile);

          // Update tournament with default image
          await apiClient.updateTournament(tournamentId, {
            image_url: uploadResult.imageUrl
          });
          console.log('Default image generated and saved:', uploadResult.imageUrl);
        } catch (genError: any) {
          console.error('Error generating default image:', genError);
          // Continue without error - just won't have default image
        }
      }

      toast.success("Tournament updated successfully!", {
        description: "Your tournament changes have been saved.",
      });

      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err: any) {
      console.error('Error updating tournament:', err);
      toast.error(err.message || "Failed to update tournament. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <SportBackground variant="details" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SportBackground variant="details" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <Button variant="ghost" onClick={onBack} className="mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="mb-2">Edit Tournament</h1>
          <p className="text-muted-foreground">
            Update tournament details and settings
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-6">
            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Tournament Image</CardTitle>
                <CardDescription>Upload a cover image for your tournament</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center">
                  {imagePreview ? (
                    <div className="relative w-full h-64 rounded-lg overflow-hidden mb-4">
                      <img src={imagePreview} alt="Tournament preview" className="w-full h-full object-cover" />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2 hover:underline"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                          setExistingImageUrl(null);
                        }}
                      >
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <label className="w-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">Click to upload image</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Tournament details and description</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tournament Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter tournament name"
                    value={tournamentData.name}
                    onChange={(e) => {
                      setTournamentData({ ...tournamentData, name: e.target.value });
                      if (errors.name) {
                        const newErrors = { ...errors };
                        delete newErrors.name;
                        setErrors(newErrors);
                      }
                    }}
                    className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  <div className="mt-1 min-h-[20px]">
                    {errors.name && (
                      <p
                        className="text-sm font-medium text-destructive"
                        role="alert"
                        aria-live="polite"
                        data-error="name"
                        style={{ color: 'var(--destructive)' }}
                      >
                        {errors.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your tournament..."
                    value={tournamentData.description}
                    onChange={(e) => setTournamentData({ ...tournamentData, description: e.target.value })}
                    className="min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="Venue, City, Country (e.g., Central Park Tennis Center, New York, USA)"
                    value={tournamentData.location}
                    onChange={(e) => {
                      setTournamentData({ ...tournamentData, location: e.target.value });
                      if (errors.location) {
                        const newErrors = { ...errors };
                        delete newErrors.location;
                        setErrors(newErrors);
                      }
                    }}
                    className={errors.location ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  <div className="mt-1 min-h-[20px]">
                    {errors.location ? (
                      <p
                        className="text-sm font-medium text-destructive"
                        role="alert"
                        aria-live="polite"
                        data-error="location"
                        style={{ color: 'var(--destructive)' }}
                      >
                        {errors.location}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Include venue name, city and country</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${errors.date ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {tournamentData.date ? format(tournamentData.date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={tournamentData.date}
                          onSelect={(date: Date | null | undefined) => {
                            setTournamentData({ ...tournamentData, date: date ?? undefined });
                            if (errors.date) setErrors({ ...errors, date: "" });
                          }}
                          disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.date && (
                      <p className="text-sm font-medium text-destructive mt-1">{errors.date}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Time (Optional)</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="time"
                        type="text"
                        placeholder="HH:MM"
                        value={tournamentData.time}
                        onChange={(e) => {
                          handleTimeChange(e);
                          if (errors.time) setErrors({ ...errors, time: "" });
                        }}
                        maxLength={5}
                        className={`pl-10 ${errors.time ? "border-destructive" : ""}`}
                      />
                    </div>
                    {errors.time && (
                      <p className="text-sm font-medium text-destructive mt-1">{errors.time}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tournament Settings */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Tournament Settings
                </CardTitle>
                <CardDescription>Configure tournament rules and format</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="format">Tournament Format *</Label>
                    <Select
                      value={tournamentData.format}
                      onValueChange={(value: string) => {
                        setTournamentData({ ...tournamentData, format: value });
                        if (errors.format) setErrors({ ...errors, format: "" });
                      }}
                    >
                      <SelectTrigger id="format" className={errors.format ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single-elimination">Single Elimination</SelectItem>
                        <SelectItem value="round-robin">Round Robin</SelectItem>
                        <SelectItem value="group-stage">Group Stage + Playoffs</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="mt-1 min-h-[20px]">
                      {errors.format && (
                        <p
                          className="text-sm font-medium text-destructive"
                          role="alert"
                          aria-live="polite"
                          data-error="format"
                          style={{ color: 'var(--destructive)' }}
                        >
                          {errors.format}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="matchFormat">Match Format *</Label>
                    <Select
                      value={tournamentData.matchFormat}
                      onValueChange={(value: string) => {
                        setTournamentData({ ...tournamentData, matchFormat: value });
                        if (errors.matchFormat) setErrors({ ...errors, matchFormat: "" });
                      }}
                    >
                      <SelectTrigger id="matchFormat" className={errors.matchFormat ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select match format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="best-of-1">Best of 1</SelectItem>
                        <SelectItem value="best-of-3">Best of 3</SelectItem>
                        <SelectItem value="best-of-5">Best of 5</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="mt-1 min-h-[20px]">
                      {errors.matchFormat && (
                        <p
                          className="text-sm font-medium text-destructive"
                          role="alert"
                          aria-live="polite"
                          data-error="matchFormat"
                          style={{ color: 'var(--destructive)' }}
                        >
                          {errors.matchFormat}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">Max Participants *</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="maxParticipants"
                        type="number"
                        min="2"
                        placeholder="64"
                        value={tournamentData.maxParticipants}
                        onChange={(e) => {
                          setTournamentData({ ...tournamentData, maxParticipants: e.target.value });
                          if (errors.maxParticipants) setErrors({ ...errors, maxParticipants: "" });
                        }}
                        className={`pl-10 ${errors.maxParticipants ? "border-destructive" : ""}`}
                      />
                    </div>
                    {errors.maxParticipants && (
                      <p className="text-sm font-medium text-destructive mt-1">{errors.maxParticipants}</p>
                    )}
                    {!errors.maxParticipants && (
                      <p className="text-xs text-muted-foreground">Minimum 2 participants required</p>
                    )}
                  </div>
                </div>

                {/* Group Stage Settings - only show when format is group-stage */}
                {tournamentData.format === "group-stage" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="numGroups">Number of Groups *</Label>
                      <Input
                        id="numGroups"
                        type="number"
                        min="2"
                        placeholder="3"
                        value={tournamentData.numGroups}
                        onChange={(e) => {
                          setTournamentData({ ...tournamentData, numGroups: e.target.value });
                          if (errors.numGroups) {
                            const newErrors = { ...errors };
                            delete newErrors.numGroups;
                            setErrors(newErrors);
                          }
                        }}
                        className={errors.numGroups ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                      <div className="mt-1 min-h-[20px]">
                        {errors.numGroups && (
                          <p
                            className="text-sm font-medium text-destructive"
                            role="alert"
                            aria-live="polite"
                            data-error="numGroups"
                            style={{ color: 'var(--destructive)' }}
                          >
                            {errors.numGroups}
                          </p>
                        )}
                        {!errors.numGroups && (
                          <p className="text-xs text-muted-foreground">How many groups to divide players into</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="playersPerGroupAdvance">Players Advancing per Group *</Label>
                      <Input
                        id="playersPerGroupAdvance"
                        type="number"
                        min="1"
                        placeholder="2"
                        value={tournamentData.playersPerGroupAdvance}
                        onChange={(e) => {
                          setTournamentData({ ...tournamentData, playersPerGroupAdvance: e.target.value });
                          if (errors.playersPerGroupAdvance) {
                            const newErrors = { ...errors };
                            delete newErrors.playersPerGroupAdvance;
                            setErrors(newErrors);
                          }
                        }}
                        className={errors.playersPerGroupAdvance ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                      <div className="mt-1 min-h-[20px]">
                        {errors.playersPerGroupAdvance && (
                          <p
                            className="text-sm font-medium text-destructive"
                            role="alert"
                            aria-live="polite"
                            data-error="playersPerGroupAdvance"
                            style={{ color: 'var(--destructive)' }}
                          >
                            {errors.playersPerGroupAdvance}
                          </p>
                        )}
                        {!errors.playersPerGroupAdvance && (
                          <p className="text-xs text-muted-foreground">How many players advance from each group to playoffs</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invite Players */}
            <Card>
              <CardHeader>
                <CardTitle>Invite Players</CardTitle>
                <CardDescription>
                  Search for players and send them tournament invitations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, username, or country..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (e.target.value.trim() === "") {
                          setSearchResults([]);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchPlayers();
                        }
                      }}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleSearchPlayers}
                    disabled={searching || !searchQuery.trim()}
                  >
                    {searching ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {searchResults.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {player.avatar_url ? (
                            <img
                              src={player.avatar_url.startsWith('http')
                                ? player.avatar_url
                                : `${window.location.protocol}//${window.location.host}${player.avatar_url.startsWith('/') ? '' : '/'}${player.avatar_url}`}
                              alt={player.full_name || player.username}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const initials = (player.full_name || player.username || '')
                                    .split(' ')
                                    .map(n => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2);
                                  if (!parent.querySelector('.player-initials')) {
                                    const span = document.createElement('span');
                                    span.className = 'player-initials text-sm font-medium text-muted-foreground';
                                    span.textContent = initials;
                                    parent.appendChild(span);
                                  }
                                }
                              }}
                            />
                          ) : (
                            <span className="text-sm font-medium text-muted-foreground">
                              {(player.full_name || player.username || '')
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div>
                              <div className="font-medium truncate">
                                {player.full_name || player.username || 'Unknown'}
                              </div>
                              {player.full_name && player.username && (
                                <div className="text-sm text-muted-foreground truncate">
                                  @{player.username}
                                </div>
                              )}
                            </div>
                            {player.country && (
                              <span className="text-xs px-2 py-1 rounded-md border border-border bg-muted flex-shrink-0">
                                {player.country}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {player.rating && (
                            <span className="text-xs font-mono text-muted-foreground">
                              {player.rating.toLocaleString()}
                            </span>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSendInvitation(player.id, player.full_name || player.username)}
                            disabled={sendingInvitations.has(player.id)}
                          >
                            {sendingInvitations.has(player.id) ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Send Invite
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery.trim() && !searching && searchResults.length === 0 && (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No players found</p>
                    <p className="text-sm text-muted-foreground mt-2">Try a different search term</p>
                  </div>
                )}

                {!searchQuery.trim() && searchResults.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Search for players to invite</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add Guest Player */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Add Guest Player</CardTitle>
                    <CardDescription>
                      Manually add a participant who doesn't have a system account
                    </CardDescription>
                  </div>
                  {!showGuestForm && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowGuestForm(true)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Guest
                    </Button>
                  )}
                </div>
              </CardHeader>
              {showGuestForm && (
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="guestFirstName">First Name *</Label>
                        <Input
                          id="guestFirstName"
                          value={guestFormData.firstName}
                          onChange={(e) => setGuestFormData({ ...guestFormData, firstName: e.target.value })}
                          placeholder="John"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guestLastName">Last Name *</Label>
                        <Input
                          id="guestLastName"
                          value={guestFormData.lastName}
                          onChange={(e) => setGuestFormData({ ...guestFormData, lastName: e.target.value })}
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guestEmail">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="guestEmail"
                          type="email"
                          value={guestFormData.email}
                          onChange={(e) => setGuestFormData({ ...guestFormData, email: e.target.value })}
                          placeholder="player@example.com"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guestCountry">Country *</Label>
                      <Input
                        id="guestCountry"
                        value={guestFormData.country}
                        onChange={(e) => setGuestFormData({ ...guestFormData, country: e.target.value })}
                        placeholder="e.g., USA, Japan, Germany"
                        required
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowGuestForm(false);
                          setGuestFormData({
                            firstName: "",
                            lastName: "",
                            email: "",
                            country: "",
                          });
                        }}
                        disabled={addingGuest}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button" 
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddGuestPlayer(e);
                        }}
                        disabled={addingGuest}
                      >
                        {addingGuest ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Guest Player
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
              {!showGuestForm && (
                <CardContent>
                  <div className="text-center py-8">
                    <UserPlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No form displayed</p>
                    <p className="text-sm text-muted-foreground mt-2">Click "Add Guest" to add a participant without a system account</p>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Registered Participants */}
            <Card>
              <CardHeader>
                <CardTitle>Registered Participants</CardTitle>
                <CardDescription>
                  View all players who have registered for this tournament
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingParticipants ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : participants.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No participants registered yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {participant.avatar_url ? (
                            <img
                              src={participant.avatar_url.startsWith('http')
                                ? participant.avatar_url
                                : `${window.location.protocol}//${window.location.host}${participant.avatar_url.startsWith('/') ? '' : '/'}${participant.avatar_url}`}
                              alt={participant.full_name || participant.username}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const initials = (participant.full_name || participant.username || '')
                                    .split(' ')
                                    .map(n => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2);
                                  if (!parent.querySelector('.participant-initials')) {
                                    const span = document.createElement('span');
                                    span.className = 'participant-initials text-sm font-medium text-muted-foreground';
                                    span.textContent = initials;
                                    parent.appendChild(span);
                                  }
                                }
                              }}
                            />
                          ) : (
                            <span className="text-sm font-medium text-muted-foreground">
                              {(participant.full_name || participant.username || '')
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div>
                              <div className="font-medium truncate">
                                {participant.full_name || participant.username || 'Unknown'}
                              </div>
                              {participant.full_name && participant.username && (
                                <div className="text-sm text-muted-foreground truncate">
                                  @{participant.username}
                                </div>
                              )}
                            </div>
                            {participant.country && (
                              <span className="text-xs px-2 py-1 rounded-md border border-border bg-muted flex-shrink-0">
                                {participant.country}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {participant.player_type === 'guest' ? (
                            <span className="text-xs px-2 py-1 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 font-medium">
                              Guest
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-medium">
                              System
                            </span>
                          )}
                          {participant.rating && (
                            <span className="text-xs font-mono text-muted-foreground">
                              {participant.rating.toLocaleString()}
                            </span>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={removingParticipantId === participant.id}
                              >
                                {removingParticipantId === participant.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {participant.player_type !== 'guest' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleViewProfile(participant.username)}>
                                    <User className="mr-2 h-4 w-4" />
                                    View Profile
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleRemoveParticipant(participant.id)}
                                disabled={removingParticipantId === participant.id}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove from Tournament
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {participants.length > 0 && (
                  <div className="mt-4 pt-4 border-t text-sm text-muted-foreground text-center">
                    {participants.length} {participants.length === 1 ? 'participant' : 'participants'} registered
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <Button type="button" variant="outline" onClick={onBack} className="hover:underline">
                Cancel
              </Button>
              <Button type="submit" className="hover:underline" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
