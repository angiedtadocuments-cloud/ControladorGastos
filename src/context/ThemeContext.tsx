import React, { createContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Definimos la forma de los datos
interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 2. EFECTO: Cargar la preferencia al abrir la app 📂
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('APP_THEME');
        if (savedTheme !== null) {
          // Si encontramos 'dark' guardado, activamos el modo oscuro
          setIsDarkMode(savedTheme === 'dark');
        }
      } catch (error) {
        console.error("Error cargando el tema:", error);
      }
    };

    loadThemePreference();
  }, []);

  // 3. FUNCIÓN: Cambiar y GUARDAR la preferencia 💾
  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode; // Calculamos el nuevo valor
      setIsDarkMode(newMode);      // Actualizamos la app inmediatamente
      
      // Guardamos la decisión en la memoria del celular
      await AsyncStorage.setItem('APP_THEME', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error("Error guardando el tema:", error);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};