import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '../types'; // Asegúrate de que esta ruta apunte a tu archivo de tipos

const STORAGE_KEY = '@transactions_data';

export const storageService = {
  // Guardar la lista completa de transacciones
  saveTransactions: async (transactions: Transaction[]) => {
    try {
      // Convertimos los datos a texto (String) antes de guardar
      const jsonValue = JSON.stringify(transactions);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (e) {
      console.error('Error al guardar datos', e);
    }
  },

  // Leer las transacciones guardadas
  loadTransactions: async (): Promise<Transaction[]> => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      // Si hay datos, los convertimos de texto a objetos. Si no, devolvemos una lista vacía.
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Error al cargar datos', e);
      return [];
    }
  }
};