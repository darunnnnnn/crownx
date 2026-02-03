require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, initDB } = require('./database');
const { authenticateToken, requireFounder } = require('./middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDB();

// Auth Routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    if (bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

// Expense Routes
app.get('/api/expenses', authenticateToken, requireFounder, (req, res) => {
  const { month, year } = req.query;
  let query = `
    SELECT e.*, u.name as founder_name 
    FROM expenses e 
    JOIN users u ON e.founder_id = u.id 
    ORDER BY e.date DESC
  `;
  let params = [];

  if (month && year) {
    query = `
      SELECT e.*, u.name as founder_name 
      FROM expenses e 
      JOIN users u ON e.founder_id = u.id 
      WHERE strftime('%m', e.date) = ? AND strftime('%Y', e.date) = ?
      ORDER BY e.date DESC
    `;
    params = [month.padStart(2, '0'), year];
  }

  db.all(query, params, (err, expenses) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(expenses);
  });
});

app.post('/api/expenses', authenticateToken, requireFounder, (req, res) => {
  const { amount, category, description, date } = req.body;
  
  db.run(
    'INSERT INTO expenses (amount, category, description, date, founder_id) VALUES (?, ?, ?, ?, ?)',
    [amount, category, description, date, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ id: this.lastID, message: 'Expense added successfully' });
    }
  );
});

app.put('/api/expenses/:id', authenticateToken, requireFounder, (req, res) => {
  const { amount, category, description, date } = req.body;
  
  db.run(
    'UPDATE expenses SET amount = ?, category = ?, description = ?, date = ? WHERE id = ? AND founder_id = ?',
    [amount, category, description, date, req.params.id, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (this.changes === 0) return res.status(404).json({ error: 'Expense not found or unauthorized' });
      res.json({ message: 'Expense updated successfully' });
    }
  );
});

app.delete('/api/expenses/:id', authenticateToken, requireFounder, (req, res) => {
  db.run(
    'DELETE FROM expenses WHERE id = ? AND founder_id = ?',
    [req.params.id, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (this.changes === 0) return res.status(404).json({ error: 'Expense not found or unauthorized' });
      res.json({ message: 'Expense deleted successfully' });
    }
  );
});

// Dashboard Stats
app.get('/api/dashboard/stats', authenticateToken, requireFounder, (req, res) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  db.get('SELECT total_amount FROM savings WHERE id = 1', (err, savings) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    db.get(
      `SELECT SUM(amount) as monthly_expenses FROM expenses 
       WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?`,
      [currentMonth.toString().padStart(2, '0'), currentYear.toString()],
      (err, monthlyExp) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        db.get('SELECT SUM(amount) as total_expenses FROM expenses', (err, totalExp) => {
          if (err) return res.status(500).json({ error: 'Database error' });

          db.get(
            `SELECT SUM(total_amount) as monthly_payouts FROM monthly_payouts 
             WHERE month = ? AND year = ?`,
            [`${currentYear}-${currentMonth.toString().padStart(2, '0')}`, currentYear],
            (err, payouts) => {
              if (err) return res.status(500).json({ error: 'Database error' });

              const totalSavings = savings?.total_amount || 0;
              const monthlyExpenses = monthlyExp?.monthly_expenses || 0;
              const totalExpenses = totalExp?.total_expenses || 0;
              const monthlyPayouts = payouts?.monthly_payouts || 0;
              const netProfit = totalSavings - totalExpenses - monthlyPayouts;

              res.json({
                totalSavings,
                monthlyExpenses,
                totalExpenses,
                monthlyPayouts,
                netProfit,
                remainingBalance: totalSavings - totalExpenses
              });
            }
          );
        });
      }
    );
  });
});

app.put('/api/savings', authenticateToken, requireFounder, (req, res) => {
  const { amount } = req.body;
  
  db.run(
    'UPDATE savings SET total_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
    [amount],
    function(err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ message: 'Savings updated successfully' });
    }
  );
});

// Client Routes
app.get('/api/clients', authenticateToken, (req, res) => {
  db.all('SELECT * FROM clients ORDER BY name', (err, clients) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(clients);
  });
});

app.post('/api/clients', authenticateToken, requireFounder, (req, res) => {
  const { name } = req.body;
  
  db.run('INSERT INTO clients (name) VALUES (?)', [name], function(err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ id: this.lastID, message: 'Client added successfully' });
  });
});

// Editor Routes
app.get('/api/editors', authenticateToken, requireFounder, (req, res) => {
  db.all(`
    SELECT e.*, u.name, u.email 
    FROM editors e 
    JOIN users u ON e.user_id = u.id 
    ORDER BY u.name
  `, (err, editors) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(editors);
  });
});

app.post('/api/editors', authenticateToken, requireFounder, (req, res) => {
  const { name, email, password, ratePerVideo } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "editor")',
    [name, email, hashedPassword],
    function(err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      
      const userId = this.lastID;
      db.run(
        'INSERT INTO editors (user_id, rate_per_video) VALUES (?, ?)',
        [userId, ratePerVideo],
        function(err) {
          if (err) return res.status(500).json({ error: 'Database error' });
          res.json({ id: this.lastID, message: 'Editor added successfully' });
        }
      );
    }
  );
});

// Video Completion Routes
app.post('/api/videos/complete', authenticateToken, (req, res) => {
  const { clientId } = req.body;
  const currentDate = new Date();
  const month = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
  const year = currentDate.getFullYear();

  // Get editor ID from user ID
  db.get('SELECT id FROM editors WHERE user_id = ?', [req.user.id], (err, editor) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!editor) return res.status(404).json({ error: 'Editor not found' });

    db.run(
      'INSERT INTO video_completions (editor_id, client_id, completed_date, month, year) VALUES (?, ?, ?, ?, ?)',
      [editor.id, clientId, currentDate.toISOString().split('T')[0], month, year],
      function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'Video completion recorded' });
      }
    );
  });
});

app.get('/api/videos/my-stats', authenticateToken, (req, res) => {
  const currentMonth = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;

  db.get('SELECT id FROM editors WHERE user_id = ?', [req.user.id], (err, editor) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!editor) return res.status(404).json({ error: 'Editor not found' });

    db.all(`
      SELECT c.name as client_name, COUNT(*) as video_count
      FROM video_completions vc
      JOIN clients c ON vc.client_id = c.id
      WHERE vc.editor_id = ? AND vc.month = ?
      GROUP BY c.id, c.name
    `, [editor.id, currentMonth], (err, stats) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      
      db.get(`
        SELECT COUNT(*) as total_videos
        FROM video_completions
        WHERE editor_id = ? AND month = ?
      `, [editor.id, currentMonth], (err, total) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        res.json({
          clientStats: stats,
          totalVideos: total.total_videos
        });
      });
    });
  });
});

// Monthly Payouts
app.get('/api/payouts/:month/:year', authenticateToken, requireFounder, (req, res) => {
  const { month, year } = req.params;
  const monthKey = `${year}-${month.padStart(2, '0')}`;

  db.all(`
    SELECT 
      e.id as editor_id,
      u.name as editor_name,
      e.rate_per_video,
      COUNT(vc.id) as total_videos,
      (COUNT(vc.id) * e.rate_per_video) as total_amount,
      COALESCE(mp.status, 'pending') as status
    FROM editors e
    JOIN users u ON e.user_id = u.id
    LEFT JOIN video_completions vc ON e.id = vc.editor_id AND vc.month = ?
    LEFT JOIN monthly_payouts mp ON e.id = mp.editor_id AND mp.month = ? AND mp.year = ?
    GROUP BY e.id, u.name, e.rate_per_video
    HAVING total_videos > 0
  `, [monthKey, monthKey, parseInt(year)], (err, payouts) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(payouts);
  });
});

app.post('/api/payouts/finalize', authenticateToken, requireFounder, (req, res) => {
  const { month, year, payouts } = req.body;
  const monthKey = `${year}-${month.padStart(2, '0')}`;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    payouts.forEach(payout => {
      db.run(`
        INSERT OR REPLACE INTO monthly_payouts 
        (editor_id, month, year, total_videos, total_amount, status) 
        VALUES (?, ?, ?, ?, ?, 'paid')
      `, [payout.editor_id, monthKey, parseInt(year), payout.total_videos, payout.total_amount]);
    });

    db.run('COMMIT', (err) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Payouts finalized successfully' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});