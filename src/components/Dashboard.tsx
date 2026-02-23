import React, { useState, useEffect, useCallback } from 'react';
import { dashboardAPI, expenseAPI } from '../firebaseApi';
import { DashboardStats, Expense } from '../types';

const Dashboard: React.FC<{ onTabChange: (tab: string) => void }> = ({ onTabChange }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showSavingsForm, setShowSavingsForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);

  const [transactionForm, setTransactionForm] = useState({
    amount: '',
    type: 'expense',
    description: '',
    client: 'Others',
    date: new Date().toISOString().split('T')[0],
    expenseType: 'others',
    employee: ''
  });

  const [currentStep, setCurrentStep] = useState(0);

  const [savingsAmount, setSavingsAmount] = useState('');

  const loadMonthlyData = useCallback(async () => {
    try {
      const expensesRes = await expenseAPI.getExpenses(selectedMonth, selectedYear);
      setExpenses(expensesRes.data);
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
        setExpenses(expensesRes.data);
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
      const description = transactionForm.expenseType === 'salary' 
        ? `Salary - ${transactionForm.employee}`
        : transactionForm.description;
      
      const amount = transactionForm.type === 'expense' 
        ? parseFloat(transactionForm.amount) 
        : -parseFloat(transactionForm.amount);
      
      await expenseAPI.addExpense({
        amount: amount,
        category: transactionForm.type === 'expense' ? 'Expense' : 'Income',
        description: description,
        client: transactionForm.client,
        date: transactionForm.date
      });
      
      setShowTransactionForm(false);
      setCurrentStep(0);
      setTransactionForm({
        amount: '',
        type: 'expense',
        description: '',
        client: 'Others',
        date: new Date().toISOString().split('T')[0],
        expenseType: 'others',
        employee: ''
      });
      
      const [statsRes, expensesRes] = await Promise.all([
        dashboardAPI.getStats(),
        expenseAPI.getExpenses(selectedMonth, selectedYear)
      ]);
      setStats(statsRes.data);
      setExpenses(expensesRes.data);
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleNextStep = () => {
    if (currentStep < getMaxSteps() - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getMaxSteps = () => {
    if (transactionForm.type === 'expense' && transactionForm.expenseType === 'salary') {
      return 5;
    }
    return 4;
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0: return transactionForm.amount !== '';
      case 1: return transactionForm.client !== '';
      case 2: return transactionForm.expenseType !== '';
      case 3: return transactionForm.expenseType !== 'salary' || transactionForm.employee !== '';
      case 4: return transactionForm.date !== '';
      default: return false;
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await expenseAPI.deleteExpense(id);
      const [statsRes, expensesRes] = await Promise.all([
        dashboardAPI.getStats(),
        expenseAPI.getExpenses(selectedMonth, selectedYear)
      ]);
      setStats(statsRes.data);
      setExpenses(expensesRes.data);
    } catch (error) {
      console.error('Error deleting expense:', error);
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
      {/* Header */}
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
        <button className="tab-btn active" onClick={() => onTabChange('dashboard')}>Dashboard</button>
        <button className="tab-btn" onClick={() => onTabChange('editors')}>Editors</button>
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
          <p className="stat-label">Net Profit</p>
          <h3 className="stat-value">₹{stats?.netProfit.toLocaleString() || '0'}</h3>
        </div>

        <div className="stat-card quaternary">
          <div className="stat-header">
            <div className="stat-icon">
              <span className="material-icons-round">account_balance</span>
            </div>
          </div>
          <p className="stat-label">Money in Bank</p>
          <h3 className="stat-value">₹{((stats?.netProfit || 0) + (stats?.totalSavings || 0)).toLocaleString()}</h3>
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
        <button 
          className="action-btn income"
          onClick={() => setShowIncomeForm(true)}
        >
          <span className="material-icons-round text-sm">add</span>
          Add Income
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
                  <h4 className="activity-title">{expense.amount < 0 ? expense.client : expense.description}</h4>
                  <p className="activity-meta">
                    {expense.amount < 0 ? 'Income' : expense.category} • {formatTimeAgo(expense.created_at)}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <p className={`activity-amount ${expense.amount < 0 ? 'positive' : 'negative'}`}>
                  {expense.amount < 0 ? '+' : '-'}₹{Math.abs(expense.amount).toLocaleString()}
                </p>
                <button
                  onClick={() => handleDeleteExpense(expense.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#ef4444',
                    padding: '2px'
                  }}
                >
                  <span className="material-icons-round" style={{ fontSize: '14px' }}>delete</span>
                </button>
              </div>
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
          <div className="modal-clean" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-clean">
              <h3>Add Expense</h3>
              <div className="step-indicator">
                Step {currentStep + 1} of {getMaxSteps()}
              </div>
            </div>
            
            <div className="form-step">
              {currentStep === 0 && (
                <div className="step-content">
                  <h4>Enter Amount</h4>
                  <input
                    type="number"
                    step="0.01"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                    className="step-input"
                    placeholder="₹ 0.00"
                    autoFocus
                  />
                </div>
              )}
              
              {currentStep === 1 && (
                <div className="step-content">
                  <h4>Select Client</h4>
                  <select
                    value={transactionForm.client}
                    onChange={(e) => setTransactionForm({ ...transactionForm, client: e.target.value })}
                    className="step-input"
                  >
                    <option value="Sparsh">Sparsh</option>
                    <option value="Enhance">Enhance</option>
                    <option value="Aly">Aly</option>
                    <option value="Greg">Greg</option>
                    <option value="Others">Others</option>
                    <option value="Studio 6">Studio 6</option>
                  </select>
                </div>
              )}
              
              {currentStep === 2 && (
                <div className="step-content">
                  <h4>Expense Type</h4>
                  <div className="type-buttons">
                    <button
                      type="button"
                      className={`type-btn ${transactionForm.expenseType === 'salary' ? 'active' : ''}`}
                      onClick={() => setTransactionForm({ ...transactionForm, expenseType: 'salary' })}
                    >
                      Salary
                    </button>
                    <button
                      type="button"
                      className={`type-btn ${transactionForm.expenseType === 'others' ? 'active' : ''}`}
                      onClick={() => setTransactionForm({ ...transactionForm, expenseType: 'others' })}
                    >
                      Others
                    </button>
                  </div>
                </div>
              )}
              
              {currentStep === 3 && transactionForm.expenseType === 'salary' && (
                <div className="step-content">
                  <h4>Select Employee</h4>
                  <select
                    value={transactionForm.employee}
                    onChange={(e) => setTransactionForm({ ...transactionForm, employee: e.target.value })}
                    className="step-input"
                  >
                    <option value="">Select Employee</option>
                    <option value="Sanjose">Sanjose</option>
                    <option value="Abishek">Abishek</option>
                    <option value="Tharun">Tharun</option>
                    <option value="Yuvanesh">Yuvanesh</option>
                    <option value="Nithin">Nithin</option>
                  </select>
                </div>
              )}
              
              {currentStep === 3 && transactionForm.expenseType === 'others' && (
                <div className="step-content">
                  <h4>Description</h4>
                  <input
                    type="text"
                    value={transactionForm.description}
                    onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                    className="step-input"
                    placeholder="What was this expense for?"
                  />
                </div>
              )}
              
              {((currentStep === 4) || (currentStep === 3 && transactionForm.expenseType === 'others')) && (
                <div className="step-content">
                  <h4>Date: {new Date().toLocaleDateString()}</h4>
                  <p style={{ color: '#64748b', fontSize: '14px' }}>Using today's date</p>
                </div>
              )}
            </div>
            
            <div className="step-actions">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="step-btn secondary"
                >
                  Back
                </button>
              )}
              
              {currentStep < getMaxSteps() - 1 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!canProceedToNext()}
                  className="step-btn primary"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleTransactionSubmit}
                  disabled={!canProceedToNext()}
                  className="step-btn primary"
                >
                  Add Expense
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showIncomeForm && (
        <div className="modal-overlay" onClick={() => setShowIncomeForm(false)}>
          <div className="modal-clean" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-clean">
              <h3>Add Income</h3>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await expenseAPI.addExpense({
                  amount: -parseFloat(transactionForm.amount),
                  category: 'Income',
                  description: transactionForm.description,
                  client: transactionForm.client,
                  date: new Date().toISOString().split('T')[0]
                });
                
                setShowIncomeForm(false);
                setTransactionForm({
                  amount: '',
                  type: 'expense',
                  description: '',
                  client: 'Others',
                  date: new Date().toISOString().split('T')[0],
                  expenseType: 'others',
                  employee: ''
                });
                
                const [statsRes, expensesRes] = await Promise.all([
                  dashboardAPI.getStats(),
                  expenseAPI.getExpenses(selectedMonth, selectedYear)
                ]);
                setStats(statsRes.data);
                setExpenses(expensesRes.data);
              } catch (error) {
                console.error('Error saving income:', error);
              }
            }}>
              <div style={{ padding: '24px' }}>
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
                  <label className="form-label">Client</label>
                  <select
                    value={transactionForm.client}
                    onChange={(e) => setTransactionForm({ ...transactionForm, client: e.target.value })}
                    className="form-input"
                  >
                    <option value="Sparsh">Sparsh</option>
                    <option value="Enhance">Enhance</option>
                    <option value="Aly">Aly</option>
                    <option value="Greg">Greg</option>
                    <option value="Others">Others</option>
                    <option value="Studio 6">Studio 6</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    required
                    value={transactionForm.description}
                    onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                    className="form-input"
                    placeholder="What was this income from?"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowIncomeForm(false)}
                  className="action-btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="action-btn income">
                  Add Income
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