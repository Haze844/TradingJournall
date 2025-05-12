import React from "react";

export default function Loader() {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-gray-500" />
      <span className="text-gray-600 text-sm">Lade...</span>
    </div>
  );
}