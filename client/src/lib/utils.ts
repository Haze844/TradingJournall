import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "yyyy-MM-dd");
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "yyyy-MM-dd HH:mm");
}

export function formatTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "HH:mm");
}

export function getTodayDates(): { startDate: Date; endDate: Date } {
  const today = new Date();
  
  const startDate = new Date(today);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}

export function getWeekDates(): { weekStart: Date; weekEnd: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return { weekStart, weekEnd };
}

export function getLastMonthDates(): { monthStart: Date; monthEnd: Date } {
  const now = new Date();
  
  // Start date: First day of previous month
  const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  monthStart.setHours(0, 0, 0, 0);
  
  // End date: Last day of previous month
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  monthEnd.setHours(23, 59, 59, 999);
  
  return { monthStart, monthEnd };
}

export function calculateWinRate(winCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  return (winCount / totalCount) * 100;
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

// Funktion zum Speichern der Anmeldedaten im localStorage
export function saveLoginCredentials(username: string, password: string) {
  localStorage.setItem('nxtlvl_username', username);
  // Die Passwörter sollten in einer realen Produktionsumgebung
  // NIEMALS im Klartext gespeichert werden
  localStorage.setItem('nxtlvl_password', btoa(password)); // Simple encoding (nicht sicher!)
}

// Funktion zum Abrufen der gespeicherten Anmeldedaten
export function getSavedLoginCredentials() {
  const username = localStorage.getItem('nxtlvl_username');
  const encodedPassword = localStorage.getItem('nxtlvl_password');
  
  if (!username || !encodedPassword) return null;
  
  return {
    username,
    password: atob(encodedPassword) // Decode
  };
}

// Funktion zum Löschen der gespeicherten Anmeldedaten
export function clearSavedLoginCredentials() {
  localStorage.removeItem('nxtlvl_username');
  localStorage.removeItem('nxtlvl_password');
}
