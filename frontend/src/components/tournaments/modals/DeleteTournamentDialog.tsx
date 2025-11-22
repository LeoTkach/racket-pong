import { useEffect, useLayoutEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface DeleteTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentName: string;
  onConfirm: () => void;
}

export function DeleteTournamentDialog({
  open,
  onOpenChange,
  tournamentName,
  onConfirm,
}: DeleteTournamentDialogProps) {
  // Prevent layout shift when modal opens
  // Use useLayoutEffect to apply styles synchronously before paint
  useLayoutEffect(() => {
    if (!open) {
      // Clean up when modal closes
      const nav = document.querySelector('nav[class*="sticky"]') as HTMLElement;
      if (nav) {
        nav.style.removeProperty('padding-right');
        nav.style.removeProperty('margin-right');
      }
      document.body.style.removeProperty('padding-right');
      document.documentElement.style.removeProperty('--scrollbar-width');
      
      // Restore scroll position smoothly
      const savedScrollY = sessionStorage.getItem('modal-scroll-y');
      if (savedScrollY) {
        const scrollY = parseInt(savedScrollY, 10);
        requestAnimationFrame(() => {
          window.scrollTo({ top: scrollY, behavior: 'auto' });
          sessionStorage.removeItem('modal-scroll-y');
        });
      }
      return;
    }

    const nav = document.querySelector('nav[class*="sticky"]') as HTMLElement;
    let observer: MutationObserver | null = null;
    let scrollbarWidth = 0;
    
    // Save scroll position BEFORE any changes
    const scrollY = window.scrollY;
    sessionStorage.setItem('modal-scroll-y', scrollY.toString());
    
    const calculateScrollbarWidth = () => {
      // Calculate scrollbar width BEFORE scroll is locked
      const outer = document.createElement('div');
      outer.style.visibility = 'hidden';
      outer.style.overflow = 'scroll';
      outer.style.msOverflowStyle = 'scrollbar';
      outer.style.width = '100px';
      outer.style.position = 'absolute';
      outer.style.top = '-9999px';
      document.body.appendChild(outer);
      
      const inner = document.createElement('div');
      inner.style.width = '100%';
      outer.appendChild(inner);
      
      const width = outer.offsetWidth - inner.offsetWidth;
      document.body.removeChild(outer);
      
      return Math.max(width, 0);
    };
    
    const updateScrollbarPadding = () => {
      if (scrollbarWidth === 0) {
        scrollbarWidth = calculateScrollbarWidth();
      }
      
      // Set CSS variable
      document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
      
      // Apply padding to nav immediately with !important via inline style
      if (nav && scrollbarWidth > 0) {
        nav.style.setProperty('padding-right', `${scrollbarWidth}px`, 'important');
      }
      
      // Also apply to body
      if (scrollbarWidth > 0) {
        document.body.style.setProperty('padding-right', `${scrollbarWidth}px`, 'important');
      }
    };
    
    const removeScrollbarPadding = () => {
      if (nav) {
        nav.style.removeProperty('padding-right');
        nav.style.removeProperty('margin-right');
      }
      document.body.style.removeProperty('padding-right');
      document.documentElement.style.removeProperty('--scrollbar-width');
    };

    // Calculate scrollbar width IMMEDIATELY before Radix locks scroll
    scrollbarWidth = calculateScrollbarWidth();
    
    // Apply padding synchronously BEFORE scroll is locked
    if (scrollbarWidth > 0) {
      document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
      
      if (nav) {
        nav.style.setProperty('padding-right', `${scrollbarWidth}px`, 'important');
      }
      document.body.style.setProperty('padding-right', `${scrollbarWidth}px`, 'important');
    }
    
    // Force scroll position to stay the same - prevent any jumps
    const preventScrollJump = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY !== scrollY) {
        // Use scrollTo with behavior: 'auto' to prevent smooth scroll
        window.scrollTo({ top: scrollY, behavior: 'auto' });
      }
    };
    
    // Apply immediately and repeatedly to prevent jumps
    preventScrollJump();
    
    // Also listen for when Radix adds the scroll lock attribute
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-radix-scroll-lock') {
          if (document.body.hasAttribute('data-radix-scroll-lock')) {
            // Recalculate and apply when scroll is locked
            updateScrollbarPadding();
            // Force scroll position to stay
            preventScrollJump();
          } else {
            removeScrollbarPadding();
          }
        }
      }
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-radix-scroll-lock']
    });
    
    // Continuously check and fix scroll position until locked
    // Limit to prevent infinite loop - stop after 50ms or when locked
    let checkCount = 0;
    const maxChecks = 10;
    const scrollCheckInterval = setInterval(() => {
      checkCount++;
      if (document.body.hasAttribute('data-radix-scroll-lock') || checkCount >= maxChecks) {
        updateScrollbarPadding();
        preventScrollJump();
        clearInterval(scrollCheckInterval);
      } else {
        preventScrollJump();
      }
    }, 5);
    
    // Also check after a microtask
    Promise.resolve().then(() => {
      if (document.body.hasAttribute('data-radix-scroll-lock')) {
        updateScrollbarPadding();
        preventScrollJump();
      }
    });
    
    // Cleanup function
    return () => {
      clearInterval(scrollCheckInterval);
      if (observer) {
        observer.disconnect();
      }
      removeScrollbarPadding();
    };
  }, [open]);

  const handleDelete = () => {
    onConfirm();
    toast.success("Tournament deleted successfully");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <span className="font-semibold text-foreground">"{tournamentName}"</span> and all associated data.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Tournament
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
