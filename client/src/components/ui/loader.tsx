// client/src/components/ui/loader.tsx
import React from "react";

export default function Loader() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
      <div className="loader" />
      <style>{`
        .loader {
          width: 32px;
          height: 32px;
          border: 4px solid #ccc;
          border-top-color: #333;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}