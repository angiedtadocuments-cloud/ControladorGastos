import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  TouchableWithoutFeedback, 
  Keyboard, 
  Platform,
  Modal,
  FlatList
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { storageService } from '../../services/storage';
import { Transaction, CATEGORIES } from '../../types';
import { TransactionContext } from '../../context/TransactionContext';
import { useTheme } from '../../hooks/useTheme';

const themeColors = {
  light: {
    background: '#ffffff',
    text: '#333333',
    label: '#666666',
    inputBg: '#f9f9f9',
    inputBorder: '#dddddd',
    inputText: '#333333',
    placeholder: '#999999',
    typeDefaultBg: '#f0f0f0',
    typeDefaultText: '#666666',
    dateButtonBg: '#f0f0f0',
    modalBg: '#ffffff',
    categoryItemBg: '#f5f5f5',
  },
  dark: {
    background: '#121212',
    text: '#ffffff',
    label: '#bbbbbb',
    inputBg: '#2c2c2c',
    inputBorder: '#444444',
    inputText: '#ffffff',
    placeholder: '#aaaaaa',
    typeDefaultBg: '#333333',
    typeDefaultText: '#cccccc',
    dateButtonBg: '#333333',
    modalBg: '#1e1e1e',
    categoryItemBg: '#2c2c2c',
  }
};

export const AddTransactionScreen = ({ navigation, route }: any) => {
  const { setTransactions } = useContext(TransactionContext)!;
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? themeColors.dark : themeColors.light;

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const transactionToEdit = route.params?.transactionToEdit;

  useEffect(() => {
    if (transactionToEdit) {
      setAmount(transactionToEdit.amount.toString());
      setCategory(transactionToEdit.category);
      setDescription(transactionToEdit.description || '');
      setType(transactionToEdit.type);
      setDate(new Date(transactionToEdit.date));
      
      navigation.setOptions({ 
        title: 'Editar Transacción',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
      });
    } else {
      navigation.setOptions({ 
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
      });
    }
  }, [transactionToEdit, isDarkMode]);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleSave = async () => {
    if (!amount || !category) {
      Alert.alert("Faltan datos", "Por favor ingresa un monto y una categoría");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Monto inválido", "El monto debe ser mayor a 0");
      return;
    }

    const newTransaction: Transaction = {
      id: transactionToEdit ? transactionToEdit.id : Date.now().toString(),
      amount: numericAmount,
      date: date.toISOString(),
      category: category,
      type: type,
      description: description
    };

    try {
      const existingTransactions = await storageService.loadTransactions();
      let updatedTransactions;

      if (transactionToEdit) {
        updatedTransactions = existingTransactions.map(t => 
          t.id === newTransaction.id ? newTransaction : t
        );
      } else {
        updatedTransactions = [...existingTransactions, newTransaction];
      }
      
      await storageService.saveTransactions(updatedTransactions);
      setTransactions(updatedTransactions);
      navigation.goBack();
      
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la transacción");
      console.error(error);
    }
  };

  const selectCategory = (cat: string) => {
    setCategory(cat);
    setShowCategoryModal(false);
  };

  const availableCategories = type === 'income' ? CATEGORIES.income : CATEGORIES.expense;

  const inputStyle = [
    styles.input, 
    { 
      backgroundColor: colors.inputBg, 
      borderColor: colors.inputBorder, 
      color: colors.inputText 
    }
  ];

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: colors.background }}> 
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={[styles.title, { color: colors.text }]}>
            {transactionToEdit ? 'Editar Transacción' : 'Nueva Transacción'}
          </Text>

          <View style={[styles.typeContainer, { backgroundColor: colors.typeDefaultBg }]}>
            <TouchableOpacity 
              style={[styles.typeButton, type === 'expense' && styles.activeExpense]} 
              onPress={() => setType('expense')}
            >
              <Text style={[styles.typeText, { color: type === 'expense' ? 'white' : colors.typeDefaultText }]}>
                Gasto
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.typeButton, type === 'income' && styles.activeIncome]} 
              onPress={() => setType('income')}
            >
              <Text style={[styles.typeText, { color: type === 'income' ? 'white' : colors.typeDefaultText }]}>
                Ingreso
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.label }]}>Monto</Text>
          <TextInput
            style={inputStyle}
            placeholder="0.00"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <Text style={[styles.label, { color: colors.label }]}>Fecha</Text>
          <TouchableOpacity 
            style={[styles.dateButton, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} 
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.label} style={{ marginRight: 10 }} />
            <Text style={{ color: colors.inputText, fontSize: 16 }}>
              {date.toLocaleDateString('es-MX')}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode="date"
              display="default"
              onChange={onChangeDate}
              themeVariant={isDarkMode ? "dark" : "light"}
            />
          )}

          <Text style={[styles.label, { color: colors.label }]}>Categoría</Text>
          <TouchableOpacity 
            style={[styles.categoryButton, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={{ color: category ? colors.inputText : colors.placeholder, fontSize: 16 }}>
              {category || 'Selecciona una categoría'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.label} />
          </TouchableOpacity>

          <Text style={[styles.label, { color: colors.label }]}>Descripción (Opcional)</Text>
          <TextInput
            style={inputStyle}
            placeholder="Nota adicional..."
            placeholderTextColor={colors.placeholder}
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {transactionToEdit ? 'Actualizar' : 'Guardar Transacción'}
            </Text>
          </TouchableOpacity>

        </ScrollView>

        <Modal
          visible={showCategoryModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Selecciona Categoría
                </Text>
                <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                  <Ionicons name="close" size={24} color={colors.label} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={availableCategories}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.categoryItem, 
                      { backgroundColor: colors.categoryItemBg },
                      category === item && { backgroundColor: '#6200ee20' }
                    ]}
                    onPress={() => selectCategory(item)}
                  >
                    <Text style={[styles.categoryItemText, { color: colors.text }]}>
                      {item}
                    </Text>
                    {category === item && (
                      <Ionicons name="checkmark" size={20} color="#6200ee" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    borderRadius: 10,
    padding: 5,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeExpense: {
    backgroundColor: '#ff5252',
  },
  activeIncome: {
    backgroundColor: '#4caf50',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#6200ee',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  categoryItemText: {
    fontSize: 16,
  },
});