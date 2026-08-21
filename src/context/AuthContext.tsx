import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { AuthUser } from "../types";
import { api } from "../lib/api";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  updateUser: (payload: Pick<AuthUser, "name" | "email">) => void;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    api
      .me()
      .then((userData) => {
        if (isMounted) {
          setUser(userData);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateUser = (payload: Pick<AuthUser, "name" | "email">) => {
    setUser((current) => (current ? { ...current, ...payload } : current));
  };

  const login = (userData: AuthUser) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignora erro de rede no logout para limpar estado local
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, setUser, updateUser, login, logout }}
    >
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
