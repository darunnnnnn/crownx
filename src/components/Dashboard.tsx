import React, { useState, useEffect, useCallback } from 'react';
import { dashboardAPI, expenseAPI } from '../firebaseApi';
import { DashboardStats, Expense } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showSavingsForm, setShowSavingsForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);

  const [transactionForm, setTransactionForm] = useState({
    amount: '',
    type: 'expense',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [savingsAmount, setSavingsAmount] = useState('');

  const loadMonthlyData = useCallback(async () => {
    try {
      const expensesRes = await expenseAPI.getExpenses(selectedMonth, selectedYear);
      setExpenses(expensesRes.data.slice(0, 3));
    } catch (error) {
      console.error('Error loading monthly data:', error);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, expensesRes] = await Promise.all([
          dashboardAPI.getStats(),
          expenseAPI.getExpenses(selectedMonth, selectedYear)
        ]);
        setStats(statsRes.data);
        setExpenses(expensesRes.data.slice(0, 3));
        setSavingsAmount(statsRes.data.totalSavings.toString());
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedMonth, selectedYear]);

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = transactionForm.type === 'expense' 
        ? parseFloat(transactionForm.amount) 
        : -parseFloat(transactionForm.amount);
      
      await expenseAPI.addExpense({
        amount: amount,
        category: transactionForm.type === 'expense' ? 'Expense' : 'Income',
        description: transactionForm.description,
        date: transactionForm.date
      });
      
      setShowTransactionForm(false);
      setTransactionForm({
        amount: '',
        type: 'expense',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      const [statsRes, expensesRes] = await Promise.all([
        dashboardAPI.getStats(),
        expenseAPI.getExpenses(selectedMonth, selectedYear)
      ]);
      setStats(statsRes.data);
      setExpenses(expensesRes.data.slice(0, 3));
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleSavingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dashboardAPI.updateSavings(parseFloat(savingsAmount));
      setShowSavingsForm(false);
      
      const statsRes = await dashboardAPI.getStats();
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error updating savings:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="header" style={{ paddingTop: '8px' }}>
        <div>
          <div className="app-title">CrownX Agency</div>
        </div>
        <div className="header-icons">
          <button className="icon-btn">
            <span className="material-icons-round text-slate-600">notifications</span>
          </button>
          <div className="user-avatar">F1</div>
        </div>
      </header>

      <div style={{ height: '16px' }}></div>

      <div className="tab-nav">
        <button className="tab-btn active">Dashboard</button>
        <button className="tab-btn">Editors</button>
      </div>

      <div className="stats-container">
        <div className="stat-card primary">
          <div className="stat-header">
            <div className="stat-icon">
              <span className="material-icons-round">account_balance_wallet</span>
            </div>
            <span className="stat-change">+12.5%</span>
          </div>
          <p className="stat-label">Total Savings</p>
          <h3 className="stat-value">₹{stats?.totalSavings.toLocaleString() || '0'}</h3>
        </div>

        <div className="stat-card secondary">
          <div className="stat-header">
            <div className="stat-icon secondary">
              <span className="material-icons-round text-rose-600">trending_down</span>
            </div>
            <span className="stat-change negative">-4.2%</span>
          </div>
          <p className="stat-label secondary">Monthly Expenses</p>
          <h3 className="stat-value">₹{stats?.monthlyExpenses.toLocaleString() || '0'}</h3>
        </div>

        <div className="stat-card tertiary">
          <div className="stat-header">
            <div className="stat-icon">
              <span className="material-icons-round">show_chart</span>
            </div>
          </div>
          <p className="stat-label">Monthly Profit</p>
          <h3 className="stat-value">₹{((stats?.monthlyIncome || 0) - (stats?.monthlyExpenses || 0)).toLocaleString()}</h3>
        </div>
      </div>

      <div className="action-buttons">
        <button 
          className="action-btn success"
          onClick={() => setShowSavingsForm(true)}
        >
          <span className="material-icons-round text-sm">savings</span>
          Update Savings
        </button>
        <button 
          className="action-btn primary"
          onClick={() => setShowTransactionForm(true)}
        >
          <span className="material-icons-round text-sm">add</span>
          Add Expense
        </button>
      </div>

      <section className="activity-section">
        <div className="section-header">
          <h3 className="section-title">Recent Activity</h3>
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              loadMonthlyData();
            }}
            style={{ 
              fontSize: '11px', 
              padding: '2px 6px', 
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              backgroundColor: 'white',
              minWidth: '60px',
              height: '24px'
            }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'short' })}
              </option>
            ))}
          </select>
        </div>
        
        <div className="activity-list">
          {expenses.map((expense) => (
            <div key={expense.id} className="activity-item">
              <div className="activity-left">
                <div className={`activity-icon ${expense.amount < 0 ? 'income' : 'expense'}`}>
                  <span className="material-icons-round">
                    {expense.amount < 0 ? 'payments' : 'shopping_bag'}
                  </span>
                </div>
                <div>
                  <h4 className="activity-title">{expense.description}</h4>
                  <p className="activity-meta">
                    {expense.amount < 0 ? 'Income' : expense.category} • {formatTimeAgo(expense.created_at)}
                  </p>
                </div>
              </div>
              <p className={`activity-amount ${expense.amount < 0 ? 'positive' : 'negative'}`}>
                {expense.amount < 0 ? '+' : '-'}₹{Math.abs(expense.amount).toLocaleString()}
              </p>
            </div>
          ))}

          {expenses.length === 0 && (
            <div style={{
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '16px',
              border: '1px solid #f1f5f9',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', color: '#94a3b8' }}>
                <span className="material-icons-round" style={{ fontSize: '48px' }}>receipt</span>
              </div>
              <div style={{ color: '#64748b' }}>
                No recent transactions found
              </div>
            </div>
          )}
        </div>
      </section>

      <nav className="bottom-nav">
        <button className="nav-item active">
          <span className="material-icons-round nav-icon">dashboard</span>
          <span>Home</span>
        </button>
        <button className="nav-item">
          <span className="material-icons-round nav-icon">pie_chart</span>
          <span>Stats</span>
        </button>
        <button className="nav-item">
          <span className="material-icons-round nav-icon">account_circle</span>
          <span>Profile</span>
        </button>
        <button className="nav-item">
          <span className="material-icons-round nav-icon">settings</span>
          <span>Settings</span>
        </button>
      </nav>

      {showTransactionForm && (
        <div className="modal-overlay" onClick={() => setShowTransactionForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">Add Transaction</div>
            <form onSubmit={handleTransactionSubmit}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  value={transactionForm.type}
                  onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}
                  className="form-input"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  required
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                  className="form-input"
                  placeholder={transactionForm.type === 'expense' ? 'What was this expense for?' : 'What was this income from?'}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  required
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowTransactionForm(false)}
                  className="action-btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="action-btn primary">
                  Add {transactionForm.type === 'expense' ? 'Expense' : 'Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSavingsForm && (
        <div className="modal-overlay" onClick={() => setShowSavingsForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">Update Total Savings</div>
            <form onSubmit={handleSavingsUpdate}>
              <div className="form-group">
                <label className="form-label">Total Savings Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={savingsAmount}
                  onChange={(e) => setSavingsAmount(e.target.value)}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowSavingsForm(false)}
                  className="action-btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="action-btn success">
                  Update Savings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;