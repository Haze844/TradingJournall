import React, { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimierterTooltipProps {
  children: ReactNode;
  inhalt: ReactNode;
  seite?: "oben" | "rechts" | "unten" | "links";
  ausrichtung?: "anfang" | "mitte" | "ende";
  verzögerung?: number;
  className?: string;
  inhaltClassName?: string;
}

const AnimierterTooltip = ({
  children,
  inhalt,
  seite = "oben",
  ausrichtung = "mitte",
  verzögerung = 200,
  className,
  inhaltClassName,
}: AnimierterTooltipProps) => {
  const [istOffen, setIstOffen] = useState(false);
  const [verzögerungsHandler, setVerzögerungsHandler] = useState<NodeJS.Timeout | null>(null);

  const handleMausEintritt = () => {
    setVerzögerungsHandler(
      setTimeout(() => {
        setIstOffen(true);
      }, verzögerung)
    );
  };

  const handleMausVerlassen = () => {
    if (verzögerungsHandler) {
      clearTimeout(verzögerungsHandler);
      setVerzögerungsHandler(null);
    }
    setIstOffen(false);
  };

  // Positions-Stile basierend auf Seite und Ausrichtung
  const holePositionsStile = () => {
    let positionsStile: React.CSSProperties = {};
    
    switch (seite) {
      case "oben":
        positionsStile.bottom = "100%";
        positionsStile.marginBottom = "0.5rem";
        break;
      case "rechts":
        positionsStile.left = "100%";
        positionsStile.marginLeft = "0.5rem";
        break;
      case "unten":
        positionsStile.top = "100%";
        positionsStile.marginTop = "0.5rem";
        break;
      case "links":
        positionsStile.right = "100%";
        positionsStile.marginRight = "0.5rem";
        break;
    }
    
    switch (ausrichtung) {
      case "anfang":
        if (seite === "oben" || seite === "unten") positionsStile.left = 0;
        else positionsStile.top = 0;
        break;
      case "mitte":
        if (seite === "oben" || seite === "unten") {
          positionsStile.left = "50%";
          positionsStile.transform = "translateX(-50%)";
        } else {
          positionsStile.top = "50%";
          positionsStile.transform = "translateY(-50%)";
        }
        break;
      case "ende":
        if (seite === "oben" || seite === "unten") positionsStile.right = 0;
        else positionsStile.bottom = 0;
        break;
    }

    return positionsStile;
  };

  // Animations-Varianten basierend auf der Seite
  const holeAnimationsVarianten = () => {
    const richtungen = {
      oben: { initial: { y: 10 }, animate: { y: 0 } },
      rechts: { initial: { x: -10 }, animate: { x: 0 } },
      unten: { initial: { y: -10 }, animate: { y: 0 } },
      links: { initial: { x: 10 }, animate: { x: 0 } },
    };

    return {
      initial: {
        opacity: 0,
        ...richtungen[seite].initial,
      },
      animate: {
        opacity: 1,
        ...richtungen[seite].animate,
      },
      exit: {
        opacity: 0,
        ...richtungen[seite].initial,
      },
    };
  };

  return (
    <div
      className={cn("relative inline-block", className)}
      onMouseEnter={handleMausEintritt}
      onMouseLeave={handleMausVerlassen}
      onFocus={handleMausEintritt}
      onBlur={handleMausVerlassen}
    >
      {children}
      <AnimatePresence>
        {istOffen && (
          <motion.div
            className={cn(
              "absolute z-50 max-w-xs backdrop-blur-sm",
              inhaltClassName
            )}
            style={holePositionsStile()}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={holeAnimationsVarianten()}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <div className="bg-black/80 text-white p-2 rounded-md shadow-md text-sm font-medium">
              {inhalt}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { AnimierterTooltip };