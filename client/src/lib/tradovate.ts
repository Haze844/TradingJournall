import { apiRequest } from "./queryClient";

// Tradovate API Schnittstelle
const TRADOVATE_API_BASE = 'https://demo.tradovateapi.com/v1';

// Typedefinitionen für Tradovate
interface TradovateCredentials {
  username: string;
  password: string;
  appId?: string;
  appVersion?: string;
  cid?: string;
  sec?: string;
}

interface TradovateAuthResponse {
  accessToken: string;
  mdAccessToken: string;
  expirationTime: number;
  userId: number;
  name: string;
}

interface TradovateOrder {
  id: number;
  accountId: number;
  contractId: number;
  timestamp: string;
  action: string; // 'Buy' oder 'Sell'
  ordStatus: string;
  executionId: number;
  avgPrice: number;
  filledQty: number;
  symbol?: string; // wird später ergänzt
}

interface TradovateContract {
  id: number;
  name: string;
  contractMaturity: string;
}

// Auth Token Caching
let authToken: string | null = null;
let tokenExpiration: number = 0;

/**
 * Bei Tradovate einloggen und Access Token erhalten
 */
async function getAuthToken(): Promise<string> {
  // Wenn wir bereits einen gültigen Token haben, verwenden wir diesen
  if (authToken && tokenExpiration > Date.now()) {
    return authToken;
  }
  
  try {
    // Hier würden tatsächliche Anmeldedaten verwendet werden
    // Für dieses Beispiel werden die Umgebungsvariablen genutzt
    const credentials: TradovateCredentials = {
      username: process.env.TRADOVATE_USERNAME || "",
      password: process.env.TRADOVATE_PASSWORD || "",
      appId: "Sample App",
      appVersion: "1.0"
    };
    
    if (!credentials.username || !credentials.password) {
      throw new Error("Tradovate Anmeldedaten nicht konfiguriert");
    }
    
    // Die echte API würde direkt den Tradovate Endpunkt ansprechen
    // Für unser Beispiel senden wir die Anfrage an unseren Backend-Proxy
    const response = await apiRequest("POST", "/api/tradovate/auth", credentials);
    const authData: TradovateAuthResponse = await response.json();
    
    // Token und Expiration speichern
    authToken = authData.accessToken;
    // Token läuft 10 Minuten vor der tatsächlichen Expiration ab (Sicherheitspuffer)
    tokenExpiration = authData.expirationTime - 600000;
    
    return authToken;
  } catch (error) {
    console.error("Tradovate Authentifizierungsfehler:", error);
    throw new Error("Konnte nicht bei Tradovate authentifizieren");
  }
}

/**
 * Verträge und ihre Details von Tradovate abrufen
 */
async function getContracts(): Promise<Record<number, TradovateContract>> {
  try {
    const token = await getAuthToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    const response = await apiRequest("GET", "/api/tradovate/contracts", undefined);
    // In einer echten Implementierung würden wir Authorization Header setzen
    // Dies ist hier ein Beispiel, wie es in einer echten API aussehen könnte
    // const response = await fetch(`${TRADOVATE_API_BASE}/contracts`, {
    //   headers: { 'Authorization': `Bearer ${token}` }
    // });
    
    const contracts = await response.json();
    
    // Konvertieren Sie die Liste in eine Map für schnelleren Zugriff
    const contractMap: Record<number, TradovateContract> = {};
    contracts.forEach((contract: TradovateContract) => {
      contractMap[contract.id] = contract;
    });
    
    return contractMap;
  } catch (error) {
    console.error("Fehler beim Abrufen der Verträge:", error);
    throw new Error("Konnte Verträge nicht von Tradovate abrufen");
  }
}

/**
 * Ausgeführte Orders von Tradovate abrufen
 */
async function getExecutedOrders(accountId?: number): Promise<TradovateOrder[]> {
  try {
    const token = await getAuthToken();
    const url = accountId 
      ? `/api/tradovate/orders?accountId=${accountId}&ordStatus=Filled` 
      : `/api/tradovate/orders?ordStatus=Filled`;
    
    const headers = { 'Authorization': `Bearer ${token}` };
    const response = await apiRequest("GET", url, undefined);
    // In einer echten Implementierung würden wir Authorization Header setzen
    // Dies ist hier ein Beispiel, wie es in einer echten API aussehen könnte
    
    const orders = await response.json();
    
    // Vertragsdetails für jede Order abrufen
    const contracts = await getContracts();
    
    // Ergänze die Orders um den Symbol-Namen aus den Vertragsinformationen
    return orders.map((order: TradovateOrder) => ({
      ...order,
      symbol: contracts[order.contractId]?.name || `Unknown-${order.contractId}`
    }));
  } catch (error) {
    console.error("Fehler beim Abrufen der Orders:", error);
    throw new Error("Konnte Orders nicht von Tradovate abrufen");
  }
}

/**
 * Trades von Tradovate abrufen und in das interne Format konvertieren
 */
async function fetchTradovateTradesAndConvert(userId: number): Promise<any[]> {
  try {
    // Orders abrufen
    const orders = await getExecutedOrders();
    
    // Orders in unser internes Format konvertieren
    return orders.map(order => {
      // Bestimmen Sie isWin basierend auf der Action und dem Preis
      // Dies ist eine vereinfachte Logik, in der Realität wäre das komplexer
      const isWin = order.action === 'Buy' ? true : false; // Vereinfacht für das Beispiel
      
      return {
        userId,
        symbol: order.symbol,
        setup: "Auto-Import", // Standardwert, kann später angepasst werden
        mainTrendM15: order.action === 'Buy' ? 'Long' : 'Short',
        internalTrendM5: order.action === 'Buy' ? 'Long' : 'Short',
        entryType: order.action,
        entryLevel: order.avgPrice.toString(),
        liquidation: "", // Nicht direkt in den Tradovate-Daten enthalten
        location: "", // Nicht direkt in den Tradovate-Daten enthalten
        rrAchieved: 0, // Nicht direkt in den Tradovate-Daten enthalten
        rrPotential: 0, // Nicht direkt in den Tradovate-Daten enthalten
        isWin,
        date: order.timestamp,
      };
    });
  } catch (error) {
    console.error("Fehler beim Konvertieren der Trades:", error);
    throw new Error("Konnte Trades nicht konvertieren");
  }
}

/**
 * Hauptfunktion: Trades von Tradovate synchronisieren
 */
export async function synchronizeTrades(userId: number): Promise<{ success: boolean; message: string }> {
  try {
    // Prüfen, ob Tradovate API konfiguriert ist
    // In der Praxis würde hier geprüft, ob die Umgebungsvariablen gesetzt sind
    const credentialsConfigured = await apiRequest("GET", "/api/tradovate/check-credentials");
    const { configured } = await credentialsConfigured.json();
    
    if (!configured) {
      return {
        success: false,
        message: "Tradovate API-Zugangsdaten sind nicht konfiguriert. Bitte in den Einstellungen hinterlegen."
      };
    }
    
    // Hier würden wir direkt die Tradovate API ansprechen
    // Für unser Beispiel senden wir die Anfrage an unseren Backend-Proxy
    const response = await apiRequest("POST", "/api/import-trades", { userId });
    const data = await response.json();
    
    return {
      success: true,
      message: data.message || "Trades erfolgreich von Tradovate synchronisiert"
    };
  } catch (error: any) {
    console.error("Error synchronizing trades:", error);
    return {
      success: false,
      message: error.message || "Fehler bei der Tradovate-Synchronisierung"
    };
  }
}
