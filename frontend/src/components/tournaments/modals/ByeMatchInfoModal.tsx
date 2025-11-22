import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Info } from "lucide-react";

interface ByeMatchInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerName: string;
}

export function ByeMatchInfoModal({
  open,
  onOpenChange,
  playerName
}: ByeMatchInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            Automatic Advancement (Bye Match)
          </DialogTitle>
          <DialogDescription>
            {playerName} automatically advances to the next round
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-primary/10 p-6 rounded-lg text-center space-y-4">
            <div className="text-lg font-semibold text-primary">{playerName}</div>
            <div className="text-sm text-muted-foreground">Advances automatically to next round</div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h4 className="font-semibold text-sm">Why does this happen?</h4>
            <p className="text-sm text-muted-foreground">
              In single-elimination tournaments, the bracket size is determined by powers of 2 (4, 8, 16, 32 players).
              When the number of participants is less than the bracket size, some players receive a "bye" - they automatically advance to the next round without playing a match.
            </p>
            <p className="text-sm text-muted-foreground">
              Players with the highest ratings typically receive byes to balance the tournament bracket and ensure fair competition.
            </p>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
            <strong>Note:</strong> This is a standard tournament format feature. The player will automatically appear in the next round of the bracket.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



