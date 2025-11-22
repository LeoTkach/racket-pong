"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--toast-bg)",
          "--normal-text": "var(--toast-title)",
          "--normal-border": "var(--toast-border)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "toast-notification",
          title: "toast-title",
          description: "toast-description",
          actionButton: "toast-action",
          cancelButton: "toast-cancel",
          closeButton: "toast-close",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
