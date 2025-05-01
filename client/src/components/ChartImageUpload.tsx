import { useState, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, RefreshCcw, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import ImagePreview from "@/components/ImagePreview";

interface ChartImageUploadProps {
  existingImage?: string | null;
  onChange: (base64Image: string | null) => void;
}

export default function ChartImageUpload({ existingImage, onChange }: ChartImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(existingImage || null);
  const [linkInput, setLinkInput] = useState<string>("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Wenn der existingImage ändert sich, dann ändert sich auch der Preview
  useEffect(() => {
    setPreview(existingImage || null);
  }, [existingImage]);

  // Datei zu Base64 konvertieren
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Bild-Upload Handler
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Prüfen, ob Datei ein Bild ist
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ungültiges Dateiformat",
        description: "Bitte nur Bilder hochladen (JPEG, PNG, GIF)",
        variant: "destructive"
      });
      return;
    }
    
    // Dateigröße prüfen (10MB Limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Bild zu groß",
        description: "Maximale Bildgröße ist 10MB",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Datei zu Base64 konvertieren 
      const base64Image = await fileToBase64(file);
      setPreview(base64Image);
      onChange(base64Image);
      
      toast({
        title: "Bild hinzugefügt",
        description: "Das Chart-Bild wurde erfolgreich hochgeladen"
      });
    } catch (error) {
      toast({
        title: "Upload fehlgeschlagen",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // TradingView Link Handler
  const handleLinkSubmit = () => {
    // Zurücksetzen des Fehlers
    setLinkError(null);
    
    if (!linkInput.trim()) {
      setLinkError("Bitte gib einen Link ein");
      return;
    }
    
    // Überprüfen, ob es ein gültiger Bildlink ist
    if (!isValidImageUrl(linkInput)) {
      setLinkError("Der Link muss mit http:// oder https:// beginnen und auf eine Bilddatei oder TradingView-URL verweisen");
      return;
    }
    
    setIsUploading(true);
    
    // Verarbeite den eingegebenen Link
    let finalUrl = linkInput.trim();
    
    // Wenn es ein TradingView-Link ist, stelle sicher, dass er korrekt formatiert ist
    if (finalUrl.includes('tradingview.com')) {
      // Prüfe, ob es bereits ein direkter Screenshot-Link ist
      if (!finalUrl.includes('/x/')) {
        // Versuche den Link in einen Screenshot-Link umzuwandeln, wenn möglich
        const tvLinkMatch = finalUrl.match(/\/chart\/([^\/]+)/);
        if (tvLinkMatch && tvLinkMatch[1]) {
          finalUrl = `https://www.tradingview.com/x/${tvLinkMatch[1]}/`;
        }
      }
    }
    
    // Direkte Verwendung der verarbeiteten URL als Bildquelle
    setPreview(finalUrl);
    onChange(finalUrl);
    
    toast({
      title: "Bild hinzugefügt",
      description: "Der TradingView Chart wurde erfolgreich verknüpft"
    });
    
    setIsUploading(false);
    setLinkInput("");
  };

  // Überprüfung der Bild-URL
  const isValidImageUrl = (url: string): boolean => {
    // Überprüft, ob die URL mit http:// oder https:// beginnt
    const hasValidProtocol = /^https?:\/\//i.test(url);
    
    // Überprüft, ob es sich um eine Bild-URL handelt (endet mit .jpg, .jpeg, .png, .gif) 
    // oder eine TradingView-URL ist
    const isImageOrTradingViewUrl = /\.(jpg|jpeg|png|gif)$/i.test(url) || 
                                    /tradingview\.com/i.test(url) ||
                                    /\.tradingstation\.com/i.test(url);
    
    return hasValidProtocol && isImageOrTradingViewUrl;
  };

  // Löschen des Bildes
  const handleRemoveImage = () => {
    setPreview(null);
    onChange(null);
    toast({
      title: "Bild entfernt",
      description: "Das Chart-Bild wurde entfernt"
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium">TradingView Chart</p>
        {preview && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 px-2 text-red-500 hover:text-red-700 hover:bg-red-100 text-xs"
            onClick={handleRemoveImage}
          >
            <X className="h-3 w-3 mr-1" />
            Entfernen
          </Button>
        )}
      </div>
      
      {!preview ? (
        <div className="border-2 border-dashed border-primary/40 rounded-lg p-2 text-center hover:border-primary/60 transition-colors">
          <div className="flex flex-col items-center justify-center space-y-1">
            <div className="bg-primary/10 rounded-full p-1">
              <LinkIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Kopiere den Link zum Screenshot deines TradingView Charts
              </p>
            </div>
            <div className="w-full space-y-1">
              <Input
                type="url"
                placeholder="https://www.tradingview.com/x/..."
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                className={linkError ? "border-red-500" : ""}
              />
              {linkError && (
                <p className="text-xs text-red-500">{linkError}</p>
              )}
              <Button 
                onClick={handleLinkSubmit}
                disabled={isUploading}
                className="w-full"
                variant="default"
              >
                {isUploading ? (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                    Verarbeite...
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Link verwenden
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <ImagePreview 
            image={preview} 
            alt="TradingView Chart" 
          />
        </>  
      )}
    </div>
  );
}