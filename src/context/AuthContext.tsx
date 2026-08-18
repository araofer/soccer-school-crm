import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { AuthUser } from "../types";

interface AuthContextType {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  updateUser: (payload: Pick<AuthUser, "name" | "email">) => void;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const cachedUser =
      typeof window !== "undefined"
        ? window.localStorage.getItem("soccer-school-user")
        : null;
    if (!cachedUser) return null;
    try {
      return JSON.parse(cachedUser) as AuthUser;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      window.localStorage.setItem("soccer-school-user", JSON.stringify(user));
    } else {
      window.localStorage.removeItem("soccer-school-user");
    }
  }, [user]);

  const updateUser = (payload: Pick<AuthUser, "name" | "email">) => {
    setUser((current) => (current ? { ...current, ...payload } : current));
  };

  const login = (userData: AuthUser) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, updateUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
