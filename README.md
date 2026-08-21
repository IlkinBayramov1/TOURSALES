# TOURSALES — Enterprise B2B/B2C Travel SaaS Platform

TOURSALES is a multi-tenant, enterprise-grade Travel SaaS platform built with Node.js, Express, Prisma ORM, and MySQL. It features high financial integrity through double-entry ledger accounting, real-time seat matrix locking, multi-currency conversion, cryptographic QR voucher verification, and B2B partner RBAC.

## 🚀 Key Features

- **Financial Integrity**: Double-Entry Accounting Ledger (`Decimal(19, 4)` precision)
- **Multi-Tenant Architecture**: Tenant isolation, scoped DB queries, and branding
- **Payment Orchestration**: BirBank / Kapital Bank, Stripe, PayPal with Webhook Idempotency Layer (`SKIPPED_DUPLICATE`)
- **Inventory & Seat Engine**: Real-time visual bus seat matrix with concurrency locking mutex
- **Cryptographic QR Vouchers**: HMAC-SHA256 token verification to prevent ticket tampering
- **Azerbaijan Tax Compliance**: DVX e-Qaimə XML Generator & Commercial Invoices
- **Dynamic Pricing Engine**: Seasonality, Early Bird, Surge Pricing, Loyalty Tiers, and Promo Campaigns
- **Multi-Currency & i18n**: Live Central Bank exchange rates and 5-language support (AZ, EN, RU, TR, AR)
- **B2B Agency RBAC**: Fine-grained role-based permissions (`AgencyOwner`, `AgencyAdmin`, `SalesAgent`, `Accountant`, `Guide`)
- **Customer CRM & Automation**: LTV calculation, VIP/At-Risk segmentation, and Abandoned Cart Recovery
- **Security & Resilience**: 2FA TOTP, Active Session Kill, Debt Lock, GDPR Anonymization, Graceful Shutdown, and Fraud & Risk Scoring Engine

## 🛠️ Setup & Running

```bash
# Navigate to backend
cd back

# Install dependencies
npm install

# Push database schema
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Run integration test suite
node scratch_test_dashboard.js

# Start server
npm start
```
