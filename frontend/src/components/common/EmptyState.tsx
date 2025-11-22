import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "../ui/button";
import { typography } from "../../utils/typography";
import { cn } from "../ui/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  text: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
}

export function EmptyState({ icon: Icon, text, actionButton }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <Icon className="w-16 h-16 text-muted-foreground mb-4" />
      <p className="text-center text-muted-foreground text-lg mb-4 mx-auto max-w-2xl">{text}</p>
      {actionButton && (
        <Button onClick={actionButton.onClick}>
          {actionButton.icon && <actionButton.icon className="w-4 h-4 mr-2" />}
          {actionButton.label}
        </Button>
      )}
    </div>
  );
}

