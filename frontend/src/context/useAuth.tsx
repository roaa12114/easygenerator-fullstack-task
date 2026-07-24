import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getMe, logout as logoutApi } from '../api/auth';

interface User {
  userId: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try{
         const userData = await getMe();
         setUser(userData.user);
    } catch (error) {
        setUser(null)
    }
  };

  const logout = async () => {
    try {
        await logoutApi();
        setUser(null);
    }
        catch (error){
            //worth checking
            setUser(null);
        }
  };

  useEffect(() => {
    const initialization = async() =>{
        await checkAuth();
        setLoading(false);
    }
    initialization ();
    // this should run checkAuth() once, when the app first loads,
    // so a page refresh doesn't lose the "logged in" state
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}