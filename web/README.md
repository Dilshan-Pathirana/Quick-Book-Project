# Quick Book Web UI

Mobile-first web UI for the backend in [api/](../api/).

- API base is configured in `.env.local` (`NEXT_PUBLIC_API_BASE_URL`).
- Default backend in this repo runs at `http://localhost:3002/api/v1`.

## Run

```bash
cd web
npm install
npm run dev
```

If port 3000 is already in use, Next will auto-select another port.

## Pages (SRS/API mapping)

- `/login`, `/register`
- `/dashboard` (business overview)
- `/customers` (+ create/detail/transactions)
- `/equipment` (+ create/detail + availability + maintenance)
- `/quotations` (+ create/detail + send + convert-to-invoice)
- `/invoices` (+ detail PDF/send + payments)
- `/rentals` (mark-out/returned/report-damage)
- `/accounting` (accounts + journal entries)
- `/analytics` (revenue + equipment + customers)
- `/reports` (P&L, balance sheet, cash flow, VAT)
