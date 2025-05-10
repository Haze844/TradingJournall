import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { isRenderEnvironment, isReplitEnvironment, detectEnvironment } from '@/lib/env-detection';
import { debugLog, errorLog, diagnoseRenderState, getDebugState } from '@/lib/render-debug';

export default function DebugPage() {
  const [activeTab, setActiveTab] = useState('auth');
  const [authDebugData, setAuthDebugData] = useState<any>(null);
  const [renderLogs, setRenderLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataFetchError, setDataFetchError] = useState<string | null>(null);
  const [envInfo, setEnvInfo] = useState(detectEnvironment());
  const [sessionStatus, setSessionStatus] = useState<any>(null);
  const { toast } = useToast();
  const auth = useAuth();
  const user = auth.user;
  const isAuthenticated = !!user;

  // Fetch-Funktionen
  const fetchAuthDebug = async () => {
    setIsLoading(true);
    setDataFetchError(null);
    try {
      const response = await fetch('/auth-debug');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      setAuthDebugData(data);
      debugLog('DEBUG-PAGE', 'Auth-Debug Daten abgerufen:', data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setDataFetchError(`Fehler beim Abrufen der Auth-Debug-Daten: ${errorMessage}`);
      errorLog('DEBUG-PAGE', 'Fehler beim Abrufen der Auth-Debug-Daten:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRenderLogs = async () => {
    setIsLoading(true);
    setDataFetchError(null);
    try {
      const response = await fetch('/api/render-logs');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      setRenderLogs(data.logs || []);
      setSessionStatus(data.session || null);
      debugLog('DEBUG-PAGE', 'Render-Logs abgerufen:', data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setDataFetchError(`Fehler beim Abrufen der Render-Logs: ${errorMessage}`);
      errorLog('DEBUG-PAGE', 'Fehler beim Abrufen der Render-Logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testCookies = () => {
    // Setze einen Test-Cookie
    document.cookie = `debug_test=${Date.now()};path=/;`;
    toast({
      title: 'Test-Cookie gesetzt',
      description: 'Cookie für Debug-Zwecke wurde gesetzt',
    });
    
    // Nach einer kurzen Verzögerung Cookies prüfen
    setTimeout(() => {
      const cookies = document.cookie;
      debugLog('DEBUG-PAGE', 'Aktuelle Cookies:', cookies);
      toast({
        title: 'Cookie-Status',
        description: cookies ? `Cookies vorhanden: ${cookies}` : 'Keine Cookies gefunden'
      });
    }, 500);
  };

  const forceRenderMode = (enabled: boolean) => {
    try {
      if (enabled) {
        localStorage.setItem('debug_isRender', 'true');
        toast({
          title: 'Render-Modus aktiviert',
          description: 'Render-Umgebungserkennung wurde manuell aktiviert'
        });
      } else {
        localStorage.removeItem('debug_isRender');
        toast({
          title: 'Render-Modus deaktiviert',
          description: 'Render-Umgebungserkennung wurde zurückgesetzt'
        });
      }
      // Umgebungsinfo aktualisieren
      setEnvInfo(detectEnvironment());
    } catch (e) {
      errorLog('DEBUG-PAGE', 'Fehler beim Ändern des Render-Modus:', e);
    }
  };

  const generateTestError = () => {
    try {
      // Absichtlich einen Fehler erzeugen für Debug-Zwecke
      const testObject = null;
      // @ts-ignore - Absichtlicher Fehler
      const result = testObject.nonExistentMethod();
      console.log('Dieser Code sollte nie ausgeführt werden:', result);
    } catch (e) {
      errorLog('DEBUG-PAGE', 'Test-Fehler erzeugt:', e);
      toast({
        title: 'Test-Fehler erzeugt',
        description: 'Fehler-Log wurde in der Konsole ausgegeben',
        variant: 'destructive'
      });
    }
  };

  const runRenderDiagnose = () => {
    const diagnoseResult = diagnoseRenderState();
    debugLog('DEBUG-PAGE', 'Render-Diagnose durchgeführt:', diagnoseResult);
    toast({
      title: 'Render-Diagnose durchgeführt',
      description: 'Ergebnis wurde in den Debug-Logs gespeichert',
    });
  };

  // Effekt, um die Debug-Daten beim Laden der Seite zu laden
  useEffect(() => {
    if (activeTab === 'auth') {
      fetchAuthDebug();
    } else if (activeTab === 'logs') {
      fetchRenderLogs();
    }
    
    // Bei jedem Tab-Wechsel Debug-Info ausgeben
    debugLog('DEBUG-PAGE', 'Debug-Seite geladen oder Tab gewechselt:', {
      activeTab,
      envInfo,
      isAuthenticated,
      userId: user?.id,
      username: user?.username,
      renderState: getDebugState()
    });
  }, [activeTab]);

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Debug & Diagnose Tool</CardTitle>
          <CardDescription>
            Dieses Tool hilft bei der Diagnose von Problemen mit der Anwendung
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Umgebung</h3>
              <ul className="space-y-1">
                <li>
                  Render: <span className={envInfo.isRender ? 'text-green-500 font-bold' : 'text-gray-500'}>
                    {envInfo.isRender ? 'Ja' : 'Nein'}
                  </span>
                </li>
                <li>
                  Replit: <span className={envInfo.isReplit ? 'text-green-500 font-bold' : 'text-gray-500'}>
                    {envInfo.isReplit ? 'Ja' : 'Nein'}
                  </span>
                </li>
                <li>
                  Netlify: <span className={envInfo.isNetlify ? 'text-green-500 font-bold' : 'text-gray-500'}>
                    {envInfo.isNetlify ? 'Ja' : 'Nein'}
                  </span>
                </li>
                <li>Hostname: <code>{envInfo.hostname}</code></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Authentifizierung</h3>
              <ul className="space-y-1">
                <li>
                  Status: <span className={isAuthenticated ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                    {isAuthenticated ? 'Authentifiziert' : 'Nicht authentifiziert'}
                  </span>
                </li>
                {user && (
                  <>
                    <li>User ID: {user.id}</li>
                    <li>Username: {user.username}</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Button onClick={() => fetchAuthDebug()} disabled={isLoading}>
              Auth-Debug aktualisieren
            </Button>
            <Button onClick={() => fetchRenderLogs()} disabled={isLoading}>
              Render-Logs abrufen
            </Button>
            <Button onClick={testCookies} variant="outline">
              Cookies testen
            </Button>
            <Button 
              onClick={() => forceRenderMode(!isRenderEnvironment())} 
              variant={isRenderEnvironment() ? "destructive" : "outline"}
            >
              {isRenderEnvironment() ? 'Render-Modus deaktivieren' : 'Render-Modus aktivieren'}
            </Button>
            <Button onClick={generateTestError} variant="destructive">
              Test-Fehler erzeugen
            </Button>
            <Button onClick={runRenderDiagnose} variant="outline">
              Render-Diagnose ausführen
            </Button>
          </div>

          {dataFetchError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p className="font-bold">Fehler</p>
              <p>{dataFetchError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="auth">Authentifizierung & Session</TabsTrigger>
          <TabsTrigger value="logs">Render Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="auth">
          <Card>
            <CardHeader>
              <CardTitle>Auth & Session Debug</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-10">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
                  <p>Daten werden geladen...</p>
                </div>
              ) : authDebugData ? (
                <div className="overflow-auto max-h-[60vh]">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Session</h3>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                      {JSON.stringify(authDebugData.session, null, 2)}
                    </pre>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Cookies</h3>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                      {JSON.stringify(authDebugData.cookies, null, 2)}
                    </pre>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Umgebung</h3>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                      {JSON.stringify(authDebugData.environment, null, 2)}
                    </pre>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Request Info</h3>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                      {JSON.stringify(authDebugData.request, null, 2)}
                    </pre>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Header Info</h3>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                      {JSON.stringify(authDebugData.headers, null, 2)}
                    </pre>
                  </div>
                  
                  {authDebugData.renderInfo && Object.keys(authDebugData.renderInfo).length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2">Render Info</h3>
                      <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                        {JSON.stringify(authDebugData.renderInfo, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Datenbank Status</h3>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                      {JSON.stringify(authDebugData.database, null, 2)}
                    </pre>
                  </div>
                  
                  {authDebugData.recentAuthLogs && authDebugData.recentAuthLogs.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2">Letzte Auth-Logs</h3>
                      <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                        {JSON.stringify(authDebugData.recentAuthLogs, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p>Keine Auth-Debug-Daten verfügbar</p>
                  <Button onClick={fetchAuthDebug} className="mt-4">
                    Daten abrufen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Render Logs</CardTitle>
              {sessionStatus && (
                <CardDescription>
                  Session: {sessionStatus.authenticated ? 'Authentifiziert' : 'Nicht authentifiziert'} 
                  | ID: {sessionStatus.sessionID || 'Keine'} 
                  | Cookies: {sessionStatus.hasCookies ? 'Vorhanden' : 'Keine'}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-10">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
                  <p>Logs werden geladen...</p>
                </div>
              ) : renderLogs && renderLogs.length > 0 ? (
                <div className="bg-gray-100 p-4 rounded overflow-auto max-h-[60vh]">
                  {renderLogs.map((log, index) => (
                    <div 
                      key={index} 
                      className={`mb-1 font-mono text-xs ${log.includes('[ERROR]') ? 'text-red-600' : ''}`}
                    >
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p>Keine Render-Logs verfügbar</p>
                  <Button onClick={fetchRenderLogs} className="mt-4">
                    Logs abrufen
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={fetchRenderLogs} 
                variant="outline" 
                className="w-full"
                disabled={isLoading}
              >
                Logs aktualisieren
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}