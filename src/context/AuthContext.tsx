import React, { createContext, useContext, ReactNode } from 'react';

interface User {
  email: string;
}

interface AuthContextType {
  user: User;
}

const MOCK_USER: User = { email: 'demo@app.local' };

const AuthContext = createContext<AuthContextType>({ user: MOCK_USER });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthContext.Provider value={{ user: MOCK_USER }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};