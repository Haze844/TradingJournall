import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/auth-page";
import SimpleHome from "./pages/SimpleHome";
import { useAuth } from "./hooks/use-auth";

export default function App() {
  const { user, isLoading } = useAuth();
  const isAuthenticated = !!user;

  // ⏳ Während die Session geladen wird, nichts anzeigen (Vermeidung von Redirect-Fehlern)
  if (isLoading) {
    return <div>Lade...</div>; // oder ein Spinner, etc.
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/simplehome"
          element={
            isAuthenticated ? (
              <SimpleHome />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        {/* Catch-All Fallback */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
