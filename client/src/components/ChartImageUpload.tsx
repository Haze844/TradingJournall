import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, RefreshCcw, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChartImageUploadProps {
  existingImage?: string | null;
  onChange: (base64Image: string | null) => void;
}

export default function ChartImageUpload({ existingImage, onChange }: ChartImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(existingImage || null);
  const { toast } = useToast();

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
    
    // Dateigröße prüfen (5MB Limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Bild zu groß",
        description: "Maximale Bildgröße ist 5MB",
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">TradingView Chart</p>
        {preview && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-100"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4 mr-1" />
            Entfernen
          </Button>
        )}
      </div>
      
      {!preview ? (
        <div className="border-2 border-dashed border-primary/40 rounded-lg p-4 text-center hover:border-primary/60 transition-colors">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="bg-primary/10 rounded-full p-2">
              <ImageIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">TradingView Chart hinzufügen</p>
              <p className="text-xs text-muted-foreground">
                Füge einen Screenshot deines Charts hinzu
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative"
              disabled={isUploading}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {isUploading ? (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                  Lade hoch...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Bild auswählen
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden border border-border">
          <div className="relative pb-[60%] w-full">
            <img 
              src={preview} 
              alt="TradingView Chart" 
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <div className="p-2 bg-muted/30 text-xs text-center text-muted-foreground">
            TradingView Chart Snapshot
          </div>
        </div>
      )}
    </div>
  );
}