import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

export const useTheme = () => {
  const context = useContext(ThemeContext);

  // 🛡️ Seguridad: Si intentamos usar esto fuera del Proveedor, lanzamos un error
  if (!context) {
    throw new Error("useTheme debe ser usado dentro de un ThemeProvider");
  }

  return context;
};