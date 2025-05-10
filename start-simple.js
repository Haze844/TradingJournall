/**
 * Einfaches Start-Skript für die vereinfachte Version des Servers
 */

// Kompiliere TypeScript zu JavaScript
import { execSync } from 'child_process';

execSync('npx tsx --no-warnings server/index-simple.ts', { stdio: 'inherit' });