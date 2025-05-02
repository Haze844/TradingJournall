"use client"

import * as React from "react"
import { SelectItem } from "./select"

// Definieren eines Interfaces das keine Vererbung verwendet, um Typprobleme zu vermeiden
interface SafeSelectItemProps {
  value: string | null | undefined;
  fallbackValue?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * Ein sicherer Wrapper für SelectItem, der leere Werte automatisch durch einen Fallback-Wert ersetzt.
 * Dies verhindert den Fehler "A <Select.Item /> must have a value prop that is not an empty string"
 */
export function SafeSelectItem({ value, fallbackValue = "default_value", children, ...props }: SafeSelectItemProps) {
  // Wenn der Wert leer, null oder undefined ist, verwende einen Fallback-Wert
  const safeValue = value && value !== '' ? value : fallbackValue;
  
  return (
    <SelectItem value={safeValue} {...props}>
      {children || safeValue}
    </SelectItem>
  );
}