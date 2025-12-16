const MOCK_DATA = {
  accounts: [
    { id: '1', attributes: { name: 'Cuenta Corriente', current_balance: '5420.50', currency_symbol: '$', type: 'asset' as const }},
    { id: '2', attributes: { name: 'Ahorros', current_balance: '12300.00', currency_symbol: '$', type: 'asset' as const }},
    { id: '3', attributes: { name: 'Tarjeta Crédito', current_balance: '-850.00', currency_symbol: '$', type: 'liability' as const }}
  ]
};

export const mockAPI = {
  getAccounts: () => MOCK_DATA.accounts,
};