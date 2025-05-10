/**
 * Render-Deployment-Test-Skript
 * 
 * Dieses Skript führt automatisierte Tests bei jedem Render-Deployment aus,
 * um sicherzustellen, dass grundlegende Funktionen verfügbar sind.
 * 
 * Verwendung im Terminal auf Render:
 * node render-test.js
 */

const fs = require('fs');
const http = require('http');
const https = require('https');

// Konfiguration
const config = {
  // App-Basis-URL (wird automatisch aus Umgebungsvariablen bestimmt)
  baseUrl: process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000',
  // Zu testende Endpunkte
  endpoints: [
    { path: '/', expectedStatus: 303 },  // Sollte zur Auth-Seite umleiten
    { path: '/render-debug', expectedStatus: 200 },  // Unser neuer Debug-Endpunkt
    { path: '/api/health', expectedStatus: 200 },
    { path: '/auth', expectedStatus: 200 }
  ],
  // Timeout für Anfragen in Millisekunden
  timeout: 10000
};

// Farben für Konsolenausgabe
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Logging-Funktionen
function log(message, color = colors.reset) {
  console.log(`${color}[RENDER-TEST] ${message}${colors.reset}`);
}

function logSuccess(message) {
  log(message, colors.green);
}

function logError(message) {
  log(message, colors.red);
}

function logInfo(message) {
  log(message, colors.cyan);
}

function logWarning(message) {
  log(message, colors.yellow);
}

// Einfache HTTP-Request-Funktion mit Unterstützung für Umleitungen
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    logInfo(`Request: ${url}`);
    
    // Wähle das richtige Modul basierend auf der URL
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, {
      timeout: config.timeout,
      ...options
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          redirectLocation: res.headers.location,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timed out after ${config.timeout}ms`));
    });
  });
}

// Teste einen einzelnen Endpunkt
async function testEndpoint(endpoint) {
  const url = `${config.baseUrl}${endpoint.path}`;
  try {
    const response = await request(url);
    
    // Überprüfe Statuscode
    if (response.statusCode === endpoint.expectedStatus) {
      logSuccess(`✓ ${endpoint.path} - Status: ${response.statusCode}`);
      
      // Bei Umleitungen die Ziel-URL anzeigen
      if (response.statusCode >= 300 && response.statusCode < 400) {
        logInfo(`  → Umleitung zu: ${response.redirectLocation}`);
      }
      
      // Bei JSON-Antworten die Struktur untersuchen
      if (response.headers['content-type']?.includes('application/json')) {
        try {
          const json = JSON.parse(response.data);
          logInfo(`  → JSON Response: ${Object.keys(json).join(', ')}`);
        } catch (e) {
          logWarning(`  → JSON-Parsing fehlgeschlagen: ${e.message}`);
        }
      }
      
      return true;
    } else {
      logError(`✗ ${endpoint.path} - Status: ${response.statusCode}, erwartet: ${endpoint.expectedStatus}`);
      return false;
    }
  } catch (error) {
    logError(`✗ ${endpoint.path} - Fehler: ${error.message}`);
    return false;
  }
}

// Teste alle konfigurierten Endpunkte
async function runTests() {
  log('\n' + '='.repeat(50), colors.magenta);
  logInfo(`Starte Tests für ${config.baseUrl}`);
  log('='.repeat(50) + '\n', colors.magenta);
  
  const results = [];
  
  // System-Information
  logInfo('Systemumgebung:');
  logInfo(`  Node.js: ${process.version}`);
  logInfo(`  Render URL: ${process.env.RENDER_EXTERNAL_URL || 'Nicht verfügbar'}`);
  logInfo(`  Umgebung: ${process.env.NODE_ENV || 'development'}`);
  
  try {
    // Endpunkte testen
    log('\nTeste Endpunkte:', colors.magenta);
    for (const endpoint of config.endpoints) {
      const success = await testEndpoint(endpoint);
      results.push({ endpoint: endpoint.path, success });
    }
    
    // Test-Ergebnisse zusammenfassen
    const successCount = results.filter(r => r.success).length;
    const totalTests = results.length;
    
    log('\n' + '-'.repeat(50), colors.magenta);
    if (successCount === totalTests) {
      logSuccess(`✓ Alle Tests erfolgreich (${successCount}/${totalTests})`);
    } else {
      logError(`✗ Einige Tests sind fehlgeschlagen (${successCount}/${totalTests} erfolgreich)`);
    }
    log('-'.repeat(50) + '\n', colors.magenta);
    
    // Bestandene Tests
    if (successCount > 0) {
      logSuccess('Bestandene Tests:');
      results.filter(r => r.success).forEach(r => {
        logSuccess(`  ✓ ${r.endpoint}`);
      });
    }
    
    // Fehlgeschlagene Tests
    if (successCount < totalTests) {
      logError('\nFehlgeschlagene Tests:');
      results.filter(r => !r.success).forEach(r => {
        logError(`  ✗ ${r.endpoint}`);
      });
    }
    
    log('\n' + '='.repeat(50), colors.magenta);
    log(`Test abgeschlossen: ${new Date().toISOString()}`, colors.cyan);
    log('='.repeat(50) + '\n', colors.magenta);
    
    // Ergebnis zurückgeben (true wenn alle Tests erfolgreich)
    return successCount === totalTests;
  } catch (error) {
    logError(`Unerwarteter Fehler: ${error.message}`);
    return false;
  }
}

// Hauptfunktion
async function main() {
  try {
    // Tests ausführen
    const success = await runTests();
    
    // Exitcode basierend auf Testergebnis
    process.exit(success ? 0 : 1);
  } catch (error) {
    logError(`Fataler Fehler: ${error.message}`);
    process.exit(1);
  }
}

// Skript starten
main();