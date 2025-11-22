import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Calendar } from "../../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { ArrowLeft, Upload, Calendar as CalendarIcon, Users, Loader2, Clock } from "lucide-react";
import { SportBackground } from "../../components/common/backgrounds/sport-background/SportBackground";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "../../contexts/AuthContext";
import { apiClient } from "../../api/client";

interface CreateTournamentPageProps {
  onBack: () => void;
}

export function CreateTournamentPage({ onBack }: CreateTournamentPageProps) {
  const { user } = useAuth();
  
  // Add spin animation to the component
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  const [loading, setLoading] = useState(false);
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
  const [errors, setErrors] = useState<Record<string, string>>({});


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
      toast.error("You must be logged in to create a tournament");
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
      } else {
        // Validate group stage settings if format is group-stage
        if (tournamentData.format === "group-stage") {
          // Validate number of groups
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
            } else if (numGroups > maxPart) {
              const errorMsg = "Number of groups cannot exceed maximum participants";
              newErrors.numGroups = errorMsg;
              if (!firstErrorField) firstErrorField = "numGroups";
            } else {
              // Validate players per group advance
              if (!tournamentData.playersPerGroupAdvance || tournamentData.playersPerGroupAdvance.trim() === "") {
                const errorMsg = "Please enter number of players advancing from each group";
                newErrors.playersPerGroupAdvance = errorMsg;
                if (!firstErrorField) firstErrorField = "playersPerGroupAdvance";
              } else {
                const playersPerGroupAdvance = parseInt(tournamentData.playersPerGroupAdvance);
                if (isNaN(playersPerGroupAdvance) || playersPerGroupAdvance < 1) {
                  const errorMsg = "At least 1 player must advance from each group";
                  newErrors.playersPerGroupAdvance = errorMsg;
                  if (!firstErrorField) firstErrorField = "playersPerGroupAdvance";
                } else {
                  // Calculate minimum group size
                  // Groups are distributed: most groups have floor(maxPart / numGroups) players,
                  // remaining players go to the first groups
                  const baseGroupSize = Math.floor(maxPart / numGroups);
                  const remainder = maxPart % numGroups;
                  // The smallest group will have baseGroupSize players
                  // (if remainder > 0, first groups get one extra player, but smallest is still baseGroupSize)
                  const minGroupSize = baseGroupSize;
                  
                  // Cannot advance all players from a group (must leave at least 1)
                  if (playersPerGroupAdvance >= minGroupSize) {
                    const errorMsg = `Cannot advance ${playersPerGroupAdvance} player${playersPerGroupAdvance !== 1 ? 's' : ''} from a group. With ${maxPart} participants in ${numGroups} groups, the smallest group will have ${minGroupSize} player${minGroupSize !== 1 ? 's' : ''}. At least 1 player must remain in each group.`;
                    newErrors.playersPerGroupAdvance = errorMsg;
                    if (!firstErrorField) firstErrorField = "playersPerGroupAdvance";
                  }
                }
              }
            }
          }
        }
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
      let imageUrl: string | null = null;
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
        organizer_id: user.id,
        image_url: imageUrl,
      };

      // Add group stage settings if format is group-stage
      if (tournamentData.format === "group-stage") {
        tournamentPayload.num_groups = parseInt(tournamentData.numGroups);
        tournamentPayload.players_per_group_advance = parseInt(tournamentData.playersPerGroupAdvance);
      }

      const response = await apiClient.createTournament(tournamentPayload);
      const createdTournament = response.tournament;

      // Если изображение не было загружено, генерируем дефолтное изображение
      if (!imageUrl && createdTournament?.id) {
        try {
          const { generateTournamentImage } = await import("../../utils/generateTournamentImage");
          const defaultImageFile = await generateTournamentImage(createdTournament.id);
          const uploadResult = await apiClient.uploadTournamentImage(defaultImageFile);
          
          // Обновляем турнир с дефолтным изображением
          await apiClient.updateTournament(createdTournament.id, {
            image_url: uploadResult.imageUrl
          });
        } catch (genError: any) {
          console.error('Error generating default image:', genError);
          // Продолжаем без ошибки - просто не будет дефолтного изображения
        }
      }

      toast.success("Tournament created successfully!", {
        description: "Your tournament is now live and accepting registrations.",
      });
      
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err: any) {
      console.error('Error creating tournament:', err);
      toast.error(err.message || "Failed to create tournament. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SportBackground variant="details" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <Button variant="ghost" onClick={onBack} className="mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="mb-2">Create Tournament</h1>
          <p className="text-muted-foreground">
            Set up a new free table tennis tournament and start accepting registrations
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
                        onClick={() => setImagePreview(null)}
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
                        const newData: any = { ...tournamentData, format: value };
                        // Clear group stage fields if format is not group-stage
                        if (value !== "group-stage") {
                          newData.numGroups = "";
                          newData.playersPerGroupAdvance = "";
                        }
                        setTournamentData(newData);
                        if (errors.format) setErrors({ ...errors, format: "" });
                        // Clear group stage errors when format changes
                        if (errors.numGroups) setErrors({ ...errors, numGroups: "" });
                        if (errors.playersPerGroupAdvance) setErrors({ ...errors, playersPerGroupAdvance: "" });
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
                          // Clear group stage errors when max participants changes
                          if (errors.numGroups) setErrors({ ...errors, numGroups: "" });
                          if (errors.playersPerGroupAdvance) setErrors({ ...errors, playersPerGroupAdvance: "" });
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
                          if (errors.numGroups) setErrors({ ...errors, numGroups: "" });
                          // Clear playersPerGroupAdvance error when numGroups changes
                          if (errors.playersPerGroupAdvance) setErrors({ ...errors, playersPerGroupAdvance: "" });
                        }}
                        className={errors.numGroups ? "border-destructive" : ""}
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
                          if (errors.playersPerGroupAdvance) setErrors({ ...errors, playersPerGroupAdvance: "" });
                        }}
                        className={errors.playersPerGroupAdvance ? "border-destructive" : ""}
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

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <Button type="button" variant="outline" onClick={onBack} className="hover:underline">
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 
                      className="w-4 h-4 mr-2" 
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                    Creating...
                  </>
                ) : (
                  "Create Tournament"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
