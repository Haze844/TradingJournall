#!/bin/bash

# Finde alle Dateien, die "@shared/schema" importieren
FILES=$(grep -l "@shared/schema" client/src/**/*.ts* 2>/dev/null)
echo "Gefundene Dateien mit @shared/schema Import:"
echo "$FILES"

for FILE in $FILES; do
  echo "Fixing import in $FILE"
  # Ersetze den Import durch den neuen lokalen Pfad
  sed -i 's|@shared/schema|../shared/schema|g' "$FILE"
done

# Finde alle Dateien, die "../../shared/schema" importieren
FILES2=$(grep -l "../../shared/schema" client/src/**/*.ts* 2>/dev/null)
echo "Gefundene Dateien mit ../../shared/schema Import:"
echo "$FILES2"

for FILE in $FILES2; do
  echo "Fixing import in $FILE"
  # Ersetze den Import durch den neuen lokalen Pfad
  sed -i 's|../../shared/schema|../shared/schema|g' "$FILE"
done

# Finde alle Dateien, die "../../../shared/schema" importieren
FILES3=$(grep -l "../../../shared/schema" client/src/**/*.ts* 2>/dev/null)
echo "Gefundene Dateien mit ../../../shared/schema Import:"
echo "$FILES3"

for FILE in $FILES3; do
  echo "Fixing import in $FILE"
  # Ersetze den Import durch den neuen lokalen Pfad
  sed -i 's|../../../shared/schema|../shared/schema|g' "$FILE"
done

echo "All imports fixed!"