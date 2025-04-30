import { useState } from "react";
import { Maximize } from "lucide-react";
import { FullScreenModal } from "./FullScreenModal";

interface ImagePreviewProps {
  image: string;
  alt: string;
}

export default function ImagePreview({ image, alt }: ImagePreviewProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  return (
    <>
      <div 
        className="rounded-lg overflow-hidden border border-border relative group cursor-pointer"
        onClick={() => setIsFullScreen(true)}
      >
        <div className="relative pb-[60%] w-full">
          <img 
            src={image} 
            alt={alt} 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div 
            className="absolute opacity-0 group-hover:opacity-100 transition-opacity inset-0 w-full h-full bg-black/30 flex items-center justify-center"
          >
            <Maximize className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="p-2 bg-muted/30 text-xs text-center text-muted-foreground flex justify-between items-center">
          <span>TradingView Chart</span>
          <span className="text-xs text-muted-foreground/80 italic">Klicken zum Vergrößern</span>
        </div>
      </div>

      <FullScreenModal 
        isOpen={isFullScreen}
        onClose={() => setIsFullScreen(false)}
        image={image}
      />
    </>
  );
}