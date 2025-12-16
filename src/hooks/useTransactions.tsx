import { useContext } from 'react';
import { TransactionContext } from '../context/TransactionContext'; // Ajusta la ruta si es necesario

export const useTransactions = () => {
  const context = useContext(TransactionContext);

  // 🛡️ Seguridad: Si intentamos usar esto fuera del Proveedor, lanzamos un error
  if (!context) {
    throw new Error("useTransactions debe ser usado dentro de un TransactionProvider");
  }

  return context;
};