#!/bin/bash

# Finde alle Dateien, die "@shared/schema" importieren
FILES=$(grep -l "@shared/schema" client/src/**/*.ts* 2>/dev/null)

for FILE in $FILES; do
  echo "Fixing import in $FILE"
  # Bestimme die relative Pfad-Tiefe
  DEPTH=$(echo "$FILE" | tr -cd '/' | wc -c)
  DEPTH=$((DEPTH - 2)) # Ziehe "client/src/" ab
  
  # Baue den richtigen relativen Pfad auf
  REL_PATH="../"
  for ((i=0; i<$DEPTH; i++)); do
    REL_PATH="../$REL_PATH"
  done
  
  # Ersetze den Import
  sed -i "s|@shared/schema|${REL_PATH}shared/schema|g" "$FILE"
done

echo "All imports fixed!"