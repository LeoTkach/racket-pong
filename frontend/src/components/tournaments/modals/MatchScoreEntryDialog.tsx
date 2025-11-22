import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface MatchScoreEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player1: string;
  player2: string;
  matchFormat: "best-of-1" | "best-of-3" | "best-of-5";
  existingScore?: string;
  onSave: (score: string, winner: string) => void;
}

interface SetScore {
  player1: number;
  player2: number;
}

export function MatchScoreEntryDialog({
  open,
  onOpenChange,
  player1,
  player2,
  matchFormat,
  existingScore,
  onSave
}: MatchScoreEntryDialogProps) {
  const [sets, setSets] = useState<SetScore[]>([{ player1: 11, player2: 0 }]);
  
  // Check if this is a bye match (player2 is "BYE" or empty/null)
  const isByeMatch = player2 === "BYE" || !player2 || player2.trim() === "";
  
  // Calculate max sets based on match format
  const maxSets = matchFormat === "best-of-1" ? 1 : matchFormat === "best-of-3" ? 3 : 5;
  const setsToWin = Math.ceil(maxSets / 2);

  useEffect(() => {
    if (existingScore) {
      // Parse existing score (format: "11-3, 11-5, 7-11, 11-8")
      const setScores = existingScore.split(",").map(set => {
        const [p1, p2] = set.trim().split("-").map(Number);
        return { player1: p1, player2: p2 };
      });
      setSets(setScores);
    } else {
      if (isByeMatch) {
        // For bye matches, set default score as player1 wins all sets
        const defaultSets = Array(maxSets).fill(null).map(() => ({ player1: 11, player2: 0 }));
        setSets(defaultSets);
      } else {
        setSets([{ player1: 11, player2: 0 }]);
      }
    }
  }, [existingScore, open, isByeMatch, maxSets]);

  // Automatically complete bye matches when dialog opens (only if not already completed)
  useEffect(() => {
    if (open && isByeMatch && !existingScore) {
      // Automatically complete the bye match
      const defaultSets = Array(setsToWin).fill(null).map(() => ({ player1: 11, player2: 0 }));
      const scoreString = defaultSets.map(set => `${set.player1}-${set.player2}`).join(", ");
      
      // Ensure player1 is clean (trim and remove any extra text like "Advances BYE")
      const cleanPlayerName = player1.trim().split(/\s+(?:Advances|BYE)/i)[0].trim();
      
      // Use setTimeout to ensure the dialog is fully rendered before closing
      const timer = setTimeout(() => {
        onSave(scoreString, cleanPlayerName);
        toast.success("Bye match completed - player advanced to next round");
        onOpenChange(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
    // Если матч уже завершен (есть existingScore), не делаем ничего автоматически
  }, [open, isByeMatch, existingScore, setsToWin, player1, onSave, onOpenChange]);

  // Remove focus from inputs when dialog opens for best-of-1 format
  useEffect(() => {
    if (open && matchFormat === "best-of-1" && !isByeMatch) {
      // Remove focus from any input elements after dialog is rendered
      const timer = setTimeout(() => {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
          activeElement.blur();
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [open, matchFormat, isByeMatch]);

  const addSet = () => {
    if (sets.length < maxSets) {
      setSets([...sets, { player1: 11, player2: 0 }]);
    }
  };

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
    }
  };

  const updateSetScore = (index: number, player: "player1" | "player2", value: string) => {
    const numValue = parseInt(value) || 0;
    setSets(sets.map((set, i) => 
      i === index ? { ...set, [player]: numValue } : set
    ));
  };

  const validateAndSave = () => {
    // For bye matches, automatically complete with player1 as winner
    if (isByeMatch) {
      // Create a default score string (e.g., "11-0, 11-0, 11-0" for best-of-5)
      const defaultSets = Array(setsToWin).fill(null).map(() => ({ player1: 11, player2: 0 }));
      const scoreString = defaultSets.map(set => `${set.player1}-${set.player2}`).join(", ");
      
      // Ensure player1 is clean (trim and remove any extra text like "Advances BYE")
      const cleanPlayerName = player1.trim().split(/\s+(?:Advances|BYE)/i)[0].trim();
      
      onSave(scoreString, cleanPlayerName);
      toast.success("Bye match completed - player advanced to next round");
      return;
    }

    // Validate each set for regular matches
    for (let i = 0; i < sets.length; i++) {
      const set = sets[i];
      
      // Check minimum score
      if (set.player1 < 0 || set.player2 < 0) {
        toast.error(`Set ${i + 1}: Scores cannot be negative`);
        return;
      }

      // Check if someone won the set
      const maxScore = Math.max(set.player1, set.player2);
      const minScore = Math.min(set.player1, set.player2);

      // Normal win: must be at least 11 and win by 2
      if (maxScore < 11) {
        toast.error(`Set ${i + 1}: Winning score must be at least 11`);
        return;
      }

      // If score is 11 or more, must win by at least 2
      if (maxScore >= 11 && maxScore - minScore < 2) {
        toast.error(`Set ${i + 1}: Must win by at least 2 points`);
        return;
      }

      // For deuce situations (10-10), check if difference is at least 2
      if (minScore >= 10 && maxScore - minScore < 2) {
        toast.error(`Set ${i + 1}: Must win by at least 2 points in deuce`);
        return;
      }
    }

    // Count wins
    let p1Wins = 0;
    let p2Wins = 0;
    sets.forEach(set => {
      if (set.player1 > set.player2) p1Wins++;
      else p2Wins++;
    });

    // Check if match is complete
    if (p1Wins < setsToWin && p2Wins < setsToWin) {
      toast.error(`Match incomplete: Need ${setsToWin} sets to win in ${matchFormat} format`);
      return;
    }

    // Check if winner has correct number of sets
    const maxPossibleWins = Math.max(p1Wins, p2Wins);
    if (maxPossibleWins < setsToWin) {
      toast.error(`Invalid match: Winner needs ${setsToWin} sets in ${matchFormat} format`);
      return;
    }
    
    // Check if too many sets won (e.g., 4-0 in best-of-5 is invalid, max is 3-0, 3-1, or 3-2)
    if (maxPossibleWins > setsToWin) {
      toast.error(`Invalid match: Cannot win more than ${setsToWin} sets in ${matchFormat} format (max score: ${setsToWin}-${maxSets - setsToWin})`);
      return;
    }
    
    // Check total sets played (for best-of-5: can be 3, 4, or 5 sets)
    if (sets.length > maxSets) {
      toast.error(`Invalid match: Cannot play more than ${maxSets} sets in ${matchFormat} format`);
      return;
    }
    
    // Check that loser's sets don't exceed maximum possible
    const minWins = Math.min(p1Wins, p2Wins);
    if (maxPossibleWins === setsToWin && minWins > maxSets - setsToWin) {
      toast.error(`Invalid match: In ${matchFormat}, loser cannot win more than ${maxSets - setsToWin} sets`);
      return;
    }

    // Determine winner
    const winner = p1Wins > p2Wins ? player1 : player2;

    // Format score string (e.g., "11-3, 11-5, 7-11, 11-8")
    const scoreString = sets.map(set => `${set.player1}-${set.player2}`).join(", ");

    onSave(scoreString, winner);
    toast.success("Match result saved");
  };

  const player1Wins = sets.filter(set => set.player1 > set.player2).length;
  const player2Wins = sets.filter(set => set.player1 < set.player2).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isByeMatch ? "Complete Bye Match" : "Enter Match Result"}</DialogTitle>
          <DialogDescription>
            {isByeMatch 
              ? `${player1} advances to the next round (bye match)`
              : `Enter the detailed scores for each set. Match format: ${matchFormat}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Match format info */}
          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Format:</span>
              <span className="font-medium">{matchFormat} (first to {setsToWin} sets)</span>
            </div>
          </div>

          {isByeMatch ? (
            /* Bye match - simplified UI */
            <div className="bg-primary/10 p-6 rounded-lg text-center space-y-4">
              <div className="text-lg font-semibold text-primary">{player1}</div>
              <div className="text-sm text-muted-foreground">Advances automatically</div>
              <div className="text-xs text-muted-foreground mt-2">
                This is a bye match. {player1} will automatically advance to the next round.
              </div>
            </div>
          ) : (
            /* Regular match - score entry */
            <>
              {/* Current score */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/10 p-4 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">{player1}</div>
                  <div className="text-3xl font-bold">{player1Wins}</div>
                  <div className="text-xs text-muted-foreground mt-1">Sets Won</div>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">{player2}</div>
                  <div className="text-3xl font-bold">{player2Wins}</div>
                  <div className="text-xs text-muted-foreground mt-1">Sets Won</div>
                </div>
              </div>

              {/* Sets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Set Scores</Label>
                  {sets.length < maxSets && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addSet}
                      className="hover:underline"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Set
                    </Button>
                  )}
                </div>
                
                {sets.map((set, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                    <div className="font-medium text-sm min-w-[60px]">Set {index + 1}</div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">{player1}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={set.player1}
                          onChange={(e) => updateSetScore(index, "player1", e.target.value)}
                          className="text-center"
                          autoFocus={false}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">{player2}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={set.player2}
                          onChange={(e) => updateSetScore(index, "player2", e.target.value)}
                          className="text-center"
                          autoFocus={false}
                        />
                      </div>
                    </div>
                    {sets.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSet(index)}
                        className="hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Help text */}
              <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
                <strong>Note:</strong> Each set must be won with at least 11 points and by a margin of at least 2 points. 
                In case of deuce (10-10 or higher), play continues until one player leads by 2 points.
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={validateAndSave}>
            {isByeMatch ? "Complete Bye Match" : "Save Result"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
