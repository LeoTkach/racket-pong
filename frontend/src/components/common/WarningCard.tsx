import React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";

interface WarningCardProps {
  title: string;
  description: string;
  additionalInfo?: string | React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "warning" | "error" | "info";
}

export function WarningCard({
  title,
  description,
  additionalInfo,
  actionLabel,
  onAction,
  variant = "warning",
}: WarningCardProps) {
  const variantStyles = {
    warning: "border-orange-500/50 bg-orange-500/10",
    error: "border-red-500/50 bg-red-500/10",
    info: "border-blue-500/50 bg-blue-500/10",
  };

  return (
    <Card className={`mb-6 ${variantStyles[variant]}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
            {additionalInfo && (
              <div className="text-sm text-muted-foreground mb-3">
                {typeof additionalInfo === "string" ? (
                  <p>{additionalInfo}</p>
                ) : (
                  additionalInfo
                )}
              </div>
            )}
            {actionLabel && onAction && (
              <Button onClick={onAction} variant="default">
                {actionLabel}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

