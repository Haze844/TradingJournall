"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

const FullscreenDialog = DialogPrimitive.Root

const FullscreenDialogTrigger = DialogPrimitive.Trigger

// Wir erstellen einen benutzerdefinierten DialogContent ohne X-Button
const FullscreenDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    overlayClassName?: string;
  }
>(({ className, overlayClassName, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/90 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        overlayClassName
      )}
      onClick={() => {
        // Schließen des Dialogs beim Klick auf den Overlay
        const closeBtn = document.querySelector('[data-dialog-close]');
        if (closeBtn && 'click' in closeBtn) {
          (closeBtn as HTMLElement).click();
        }
      }}
    />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 w-full h-full border-none outline-none p-0 bg-transparent",
        "flex items-center justify-center",
        className
      )}
      {...props}
    >
      {children}
      {/* X-Button entfernt */}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
FullscreenDialogContent.displayName = "FullscreenDialogContent"

export {
  FullscreenDialog,
  FullscreenDialogTrigger,
  FullscreenDialogContent,
}