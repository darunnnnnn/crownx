import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  getDoc,
  setDoc,
  doc
} from 'firebase/firestore';
import { db } from './firebase';
import { Expense } from './types';

export const expenseAPI = {
  getExpenses: async (month?: string, year?: string) => {
    let q = query(collection(db, 'expenses'), orderBy('created_at', 'desc'));
    
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      q = query(
        collection(db, 'expenses'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    const expenses: Expense[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        amount: data.amount || 0,
        category: data.category || '',
        description: data.description || '',
        founder_id: 'user1',
        founder_name: 'User',
        date: data.date ? data.date.toDate().toISOString().split('T')[0] : '',
        created_at: data.created_at ? data.created_at.toDate().toISOString() : ''
      };
    });
    
    return { data: expenses };
  },

  addExpense: async (expense: any) => {
    await addDoc(collection(db, 'expenses'), {
      ...expense,
      founder_id: 'user1',
      founder_name: 'User',
      date: Timestamp.fromDate(new Date(expense.date)),
      created_at: Timestamp.now()
    });
  }
};

export const dashboardAPI = {
  getStats: async () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const savingsDoc = await getDoc(doc(db, 'settings', 'savings'));
    const totalSavings = savingsDoc.exists() ? savingsDoc.data().total_amount : 0;

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);
    
    const monthlyQuery = query(
      collection(db, 'expenses'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );
    
    const monthlySnapshot = await getDocs(monthlyQuery);
    const monthlyTransactions = monthlySnapshot.docs.map(doc => doc.data().amount);
    
    const monthlyExpenses = monthlyTransactions
      .filter(amount => amount > 0)
      .reduce((sum, amount) => sum + amount, 0);
      
    const monthlyIncome = monthlyTransactions
      .filter(amount => amount < 0)
      .reduce((sum, amount) => sum + Math.abs(amount), 0);

    return {
      data: {
        totalSavings,
        monthlyExpenses,
        monthlyIncome,
        totalExpenses: 0,
        monthlyPayouts: 0,
        netProfit: monthlyIncome - monthlyExpenses,
        remainingBalance: totalSavings
      }
    };
  },

  updateSavings: async (amount: number) => {
    await setDoc(doc(db, 'settings', 'savings'), {
      total_amount: amount,
      updated_at: Timestamp.now()
    });
  }
};