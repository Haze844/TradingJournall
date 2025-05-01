import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: string;
}

export function FullScreenModal({ isOpen, onClose, image }: FullScreenModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Prüfe, ob es ein TradingView-Link ist
  const isTradingViewLink = image && /tradingview\.com\/x\//i.test(image);

  // Event-Listener für Escape-Taste
  useEffect(() => {
    if (!isOpen) return;

    // Animation starten
    setIsVisible(true);
    setImageError(false);
    
    // Verhindere Scrolling des Body während Modal offen ist
    document.body.style.overflow = 'hidden';

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    // Event-Listener hinzufügen
    window.addEventListener("keydown", handleEscape);
    
    // Event-Listener entfernen beim Cleanup
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Wenn das Modal nicht geöffnet ist, nichts rendern
  if (!isOpen) return null;

  // Erstelle die Vollbild-URL für TradingView
  // Wenn der Link bereits ein direkter Bildlink ist (endet mit .png, .jpg, usw.), verwende ihn direkt
  // Ansonsten versuche, einen Screenshot-URL aus dem TradingView-Link zu erstellen
  const getDisplayUrl = () => {
    if (!image) return '';
    
    if (isTradingViewLink) {
      // Für TradingView Links, versuche direkt den Screenshot zu bekommen
      return image;
    }
    
    // Für alle anderen Links, verwende den Link direkt
    return image;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div 
      className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black/95 transition-opacity duration-300
                 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      {/* Schließen-Button oben rechts */}
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute top-4 right-4 bg-black/50 border-white/20 text-white hover:bg-white/20 z-[1001]"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>

      {/* Inhalt des Modals */}
      <div className="w-full h-full flex items-center justify-center p-4">
        {isTradingViewLink && !imageError ? (
          // Wenn es ein TradingView-Link ist, versuche iframe oder Bild
          <>
            {/* Für TradingView Links, versuche ein Bild zu zeigen */}
            <img 
              src={getDisplayUrl()} 
              alt="TradingView Chart" 
              className="max-w-full max-h-full object-contain cursor-zoom-out" 
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              onError={handleImageError}
            />

            {/* Fallback-Info */}
            {imageError && (
              <div className="text-white text-center p-6 bg-black/70 rounded-lg">
                <p className="mb-2">Der TradingView Chart konnte nicht als Bild angezeigt werden.</p>
                <Button 
                  variant="outline" 
                  className="mt-4 border-white/20 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(image, '_blank');
                  }}
                >
                  Chart auf TradingView öffnen
                </Button>
              </div>
            )}
          </>
        ) : (
          // Normales Bild anzeigen
          <img 
            src={getDisplayUrl()} 
            alt="Vollbild Ansicht" 
            className="max-w-full max-h-full object-contain cursor-zoom-out" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            onError={handleImageError}
          />
        )}

        {/* Allgemeiner Fallback für Bildfehler */}
        {imageError && !isTradingViewLink && (
          <div className="text-white text-center p-6 bg-black/70 rounded-lg">
            <p>Das Bild konnte nicht geladen werden.</p>
            <p className="text-sm text-gray-400 mt-2">{image}</p>
          </div>
        )}
      </div>
    </div>
  );
}