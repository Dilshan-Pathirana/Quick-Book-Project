-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('OWNER', 'ACCOUNTANT', 'SALES', 'INVENTORY_MANAGER');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "DepreciationMethod" AS ENUM ('STRAIGHT_LINE', 'REDUCING_BALANCE');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE');

-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('RESERVED', 'OUT', 'RETURNED', 'DAMAGED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK', 'TRANSFER', 'WALLET');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('HELD', 'REFUNDED', 'PARTIALLY_DEDUCTED');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "JournalReferenceType" AS ENUM ('INVOICE', 'PAYMENT', 'MANUAL');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('QUOTATION', 'INVOICE', 'PAYMENT', 'RENTAL', 'EQUIPMENT', 'CUSTOMER', 'JOURNAL_ENTRY', 'FILE');

-- CreateEnum
CREATE TYPE "DeliveryChannel" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" "RoleName" NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT,
    "role_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "customer_type" "CustomerType" NOT NULL,
    "full_name" TEXT NOT NULL,
    "company_name" TEXT,
    "nic_or_br" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp_number" TEXT,
    "address" TEXT,
    "credit_limit" DECIMAL(12,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "equipment_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" UUID NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "internal_code" TEXT NOT NULL,
    "purchase_cost" DECIMAL(12,2),
    "replacement_value" DECIMAL(12,2),
    "daily_rate" DECIMAL(12,2),
    "hourly_rate" DECIMAL(12,2),
    "status" "EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "warehouse_id" TEXT,
    "purchase_date" TIMESTAMP(3),
    "depreciation_method" "DepreciationMethod",
    "depreciation_rate" DECIMAL(7,4),
    "condition_notes" TEXT,
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_maintenance_logs" (
    "id" TEXT NOT NULL,
    "equipment_id" UUID NOT NULL,
    "maintenance_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "cost" DECIMAL(12,2),
    "downtime_start" TIMESTAMP(3),
    "downtime_end" TIMESTAMP(3),
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" UUID NOT NULL,
    "quotation_number" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "rental_start_date" TIMESTAMP(3) NOT NULL,
    "rental_end_date" TIMESTAMP(3) NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "delivery_fee" DECIMAL(12,2),
    "operator_fee" DECIMAL(12,2),
    "security_deposit" DECIMAL(12,2),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "vat_amount" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_items" (
    "id" TEXT NOT NULL,
    "quotation_id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "manual_price" DECIMAL(12,2),
    "rental_days" INTEGER NOT NULL DEFAULT 1,
    "line_total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "quotation_id" UUID,
    "invoice_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "delivery_fee" DECIMAL(12,2),
    "operator_fee" DECIMAL(12,2),
    "security_deposit" DECIMAL(12,2),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "vat_amount" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "amount_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance_due" DECIMAL(12,2) NOT NULL,
    "pdf_url" TEXT,
    "pdf_file_id" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoice_id" UUID NOT NULL,
    "equipment_id" UUID,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "line_total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rentals" (
    "id" TEXT NOT NULL,
    "invoice_id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "rental_start" TIMESTAMP(3) NOT NULL,
    "rental_end" TIMESTAMP(3) NOT NULL,
    "actual_return_date" TIMESTAMP(3),
    "status" "RentalStatus" NOT NULL DEFAULT 'RESERVED',
    "condition_out" TEXT,
    "condition_in" TEXT,
    "damage_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoice_id" UUID NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference_number" TEXT,
    "recorded_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" TEXT NOT NULL,
    "invoice_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "DepositStatus" NOT NULL DEFAULT 'HELD',
    "refund_amount" DECIMAL(12,2),
    "deduction_amount" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chart_of_accounts" (
    "id" TEXT NOT NULL,
    "account_code" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "account_type" "AccountType" NOT NULL,
    "parent_account_id" TEXT,

    CONSTRAINT "chart_of_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "entry_number" TEXT NOT NULL,
    "reference_type" "JournalReferenceType" NOT NULL,
    "reference_id" TEXT NOT NULL,
    "entry_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "created_by" UUID,
    "invoiceId" UUID,
    "paymentId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_lines" (
    "id" TEXT NOT NULL,
    "journal_entry_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "debit_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credit_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "journal_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" UUID,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "original_name" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_logs" (
    "id" TEXT NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "channel" "DeliveryChannel" NOT NULL,
    "to" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "detail" TEXT,
    "file_id" TEXT,
    "quotationId" UUID,
    "invoiceId" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "users"("role_id");

-- CreateIndex
CREATE INDEX "customers_full_name_idx" ON "customers"("full_name");

-- CreateIndex
CREATE INDEX "customers_company_name_idx" ON "customers"("company_name");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_name_key" ON "warehouses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_categories_name_key" ON "equipment_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_serial_number_key" ON "equipment"("serial_number");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_internal_code_key" ON "equipment"("internal_code");

-- CreateIndex
CREATE INDEX "equipment_category_id_idx" ON "equipment"("category_id");

-- CreateIndex
CREATE INDEX "equipment_status_idx" ON "equipment"("status");

-- CreateIndex
CREATE INDEX "equipment_warehouse_id_idx" ON "equipment"("warehouse_id");

-- CreateIndex
CREATE INDEX "equipment_maintenance_logs_equipment_id_idx" ON "equipment_maintenance_logs"("equipment_id");

-- CreateIndex
CREATE INDEX "equipment_maintenance_logs_maintenance_date_idx" ON "equipment_maintenance_logs"("maintenance_date");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_quotation_number_key" ON "quotations"("quotation_number");

-- CreateIndex
CREATE INDEX "quotations_customer_id_idx" ON "quotations"("customer_id");

-- CreateIndex
CREATE INDEX "quotations_status_idx" ON "quotations"("status");

-- CreateIndex
CREATE INDEX "quotations_rental_start_date_rental_end_date_idx" ON "quotations"("rental_start_date", "rental_end_date");

-- CreateIndex
CREATE INDEX "quotation_items_quotation_id_idx" ON "quotation_items"("quotation_id");

-- CreateIndex
CREATE INDEX "quotation_items_equipment_id_idx" ON "quotation_items"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_quotation_id_key" ON "invoices"("quotation_id");

-- CreateIndex
CREATE INDEX "invoices_customer_id_idx" ON "invoices"("customer_id");

-- CreateIndex
CREATE INDEX "invoices_quotation_id_idx" ON "invoices"("quotation_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_invoice_date_idx" ON "invoices"("invoice_date");

-- CreateIndex
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX "invoice_items_equipment_id_idx" ON "invoice_items"("equipment_id");

-- CreateIndex
CREATE INDEX "rentals_invoice_id_idx" ON "rentals"("invoice_id");

-- CreateIndex
CREATE INDEX "rentals_equipment_id_idx" ON "rentals"("equipment_id");

-- CreateIndex
CREATE INDEX "rentals_status_idx" ON "rentals"("status");

-- CreateIndex
CREATE INDEX "rentals_rental_start_rental_end_idx" ON "rentals"("rental_start", "rental_end");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_payment_date_idx" ON "payments"("payment_date");

-- CreateIndex
CREATE INDEX "deposits_invoice_id_idx" ON "deposits"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "chart_of_accounts_account_code_key" ON "chart_of_accounts"("account_code");

-- CreateIndex
CREATE INDEX "chart_of_accounts_account_type_idx" ON "chart_of_accounts"("account_type");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_entry_number_key" ON "journal_entries"("entry_number");

-- CreateIndex
CREATE INDEX "journal_entries_reference_type_reference_id_idx" ON "journal_entries"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "journal_entries_entry_date_idx" ON "journal_entries"("entry_date");

-- CreateIndex
CREATE INDEX "journal_lines_journal_entry_id_idx" ON "journal_lines"("journal_entry_id");

-- CreateIndex
CREATE INDEX "journal_lines_account_id_idx" ON "journal_lines"("account_id");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_entity_type_entity_id_idx" ON "activity_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "activity_logs_timestamp_idx" ON "activity_logs"("timestamp");

-- CreateIndex
CREATE INDEX "delivery_logs_entity_type_entity_id_idx" ON "delivery_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "delivery_logs_channel_idx" ON "delivery_logs"("channel");

-- CreateIndex
CREATE INDEX "delivery_logs_status_idx" ON "delivery_logs"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "equipment_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_maintenance_logs" ADD CONSTRAINT "equipment_maintenance_logs_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_maintenance_logs" ADD CONSTRAINT "equipment_maintenance_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_pdf_file_id_fkey" FOREIGN KEY ("pdf_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_parent_account_id_fkey" FOREIGN KEY ("parent_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_logs" ADD CONSTRAINT "delivery_logs_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_logs" ADD CONSTRAINT "delivery_logs_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_logs" ADD CONSTRAINT "delivery_logs_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
