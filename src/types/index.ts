export interface Transaction {
  id: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
  description?: string;
}

export interface Account {
  id: string;
  attributes: {
    name: string;
    current_balance: string;
    currency_symbol: string;
    type: 'asset' | 'liability';
  };
}

export const CATEGORIES = {
  expense: [
    'Comida',
    'Transporte',
    'Servicios',
    'Entretenimiento',
    'Salud',
    'Educación',
    'Compras',
    'Otros'
  ],
  income: [
    'Salario',
    'Freelance',
    'Inversiones',
    'Ventas',
    'Otros'
  ]
};