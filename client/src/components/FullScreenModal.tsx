import { useEffect, useState } from "react";

interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: string;
}

export function FullScreenModal({ isOpen, onClose, image }: FullScreenModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Event-Listener für Escape-Taste
  useEffect(() => {
    if (!isOpen) return;

    // Animation starten
    setIsVisible(true);
    
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

  return (
    <div 
      className={`fixed inset-0 z-[1000] flex items-center justify-center bg-black transition-opacity duration-300 p-0 m-0
                 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <img 
        src={image} 
        alt="Vollbild Ansicht" 
        className="w-full h-full cursor-pointer object-contain p-0 m-0" 
        onClick={(e) => {
          e.stopPropagation(); // Verhindert Bubbling, so dass der Klick auf das Bild nicht das Modal schließt
          onClose(); // Trotzdem schließen, da wir es so wollen
        }}
        onWheel={onClose}
      />
    </div>
  );
}