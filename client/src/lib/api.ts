import { isRender } from "./utils";

interface GetQueryFnOptions {
  on401?: "returnNull" | "throw";
}

export const getQueryFn = ({ on401 = "throw" }: GetQueryFnOptions = {}) => {
  return async ({ queryKey }: { queryKey: string[] }) => {
    const endpoint = queryKey[0];

    try {
      const response = await fetch(endpoint, {
        credentials: "include", // ✅ <-- wichtig für Cookies wie tj_sid
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        if (on401 === "returnNull") {
          return null;
        }
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (isRender()) {
        console.warn("API request failed on Render:", endpoint, error);

        // Fallback zu lokalem Storage bei Render-Umgebung
        if (endpoint === "/api/user" || endpoint === "/me") {
          const storedUser = localStorage.getItem("auth_user");
          if (storedUser && storedUser !== "null" && storedUser !== "") {
            try {
              return JSON.parse(storedUser);
            } catch (e) {
              console.error("Failed to parse stored user:", e);
            }
          }
        }
      }

      throw error;
    }
  };
};
