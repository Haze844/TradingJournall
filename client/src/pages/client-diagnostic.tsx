import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { detectEnvironment } from '@/lib/routing-fix';

/**
 * Client-seitige Diagnoseseite zur Identifizierung und Behebung von Render-Deployment-Problemen
 */
export default function ClientDiagnosticPage() {
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Sammle Client-Informationen
    const env = detectEnvironment();
    const clientData = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      location: {
        href: window.location.href,
        hostname: window.location.hostname,
        pathname: window.location.pathname,
        protocol: window.location.protocol,
        port: window.location.port || (window.location.protocol === 'https:' ? '443' : '80')
      },
      environment: {
        ...env,
        isSecure: window.location.protocol === 'https:',
        screen: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      },
      timestamp: new Date().toISOString()
    };
    
    setClientInfo(clientData);
    
    // Rufe den Server-Diagnostic-Endpunkt auf
    const fetchServerDiagnostic = async () => {
      try {
        const response = await fetch('/render-diagnostic');
        if (!response.ok) {
          throw new Error(`Diagnose-Endpunkt nicht erreichbar: ${response.status}`);
        }
        const data = await response.json();
        setServerStatus(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
        setLoading(false);
        
        // Beim Fehler den einfacheren Debug-Endpunkt probieren
        try {
          const simpleResponse = await fetch('/render-debug');
          if (simpleResponse.ok) {
            const simpleData = await simpleResponse.json();
            setServerStatus({
              simple: true,
              data: simpleData
            });
          }
        } catch (fallbackErr) {
          console.error('Auch einfacher Debug-Endpunkt nicht verfügbar:', fallbackErr);
        }
      }
    };
    
    fetchServerDiagnostic();
  }, []);
  
  // Helper zur Prüfung des Auth-Status und der Client-Server-Unterschiede
  const detectAuthIssues = () => {
    if (!serverStatus || !clientInfo) return null;
    
    const issues = [];
    
    // Prüfe auf HTTPS-Mismatch
    const clientIsHttps = clientInfo.location.protocol === 'https:';
    const serverIsHttps = serverStatus.request?.isHttps;
    
    if (clientIsHttps !== serverIsHttps) {
      issues.push(`HTTPS-Mismatch: Client ${clientIsHttps ? 'verwendet' : 'verwendet kein'} HTTPS, Server ${serverIsHttps ? 'verwendet' : 'verwendet kein'} HTTPS`);
    }
    
    // Prüfe, ob Cookies korrekt gesetzt werden können
    if (!navigator.cookieEnabled) {
      issues.push('Cookies sind im Browser deaktiviert');
    }
    
    // Prüfe auf Cookie-Domain-Probleme
    const hostname = window.location.hostname;
    if (hostname !== serverStatus.request?.hostname) {
      issues.push(`Hostname-Mismatch: Client sieht ${hostname}, Server sieht ${serverStatus.request?.hostname}`);
    }
    
    // Prüfe Session-Setup
    if (serverStatus.sessionConfig && !serverStatus.sessionConfig.hasSessionSecret) {
      issues.push('SESSION_SECRET ist nicht in der Serverumgebung konfiguriert');
    }
    
    return issues.length > 0 ? issues : null;
  };
  
  const authIssues = serverStatus && clientInfo ? detectAuthIssues() : null;
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Render Deployment Diagnose</h1>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Sammle Diagnosedaten vom Server...</p>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 p-4 rounded-md mb-6">
            <h2 className="text-xl font-semibold text-destructive mb-2">Fehler bei der Diagnose</h2>
            <p>{error}</p>
            {serverStatus?.simple && (
              <div className="mt-4">
                <p className="font-medium">Einfache Diagnose verfügbar:</p>
                <pre className="bg-muted p-4 rounded-md mt-2 overflow-auto text-xs">
                  {JSON.stringify(serverStatus.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <>
            {authIssues && (
              <div className="bg-orange-100 dark:bg-orange-950 border border-orange-300 dark:border-orange-800 p-4 rounded-md mb-6">
                <h2 className="text-xl font-semibold text-orange-800 dark:text-orange-300 mb-2">Potentielle Authentifizierungsprobleme</h2>
                <ul className="list-disc pl-5 space-y-1">
                  {authIssues.map((issue, index) => (
                    <li key={index} className="text-orange-700 dark:text-orange-400">{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg shadow p-4">
                <h2 className="text-xl font-semibold mb-3 text-primary">Client-Informationen</h2>
                <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                  {JSON.stringify(clientInfo, null, 2)}
                </pre>
              </div>
              
              <div className="bg-card rounded-lg shadow p-4">
                <h2 className="text-xl font-semibold mb-3 text-primary">Server-Informationen</h2>
                <pre className="bg-muted p-4 rounded-md overflow-auto text-xs h-[400px] overflow-y-auto">
                  {JSON.stringify(serverStatus, null, 2)}
                </pre>
              </div>
            </div>
            
            <div className="mt-6 bg-card rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-3 text-primary">Datei-Diagnostik</h2>
              {serverStatus.keyFiles ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted">
                        <th className="p-2 text-left">Datei</th>
                        <th className="p-2 text-left">Existiert</th>
                        <th className="p-2 text-left">Größe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serverStatus.keyFiles.map((file: any, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                          <td className="p-2">{file.path}</td>
                          <td className="p-2">{file.exists ? '✅' : '❌'}</td>
                          <td className="p-2">{file.size} Bytes</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Keine Datei-Informationen verfügbar</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}