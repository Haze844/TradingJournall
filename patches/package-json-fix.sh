#!/bin/bash
# Diese Datei ändert die build- und start-Skripte in package.json, 
# um ESM-kompatible Ausgabedateien zu erzeugen
sed -i 's|--format=esm --outdir=dist"|--format=esm --outfile=dist/index.mjs"|g' package.json
sed -i 's|node dist/index.js|node dist/index.mjs|g' package.json
echo "✅ package.json für ESM angepasst"
