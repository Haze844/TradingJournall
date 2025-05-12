import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/auth-page";
import SimpleHome from "./pages/SimpleHome";
import { useAuth } from "./hooks/use-auth-new"; // optionaler Auth-Hook

export default function App() {
  const { user, isLoading } = useAuth(); // via Context
  const isAuthenticated = !!user;

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
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
