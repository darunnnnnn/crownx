export interface User {
  id: string;
  name: string;
  email: string;
  role: 'founder' | 'editor';
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  founder_id: string;
  founder_name: string;
  created_at: string;
}

export interface DashboardStats {
  totalSavings: number;
  monthlyExpenses: number;
  monthlyIncome: number;
  totalExpenses: number;
  monthlyPayouts: number;
  netProfit: number;
  remainingBalance: number;
}