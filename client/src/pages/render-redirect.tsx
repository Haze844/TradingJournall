import { useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Loader2 } from 'lucide-react';
import { detectEnvironment } from '@/lib/routing-fix';

/**
 * Spezielle Redirect-Seite für Render-Deployment
 * Diese Seite fängt alle unbekannten Routen ab und leitet zur richtigen Seite weiter
 */
export default function RenderRedirectPage() {
  const [location, setLocation] = useLocation();
  const { isRender } = detectEnvironment();
  const [_, params] = useRoute('/render-redirect/:path*');
  
  // Extrahiere die Zielseite aus den URL-Parametern
  const targetPath = params?.path || '';
  
  useEffect(() => {
    // Nur auf Render ausführen
    if (!isRender) {
      setLocation('/');
      return;
    }
    
    console.log('Render-Redirect aktiviert - leite weiter zu:', targetPath || '/');
    
    // Kurze Verzögerung für die Weiterleitung
    const timer = setTimeout(() => {
      // Zum Ziel navigieren - wenn leer, dann zur Startseite
      if (targetPath) {
        setLocation('/' + targetPath);
      } else {
        setLocation('/');
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [targetPath, isRender, setLocation]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
        <h1 className="text-2xl font-bold mt-4">Weiterleitung...</h1>
        <p className="text-muted-foreground mt-2">Du wirst automatisch weitergeleitet.</p>
      </div>
    </div>
  );
}