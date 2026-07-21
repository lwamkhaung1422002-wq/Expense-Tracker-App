export const previewUser = {
  id: 'preview-user',
  name: 'Preview User',
  email: 'preview@expense-tracker.local',
  currency: 'USD',
}

const categories = [
  { id: 'preview-cat-food', name: 'Food & Dining', color: '#F97316', type: 'EXPENSE' },
  { id: 'preview-cat-transport', name: 'Transport', color: '#2563EB', type: 'EXPENSE' },
  { id: 'preview-cat-shopping', name: 'Shopping', color: '#8B5CF6', type: 'EXPENSE' },
  { id: 'preview-cat-bills', name: 'Bills', color: '#64748B', type: 'EXPENSE' },
  { id: 'preview-cat-salary', name: 'Salary', color: '#22C55E', type: 'INCOME' },
  { id: 'preview-cat-freelance', name: 'Freelance', color: '#14B8A6', type: 'INCOME' },
]

const wallets = [
  { id: 'preview-wallet-cash', name: 'Cash Wallet', type: 'Cash', maskedNumber: '', balance: 284.5, color: '#3B5BFF' },
  { id: 'preview-wallet-card', name: 'Visa Everyday', type: 'Card', maskedNumber: '2841', balance: 2210.25, color: '#0F766E' },
  { id: 'preview-wallet-bank', name: 'Main Bank', type: 'Bank', maskedNumber: '1098', balance: 8460.75, color: '#7C3AED' },
]

function isoForMonth(month, day, hour = 9, minute = 30) {
  return new Date(`${month}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`).toISOString()
}

function category(id) {
  return categories.find((item) => item.id === id)
}

function wallet(id) {
  return wallets.find((item) => item.id === id)
}

function makeTransactions(month) {
  const rows = [
    ['preview-tx-1', 'INCOME', 4800, 1, 'Monthly salary', 'preview-cat-salary', 'preview-wallet-bank', 9, 5],
    ['preview-tx-2', 'EXPENSE', 84.25, 2, 'Grocery Market', 'preview-cat-food', 'preview-wallet-card', 18, 20],
    ['preview-tx-3', 'EXPENSE', 24.5, 4, 'Ride share', 'preview-cat-transport', 'preview-wallet-card', 8, 45],
    ['preview-tx-4', 'EXPENSE', 119.99, 6, 'Internet bill', 'preview-cat-bills', 'preview-wallet-bank', 10, 10],
    ['preview-tx-5', 'EXPENSE', 46.8, 9, 'Dinner with friends', 'preview-cat-food', 'preview-wallet-card', 20, 15],
    ['preview-tx-6', 'INCOME', 650, 12, 'Design project', 'preview-cat-freelance', 'preview-wallet-bank', 14, 0],
    ['preview-tx-7', 'EXPENSE', 210, 15, 'New shoes', 'preview-cat-shopping', 'preview-wallet-card', 16, 35],
    ['preview-tx-8', 'EXPENSE', 18.75, 17, 'Coffee meeting', 'preview-cat-food', 'preview-wallet-cash', 11, 25],
    ['preview-tx-9', 'EXPENSE', 62.4, 22, 'Fuel top-up', 'preview-cat-transport', 'preview-wallet-card', 7, 50],
  ]

  return rows.map(([id, type, amount, day, description, categoryId, walletId, hour, minute]) => {
    const occurredAt = isoForMonth(month, day, hour, minute)
    return {
      id,
      type,
      amount,
      date: occurredAt,
      occurredAt,
      description,
      note: 'Preview data',
      categoryId,
      walletId,
      category: category(categoryId),
      wallet: wallet(walletId),
    }
  }).sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
}

function summarize(transactions, month) {
  const income = transactions.filter((item) => item.type === 'INCOME').reduce((sum, item) => sum + item.amount, 0)
  const expense = transactions.filter((item) => item.type === 'EXPENSE').reduce((sum, item) => sum + item.amount, 0)
  const categoryBreakdown = categories.map((item) => {
    const total = transactions
      .filter((transaction) => transaction.categoryId === item.id)
      .reduce((sum, transaction) => sum + transaction.amount, 0)
    return {
      categoryId: item.id,
      categoryName: item.name,
      color: item.color,
      type: item.type,
      total,
    }
  }).filter((item) => item.total > 0)

  const days = [1, 7, 14, 21, 28]
  const dailyTrend = days.map((day) => {
    const until = new Date(isoForMonth(month, day, 23, 59)).getTime()
    return {
      date: isoForMonth(month, day, 12, 0),
      income: transactions.filter((item) => item.type === 'INCOME' && new Date(item.occurredAt).getTime() <= until).reduce((sum, item) => sum + item.amount, 0),
      expense: transactions.filter((item) => item.type === 'EXPENSE' && new Date(item.occurredAt).getTime() <= until).reduce((sum, item) => sum + item.amount, 0),
    }
  })

  return {
    totals: { income, expense, net: income - expense },
    categoryBreakdown,
    dailyTrend,
  }
}

function makeReport(summary) {
  return {
    series: summary.dailyTrend.map((row) => ({
      label: new Date(row.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      income: row.income,
      expense: row.expense,
      net: row.income - row.expense,
    })),
    categories: summary.categoryBreakdown
      .filter((item) => item.type === 'EXPENSE')
      .map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        color: item.color,
        total: item.total,
      })),
  }
}

export function getPreviewSnapshot({ month }) {
  const transactions = makeTransactions(month)
  const summary = summarize(transactions, month)
  return {
    user: previewUser,
    profile: previewUser,
    categories,
    transactions,
    summary,
    wallets,
    budgets: [
      { id: 'preview-budget-main', name: 'Monthly Essentials', amount: 1400, month, categoryId: '', category: null, color: '#3B5BFF' },
      { id: 'preview-budget-food', name: 'Food & Dining', amount: 420, month, categoryId: 'preview-cat-food', category: category('preview-cat-food'), color: '#F97316' },
    ],
    goals: [
      { id: 'preview-goal-emergency', name: 'Emergency Fund', target: 5000, saved: 2350, deadline: `${month}-28`, color: '#22C55E' },
      { id: 'preview-goal-trip', name: 'Holiday Trip', target: 1800, saved: 730, deadline: `${month}-20`, color: '#8B5CF6' },
    ],
    report: makeReport(summary),
  }
}
