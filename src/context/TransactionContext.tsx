import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { Transaction } from '../types'; 
import { storageService } from '../services/storage';

interface TransactionContextType {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

export const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  // 👇 CORRECCIÓN: Aquí definimos el estado que faltaba
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const data = await storageService.loadTransactions();
        setTransactions(data);
      } catch (error) {
        console.error("Error cargando transacciones:", error);
      }
    };

    loadInitialData();
  }, []);

  return (
    <TransactionContext.Provider value={{ transactions, setTransactions }}>
      {children}
    </TransactionContext.Provider>
  );
};