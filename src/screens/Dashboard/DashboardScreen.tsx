import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Dimensions, 
  Modal, 
  Alert,
  TextInput 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from "react-native-chart-kit";
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { storageService } from '../../services/storage';
import { Transaction } from '../../types';
import { useTransactions } from '../../hooks/useTransactions';
import { useTheme } from '../../hooks/useTheme';

const themeColors = {
  light: {
    background: '#f5f7fa',
    card: '#ffffff',
    text: '#333333',
    subtitle: '#666666',
    iconBg: '#f0f2f5',
    toggleText: '#999999',
    toggleActiveText: '#6200ee',
    toggleActiveBg: '#ffffff',
    modalOverlay: 'rgba(0,0,0,0.6)',
    searchBg: '#f0f0f0',
    searchBorder: '#ddd',
  },
  dark: {
    background: '#121212',
    card: '#1e1e1e',
    text: '#e0e0e0',
    subtitle: '#aaaaaa',
    iconBg: '#2c2c2c',
    toggleText: '#666666',
    toggleActiveText: '#bb86fc',
    toggleActiveBg: '#333333',
    modalOverlay: 'rgba(255,255,255,0.1)',
    searchBg: '#2c2c2c',
    searchBorder: '#444',
  }
};

const expenseColors = ['#FF5252', '#FF6384', '#FF9F40', '#FFCD56', '#FF8A80', '#D32F2F', '#E64A19'];
const incomeColors = ['#4CAF50', '#81C784', '#36A2EB', '#4BC0C0', '#9966FF', '#2E7D32', '#0288D1'];

const screenWidth = Dimensions.get("window").width;
export const DashboardScreen = ({ navigation }: any) => {
  const { transactions, setTransactions } = useTransactions();
  const { isDarkMode, toggleTheme } = useTheme();
  const colors = isDarkMode ? themeColors.dark : themeColors.light;

  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [chartView, setChartView] = useState<'category' | 'day'>('category');
  const [chartType, setChartType] = useState<'expense' | 'income'>('expense');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const openOptions = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
  };

  const closeOptions = () => {
    setModalVisible(false);
    setSelectedTransaction(null);
  };

  const handleEdit = () => {
    closeOptions();
    if (selectedTransaction) {
      navigation.navigate('AddTransaction', { transactionToEdit: selectedTransaction });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar Transacción",
      "¿Estás seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            if (!selectedTransaction) return;
            const newTransactions = transactions.filter(t => t.id !== selectedTransaction.id);
            await storageService.saveTransactions(newTransactions);
            setTransactions(newTransactions);
            closeOptions();
          }
        }
      ]
    );
  };

  const getCategoryIcon = (categoryName: string): any => {
    const lowerName = categoryName.toLowerCase();
    if (lowerName.includes('transf')) return 'swap-horizontal';
    if (lowerName.includes('ahorro')) return 'wallet';
    if (lowerName.includes('deuda')) return 'checkmark-done-circle';
    if (lowerName.includes('plataforma') || lowerName.includes('servicio')) return 'tv';
    if (lowerName.includes('pago')) return 'card';
    if (lowerName.includes('comida')) return 'fast-food';
    if (lowerName.includes('transporte') || lowerName.includes('gasolina')) return 'car';
    if (lowerName.includes('salud')) return 'medical';
    if (lowerName.includes('educación')) return 'school';
    if (lowerName.includes('entretenimiento')) return 'game-controller';
    if (lowerName.includes('salario')) return 'cash';
    if (lowerName.includes('freelance')) return 'laptop';
    if (lowerName.includes('inversiones')) return 'trending-up';
    return 'pricetag';
  };
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let filtered = transactions.filter(item => {
      const itemDate = new Date(item.date);
      switch (activeFilter) {
        case 'today': return itemDate >= todayStart;
        case 'week':
          const oneWeekAgo = new Date(todayStart);
          oneWeekAgo.setDate(todayStart.getDate() - 7);
          return itemDate >= oneWeekAgo;
        case 'month':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return itemDate >= startOfMonth;
        default: return true;
      }
    });

    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [transactions, activeFilter, searchQuery]);

  const balance = useMemo(() => {
    return filteredTransactions.reduce((sum, t) =>
      sum + (t.type === 'income' ? t.amount : -t.amount), 0
    );
  }, [filteredTransactions]);

  const chartData = useMemo(() => {
    const relevantData = filteredTransactions.filter(t => t.type === chartType);
    if (relevantData.length === 0) return [];
    
    let groupedData: { [key: string]: number } = {};
    relevantData.forEach(item => {
      let key;
      if (chartView === 'category') {
        key = item.category;
      } else {
        key = new Date(item.date).toLocaleDateString('es-MX');
      }
      groupedData[key] = (groupedData[key] || 0) + item.amount;
    });
    
    const currentColors = chartType === 'income' ? incomeColors : expenseColors;
    return Object.keys(groupedData).map((key, index) => ({
      name: key,
      population: groupedData[key],
      color: currentColors[index % currentColors.length],
      legendFontColor: colors.text,
      legendFontSize: 12
    }));
  }, [filteredTransactions, chartView, chartType, colors.text]);
  const createPDFContent = (data: Transaction[]) => {
    const total = data.reduce((sum, item) => sum + (item.type === 'income' ? item.amount : -item.amount), 0);
    const bgColor = isDarkMode ? '#121212' : '#FFFFFF';
    const textColor = isDarkMode ? '#E0E0E0' : '#333333';
    const cardBg = isDarkMode ? '#1E1E1E' : '#F8F8F8';

    const listItems = data.map(item => `
      <tr style="background-color: ${cardBg}; color: ${textColor};">
        <td>${new Date(item.date).toLocaleDateString('es-MX')}</td>
        <td>${item.category}</td>
        <td>${item.description || ''}</td>
        <td style="color: ${item.type === 'income' ? '#4CAF50' : '#FF5252'}; font-weight: bold; text-align: right;">
          ${item.type === 'income' ? '+' : '-'} $${item.amount.toFixed(2)}
        </td>
      </tr>
    `).join('');

    return `
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <title>Reporte Financiero</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; background-color: ${bgColor}; }
          h1 { color: ${isDarkMode ? '#BB86FC' : '#6200EE'}; text-align: center; }
          .summary { margin-top: 20px; margin-bottom: 40px; padding: 20px; border-radius: 10px; background-color: ${cardBg}; text-align: center; color: ${textColor}; }
          .total { font-size: 24px; font-weight: bold; color: ${total >= 0 ? '#4CAF50' : '#FF5252'}; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 12px; border-bottom: 1px solid ${isDarkMode ? '#333' : '#ddd'}; text-align: left; }
          th { background-color: ${isDarkMode ? '#333' : '#eee'}; color: ${isDarkMode ? 'white' : '#555'}; }
        </style>
      </head>
      <body>
        <h1>Reporte Financiero</h1>
        
        <div class="summary">
          <p>Transacciones: ${data.length}</p>
          <p>Balance Total: <span class="total">${total >= 0 ? '+' : ''} $${total.toFixed(2)}</span></p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Categoría</th>
              <th>Nota</th>
              <th style="text-align: right;">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${listItems}
          </tbody>
        </table>
      </body>
      </html>
    `;
  };

  const sharePDF = async () => {
    if (filteredTransactions.length === 0) {
      Alert.alert("Sin datos", "No hay transacciones para exportar en este filtro.");
      return;
    }

    try {
      const html = createPDFContent(filteredTransactions);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Tu Reporte Financiero'
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo generar el PDF.");
      console.error(error);
    }
  };
  const renderItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={[styles.transactionCard, { backgroundColor: colors.card }]}
      onPress={() => openOptions(item)}
    >
      <View style={[
        styles.iconContainer,
        { backgroundColor: item.type === 'income' ? '#e8f5e9' : '#ffebee' }
      ]}>
        <Ionicons
          name={getCategoryIcon(item.category)}
          size={24}
          color={item.type === 'income' ? "#4caf50" : "#ff5252"}
        />
      </View>
      <View style={styles.detailsContainer}>
        <Text style={[styles.categoryText, { color: colors.text }]}>{item.category}</Text>
        <Text style={[styles.dateText, { color: colors.subtitle }]}>
          {new Date(item.date).toLocaleDateString('es-MX')}
        </Text>
        {item.description ? (
          <Text style={[styles.descText, { color: colors.subtitle }]}>{item.description}</Text>
        ) : null}
      </View>
      <View style={styles.amountContainer}>
        <Text style={[
          styles.amountText,
          { color: item.type === 'income' ? "#4caf50" : "#ff5252" }
        ]}>
          {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const FilterButton = ({ title, value }: { title: string, value: 'all' | 'today' | 'week' | 'month' }) => (
    <TouchableOpacity
      style={[styles.filterBtn, activeFilter === value && styles.filterBtnActive]}
      onPress={() => setActiveFilter(value)}
    >
      <Text style={[styles.filterText, activeFilter === value && styles.filterTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const ChartToggle = () => (
    <View style={[styles.chartToggleContainer, { backgroundColor: colors.iconBg }]}>
      <TouchableOpacity
        style={[
          styles.chartToggleBtn,
          chartView === 'category' && { backgroundColor: colors.toggleActiveBg, elevation: 2 }
        ]}
        onPress={() => setChartView('category')}
      >
        <Text style={[
          styles.chartToggleText,
          { color: chartView === 'category' ? colors.toggleActiveText : colors.toggleText }
        ]}>Por Categoría</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.chartToggleBtn,
          chartView === 'day' && { backgroundColor: colors.toggleActiveBg, elevation: 2 }
        ]}
        onPress={() => setChartView('day')}
      >
        <Text style={[
          styles.chartToggleText,
          { color: chartView === 'day' ? colors.toggleActiveText : colors.toggleText }
        ]}>Por Día</Text>
      </TouchableOpacity>
    </View>
  );

  const TypeToggle = () => (
    <View style={styles.typeToggleContainer}>
      <TouchableOpacity
        style={[
          styles.typeToggleBtn,
          chartType === 'expense' && styles.activeExpenseBtn,
          {
            backgroundColor: chartType === 'expense' ? '#FF5252' : colors.card,
            borderColor: '#eee'
          }
        ]}
        onPress={() => setChartType('expense')}
      >
        <Text style={[styles.typeToggleText, { color: chartType === 'expense' ? 'white' : colors.text }]}>
          Gastos 📉
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.typeToggleBtn,
          chartType === 'income' && styles.activeIncomeBtn,
          {
            backgroundColor: chartType === 'income' ? '#4caf50' : colors.card,
            borderColor: '#eee'
          }
        ]}
        onPress={() => setChartType('income')}
      >
        <Text style={[styles.typeToggleText, { color: chartType === 'income' ? 'white' : colors.text }]}>
          Ingresos 📈
        </Text>
      </TouchableOpacity>
    </View>
  );
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <LinearGradient
            colors={isDarkMode ? ['#333', '#111'] : ['#6200ee', '#b866ff']}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>Dashboard</Text>

                <View style={styles.headerButtons}>
                  <TouchableOpacity onPress={sharePDF} style={styles.iconButton}>
                    <Ionicons name="document-text-outline" size={24} color="white" />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
                    <Ionicons
                      name={isDarkMode ? "moon" : "sunny"}
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.subtitle}>Control de Gastos</Text>

              <View style={[styles.balanceCard, { backgroundColor: balance >= 0 ? '#4CAF50' : '#FF5252' }]}>
                <Text style={styles.balanceLabel}>Balance Total</Text>
                <Text style={styles.balanceAmount}>
                  {balance >= 0 ? '+' : ''}${balance.toFixed(2)}
                </Text>
              </View>

              <View style={[styles.searchContainer, { backgroundColor: colors.searchBg, borderColor: colors.searchBorder }]}>
                <Ionicons name="search" size={20} color={colors.subtitle} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Buscar por categoría o nota..."
                  placeholderTextColor={colors.subtitle}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color={colors.subtitle} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={[styles.chartSectionCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>Resumen Financiero</Text>
                <TypeToggle />
                <ChartToggle />
                {chartData.length > 0 ? (
                  <PieChart
                    data={chartData}
                    width={screenWidth - 60}
                    height={220}
                    chartConfig={{
                      color: (opacity = 1) => `rgba(${isDarkMode ? '255,255,255' : '0,0,0'}, ${opacity})`
                    }}
                    accessor={"population"}
                    backgroundColor={"transparent"}
                    paddingLeft={"15"}
                    center={[10, 0]}
                    absolute
                  />
                ) : (
                  <View style={styles.noChartData}>
                    <Text style={[styles.emptyText, { color: colors.subtitle }]}>
                      No hay datos para mostrar 📊
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.filterContainer}>
                <FilterButton title="Todos" value="all" />
                <FilterButton title="Hoy" value="today" />
                <FilterButton title="Semana" value="week" />
                <FilterButton title="Mes" value="month" />
              </View>
            </View>
          </LinearGradient>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.subtitle }]}>
              {searchQuery ? "No se encontraron resultados 🔍" :
                activeFilter === 'all' ? "No hay transacciones aún 😴" : "No hay datos en este periodo 📅"}
            </Text>
          </View>
        }
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeOptions}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Opciones</Text>
              <TouchableOpacity onPress={closeOptions}>
                <Ionicons name="close" size={24} color={colors.subtitle} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.subtitle }]}>
              {selectedTransaction?.category} • ${selectedTransaction?.amount}
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.iconBg }]}
              onPress={handleEdit}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#e3f2fd' }]}>
                <Ionicons name="pencil" size={20} color="#1565c0" />
              </View>
              <Text style={[styles.modalButtonText, { color: colors.text }]}>
                Editar Transacción
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.iconBg }]}
              onPress={handleDelete}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#ffebee' }]}>
                <Ionicons name="trash" size={20} color="#d32f2f" />
              </View>
              <Text style={[styles.modalButtonText, styles.deleteButtonText]}>
                Eliminar Transacción
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTransaction')}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 10,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    padding: 5,
  },
  title: { fontSize: 32, fontWeight: '800', color: 'white' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 15 },

  balanceCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },

  chartSectionCard: {
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5
  },
  chartTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15 },

  chartToggleContainer: {
    flexDirection: 'row',
    borderRadius: 25,
    padding: 4,
    marginBottom: 10,
    width: '100%'
  },
  chartToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20
  },
  chartToggleText: { fontSize: 13, fontWeight: '600' },

  typeToggleContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    width: '100%',
    justifyContent: 'center',
    gap: 10
  },
  typeToggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1
  },
  activeExpenseBtn: { borderColor: '#FF5252' },
  activeIncomeBtn: { borderColor: '#4caf50' },
  typeToggleText: { fontSize: 13, fontWeight: '600' },

  noChartData: { height: 150, justifyContent: 'center', alignItems: 'center' },

  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  filterBtnActive: { backgroundColor: 'white' },
  filterText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600'
  },
  filterTextActive: { color: '#6200ee', fontWeight: 'bold' },

  listContent: { paddingBottom: 100 },

  transactionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  iconContainer: {
    marginRight: 15,
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  detailsContainer: { flex: 1 },
  categoryText: { fontSize: 16, fontWeight: '700' },
  dateText: { fontSize: 12, marginTop: 2 },
  descText: { fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  amountContainer: { alignItems: 'flex-end' },
  amountText: { fontSize: 16, fontWeight: '800' },

  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 16 },

  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 30,
    backgroundColor: '#6200ee',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#6200ee',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 }
  },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    elevation: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  modalSubtitle: { fontSize: 14, marginBottom: 25 },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  modalButtonText: { fontSize: 16, fontWeight: '600' },
  deleteButtonText: { color: '#d32f2f' },
});