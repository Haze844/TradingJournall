import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { loginMutation } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      alert("Bitte geben Sie Benutzername und Passwort ein");
      return;
    }

    try {
      await loginMutation.mutateAsync({ username, password });
      console.log("Login erfolgreich");
    } catch (error: any) {
      console.error("Login Fehler:", error);
      alert(`Login fehlgeschlagen: ${error.message || "Bitte versuchen Sie es erneut"}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium mb-1">
          Benutzername
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-white"
          placeholder="Benutzername eingeben"
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Passwort
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-white"
          placeholder="Passwort eingeben"
        />
      </div>
      
      <button 
        type="submit" 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? "Anmelden..." : "Anmelden"}
      </button>
    </form>
  );
}