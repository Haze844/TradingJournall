  // Komplett neue, vereinfachte Funktion für die Tastaturnavigation
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>, index: number) => {
    // Wir verarbeiten nur die Pfeiltasten
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || 
        event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      
      // Das aktuelle Element
      const currentElement = inputRefs.current[index];
      if (!currentElement) return;
      
      // Aktuellen Block und seinen Typ ermitteln
      const currentBlock = currentElement.closest('.bg-muted\\/30');
      if (!currentBlock) return;
      
      const titleEl = currentBlock.querySelector('.text-xs.font-medium');
      const titleText = titleEl?.textContent?.toLowerCase() || '';
      const currentBlockType = getBlockTypeFromTitle(titleText);
      
      console.log(`Navigation: Block ${currentBlockType}, Richtung ${event.key}`);
            
      // Alle interaktiven Elemente und ihre Positionen sammeln
      const elementPositions: Array<{
        element: HTMLElement,
        rect: DOMRect,
        blockType: string,
        index: number
      }> = [];
      
      // Alle Elemente durchgehen und ihre Positionen und Block-Zugehörigkeit sammeln
      inputRefs.current.forEach((el, idx) => {
        if (!el) return;
        
        const elBlock = el.closest('.bg-muted\\/30');
        if (!elBlock) return;
        
        const elTitleEl = elBlock.querySelector('.text-xs.font-medium');
        const elTitleText = elTitleEl?.textContent?.toLowerCase() || '';
        const elBlockType = getBlockTypeFromTitle(elTitleText);
        
        elementPositions.push({
          element: el,
          rect: el.getBoundingClientRect(),
          blockType: elBlockType,
          index: idx
        });
      });
      
      // Position des aktuellen Elements
      const currentRect = currentElement.getBoundingClientRect();
      
      // Block-Sequenz für die Navigation
      const blockSequence = ['setup', 'trends', 'position', 'marktzonen', 'ergebnis'];
      const currentBlockIndex = blockSequence.indexOf(currentBlockType);
      
      // Nächster/vorheriger Block in der Sequenz
      let targetBlockType = currentBlockType;
      
      // Bei Zeilenwechsel oder Blockwechsel
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        let bestMatch = null;
        let bestScore = Number.MAX_VALUE;
        
        // Suche nach dem nächsten Element in der Richtung
        elementPositions.forEach(item => {
          // Bei ArrowDown nur Elemente unterhalb betrachten
          if (event.key === 'ArrowDown' && item.rect.top <= currentRect.bottom) return;
          
          // Bei ArrowUp nur Elemente oberhalb betrachten
          if (event.key === 'ArrowUp' && item.rect.bottom >= currentRect.top) return;
          
          // Horizontale Abweichung (quadriert zur stärkeren Gewichtung)
          const horizontalOffset = Math.pow(
            Math.abs((item.rect.left + item.rect.right) / 2 - (currentRect.left + currentRect.right) / 2), 
            2
          );
          
          // Vertikale Distanz (je näher, desto besser)
          const verticalDistance = event.key === 'ArrowDown' 
            ? item.rect.top - currentRect.bottom
            : currentRect.top - item.rect.bottom;
          
          // Score basierend auf vertikaler Distanz und horizontaler Abweichung
          const score = verticalDistance + horizontalOffset * 0.01;
          
          // Wenn dieses Element besser ist als unser bisheriges Bestes, aktualisieren
          if (score < bestScore) {
            bestScore = score;
            bestMatch = item;
          }
        });
        
        // Wenn wir ein passendes Element gefunden haben, fokussieren wir es
        if (bestMatch) {
          bestMatch.element.focus();
          return;
        }
        
        // Wenn kein Element in der gewünschten Richtung gefunden wurde, versuche Blockwechsel
        if (event.key === 'ArrowDown' && currentBlockIndex < blockSequence.length - 1) {
          // Zum nächsten Block springen
          targetBlockType = blockSequence[currentBlockIndex + 1];
        } else if (event.key === 'ArrowUp' && currentBlockIndex > 0) {
          // Zum vorherigen Block springen
          targetBlockType = blockSequence[currentBlockIndex - 1];
        }
        
        // Nach Elementen im Zielblock suchen
        if (targetBlockType !== currentBlockType) {
          const blockElements = elementPositions.filter(item => item.blockType === targetBlockType);
          
          if (blockElements.length > 0) {
            // Bei ArrowDown das erste Element im nächsten Block
            if (event.key === 'ArrowDown') {
              // Wähle das am weitesten oben liegende Element
              const topElement = blockElements.reduce((best, current) => 
                best.rect.top < current.rect.top ? best : current
              );
              topElement.element.focus();
              return;
            }
            
            // Bei ArrowUp das letzte Element im vorherigen Block
            if (event.key === 'ArrowUp') {
              // Wähle das am weitesten unten liegende Element
              const bottomElement = blockElements.reduce((best, current) => 
                best.rect.bottom > current.rect.bottom ? best : current
              );
              bottomElement.element.focus();
              return;
            }
          }
        }
      }
      
      // Horizontale Navigation (ArrowLeft/ArrowRight)
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        let bestMatch = null;
        let bestScore = Number.MAX_VALUE;
        
        // Suche nach dem nächsten Element in der Richtung
        elementPositions.forEach(item => {
          // Bei gleicher Höhe oder in unmittelbarer Nähe (gleiche Zeile)
          const isInSameRow = Math.abs(
            (item.rect.top + item.rect.bottom) / 2 - (currentRect.top + currentRect.bottom) / 2
          ) < Math.max(item.rect.height, currentRect.height) * 0.7;
          
          // Bei ArrowRight nur Elemente rechts betrachten
          if (event.key === 'ArrowRight' && item.rect.left <= currentRect.right) return;
          
          // Bei ArrowLeft nur Elemente links betrachten
          if (event.key === 'ArrowLeft' && item.rect.right >= currentRect.left) return;
          
          // Vertikale Abweichung (quadriert zur stärkeren Gewichtung)
          const verticalOffset = Math.pow(
            Math.abs((item.rect.top + item.rect.bottom) / 2 - (currentRect.top + currentRect.bottom) / 2), 
            2
          );
          
          // Horizontale Distanz (je näher, desto besser)
          const horizontalDistance = event.key === 'ArrowRight' 
            ? item.rect.left - currentRect.right
            : currentRect.left - item.rect.right;
          
          // Bonus für Elemente in der gleichen Zeile
          const sameRowBonus = isInSameRow ? -1000 : 0;
          
          // Score basierend auf horizontaler Distanz und vertikaler Abweichung
          const score = horizontalDistance + verticalOffset * 0.01 + sameRowBonus;
          
          // Bevorzugung für Elemente im selben Block
          const sameBlockBonus = item.blockType === currentBlockType ? -500 : 0;
          
          // Wenn dieses Element besser ist als unser bisheriges Bestes, aktualisieren
          if (score + sameBlockBonus < bestScore) {
            bestScore = score + sameBlockBonus;
            bestMatch = item;
          }
        });
        
        // Wenn wir ein passendes Element gefunden haben, fokussieren wir es
        if (bestMatch) {
          bestMatch.element.focus();
          return;
        }
        
        // Wenn kein Element in der gewünschten Richtung gefunden wurde, versuche Blockwechsel
        if (event.key === 'ArrowRight' && currentBlockIndex < blockSequence.length - 1) {
          // Zum nächsten Block springen
          targetBlockType = blockSequence[currentBlockIndex + 1];
        } else if (event.key === 'ArrowLeft' && currentBlockIndex > 0) {
          // Zum vorherigen Block springen
          targetBlockType = blockSequence[currentBlockIndex - 1];
        }
        
        // Nach Elementen im Zielblock suchen
        if (targetBlockType !== currentBlockType) {
          const blockElements = elementPositions.filter(item => item.blockType === targetBlockType);
          
          if (blockElements.length > 0) {
            // Bei ArrowRight das erste Element im nächsten Block
            if (event.key === 'ArrowRight') {
              // Suche das Element im neuen Block, das horizontal am weitesten links ist
              const leftmostElement = blockElements.reduce((best, current) => 
                best.rect.left < current.rect.left ? best : current
              );
              leftmostElement.element.focus();
              return;
            }
            
            // Bei ArrowLeft das letzte Element im vorherigen Block
            if (event.key === 'ArrowLeft') {
              // Suche das Element im neuen Block, das horizontal am weitesten rechts ist
              const rightmostElement = blockElements.reduce((best, current) => 
                best.rect.right > current.rect.right ? best : current
              );
              rightmostElement.element.focus();
              return;
            }
          }
        }
      }
    }
    
    // Navigation mit Enter-Taste zum nächsten Feld - barrierefrei durch alle Blöcke
    if (event.key === 'Enter') {
      event.preventDefault();
      
      // Wenn das aktuelle Element ein Dropdown oder eine Schaltfläche ist, überprüfe zuerst, 
      // ob es bereits geöffnet ist
      const isDropdown = event.target instanceof HTMLElement && 
                        (event.target.getAttribute('role') === 'combobox' || 
                        event.target.getAttribute('aria-haspopup') === 'listbox');
      
      const isButton = event.target instanceof HTMLButtonElement;
      const isDropdownOpen = document.querySelector('[role="listbox"]');
      
      // Wenn es ein geschlossenes Dropdown ist, öffne es
      if (isDropdown && !isDropdownOpen) {
        if (event.target instanceof HTMLElement) {
          event.target.click(); // Öffne das Dropdown
          return; // Stoppe hier, damit der Benutzer zuerst eine Option auswählen kann
        }
      }
      
      // Wenn es ein Button ist, klicke ihn
      if (isButton && event.target instanceof HTMLButtonElement) {
        event.target.click();
        // Trotzdem zum nächsten Element navigieren (falls es existiert)
      }
      
      // Suche nach dem nächsten verfügbaren Eingabefeld
      let nextIndex = index + 1;
      while (nextIndex < inputRefs.current.length && !inputRefs.current[nextIndex]) {
        nextIndex++;
      }
      
      // Wenn ein nächstes Feld existiert, fokussiere es
      if (nextIndex < inputRefs.current.length && inputRefs.current[nextIndex]) {
        const nextElement = inputRefs.current[nextIndex];
        
        if (nextElement instanceof HTMLButtonElement || 
            nextElement instanceof HTMLInputElement || 
            nextElement instanceof HTMLSelectElement) {
          nextElement.focus();
          
          // Für SelectTrigger: automatisch öffnen
          if (nextElement.getAttribute('role') === 'combobox') {
            // Nicht sofort öffnen, um Benutzern die Möglichkeit zu geben, weiterzutabben
            console.log("Nächstes Feld ist ein Dropdown: fokussiert aber nicht geöffnet");
          }
        }
      } else {
        // Automatisch speichern, wenn das letzte Feld erreicht wurde
        saveChanges();
      }
    }
    
    // Escape-Taste zum Abbrechen der Bearbeitung
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditMode();
    }
  };