# CrownX Agency Tracker

A clean, minimal web application for expense tracking, savings visibility, and editor payment calculation for a three-founder agency.

## Features

### For Founders (Admin Access)
- **Financial Dashboard**: Track expenses, savings, and net profit
- **Expense Management**: Add, edit, delete expenses with categories
- **Editor Management**: Add editors, set payment rates, manage clients
- **Monthly Payouts**: Calculate and finalize editor payments
- **Real-time Stats**: View monthly expenses, total savings, and remaining balance

### For Editors
- **Video Completion Tracking**: Simple +1 button to log completed videos
- **Monthly Progress**: View personal video completion stats
- **Client-based Tracking**: Track videos completed per client

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Authentication**: JWT tokens
- **UI**: Clean, minimal design with Lucide React icons

## Quick Start

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Start Development Servers
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend development server on http://localhost:3000

### 3. Default Login Credentials

**Founders:**
- founder1@crownx.com / password123
- founder2@crownx.com / password123  
- founder3@crownx.com / password123

## Project Structure

```
crownx/
├── server/                 # Backend API
│   ├── index.js           # Main server file
│   ├── database.js        # Database setup and schema
│   ├── middleware.js      # Authentication middleware
│   └── .env              # Environment variables
├── client/                # Frontend React app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── types.ts       # TypeScript interfaces
│   │   ├── api.ts         # API service layer
│   │   └── AuthContext.tsx # Authentication context
│   └── tailwind.config.js # Tailwind CSS config
└── package.json           # Root package.json with scripts
```

## Key Features

### Role-Based Access Control
- **Founders**: Full access to financial data, expense management, and editor administration
- **Editors**: Limited access to video completion tracking only

### Financial Integration
- Editor payouts automatically deduct from total savings
- Real-time calculation of net profit and remaining balance
- Monthly expense filtering and reporting

### Clean UI/UX
- Minimal, modern design with lots of white space
- Responsive layout (desktop-first, mobile-friendly)
- One-click actions for common tasks
- Clear visual separation between different data types

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Expenses (Founders only)
- `GET /api/expenses` - Get expenses with optional month/year filter
- `POST /api/expenses` - Add new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Dashboard (Founders only)
- `GET /api/dashboard/stats` - Get financial statistics
- `PUT /api/savings` - Update total savings

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Add new client (Founders only)

### Editors (Founders only)
- `GET /api/editors` - Get all editors
- `POST /api/editors` - Add new editor

### Videos
- `POST /api/videos/complete` - Mark video as completed
- `GET /api/videos/my-stats` - Get editor's video stats

### Payouts (Founders only)
- `GET /api/payouts/:month/:year` - Get monthly payouts
- `POST /api/payouts/finalize` - Finalize monthly payouts

## Database Schema

The application uses SQLite with the following main tables:
- `users` - Founders and editors
- `expenses` - Business expenses
- `clients` - Client information
- `editors` - Editor details with payment rates
- `video_completions` - Video completion tracking
- `monthly_payouts` - Finalized monthly payments
- `savings` - Total agency savings

## Security Features

- JWT-based authentication
- Role-based route protection
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection

## Future Enhancements

- Export functionality for reports (CSV/PDF)
- Advanced analytics and charts
- Email notifications for payouts
- Multi-currency support
- Audit logging
- Backup and restore functionality

## Development

### Adding New Features
1. Update database schema in `server/database.js`
2. Add API routes in `server/index.js`
3. Create/update TypeScript types in `client/src/types.ts`
4. Add API calls in `client/src/api.ts`
5. Create/update React components

### Environment Variables
Create a `.env` file in the server directory:
```
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=5000
NODE_ENV=development
```

## Production Deployment

1. Build the frontend: `cd client && npm run build`
2. Set production environment variables
3. Use a process manager like PM2 for the backend
4. Set up a reverse proxy (nginx) for serving static files
5. Use a production database (PostgreSQL/MySQL) instead of SQLite

## Support

For issues or questions, contact the development team or create an issue in the project repository.