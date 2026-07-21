import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  Tooltip as MuiTooltip,
  ThemeProvider,
  useMediaQuery,
} from '@mui/material'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded'
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import FlagRoundedIcon from '@mui/icons-material/FlagRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import InsertChartRoundedIcon from '@mui/icons-material/InsertChartRounded'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import PowerSettingsNewRoundedIcon from '@mui/icons-material/PowerSettingsNewRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import SmartphoneRoundedIcon from '@mui/icons-material/SmartphoneRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import WalletRoundedIcon from '@mui/icons-material/WalletRounded'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { theme } from './app/theme'
import { useAuth } from './hooks/useAuth'
import { getPreviewSnapshot, previewUser } from './preview/previewData'
import { api } from './services/apiClient'
import {
  compactRecordedAt,
  dateInput,
  friendlyDate,
  friendlyMonth,
  localDateTimeInputToIso,
  monthNow,
  recordedAt,
  toLocalDateTimeInput,
  userTimezone,
} from './utils/dateTime'
import { createMoneyFormatter, currencyOptions } from './utils/money'
import { withQuery } from './utils/query'
import './App.css'

const navItems = [
  { label: 'Dashboard', icon: <DashboardRoundedIcon />, enabled: true },
  { label: 'Transactions', icon: <ReceiptLongRoundedIcon />, enabled: true },
  { label: 'Budgets', icon: <SavingsRoundedIcon />, enabled: true },
  { label: 'Categories', icon: <CategoryRoundedIcon />, enabled: true },
  { label: 'Reports', icon: <InsertChartRoundedIcon />, enabled: true },
  { label: 'Wallets', icon: <WalletRoundedIcon />, enabled: true },
  { label: 'Goals', icon: <FlagRoundedIcon />, enabled: true },
  { label: 'Settings', icon: <SettingsRoundedIcon />, enabled: true },
]

const walletTypeOptions = [
  { value: 'Cash', label: 'Cash', helper: 'Physical cash balance', color: '#22C55E', icon: <PaymentsRoundedIcon /> },
  { value: 'Mobile Wallet', label: 'Mobile Wallet', helper: 'KPay, WavePay, AYA Pay, or similar', color: '#2563EB', icon: <SmartphoneRoundedIcon /> },
  { value: 'Mobile Banking', label: 'Mobile Banking', helper: 'Bank mobile app account', color: '#0F766E', icon: <AccountBalanceRoundedIcon /> },
  { value: 'Card', label: 'Card', helper: 'Debit or credit card', color: '#3B5BFF', icon: <CreditCardRoundedIcon /> },
]

function passwordVisibilitySlotProps(visible, onToggle, label = 'password') {
  return {
    input: {
      endAdornment: (
        <InputAdornment position="end">
          <IconButton
            type="button"
            edge="end"
            aria-label={visible ? `Hide ${label}` : `Show ${label}`}
            onClick={onToggle}
            onMouseDown={(event) => event.preventDefault()}
          >
            {visible ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
          </IconButton>
        </InputAdornment>
      ),
    },
  }
}

function App() {
  const auth = useAuth()

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {auth.token || auth.isPreview ? (
        <Dashboard auth={auth} />
      ) : (
        <AuthScreen onAuth={auth.saveAuth} onPreview={() => auth.startPreview(previewUser)} />
      )}
    </ThemeProvider>
  )
}

function AuthScreen({ onAuth, onPreview, compact = false }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login' ? { email: form.email, password: form.password } : form
      const data = await api(path, { method: 'POST', body })
      onAuth(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box className={`authRoot ${compact ? 'compactAuthRoot' : ''}`}>
      <Paper className="authCard" elevation={0}>
        <Stack direction="row" gap={1.5} sx={{ mb: 3, alignItems: 'center' }}>
          <Box className="logoMark">$</Box>
          <Box>
            <Typography variant="h5">Expense Tracker</Typography>
            <Typography color="text.secondary">Finance dashboard</Typography>
          </Box>
        </Stack>
        <Stack direction="row" className="authTabs">
          <Button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</Button>
          <Button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</Button>
        </Stack>
        <Stack component="form" spacing={2} sx={{ mt: 3 }} onSubmit={submit}>
          {error && (
            <Alert
              severity="error"
              action={onPreview ? (
                <Button color="inherit" size="small" onClick={onPreview}>
                  Preview
                </Button>
              ) : null}
            >
              {error}
            </Alert>
          )}
          {mode === 'register' && (
            <TextField
              label="Name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          )}
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <TextField
            label="Password"
            type={passwordVisible ? 'text' : 'password'}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
            helperText={mode === 'register' ? 'Use at least 8 characters with a letter and a number.' : ''}
            slotProps={passwordVisibilitySlotProps(passwordVisible, () => setPasswordVisible((value) => !value))}
          />
          <Button type="submit" variant="contained" className="authSubmitButton" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
          </Button>
          {onPreview && (
            <Button type="button" variant="outlined" className="previewAuthButton" onClick={onPreview}>
              Browse in Preview Mode
            </Button>
          )}
        </Stack>
      </Paper>
      {!compact && <Paper className="authPreview" elevation={0}>
        <Typography variant="h4">Expense Tracker</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          Live dashboards, category insights, and fast expense entry with your real account data.
        </Typography>
        <Box className="phoneBalance">
          <Typography variant="caption">Total Balance</Typography>
          <Typography variant="h4">$12,480.50</Typography>
          <Typography variant="caption">+ 8.2% from last month</Typography>
          <SmallSparkline data={sampleTrend()} />
        </Box>
      </Paper>}
    </Box>
  )
}

function Dashboard({ auth }) {
  const isPreview = auth.isPreview
  const [activeView, setActiveView] = useState('Dashboard')
  const [month, setMonth] = useState(monthNow())
  const [reportPeriod, setReportPeriod] = useState('monthly')
  const [summary, setSummary] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [wallets, setWallets] = useState([])
  const [budgets, setBudgets] = useState([])
  const [goals, setGoals] = useState([])
  const [profile, setProfile] = useState(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [transactionDialog, setTransactionDialog] = useState(null)
  const [categoryDialog, setCategoryDialog] = useState(false)
  const [walletDialog, setWalletDialog] = useState(null)
  const [budgetDialog, setBudgetDialog] = useState(null)
  const [goalDialog, setGoalDialog] = useState(null)
  const [goalContributionDialog, setGoalContributionDialog] = useState(null)
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const timezone = useMemo(() => userTimezone(), [])

  const load = useCallback(async () => {
    if (isPreview) {
      const snapshot = getPreviewSnapshot({ month })
      setCategories(snapshot.categories)
      setTransactions(snapshot.transactions)
      setSummary(snapshot.summary)
      setError('')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const [categoryData, transactionData, summaryData] = await Promise.all([
        api('/api/categories', { token: auth.token }),
        api(withQuery('/api/transactions', { month, timezone }), { token: auth.token }),
        api(withQuery('/api/summary/monthly', { month, timezone }), { token: auth.token }),
      ])
      setCategories(categoryData.categories)
      setTransactions(transactionData.transactions)
      setSummary(summaryData)
    } catch (err) {
      setError(err.message)
      if (err.status === 401) auth.logout()
    } finally {
      setLoading(false)
    }
  }, [auth, isPreview, month, timezone])

  const loadExtended = useCallback(async () => {
    if (isPreview) {
      const snapshot = getPreviewSnapshot({ month })
      setWallets(snapshot.wallets)
      setBudgets(snapshot.budgets)
      setGoals(snapshot.goals)
      setProfile(snapshot.profile)
      setReport(snapshot.report)
      setError('')
      return
    }

    try {
      const [walletData, budgetData, goalData, profileData, reportData] = await Promise.all([
        api('/api/wallets', { token: auth.token }),
        api(`/api/budgets?month=${month}`, { token: auth.token }),
        api('/api/goals', { token: auth.token }),
        api('/api/profile', { token: auth.token }),
        api(withQuery('/api/reports', { period: reportPeriod, year: month.slice(0, 4), month, timezone }), { token: auth.token }),
      ])
      setWallets(walletData.wallets)
      setBudgets(budgetData.budgets)
      setGoals(goalData.goals)
      setProfile(profileData.user)
      setReport(reportData)
    } catch (err) {
      setError(err.message)
      if (err.status === 401) auth.logout()
    }
  }, [auth, isPreview, month, reportPeriod, timezone])

  useEffect(() => {
    load()
    loadExtended()
  }, [load, loadExtended])

  const currencyCode = profile?.currency || 'USD'
  const money = useMemo(() => createMoneyFormatter(currencyCode), [currencyCode])
  const requestAccount = useCallback(() => {
    setAuthPromptOpen(true)
  }, [])
  const closeAuthPrompt = useCallback(() => {
    setAuthPromptOpen(false)
  }, [])
  const saveRealAuth = useCallback((payload) => {
    auth.saveAuth(payload)
    setAuthPromptOpen(false)
  }, [auth])
  const monthlyBudgetTotal = useMemo(() => {
    return budgets.reduce((sum, budget) => sum + Number(budget.amount || 0), 0)
  }, [budgets])
  const derived = useMemo(() => deriveDashboard(summary, transactions, money), [summary, transactions, money])
  const notifications = useMemo(() => buildNotifications(derived, budgets, goals, monthlyBudgetTotal, money), [budgets, derived, goals, monthlyBudgetTotal, money])
  const mobileAction = useMemo(() => {
    if (activeView === 'Budgets') return () => (isPreview ? requestAccount() : setBudgetDialog({ month }))
    if (activeView === 'Wallets') return () => (isPreview ? requestAccount() : setWalletDialog({}))
    if (activeView === 'Goals') return () => (isPreview ? requestAccount() : setGoalDialog({}))
    if (activeView === 'Categories') return () => (isPreview ? requestAccount() : setCategoryDialog(true))
    if (activeView === 'Dashboard' || activeView === 'Transactions' || activeView === 'Reports') return () => (isPreview ? requestAccount() : setTransactionDialog({}))
    return null
  }, [activeView, isPreview, month, requestAccount])
  const headerAction = useMemo(() => {
    if (activeView === 'Budgets') return { label: 'Add Budget', action: () => (isPreview ? requestAccount() : setBudgetDialog({ month })) }
    if (activeView === 'Wallets') return { label: 'Add Wallet', action: () => (isPreview ? requestAccount() : setWalletDialog({})) }
    if (activeView === 'Goals') return { label: 'Add Goal', action: () => (isPreview ? requestAccount() : setGoalDialog({})) }
    if (activeView === 'Categories') return { label: 'Manage Categories', action: () => (isPreview ? requestAccount() : setCategoryDialog(true)) }
    if (activeView === 'Settings') return null
    return { label: 'Add Transaction', action: () => (isPreview ? requestAccount() : setTransactionDialog({})) }
  }, [activeView, isPreview, month, requestAccount])

  async function deleteTransaction(id) {
    if (isPreview) {
      requestAccount()
      return
    }
    try {
      setError('')
      await api(`/api/transactions/${id}`, { token: auth.token, method: 'DELETE' })
      await reloadTransactions()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  async function reloadTransactions() {
    await load()
    await loadExtended()
  }

  async function copyPreviousBudgets() {
    if (isPreview) {
      requestAccount()
      return
    }
    try {
      setError('')
      await api('/api/budgets/copy-previous', { token: auth.token, method: 'POST', body: { month } })
      await loadExtended()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return (
    <Box className="dashboardRoot">
      <Sidebar
        user={auth.user}
        isPreview={isPreview}
        activeView={activeView}
        budgetTotal={monthlyBudgetTotal}
        expense={derived.expense}
        money={money}
        onNavigate={setActiveView}
        onLogout={auth.logout}
      />
      <Box component="main" className="dashboardMain">
        <Header
          title={activeView}
          month={month}
          notifications={notifications}
          onMonthChange={setMonth}
          actionLabel={headerAction?.label}
          onAdd={headerAction?.action}
          onLogout={auth.logout}
          isPreview={isPreview}
          onCreateAccount={requestAccount}
        />
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {activeView === 'Dashboard' && (
          <>
            <SummaryGrid metrics={derived.metrics} loading={loading} />
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, xl: 8 }}>
                <CategoryBreakdown data={derived.expenseCategories} money={money} />
              </Grid>
              <Grid size={{ xs: 12, xl: 4 }}>
                <MonthlyBudget expense={derived.expense} budgetTotal={monthlyBudgetTotal} money={money} />
              </Grid>
            </Grid>
          </>
        )}
        {activeView === 'Transactions' && <TransactionsView transactions={transactions} loading={loading} money={money} onEdit={isPreview ? requestAccount : setTransactionDialog} onDelete={deleteTransaction} />}
        {activeView === 'Categories' && <CategoriesView categories={categories} onManage={isPreview ? requestAccount : () => setCategoryDialog(true)} />}
        {activeView === 'Wallets' && <WalletsView wallets={wallets} money={money} token={auth.token} onAdd={isPreview ? requestAccount : () => setWalletDialog({})} onEdit={isPreview ? requestAccount : setWalletDialog} onDelete={isPreview ? requestAccount : null} onReload={loadExtended} />}
        {activeView === 'Budgets' && <BudgetsView budgets={budgets} month={month} expense={derived.expense} expenseCategories={derived.expenseCategories} money={money} token={auth.token} onAdd={isPreview ? requestAccount : () => setBudgetDialog({ month })} onEdit={isPreview ? requestAccount : setBudgetDialog} onDelete={isPreview ? requestAccount : null} onCopyPrevious={copyPreviousBudgets} onReload={loadExtended} />}
        {activeView === 'Goals' && <GoalsView goals={goals} money={money} token={auth.token} onAdd={isPreview ? requestAccount : () => setGoalDialog({})} onEdit={isPreview ? requestAccount : setGoalDialog} onContribute={isPreview ? requestAccount : setGoalContributionDialog} onDelete={isPreview ? requestAccount : null} onReload={loadExtended} />}
        {activeView === 'Reports' && <ReportsView report={report} period={reportPeriod} onPeriodChange={setReportPeriod} money={money} />}
        {activeView === 'Settings' && <SettingsView profile={profile} token={auth.token} isPreview={isPreview} onProtectedAction={requestAccount} onSaved={(user) => { setProfile(user); auth.updateUser({ id: user.id, name: user.name, email: user.email }) }} onPasswordChanged={auth.logout} />}
      </Box>
      <MobileBottomNav activeView={activeView} onNavigate={setActiveView} onLogout={auth.logout} />
      {mobileAction && (
        <Button className="mobileFab" variant="contained" onClick={mobileAction} aria-label={`Add on ${activeView}`}>
          <AddRoundedIcon />
        </Button>
      )}
      <TransactionDialog
        open={Boolean(transactionDialog)}
        transaction={transactionDialog}
        categories={categories}
        wallets={wallets}
        money={money}
        token={auth.token}
        onClose={() => setTransactionDialog(null)}
        onSaved={reloadTransactions}
      />
      <CategoryDialog
        open={categoryDialog}
        categories={categories}
        token={auth.token}
        onClose={() => setCategoryDialog(false)}
        onSaved={load}
      />
      <WalletDialog open={Boolean(walletDialog)} wallet={walletDialog} token={auth.token} onClose={() => setWalletDialog(null)} onSaved={loadExtended} />
      <BudgetDialog open={Boolean(budgetDialog)} budget={budgetDialog} categories={categories} token={auth.token} onClose={() => setBudgetDialog(null)} onSaved={loadExtended} />
      <GoalDialog open={Boolean(goalDialog)} goal={goalDialog} token={auth.token} onClose={() => setGoalDialog(null)} onSaved={loadExtended} />
      <GoalContributionDialog open={Boolean(goalContributionDialog)} goal={goalContributionDialog} money={money} token={auth.token} onClose={() => setGoalContributionDialog(null)} onSaved={loadExtended} />
      <AuthPromptDialog open={authPromptOpen} onClose={closeAuthPrompt} onAuth={saveRealAuth} />
    </Box>
  )
}

function Sidebar({ user, isPreview, activeView, budgetTotal, expense, money, onNavigate, onLogout }) {
  const budgetUsed = budgetTotal > 0 ? Math.min(100, Math.round((expense / budgetTotal) * 100)) : 0

  return (
    <Paper component="aside" className="sidebar" elevation={0}>
      <Stack direction="row" gap={1.5} className="logoRow" sx={{ alignItems: 'center' }}>
        <Box className="logoMark">$</Box>
        <Typography fontWeight={600} sx={{ lineHeight: 1.12 }}>Expense<br />Tracker</Typography>
      </Stack>
      <Stack gap={0.75} className="navList">
        {navItems.map(({ label, icon, enabled }) => (
          <Button
            key={label}
            className={`navButton ${activeView === label ? 'active' : ''}`}
            startIcon={icon}
            onClick={() => enabled && onNavigate(label)}
          >
            {label}
          </Button>
        ))}
      </Stack>
      <Box className="sidebarBottom">
        <Paper className="profileCard" elevation={0}>
          <Avatar>{user?.name?.slice(0, 1) || 'U'}</Avatar>
          <Box flex={1}>
            <Typography fontWeight={600}>{user?.name || 'User'}</Typography>
            <Typography variant="caption" color="text.secondary">{isPreview ? 'Preview mode' : 'Signed in'}</Typography>
          </Box>
          <MuiTooltip title="Sign out">
            <IconButton size="small" className="profileLogoutButton" onClick={onLogout} aria-label="Sign out">
              <PowerSettingsNewRoundedIcon fontSize="small" />
            </IconButton>
          </MuiTooltip>
        </Paper>
        <Paper className="miniBudget" elevation={0}>
          <Typography fontWeight={600}>Monthly Budget</Typography>
          <Typography color="text.primary" sx={{ mt: 0.5 }}>{budgetUsed}% used</Typography>
          <Typography variant="caption" color="text.secondary">{money.format(expense)} of {money.format(budgetTotal)}</Typography>
          <LinearProgress variant="determinate" value={budgetUsed} sx={{ my: 1.5 }} />
          <Button fullWidth variant="contained" className="softButton" onClick={() => onNavigate('Budgets')}>View Details</Button>
        </Paper>
      </Box>
    </Paper>
  )
}

function Header({ title, month, onMonthChange, actionLabel, onAdd, onLogout, isPreview, onCreateAccount }) {
  return (
    <Box className="topHeader">
      <Box className="headerTitle">
        <Typography variant="h4">{title}</Typography>
        {isPreview && (
          <Stack direction="row" gap={1} className="previewHeaderMeta">
            <Chip size="small" label="Preview Mode" color="primary" variant="outlined" />
            <Typography variant="caption" color="text.secondary">Sample data only</Typography>
          </Stack>
        )}
      </Box>
      <Stack className="headerControls" direction={{ xs: 'column', sm: 'row' }} gap={1.25}>
        <TextField
          className="searchField"
          placeholder="Search anything..."
          size="small"
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
        />
        <TextField
          className="monthField"
          type="month"
          size="small"
          value={month}
          onChange={(event) => onMonthChange(event.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><CalendarMonthRoundedIcon fontSize="small" /></InputAdornment> } }}
        />
        {actionLabel && (
          <Button variant="contained" startIcon={<AddRoundedIcon />} className="addButton" onClick={onAdd}>
            {actionLabel}
          </Button>
        )}
        {isPreview && (
          <Button variant="outlined" className="createAccountButton" onClick={onCreateAccount}>
            Create Account
          </Button>
        )}
        <MuiTooltip title="Sign out">
          <IconButton className="headerLogoutButton" onClick={onLogout} aria-label="Sign out">
            <PowerSettingsNewRoundedIcon />
          </IconButton>
        </MuiTooltip>
      </Stack>
    </Box>
  )
}

function SummaryGrid({ metrics, loading }) {
  return (
    <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
      {metrics.map(({ label, amount, trend, icon, tone, progress }, index) => (
        <Grid size={{ xs: index === 0 ? 12 : 6, sm: 6, xl: 3 }} key={label}>
          <Card className={`summaryCard summaryCard-${tone}`}>
            <CardContent>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Avatar className={`summaryAvatar ${tone}`}>{icon}</Avatar>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>{label}</Typography>
              <Typography variant="h5" sx={{ mt: 0.5 }}>{loading ? '...' : amount}</Typography>
              <Typography variant="caption" color={tone === 'red' ? 'error.main' : 'success.main'}>{trend}</Typography>
              {progress != null && <LinearProgress variant="determinate" value={progress} sx={{ mt: 1.2 }} />}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

function MonthlyBudget({ expense, budgetTotal = 0, money }) {
  const used = budgetTotal > 0 ? Math.min(100, Math.round((expense / budgetTotal) * 100)) : 0
  const remaining = budgetTotal > 0 ? Math.max(0, budgetTotal - expense) : 0

  return (
    <Card className="dashboardCard budgetCard">
      <CardContent>
        <Typography variant="h6">Monthly Budget</Typography>
        <Box className="budgetBody">
          <Box className="ringWrap"><CircularRing value={used} /></Box>
          <Stack gap={1.1} className="budgetStats">
            <BudgetStat label="Total Budget" value={money.format(budgetTotal)} />
            <BudgetStat label="Spent" value={money.format(expense)} color="#FF4D4F" />
            <BudgetStat label="Remaining" value={money.format(remaining)} color="#22C55E" />
          </Stack>
        </Box>
      </CardContent>
    </Card>
  )
}

function CategoryBreakdown({ data, money }) {
  const total = data.reduce((sum, row) => sum + row.raw, 0)

  return (
    <Card className="dashboardCard categoryBreakdownCard">
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box>
            <Typography variant="h6">Spending by Category</Typography>
            <Typography variant="body2" color="text.secondary">Top expense areas this month</Typography>
          </Box>
          <Chip size="small" label={money.format(total)} className="categoryTotalChip" />
        </Stack>
        {data.length === 0 ? (
          <EmptyState
            icon={<CategoryRoundedIcon />}
            title="No category spending yet"
            text="Add expenses with categories to unlock this breakdown."
          />
        ) : (
          <Grid container spacing={2.5} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box className="donutBox">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data} dataKey="percent" innerRadius={56} outerRadius={82} paddingAngle={2}>
                      {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <Box className="donutCenter">
                  <Typography fontWeight={600}>{data[0]?.percent || 0}%</Typography>
                  <Typography variant="caption" color="text.secondary">Top</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <Stack gap={1.1} className="categoryBreakdownList">
                {data.map((item) => (
                  <Box key={item.name} className="categoryBreakdownRow">
                    <Stack direction="row" gap={1.2} sx={{ alignItems: 'center', minWidth: 0 }}>
                      <Box className="categoryDot" sx={{ backgroundColor: item.color }} />
                      <Typography variant="body2" className="categoryName">{item.name}</Typography>
                    </Stack>
                    <Box className="categoryProgressTrack">
                      <Box className="categoryProgressBar" sx={{ width: `${Math.max(4, item.percent)}%`, backgroundColor: item.color }} />
                    </Box>
                    <Box className="categoryValue">
                      <Typography variant="body2" fontWeight={600} noWrap>{item.amount}</Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>{item.percent}%</Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  )
}

function RecentTransactions({ transactions, loading, money, onEdit, onDelete, onViewAll, title = 'Recent Transactions', maxItems }) {
  const [selected, setSelected] = useState(null)
  const isMobile = useMediaQuery('(max-width:760px)')
  const fallbackLimit = isMobile ? 5 : 8
  const visibleTransactions = transactions.slice(0, maxItems || fallbackLimit)

  async function handleDelete(transaction) {
    if (isTransactionLocked(transaction)) {
      window.alert('Transactions older than one month cannot be edited or deleted.')
      return
    }
    const confirmed = window.confirm(`Delete "${transaction.description}"? This will also update the linked wallet balance.`)
    if (!confirmed) return
    try {
      await onDelete(transaction.id)
      setSelected(null)
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <Card className="dashboardCard">
      <CardContent>
        <Stack direction="row" sx={{ mb: 1.5, justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{title}</Typography>
          {onViewAll && <Button size="small" aria-label="View all transactions" onClick={onViewAll}>View All</Button>}
        </Stack>
        {loading ? <LoadingBlock /> : transactions.length === 0 ? (
          <EmptyState
            icon={<ReceiptLongRoundedIcon />}
            title="No transactions yet"
            text="Transactions will appear here after you record income or expenses."
          />
        ) : (
          <Stack className="transactionCards" spacing={1.1}>
            {visibleTransactions.map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} money={money} onClick={() => setSelected(transaction)} />
            ))}
          </Stack>
        )}
      </CardContent>
      <TransactionDrawer
        open={Boolean(selected)}
        transaction={selected}
        money={money}
        anchor={isMobile ? 'bottom' : 'right'}
        onClose={() => setSelected(null)}
        onEdit={(transaction) => {
          setSelected(null)
          onEdit(transaction)
        }}
        onDelete={handleDelete}
      />
    </Card>
  )
}

function TransactionCard({ transaction, money, onClick }) {
  const isIncome = transaction.type === 'INCOME'
  const isMobile = useMediaQuery('(max-width:760px)')

  return (
    <Paper className="transactionCard" elevation={0} onClick={onClick}>
      <Stack direction="row" gap={1.4} sx={{ alignItems: 'center', minWidth: 0 }}>
        <Avatar className="merchantAvatar" sx={{ backgroundColor: transaction.category?.color || (isIncome ? '#22C55E' : '#3B5BFF') }}>
          {transaction.description.slice(0, 1).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography fontWeight={600} noWrap>{transaction.description}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {transaction.category?.name || transaction.type} · {isMobile ? compactRecordedAt(transaction.occurredAt || transaction.date) : recordedAt(transaction.occurredAt || transaction.date)}
          </Typography>
        </Box>
      </Stack>
      <Box className="transactionAmountBlock">
        <Typography className={isIncome ? 'positiveAmount' : 'negativeAmount'} fontWeight={600}>
          {isIncome ? '+' : '-'}{money.format(transaction.amount)}
        </Typography>
        <Typography className="transactionWalletLabel" variant="caption" color="text.secondary" noWrap>
          {transaction.wallet ? transaction.wallet.name : 'No wallet'}
        </Typography>
      </Box>
    </Paper>
  )
}

function TransactionDrawer({ open, transaction, money, anchor, onClose, onEdit, onDelete }) {
  if (!transaction) return null
  const isIncome = transaction.type === 'INCOME'
  const locked = isTransactionLocked(transaction)
  const walletLabel = transaction.wallet ? `${transaction.wallet.name}${transaction.wallet.maskedNumber ? ` **** ${transaction.wallet.maskedNumber}` : ''}` : 'No wallet'

  return (
    <Drawer anchor={anchor} open={open} onClose={onClose} slotProps={{ paper: { className: anchor === 'bottom' ? 'transactionDrawer bottom' : 'transactionDrawer' } }}>
      <Stack spacing={2}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Transaction details</Typography>
            <Typography variant="h6">{transaction.description}</Typography>
          </Box>
          <IconButton onClick={onClose}><CloseRoundedIcon /></IconButton>
        </Stack>
        <Stack direction="row" gap={1.5} sx={{ alignItems: 'center' }}>
          <Avatar className="drawerMerchantAvatar" sx={{ backgroundColor: transaction.category?.color || (isIncome ? '#22C55E' : '#3B5BFF') }}>
            {transaction.description.slice(0, 1).toUpperCase()}
          </Avatar>
          <Box>
            <Typography className={isIncome ? 'positiveAmount' : 'negativeAmount'} variant="h5">
              {isIncome ? '+' : '-'}{money.format(transaction.amount)}
            </Typography>
            <Chip size="small" label={transaction.category?.name || transaction.type} />
          </Box>
        </Stack>
        <Divider />
        <Stack spacing={1.2}>
          <DetailLine label="Recorded" value={recordedAt(transaction.occurredAt || transaction.date)} />
          <DetailLine label="Wallet" value={walletLabel} />
          <DetailLine label="Type" value={isIncome ? 'Income' : 'Expense'} />
          {transaction.note && <DetailLine label="Note" value={transaction.note} />}
        </Stack>
        {locked && (
          <Alert severity="warning">
            This transaction is older than one month, so it is locked for editing and deletion.
          </Alert>
        )}
        <Stack direction="row" gap={1}>
          <Button fullWidth variant="contained" startIcon={<EditRoundedIcon />} disabled={locked} onClick={() => onEdit(transaction)}>Edit</Button>
          <Button fullWidth color="error" variant="outlined" startIcon={<DeleteRoundedIcon />} disabled={locked} onClick={() => onDelete(transaction)}>Delete</Button>
        </Stack>
      </Stack>
    </Drawer>
  )
}

function isTransactionLocked(transaction) {
  const occurredAt = new Date(transaction?.occurredAt || transaction?.date)
  if (Number.isNaN(occurredAt.getTime())) return false
  const lockedAt = new Date(occurredAt)
  lockedAt.setMonth(lockedAt.getMonth() + 1)
  return lockedAt < new Date()
}

function DetailLine({ label, value }) {
  return (
    <Stack direction="row" gap={2} sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight={600} textAlign="right">{value}</Typography>
    </Stack>
  )
}

function TransactionsView({ transactions, loading, money, onEdit, onDelete }) {
  const [query, setQuery] = useState('')
  const filteredTransactions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return transactions
    return transactions.filter((transaction) => [
      transaction.description,
      transaction.note,
      transaction.type,
      transaction.category?.name,
      transaction.wallet?.name,
    ].some((value) => String(value || '').toLowerCase().includes(normalized)))
  }, [query, transactions])

  return (
    <Stack spacing={2.5}>
      <Paper className="transactionSearchCard" elevation={0}>
        <TextField
          fullWidth
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by description, category, wallet, or note..."
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
        />
        <Typography variant="caption" color="text.secondary">
          {filteredTransactions.length} of {transactions.length} transactions
        </Typography>
      </Paper>
      <RecentTransactions
        title={query ? 'Search results' : 'History'}
        transactions={filteredTransactions}
        loading={loading}
        money={money}
        maxItems={filteredTransactions.length || 1}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </Stack>
  )
}

function CategoriesView({ categories, onManage }) {
  return (
    <Stack spacing={2.5}>
      <FeatureHeader title="Category list" action="Edit Categories" onAction={onManage} />
      <Button className="mobileInlineAction" variant="contained" startIcon={<EditRoundedIcon />} onClick={onManage}>
        Edit Categories
      </Button>
      <Grid container spacing={2}>
        {categories.map((category) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={category.id}>
            <Card className="dashboardCard categoryCard">
              <CardContent>
                <Stack direction="row" gap={1.5} sx={{ alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: category.color }}>{category.name.slice(0, 1)}</Avatar>
                  <Box>
                    <Typography fontWeight={600}>{category.name}</Typography>
                    <Typography color="text.secondary">{category.type || 'Income and expense'}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {categories.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <EmptyState
              icon={<CategoryRoundedIcon />}
              title="No categories yet"
              text="Create income and expense categories to organize your transactions."
              action="Edit Categories"
              onAction={onManage}
            />
          </Grid>
        )}
      </Grid>
    </Stack>
  )
}

function walletIcon(type) {
  return walletTypeOptions.find((option) => option.value === type)?.icon || <WalletRoundedIcon />
}

function WalletsView({ wallets, money, token, onAdd, onEdit, onDelete, onReload }) {
  const [removingId, setRemovingId] = useState('')

  async function remove(id) {
    if (onDelete) {
      onDelete()
      return
    }
    const wallet = wallets.find((item) => item.id === id)
    const confirmed = window.confirm(
      `Delete ${wallet?.name || 'this wallet'}? This is only allowed when the wallet has no transaction history.`,
    )
    if (!confirmed) return
    setRemovingId(id)
    try {
      await api(`/api/wallets/${id}`, { token, method: 'DELETE' })
      await onReload()
    } catch (err) {
      window.alert(err.message)
    } finally {
      setRemovingId('')
    }
  }

  return (
    <Stack spacing={2.5}>
      <FeatureHeader title="Accounts" action="Add Wallet" onAction={onAdd} />
      <Grid container spacing={2}>
        {wallets.map((wallet) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={wallet.id}>
            <Card className="dashboardCard walletCard">
              <CardContent>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Avatar sx={{ bgcolor: wallet.color }}>{walletIcon(wallet.type)}</Avatar>
                  <Stack direction="row" className="cardActions">
                    <MuiTooltip title="Edit wallet">
                      <IconButton
                        aria-label={`Edit ${wallet.name}`}
                        className="softIconButton"
                        onClick={(event) => {
                          event.stopPropagation()
                          onEdit(wallet)
                        }}
                      >
                        <EditRoundedIcon />
                      </IconButton>
                    </MuiTooltip>
                    <MuiTooltip title="Delete wallet">
                      <span>
                        <IconButton
                          aria-label={`Delete ${wallet.name}`}
                          className="softIconButton danger"
                          disabled={removingId === wallet.id}
                          onClick={(event) => {
                            event.stopPropagation()
                            remove(wallet.id)
                          }}
                        >
                          {removingId === wallet.id ? <CircularProgress size={18} /> : <DeleteRoundedIcon />}
                        </IconButton>
                      </span>
                    </MuiTooltip>
                  </Stack>
                </Stack>
                <Typography variant="h6" sx={{ mt: 2 }}>{wallet.name}</Typography>
                <Typography color="text.secondary">{wallet.type}{wallet.maskedNumber ? ` **** ${wallet.maskedNumber}` : ''}</Typography>
                <Typography variant="h5" sx={{ mt: 2 }}>{money.format(wallet.balance)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {wallets.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <EmptyState
              icon={<WalletRoundedIcon />}
              title="No wallets yet"
              text="Add a wallet or account to track where your money moves."
              action="Add Wallet"
              onAction={onAdd}
            />
          </Grid>
        )}
      </Grid>
    </Stack>
  )
}

function BudgetsView({ budgets, month, expense, expenseCategories, money, token, onAdd, onEdit, onDelete, onCopyPrevious, onReload }) {
  const isCompact = useMediaQuery('(max-width:760px)')

  async function remove(id) {
    if (onDelete) {
      onDelete()
      return
    }
    const budget = budgets.find((item) => item.id === id)
    if (!window.confirm(`Delete ${budget?.name || 'this budget'}?`)) return
    await api(`/api/budgets/${id}`, { token, method: 'DELETE' })
    await onReload()
  }

  const budgetTotal = budgets.reduce((sum, budget) => sum + Number(budget.amount || 0), 0)
  const progress = budgetTotal > 0 ? Math.min(100, Math.round((expense / budgetTotal) * 100)) : 0
  async function copyPrevious() {
    try {
      await onCopyPrevious()
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <Stack spacing={2.5}>
      <Paper className="budgetHero" elevation={0}>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Budget period</Typography>
            <Typography variant="h5">{friendlyMonth(month)}</Typography>
            <Typography color="text.secondary">Budgets are monthly. Create a new plan each month or copy last month.</Typography>
          </Box>
          {!isCompact && (
            <Stack direction="row" gap={1}>
              <Button className="budgetSecondaryButton" variant="outlined" onClick={copyPrevious}>Copy Last Month</Button>
              <Button className="budgetActionButton" variant="contained" startIcon={<AddRoundedIcon />} onClick={onAdd}>Add Budget</Button>
            </Stack>
          )}
        </Stack>
        {isCompact && (
          <Stack direction="row" gap={1} sx={{ mt: 2 }}>
            <Button fullWidth className="budgetSecondaryButton" variant="outlined" onClick={copyPrevious}>Copy Last Month</Button>
            <Button fullWidth variant="contained" startIcon={<AddRoundedIcon />} onClick={onAdd}>Add</Button>
          </Stack>
        )}
        <Stack direction="row" sx={{ mt: 2, justifyContent: 'space-between' }}>
          <Typography color="text.secondary">Spent</Typography>
          <Typography fontWeight={600}>{money.format(expense)}{budgetTotal > 0 ? ` / ${money.format(budgetTotal)}` : ''}</Typography>
        </Stack>
        <LinearProgress variant="determinate" value={progress} sx={{ mt: 1.2 }} />
      </Paper>
      <Grid container spacing={2}>
        {budgets.map((budget) => {
          const categorySpend = expenseCategories.find((item) => item.name === budget.category?.name)?.raw || 0
          const spent = budget.category ? categorySpend : expense
          const progress = budget.amount > 0 ? Math.min(100, Math.round((spent / budget.amount) * 100)) : 0
          return (
            <Grid size={{ xs: 12, md: 6 }} key={budget.id}>
              <Card className="dashboardCard budgetPlanCard">
                <CardContent>
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6">{budget.name}</Typography>
                      <Typography color="text.secondary">{budget.category?.name || 'Overall budget'} - {budget.month}</Typography>
                    </Box>
                    <Stack direction="row" className="cardActions">
                      <IconButton className="softIconButton" onClick={() => onEdit(budget)}><EditRoundedIcon /></IconButton>
                      <IconButton className="softIconButton danger" onClick={() => remove(budget.id)}><DeleteRoundedIcon /></IconButton>
                    </Stack>
                  </Stack>
                  <Typography variant="h5" sx={{ mt: 2 }}>{money.format(budget.amount)}</Typography>
                  <Stack direction="row" sx={{ mt: 1, justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Spent {money.format(spent)}</Typography>
                    <Typography variant="body2" fontWeight={600}>{progress}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={progress} sx={{ mt: 1, '& .MuiLinearProgress-bar': { backgroundColor: budget.color } }} />
                </CardContent>
              </Card>
            </Grid>
          )
        })}
        {budgets.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Paper className="emptyBudgetCard" elevation={0}>
              <SavingsRoundedIcon />
              <Typography variant="h6">No budgets yet</Typography>
              <Typography color="text.secondary">Create a monthly plan for {friendlyMonth(month)}.</Typography>
              {!isCompact && <Button className="emptyBudgetButton" variant="contained" startIcon={<AddRoundedIcon />} onClick={onAdd}>Add Budget</Button>}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Stack>
  )
}

function GoalsView({ goals, money, token, onAdd, onEdit, onContribute, onDelete, onReload }) {
  async function remove(id) {
    if (onDelete) {
      onDelete()
      return
    }
    const goal = goals.find((item) => item.id === id)
    if (!window.confirm(`Delete ${goal?.name || 'this goal'}?`)) return
    await api(`/api/goals/${id}`, { token, method: 'DELETE' })
    await onReload()
  }

  return (
    <Stack spacing={2.5}>
      <FeatureHeader title="Savings goals" action="Add Goal" onAction={onAdd} />
      <Grid container spacing={2}>
        {goals.map((goal) => {
          const progress = Math.min(100, Math.round((goal.saved / goal.target) * 100))
          return (
            <Grid size={{ xs: 12, md: 6 }} key={goal.id}>
              <Card className="dashboardCard goalCard">
                <CardContent>
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6">{goal.name}</Typography>
                      <Typography color="text.secondary">{goal.deadline ? `Due ${friendlyDate(goal.deadline)}` : 'No deadline'}</Typography>
                    </Box>
                    <Stack direction="row" className="cardActions">
                      <IconButton className="softIconButton" onClick={() => onEdit(goal)}><EditRoundedIcon /></IconButton>
                      <IconButton className="softIconButton danger" onClick={() => remove(goal.id)}><DeleteRoundedIcon /></IconButton>
                    </Stack>
                  </Stack>
                  <Typography sx={{ mt: 2 }}><b>{money.format(goal.saved)}</b> of {money.format(goal.target)}</Typography>
                  <Stack direction="row" sx={{ mt: 0.75, justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Remaining {money.format(Math.max(0, goal.target - goal.saved))}</Typography>
                    <Typography variant="body2" fontWeight={600}>{progress}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={progress} sx={{ mt: 1.5, '& .MuiLinearProgress-bar': { backgroundColor: goal.color } }} />
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AddRoundedIcon />}
                    sx={{ mt: 2 }}
                    disabled={progress >= 100}
                    onClick={() => onContribute(goal)}
                  >
                    Add Saved Money
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
        {goals.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <EmptyState
              icon={<FlagRoundedIcon />}
              title="No goals yet"
              text="Add a savings goal when you are ready to track progress."
              action="Add Goal"
              onAction={onAdd}
            />
          </Grid>
        )}
      </Grid>
    </Stack>
  )
}

function ReportsView({ report, period, onPeriodChange, money }) {
  const isCompact = useMediaQuery('(max-width:760px)')
  const data = report?.series || report?.monthly || []
  const categories = report?.categories || []
  const categoryTotal = categories.reduce((sum, category) => sum + Number(category.total || 0), 0)
  const totals = data.reduce((sum, row) => ({
    income: sum.income + Number(row.income || 0),
    expense: sum.expense + Number(row.expense || 0),
    net: sum.net + Number(row.net || 0),
  }), { income: 0, expense: 0, net: 0 })

  return (
    <Stack spacing={2.5}>
      <FeatureHeader title="Performance" />
      <ReportPeriodControl period={period} onPeriodChange={onPeriodChange} compact={isCompact} />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}><MetricStrip label="Income" value={money.format(totals.income)} color="#22C55E" /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><MetricStrip label="Expenses" value={money.format(totals.expense)} color="#FF4D4F" /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><MetricStrip label="Net" value={money.format(totals.net)} color="#3B5BFF" /></Grid>
      </Grid>
      <Card className="dashboardCard">
        <CardContent>
          <Typography variant="h6">{period[0].toUpperCase() + period.slice(1)} Overview</Typography>
          <Box className="lineChartBox">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis tickFormatter={(v) => compactMoney(v, money)} tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip formatter={(v) => money.format(v)} />
                <Line type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="expense" stroke="#FF4D4F" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
      <Card className="dashboardCard reportCategoryCard">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2 }}>
            <Box>
              <Typography variant="h6">Top Expense Categories</Typography>
              <Typography variant="body2" color="text.secondary">Ranked by spending for this report period</Typography>
            </Box>
            <Chip size="small" label={money.format(categoryTotal)} className="categoryTotalChip" />
          </Stack>
          {categories.length === 0 ? <EmptyState text="No category data for this report period." /> : (
            <Stack className="reportCategoryList">
              {categories.map((category) => {
                const percent = categoryTotal > 0 ? Math.round((Number(category.total || 0) / categoryTotal) * 100) : 0
                return (
                  <Box key={category.categoryId} className="reportCategoryRow">
                    <Stack direction="row" gap={1.2} sx={{ alignItems: 'center', minWidth: 0 }}>
                      <Box className="categoryDot" sx={{ backgroundColor: category.color }} />
                      <Typography className="categoryName">{category.categoryName}</Typography>
                    </Stack>
                    <Box className="categoryProgressTrack">
                      <Box className="categoryProgressBar" sx={{ width: `${Math.max(4, percent)}%`, backgroundColor: category.color }} />
                    </Box>
                    <Box className="categoryValue">
                      <Typography variant="body2" fontWeight={600} noWrap>{money.format(category.total)}</Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>{percent}%</Typography>
                    </Box>
                  </Box>
                )
              })}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  )
}

function ReportPeriodControl({ period, onPeriodChange, compact }) {
  const periods = ['daily', 'weekly', 'monthly', 'yearly']

  if (compact) {
    return (
      <FormControl className="reportPeriodSelect" size="small" fullWidth>
        <InputLabel>Report period</InputLabel>
        <Select label="Report period" value={period} onChange={(event) => onPeriodChange(event.target.value)}>
          {periods.map((item) => <MenuItem value={item} key={item}>{item[0].toUpperCase() + item.slice(1)}</MenuItem>)}
        </Select>
      </FormControl>
    )
  }

  return (
    <Stack className="reportToolbar" direction="row" gap={0.5}>
      {periods.map((item) => (
        <Button key={item} className={period === item ? 'selected' : ''} onClick={() => onPeriodChange(item)}>
          {item[0].toUpperCase() + item.slice(1)}
        </Button>
      ))}
    </Stack>
  )
}

function MetricStrip({ label, value, color }) {
  return (
    <Paper className="metricStrip" elevation={0}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography variant="h6" sx={{ color }}>{value}</Typography>
    </Paper>
  )
}

function SettingsView({ profile, token, isPreview, onProtectedAction, onSaved, onPasswordChanged }) {
  const [form, setForm] = useState({ name: '', currency: 'USD' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [visiblePasswords, setVisiblePasswords] = useState({ current: false, next: false, confirm: false })
  const [message, setMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    if (profile) setForm({ name: profile.name, currency: profile.currency || 'USD' })
  }, [profile])

  async function submit(event) {
    event.preventDefault()
    if (isPreview) {
      onProtectedAction()
      return
    }
    const data = await api('/api/profile', { token, method: 'PUT', body: form })
    onSaved(data.user)
    setMessage('Settings saved.')
  }

  async function submitPassword(event) {
    event.preventDefault()
    if (isPreview) {
      onProtectedAction()
      return
    }
    setPasswordError('')
    setPasswordMessage('')
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }
    setPasswordLoading(true)
    try {
      const data = await api('/api/profile/password', {
        token,
        method: 'PUT',
        body: {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordMessage(data.message)
      window.setTimeout(onPasswordChanged, 1200)
    } catch (err) {
      setPasswordError(err.message)
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <Stack spacing={2.5}>
      <FeatureHeader title="Profile" />
      {isPreview && (
        <Alert severity="info" action={<Button color="inherit" size="small" onClick={onProtectedAction}>Create Account</Button>}>
          Preview settings are read-only. Create an account to save preferences and password changes.
        </Alert>
      )}
      <Card className="dashboardCard">
        <CardContent>
          <Stack component="form" spacing={2} onSubmit={submit}>
            {message && <Alert severity="success">{message}</Alert>}
            <TextField label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            <FormControl fullWidth>
              <InputLabel>Currency</InputLabel>
              <Select label="Currency" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}>
                {currencyOptions.map((code) => <MenuItem value={code} key={code}>{code}</MenuItem>)}
              </Select>
            </FormControl>
            <Button type="submit" variant="contained">Save Settings</Button>
          </Stack>
        </CardContent>
      </Card>
      <Card className="dashboardCard">
        <CardContent>
          <Stack component="form" spacing={2} onSubmit={submitPassword}>
            <Box>
              <Typography variant="h6">Change password</Typography>
              <Typography color="text.secondary" variant="body2">Update your password using your current password.</Typography>
            </Box>
            {passwordError && <Alert severity="error">{passwordError}</Alert>}
            {passwordMessage && <Alert severity="success">{passwordMessage}</Alert>}
            <TextField
              label="Current password"
              type={visiblePasswords.current ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
              slotProps={passwordVisibilitySlotProps(visiblePasswords.current, () => setVisiblePasswords((value) => ({ ...value, current: !value.current })), 'current password')}
              required
            />
            <TextField
              label="New password"
              type={visiblePasswords.next ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
              helperText="Use at least 8 characters with a letter and a number."
              slotProps={passwordVisibilitySlotProps(visiblePasswords.next, () => setVisiblePasswords((value) => ({ ...value, next: !value.next })), 'new password')}
              required
            />
            <TextField
              label="Confirm new password"
              type={visiblePasswords.confirm ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
              slotProps={passwordVisibilitySlotProps(visiblePasswords.confirm, () => setVisiblePasswords((value) => ({ ...value, confirm: !value.confirm })), 'confirmation password')}
              required
            />
            <Button type="submit" variant="contained" disabled={passwordLoading}>
              {passwordLoading ? 'Updating...' : 'Change Password'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}

function FeatureHeader({ title, subtitle, action, onAction }) {
  return (
    <Paper className="featureHeader" elevation={0}>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' } }}>
        <Box>
          <Typography variant="h5">{title}</Typography>
          {subtitle && <Typography color="text.secondary">{subtitle}</Typography>}
        </Box>
        {action && (
          <Button className="featureHeaderAction" variant="contained" startIcon={<AddRoundedIcon />} onClick={onAction}>
            {action}
          </Button>
        )}
      </Stack>
    </Paper>
  )
}

function TransactionDialog({ open, transaction, categories, wallets = [], money, token, onClose, onSaved }) {
  const [form, setForm] = useState(blankTransaction())
  const [adjustTime, setAdjustTime] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const fullScreen = useMediaQuery('(max-width:760px)')

  useEffect(() => {
    setForm(transaction?.id ? {
      type: transaction.type,
      amount: transaction.amount,
      date: toLocalDateTimeInput(transaction.occurredAt || transaction.date),
      description: transaction.description,
      note: transaction.note || '',
      categoryId: transaction.categoryId,
      walletId: transaction.walletId || '',
    } : blankTransaction(wallets[0]?.id || ''))
    setAdjustTime(false)
    setError('')
  }, [transaction, wallets])

  const filteredCategories = categories.filter((category) => !category.type || category.type === form.type)
  const selectedWallet = wallets.find((wallet) => wallet.id === form.walletId)
  const availableForExpense = useMemo(() => {
    if (!selectedWallet) return null
    let balance = Number(selectedWallet.balance || 0)
    if (transaction?.id && transaction.walletId === selectedWallet.id) {
      const previousAmount = Number(transaction.amount || 0)
      balance += transaction.type === 'EXPENSE' ? previousAmount : -previousAmount
    }
    return balance
  }, [selectedWallet, transaction])

  async function submit(event) {
    event.preventDefault()
    const amount = Number(form.amount || 0)
    if (form.type === 'EXPENSE' && selectedWallet && availableForExpense != null && amount > availableForExpense) {
      setError(`Insufficient balance in ${selectedWallet.name}. Increase the wallet balance before recording this expense.`)
      return
    }
    setSaving(true)
    setError('')
    try {
      const method = transaction?.id ? 'PUT' : 'POST'
      const path = transaction?.id ? `/api/transactions/${transaction.id}` : '/api/transactions'
      const body = {
        type: form.type,
        amount: form.amount,
        description: form.description,
        note: form.note,
        categoryId: form.categoryId,
        walletId: form.walletId,
        ...(transaction?.id && adjustTime ? { date: localDateTimeInputToIso(form.date) } : {}),
      }
      await api(path, { token, method, body })
      onClose()
      await onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
      slotProps={{ paper: { className: 'appDialogPaper transactionDialogPaper' } }}
    >
      <Box component="form" onSubmit={submit}>
        <DialogTitle>{transaction?.id ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {transaction?.id ? (
              <Alert severity="info">
                Recorded {recordedAt(transaction.occurredAt || transaction.date)}.
              </Alert>
            ) : (
              <Alert severity="info">Auto-recorded on save.</Alert>
            )}
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value, categoryId: '' })}>
                <MenuItem value="EXPENSE">Expense</MenuItem>
                <MenuItem value="INCOME">Income</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Amount" type="number" inputProps={{ min: '0.01', step: '0.01' }} value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required />
            <TextField label={form.type === 'INCOME' ? 'Income source' : 'Merchant or description'} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
            {transaction?.id && (
              <>
                <Button variant="text" onClick={() => setAdjustTime((value) => !value)} sx={{ alignSelf: 'flex-start' }}>
                  {adjustTime ? 'Hide date/time' : 'Adjust date/time'}
                </Button>
                {adjustTime && (
                  <TextField
                    label="Recorded date and time"
                    type="datetime-local"
                    value={form.date}
                    onChange={(event) => setForm({ ...form, date: event.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                    required
                  />
                )}
              </>
            )}
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select label="Category" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} required>
                {filteredCategories.map((category) => <MenuItem value={category.id} key={category.id}>{category.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Wallet</InputLabel>
              <Select label="Wallet" value={form.walletId} onChange={(event) => setForm({ ...form, walletId: event.target.value })}>
                <MenuItem value="">No wallet</MenuItem>
                {wallets.map((wallet) => (
                  <MenuItem value={wallet.id} key={wallet.id}>
                    {wallet.name}{wallet.maskedNumber ? ` **** ${wallet.maskedNumber}` : ''}
                  </MenuItem>
                ))}
              </Select>
              {form.type === 'EXPENSE' && selectedWallet && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75 }}>
                  Available: {money.format(availableForExpense || 0)} in {selectedWallet.name}
                </Typography>
              )}
            </FormControl>
            <TextField label="Notes" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} multiline minRows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save Transaction'}</Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

function WalletDialog({ open, wallet, token, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', type: 'Card', maskedNumber: '', balance: 0, color: '#3B5BFF' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const fullScreen = useMediaQuery('(max-width:760px)')
  const selectedType = walletTypeOptions.find((option) => option.value === form.type) || walletTypeOptions.at(-1)
  const needsIdentifier = form.type !== 'Cash'
  const identifierLabel = form.type === 'Mobile Wallet' ? 'Phone number' : 'Last digits'
  const identifierHelper = form.type === 'Mobile Wallet'
    ? 'Use the phone number linked to this wallet.'
    : 'Optional, for example 2841 or 9988.'

  useEffect(() => {
    if (!open) return
    const matchingType = walletTypeOptions.find((option) => option.value === wallet?.type)
    setForm(wallet?.id ? {
      name: wallet.name,
      type: matchingType?.value || 'Card',
      maskedNumber: wallet.maskedNumber || '',
      balance: wallet.balance,
      color: wallet.color || matchingType?.color || '#3B5BFF',
    } : { name: '', type: 'Cash', maskedNumber: '', balance: 0, color: '#22C55E' })
    setError('')
  }, [open, wallet])

  function chooseWalletType(option) {
    setForm((current) => ({
      ...current,
      type: option.value,
      color: option.color,
      name: current.name || (option.value === 'Mobile Wallet' ? '' : option.label),
      maskedNumber: option.value === 'Cash' ? '' : current.maskedNumber,
    }))
  }

  async function submit(event) {
    event.preventDefault()
    if (form.type === 'Mobile Wallet' && !form.maskedNumber.trim()) {
      setError('Phone number is required for a mobile wallet.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const method = wallet?.id ? 'PUT' : 'POST'
      const path = wallet?.id ? `/api/wallets/${wallet.id}` : '/api/wallets'
      await api(path, { token, method, body: form })
      onClose()
      await onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen} slotProps={{ paper: { className: 'appDialogPaper' } }}>
      <Box component="form" onSubmit={submit}>
        <DialogTitle>{wallet?.id ? 'Edit Wallet' : 'Add Wallet'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <FormControl fullWidth>
              <InputLabel>Wallet type</InputLabel>
              <Select
                label="Wallet type"
                value={form.type}
                onChange={(event) => {
                  const option = walletTypeOptions.find((item) => item.value === event.target.value)
                  if (option) chooseWalletType(option)
                }}
                renderValue={() => selectedType?.label || form.type}
              >
                {walletTypeOptions.map((option) => (
                  <MenuItem value={option.value} key={option.value}>
                    <Stack direction="row" gap={1.4} sx={{ alignItems: 'center' }}>
                      <Avatar className="walletTypeMenuIcon" sx={{ bgcolor: option.color }}>{option.icon}</Avatar>
                      <Box>
                        <Typography fontWeight={700}>{option.label}</Typography>
                        <Typography variant="body2" color="text.secondary">{option.helper}</Typography>
                      </Box>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" className="walletTypeChips">
              {walletTypeOptions.map((option) => (
                <Chip
                  key={option.value}
                  icon={option.icon}
                  label={option.label}
                  color={form.type === option.value ? 'primary' : 'default'}
                  variant={form.type === option.value ? 'filled' : 'outlined'}
                  onClick={() => chooseWalletType(option)}
                />
              ))}
            </Stack>
            <TextField
              label={form.type === 'Mobile Wallet' ? 'Wallet name' : 'Name'}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              helperText={form.type === 'Mobile Wallet' ? 'For example KPay, WavePay, AYA Pay, or your custom wallet name.' : form.type === 'Cash' ? 'For example Cash, Personal cash, or Office cash.' : ''}
              required
            />
            {needsIdentifier && (
              <TextField
                label={identifierLabel}
                value={form.maskedNumber}
                onChange={(event) => setForm({ ...form, maskedNumber: event.target.value })}
                helperText={identifierHelper}
                required={form.type === 'Mobile Wallet'}
                inputProps={form.type === 'Mobile Wallet' ? { inputMode: 'tel', maxLength: 20 } : { inputMode: 'numeric', maxLength: 8 }}
              />
            )}
            <TextField label="Starting balance" type="number" inputProps={{ step: '0.01' }} value={form.balance} onChange={(event) => setForm({ ...form, balance: event.target.value })} />
            <TextField label="Color" type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save Wallet'}</Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

function BudgetDialog({ open, budget, categories, token, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', amount: '', month: monthNow(), categoryId: '', color: '#3B5BFF' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const fullScreen = useMediaQuery('(max-width:760px)')
  const expenseCategories = categories.filter((category) => !category.type || category.type === 'EXPENSE')

  useEffect(() => {
    if (!open) return
    setForm(budget?.id ? {
      name: budget.name,
      amount: budget.amount,
      month: budget.month,
      categoryId: budget.categoryId || '',
      color: budget.color || '#3B5BFF',
    } : { name: '', amount: '', month: budget?.month || monthNow(), categoryId: '', color: '#3B5BFF' })
    setError('')
  }, [budget, open])

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const method = budget?.id ? 'PUT' : 'POST'
      const path = budget?.id ? `/api/budgets/${budget.id}` : '/api/budgets'
      await api(path, { token, method, body: form })
      onClose()
      await onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen} slotProps={{ paper: { className: 'appDialogPaper' } }}>
      <Box component="form" onSubmit={submit}>
        <DialogTitle>{budget?.id ? 'Edit Budget' : 'Add Budget'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Budget name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            <TextField label="Amount" type="number" inputProps={{ min: '0.01', step: '0.01' }} value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required />
            <TextField label="Budget month" type="month" value={form.month} onChange={(event) => setForm({ ...form, month: event.target.value })} helperText="Budgets apply to one selected month." required />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select label="Category" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
                <MenuItem value="">Overall budget</MenuItem>
                {expenseCategories.map((category) => <MenuItem value={category.id} key={category.id}>{category.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Color" type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save Budget'}</Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

function GoalDialog({ open, goal, token, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', target: '', saved: 0, deadline: '', color: '#3B5BFF' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const fullScreen = useMediaQuery('(max-width:760px)')

  useEffect(() => {
    if (!open) return
    setForm(goal?.id ? {
      name: goal.name,
      target: goal.target,
      saved: goal.saved,
      deadline: goal.deadline ? dateInput(goal.deadline) : '',
      color: goal.color || '#3B5BFF',
    } : { name: '', target: '', saved: 0, deadline: '', color: '#3B5BFF' })
    setError('')
  }, [goal, open])

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const method = goal?.id ? 'PUT' : 'POST'
      const path = goal?.id ? `/api/goals/${goal.id}` : '/api/goals'
      await api(path, { token, method, body: { ...form, deadline: form.deadline || null } })
      onClose()
      await onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen} slotProps={{ paper: { className: 'appDialogPaper' } }}>
      <Box component="form" onSubmit={submit}>
        <DialogTitle>{goal?.id ? 'Edit Goal' : 'Add Goal'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Goal name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            <TextField label="Target amount" type="number" inputProps={{ min: '0.01', step: '0.01' }} value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} required />
            <TextField label="Saved so far" type="number" inputProps={{ min: '0', step: '0.01' }} value={form.saved} onChange={(event) => setForm({ ...form, saved: event.target.value })} helperText="After creating a goal, use Add Saved Money to record monthly savings." />
            <TextField label="Deadline" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Color" type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save Goal'}</Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

function GoalContributionDialog({ open, goal, money, token, onClose, onSaved }) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const fullScreen = useMediaQuery('(max-width:760px)')
  const remaining = Math.max(0, Number(goal?.target || 0) - Number(goal?.saved || 0))

  useEffect(() => {
    if (!open) return
    setAmount('')
    setError('')
  }, [open])

  async function submit(event) {
    event.preventDefault()
    const contribution = Number(amount || 0)
    if (contribution <= 0) {
      setError('Enter a saved amount greater than zero.')
      return
    }
    if (contribution > remaining) {
      setError(`This is more than the remaining amount of ${money.format(remaining)}.`)
      return
    }

    setSaving(true)
    setError('')
    try {
      await api(`/api/goals/${goal.id}/contributions`, { token, method: 'POST', body: { amount: contribution } })
      onClose()
      await onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" fullScreen={fullScreen} slotProps={{ paper: { className: 'appDialogPaper' } }}>
      <Box component="form" onSubmit={submit}>
        <DialogTitle>Add Saved Money</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <Box>
              <Typography variant="h6">{goal?.name}</Typography>
              <Typography color="text.secondary">Remaining {money.format(remaining)}</Typography>
            </Box>
            <TextField
              label="Saved amount"
              type="number"
              inputProps={{ min: '0.01', max: remaining, step: '0.01' }}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving || remaining <= 0}>{saving ? 'Saving...' : 'Add to Goal'}</Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

function CategoryDialog({ open, categories, token, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', color: '#3B5BFF', type: 'EXPENSE' })
  const [error, setError] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)

  function resetCategoryForm() {
    setEditingCategory(null)
    setForm({ name: '', color: '#3B5BFF', type: 'EXPENSE' })
  }

  function editCategory(category) {
    setError('')
    setEditingCategory(category)
    setForm({ name: category.name, color: category.color || '#3B5BFF', type: category.type || 'EXPENSE' })
  }

  async function saveCategory(event) {
    event.preventDefault()
    setError('')
    try {
      await api(editingCategory?.id ? `/api/categories/${editingCategory.id}` : '/api/categories', {
        token,
        method: editingCategory?.id ? 'PUT' : 'POST',
        body: form,
      })
      resetCategoryForm()
      await onSaved()
    } catch (err) {
      setError(err.message)
    }
  }

  async function deleteCategory(id) {
    const category = categories.find((item) => item.id === id)
    if (!window.confirm(`Delete ${category?.name || 'this category'}? Transactions using it may prevent deletion.`)) return
    try {
      await api(`/api/categories/${id}`, { token, method: 'DELETE' })
      await onSaved()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" slotProps={{ paper: { className: 'appDialogPaper categoryDialogPaper' } }}>
      <DialogTitle>Categories</DialogTitle>
      <DialogContent>
        <Stack component="form" spacing={1.5} className="categoryForm" onSubmit={saveCategory}>
          {error && <Alert severity="error">{error}</Alert>}
          {editingCategory && <Alert severity="info">Editing {editingCategory.name}</Alert>}
          <Box className="categoryFormGrid">
            <TextField label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            <TextField label="Color" type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />
            <FormControl sx={{ minWidth: 140 }}>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                <MenuItem value="EXPENSE">Expense</MenuItem>
                <MenuItem value="INCOME">Income</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Stack direction="row" className="categoryFormActions">
            <Button type="submit" variant="contained">{editingCategory ? 'Save changes' : 'Add category'}</Button>
            {editingCategory && <Button onClick={resetCategoryForm}>Cancel</Button>}
          </Stack>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={1}>
          {categories.map((category) => (
            <Stack key={category.id} direction="row" className="categoryLine" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" gap={1} sx={{ alignItems: 'center' }}>
                <Box className="categoryDot" sx={{ backgroundColor: category.color }} />
                <Typography>{category.name}</Typography>
                <Chip size="small" label={category.type || 'Any'} variant="outlined" />
              </Stack>
              <Stack direction="row" className="cardActions">
                <MuiTooltip title="Edit category">
                  <IconButton aria-label={`Edit ${category.name}`} className="softIconButton" onClick={() => editCategory(category)}><EditRoundedIcon /></IconButton>
                </MuiTooltip>
                <MuiTooltip title="Delete category">
                  <IconButton aria-label={`Delete ${category.name}`} className="softIconButton danger" onClick={() => deleteCategory(category.id)}><DeleteRoundedIcon /></IconButton>
                </MuiTooltip>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Done</Button></DialogActions>
    </Dialog>
  )
}

function AuthPromptDialog({ open, onClose, onAuth }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" slotProps={{ paper: { className: 'appDialogPaper authPromptDialog' } }}>
      <DialogTitle>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">Create an account to continue</Typography>
            <Typography variant="body2" color="text.secondary">
              Preview mode is read-only and uses sample data.
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close login dialog"><CloseRoundedIcon /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <AuthScreen onAuth={onAuth} compact />
      </DialogContent>
    </Dialog>
  )
}

function MobileBottomNav({ activeView, onNavigate, onLogout }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const views = ['Dashboard', 'Transactions', 'Budgets', 'Reports']
  const value = Math.max(0, views.indexOf(activeView))
  const navValue = views.includes(activeView) ? value : 4
  const moreItems = navItems.filter((item) => ['Categories', 'Wallets', 'Goals', 'Settings'].includes(item.label))

  function navigate(view) {
    setMoreOpen(false)
    onNavigate(view)
  }

  return (
    <Paper className="mobileBottomNav" elevation={0}>
      <BottomNavigation showLabels value={navValue} onChange={(_, index) => {
        if (index === 4) setMoreOpen(true)
        else onNavigate(views[index])
      }}>
        <BottomNavigationAction label="Home" icon={<HomeRoundedIcon />} />
        <BottomNavigationAction label="Transactions" icon={<ReceiptLongRoundedIcon />} />
        <BottomNavigationAction label="Budgets" icon={<SavingsRoundedIcon />} />
        <BottomNavigationAction label="Reports" icon={<InsertChartRoundedIcon />} />
        <BottomNavigationAction label="More" icon={<MoreHorizRoundedIcon />} />
      </BottomNavigation>
      <Drawer anchor="bottom" open={moreOpen} onClose={() => setMoreOpen(false)} slotProps={{ paper: { className: 'mobileMoreDrawer' } }}>
        <Stack spacing={1.2}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', px: 0.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Menu</Typography>
              <Typography variant="h6">More</Typography>
            </Box>
            <IconButton onClick={() => setMoreOpen(false)}><CloseRoundedIcon /></IconButton>
          </Stack>
          <Stack className="mobileMoreList">
            {moreItems.map((item) => (
              <Button
                key={item.label}
                fullWidth
                className={`mobileMoreButton ${activeView === item.label ? 'active' : ''}`}
                startIcon={item.icon}
                onClick={() => navigate(item.label)}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
          <Button className="mobileSignOutButton" fullWidth startIcon={<PowerSettingsNewRoundedIcon />} onClick={onLogout}>
            Sign out
          </Button>
        </Stack>
      </Drawer>
    </Paper>
  )
}

function deriveDashboard(summary, transactions, money) {
  const income = summary?.totals?.income || 0
  const expense = summary?.totals?.expense || 0
  const net = summary?.totals?.net || 0
  const savingsRate = income > 0 ? Math.max(0, Math.round((net / income) * 100)) : 0
  const expenseCategories = (summary?.categoryBreakdown || [])
    .filter((row) => row.type === 'EXPENSE')
    .map((row) => ({
      name: row.categoryName,
      raw: row.total,
      amount: money.format(row.total),
      percent: expense > 0 ? Math.round((row.total / expense) * 100) : 0,
      color: row.color,
    }))
  const trend = summary?.dailyTrend?.length ? summary.dailyTrend.map((row) => ({
    date: new Date(row.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    income: row.income,
    expense: row.expense,
  })) : sampleTrend()

  return {
    income,
    expense,
    net,
    trend,
    expenseCategories,
    recentLabel: transactions[0]?.description || 'No recent transactions',
    metrics: [
      { label: 'Total Balance', amount: money.format(net), trend: 'Live from selected month', icon: <AccountBalanceWalletRoundedIcon />, tone: 'blue' },
      { label: 'Monthly Income', amount: money.format(income), trend: 'Updated from transactions', icon: <ArrowUpwardRoundedIcon />, tone: 'green' },
      { label: 'Monthly Expenses', amount: money.format(expense), trend: 'Updated from transactions', icon: <ArrowDownwardRoundedIcon />, tone: 'red' },
      { label: 'Savings Rate', amount: `${savingsRate}%`, trend: 'Income minus expenses', icon: <AnalyticsRoundedIcon />, tone: 'blue', progress: savingsRate },
    ],
  }
}

function buildNotifications(derived, budgets, goals, budgetTotal, money) {
  const items = []
  if (derived.net < 0) {
    items.push({
      tone: 'error',
      title: 'Monthly balance is negative',
      body: `Expenses are higher than income by ${money.format(Math.abs(derived.net))}.`,
    })
  }
  if (budgetTotal > 0 && derived.expense >= budgetTotal) {
    items.push({
      tone: 'warning',
      title: 'Budget limit reached',
      body: `You spent ${money.format(derived.expense)} against ${money.format(budgetTotal)} planned.`,
    })
  }
  if (budgets.length === 0) {
    items.push({
      tone: 'info',
      title: 'Create a monthly budget',
      body: 'Budgets now control planning. Add one overall budget or category budgets.',
    })
  }
  goals
    .filter((goal) => goal.deadline)
    .slice(0, 2)
    .forEach((goal) => {
      const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / 86400000)
      if (daysLeft <= 30) {
        items.push({
          tone: daysLeft < 0 ? 'error' : 'info',
          title: `${goal.name} deadline ${daysLeft < 0 ? 'passed' : 'is close'}`,
          body: daysLeft < 0 ? 'Review this goal and set a new deadline.' : `${daysLeft} days left to reach ${money.format(goal.target)}.`,
        })
      }
    })
  if (items.length === 0) {
    items.push({
      tone: 'success',
      title: 'Everything looks steady',
      body: 'No urgent budget, cash flow, or goal alerts for this month.',
    })
  }
  return items
}

function compactMoney(value, money) {
  const absolute = Math.abs(Number(value || 0))
  const parts = typeof money.formatToParts === 'function' ? money.formatToParts(0) : []
  const currency = parts.find((part) => part.type === 'currency')?.value
  const prefix = currency ? `${currency}${currency.length > 1 ? ' ' : ''}` : ''
  const sign = Number(value) < 0 ? '-' : ''
  if (absolute >= 1000000) return `${sign}${prefix}${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(absolute / 1000000)}M`
  if (absolute >= 1000) return `${sign}${prefix}${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(absolute / 1000)}K`
  return money.format(value)
}

function sampleTrend() {
  return [
    { date: 'Start', income: 0, expense: 0 },
    { date: 'Week 1', income: 0, expense: 0 },
    { date: 'Week 2', income: 0, expense: 0 },
    { date: 'Week 3', income: 0, expense: 0 },
    { date: 'End', income: 0, expense: 0 },
  ]
}

function blankTransaction(walletId = '') {
  return {
    type: 'EXPENSE',
    amount: '',
    date: '',
    description: '',
    note: '',
    categoryId: '',
    walletId,
  }
}

function CircularRing({ value }) {
  return (
    <Box className="circularRing">
      <Box className="ringTrack" />
      <Box className="ringValue" sx={{ background: `conic-gradient(#FF4D4F ${value * 3.6}deg, transparent 0deg)` }} />
      <Box className="ringCenter">
        <Typography variant="h5">{value}%</Typography>
        <Typography variant="body2" color="text.secondary">used</Typography>
      </Box>
    </Box>
  )
}

function BudgetStat({ label, value, color = '#0F172A' }) {
  return (
    <Stack direction="row" className="budgetStatRow">
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight={600} sx={{ color }} noWrap>{value}</Typography>
    </Stack>
  )
}

function SmallSparkline({ data }) {
  return (
    <Box className="sparkline">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area dataKey="income" stroke="#FFFFFF" fill="rgba(255,255,255,0.16)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}

function LoadingBlock() {
  return <Box className="loadingBlock"><CircularProgress size={28} /></Box>
}

function EmptyState({ icon, title = 'Nothing here yet', text, action, onAction }) {
  return (
    <Box className="emptyState">
      {icon && <Avatar className="emptyStateIcon">{icon}</Avatar>}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6">{title}</Typography>
        {text && <Typography color="text.secondary">{text}</Typography>}
      </Box>
      {action && (
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={onAction}>
          {action}
        </Button>
      )}
    </Box>
  )
}

export default App



