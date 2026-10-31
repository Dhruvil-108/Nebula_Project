# Nebula Expenses ERP: Simple, Plain-English Explanation

---

## 1. What Problem Does This System Solve?

In traditional companies, managing business expenses is painful and frustrating:
- **Employees** lose crumpled paper receipts, spend hours filling out confusing Excel spreadsheets, and wait weeks to get their money back.
- **Managers** waste time manually reviewing dozens of line items, wondering whether an expensive dinner was allowed under company policy.
- **Finance & Accounting** get surprised at the end of the quarter when departments blow past their budgets, and spend days manually typing bank transfers and general ledger entries into QuickBooks or NetSuite.
- **Fraud & Mistakes** slip through the cracks: employees submitting the same receipt twice, taking cash advances and never repaying them, or splitting large purchases into two small transactions to bypass approval limits.

**Nebula Expenses ERP** automates this entire financial lifecycle into a frictionless, transparent, and audit-proof corporate system.

---

## 2. A Real-World Story: Alex's Business Trip to New York

To understand how Nebula Expenses works in practice, let's follow **Alex Rivera**, a sales engineer at a growing tech company:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                ALEX'S JOURNEY WITH NEBULA                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Pre-Trip Travel Authorization                                                       │
│    • Alex needs to fly to New York for a client meeting.                               │
│    • He submits a Travel Request in Nebula for $1,500 (Flights, Hotel, Meals).         │
│    • His manager approves it. Nebula immediately reserves $1,500 from the Sales        │
│      budget so the company doesn't accidentally overspend.                             │
│                                                                                        │
│ 2. Cash Advance                                                                        │
│    • Alex doesn't have enough personal savings to pay for the hotel upfront.           │
│    • He requests a $500 Cash Advance in Nebula. Finance wires the $500 to his account. │
│                                                                                        │
│ 3. Incurring the Expense & AI Receipt Scanning                                         │
│    • In New York, Alex takes the client out for dinner ($142.50).                      │
│    • Alex takes a photo of the receipt on his phone.                                   │
│    • Gemini AI automatically reads the image: "The Grillhouse", Oct 20, $142.50 total, │
│      $12.50 tax, and suggests the category "Meals & Dining". Zero manual typing!      │
│                                                                                        │
│ 4. Policy Guardrails                                                                   │
│    • Company policy says dinner over $100 requires a manager justification.            │
│    • Nebula flags: "Item exceeds $100 daily limit. Please provide business reason."    │
│    • Alex types: "Closing Q4 deal with Acme Corp CEO."                                 │
│                                                                                        │
│ 5. Net-Pay Settlement                                                                  │
│    • Alex's total trip expenses come to $800.                                          │
│    • Remember the $500 cash advance Alex received earlier?                             │
│    • Nebula automatically calculates:                                                  │
│      $800 Total Claim - $500 Advance Balance = $300 Net Reimbursable Payout.           │
│    • The advance is marked "Settled", and Alex is owed exactly $300.                   │
│                                                                                        │
│ 6. Approvals & Automated Payment Batch                                                 │
│    • The manager approves; Finance does a final check assisted by the AI Copilot.      │
│    • On Friday, Finance clicks "Create Payment Batch". Alex's $300 is bundled with     │
│      20 other employees.                                                               │
│    • With one click, Finance exports the bank transfer file for direct deposit and a   │
│      balanced journal entry for the accounting software.                               │
│    • Alex gets an in-app notification: "Your reimbursement of $300 has been paid!"     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The 5 Superpowers of Nebula Expenses

### 1. ⚡ AI Receipt Vision OCR & Duplicate Prevention
Employees never have to type dates, amounts, or merchant names manually. Google Gemini AI reads the receipt in under 2 seconds. Meanwhile, the system computes a cryptographic SHA-256 digital fingerprint of the receipt image. If someone tries to submit the same receipt twice (even on a different claim report), Nebula catches it instantly.

### 2. 🛡️ Automated Policy Engine (No Handbook Needed)
Instead of forcing employees to memorize a 40-page company policy manual, Nebula checks every item in real time:
- **Receipt Threshold**: Reminds you if an item over $25 is missing a receipt.
- **Spending Caps**: Warns or blocks claims that exceed category limits.
- **Weekend Detection**: Flags weekend transactions on business days for verification.
- **Three Alert Levels**:
  - `info`: Friendly advice (e.g., "Round amount detected, make sure itemized bill is attached").
  - `warn`: Allows submission, but requires the employee to write an explanation for the reviewer.
  - `block`: Hard stop (e.g., Alcohol purchase above limit) until fixed.

### 3. ✈️ Pre-Trip Authorizations & Cash Advances
Companies often get blindsided by unexpected travel costs. Nebula requires pre-trip authorizations (`TR-YYYY-XXXX`) which lock in budget allowances before plane tickets are purchased. Employees who need cash upfront can receive Cash Advances (`ADV-YYYY-XXXX`), and Nebula automatically settles the balance on their next expense report so the company never loses track of loaned funds.

### 4. 💳 One-Click Batch Payouts & Double-Entry Accounting
Finance teams shouldn't have to send 50 individual bank transfers or manually re-enter receipts into their accounting software. Nebula bundles approved claims into a single Payment Batch (`BATCH-YYYY-XXXX`):
- **Bank File**: Generates NACHA / SEPA direct deposit files that can be uploaded straight to corporate banking portals.
- **General Ledger Journal**: Automatically generates a balanced double-entry accounting CSV for QuickBooks or NetSuite, ensuring debits to expense accounts perfectly equal credits to Accounts Payable.

### 5. 🤖 AI Approver Assistant & Predictive Budget Forecasts
- **AI Approver Assistant**: When a manager reviews a claim, an executive brief appears showing the employee's 90-day spending history, budget impact %, anomaly flags, and pre-written notes like "Approve with note: Client meal approved per sales policy."
- **Predictive Run-Rate Alerts**: Nebula tracks how fast each department is burning money. If Marketing has spent $60,000 in the first 5 months of a $100,000 annual budget, Nebula predicts: *"At this burn rate, Marketing will spend $144,000 by year-end (breach imminent)!"*

---

## 4. Plain-English Glossary of Key Terms

| Financial Term | What It Means in Simple English |
|---|---|
| **Multi-Tenancy** | A software architecture where multiple companies (tenants) use the same system, but each company's data is completely locked and invisible to all other companies. |
| **FIFO Approval Queue** | "First In, First Out" — a queue where expense reports are sorted in the order they were submitted so reviewers handle older claims first and employees don't get forgotten. |
| **Segregation of Duties** | A corporate rule requiring at least two different people to approve a financial transaction to prevent fraud (e.g., you cannot approve your own expense report). |
| **Per Diem** | A fixed daily spending allowance granted to employees traveling for work instead of reimbursing individual meals. |
| **Net-Pay Settlement** | Subtracting a previously disbursed cash advance from an employee's new expense claim so the company only pays out the net difference. |
| **General Ledger (GL) Code** | A standardized account number used by accountants (e.g., `GL-6100` for Travel, `GL-6200` for Meals) so reports can be organized into financial ledgers. |
| **Double-Entry Bookkeeping** | An accounting standard where every transaction has two equal and opposite entries (Debits must equal Credits) to ensure math is 100% balanced. |
