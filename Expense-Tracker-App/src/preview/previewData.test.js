import assert from 'node:assert/strict'
import test from 'node:test'
import { getPreviewSnapshot, previewUser } from './previewData.js'

test('preview snapshot is frontend-only synthetic data', () => {
  const snapshot = getPreviewSnapshot({ month: '2026-07' })

  assert.equal(previewUser.id, 'preview-user')
  assert.equal(snapshot.user.email, 'preview@expense-tracker.local')
  assert.ok(snapshot.transactions.length > 0)
  assert.ok(snapshot.transactions.every((transaction) => transaction.id.startsWith('preview-')))
  assert.ok(snapshot.categories.every((category) => category.id.startsWith('preview-')))
  assert.ok(snapshot.wallets.every((wallet) => wallet.id.startsWith('preview-')))
})

test('preview totals are derived from preview transactions', () => {
  const snapshot = getPreviewSnapshot({ month: '2026-07' })
  const income = snapshot.transactions
    .filter((transaction) => transaction.type === 'INCOME')
    .reduce((sum, transaction) => sum + transaction.amount, 0)
  const expense = snapshot.transactions
    .filter((transaction) => transaction.type === 'EXPENSE')
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  assert.equal(snapshot.summary.totals.income, income)
  assert.equal(snapshot.summary.totals.expense, expense)
  assert.equal(snapshot.summary.totals.net, income - expense)
})
