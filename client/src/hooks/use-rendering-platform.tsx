import { useEffect, useState } from 'react';
import { detectEnvironment } from '@/lib/routing-fix';

type RenderingPlatform = {
  isRender: boolean;
  isReplit: boolean;
  isNetlify: boolean;
  isLocalhost: boolean;
  hostname: string;
  apiBaseUrl: string;
  needsExplicitRedirects: boolean;
};

/**
 * Hook zum Erkennen der Rendering-Plattform und Konfigurieren von
 * plattformspezifischen Einstellungen
 */
export function useRenderingPlatform(): RenderingPlatform {
  const [platform, setPlatform] = useState<RenderingPlatform>({
    isRender: false,
    isReplit: false,
    isNetlify: false,
    isLocalhost: false,
    hostname: '',
    apiBaseUrl: '',
    needsExplicitRedirects: false
  });

  useEffect(() => {
    const { isRender, isReplit, isNetlify, isLocalhost } = detectEnvironment();
    
    // Hostname bestimmen
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    
    // API Base URL basierend auf Plattform
    let apiBaseUrl = '';
    
    // Spezielle Konfiguration für bestimmte Plattformen
    let needsExplicitRedirects = false;
    
    if (isRender) {
      // Render verwendet dieselbe Domain für API und Frontend
      apiBaseUrl = '';
      needsExplicitRedirects = true;
    } else if (isNetlify) {
      // Netlify benötigt spezielle API URL zu Render oder anderen Backend-Services
      apiBaseUrl = process.env.REACT_APP_API_URL || '';
      needsExplicitRedirects = true;
    }
    
    setPlatform({
      isRender,
      isReplit,
      isNetlify,
      isLocalhost,
      hostname,
      apiBaseUrl,
      needsExplicitRedirects
    });
    
    // Debug-Log
    if (isRender) {
      console.log('Render-Plattform erkannt - spezielle Routing-Anpassungen aktiviert');
    }
  }, []);

  return platform;
}