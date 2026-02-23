import {
  AccountType,
  ActivityAction,
  CustomerType,
  DeliveryChannel,
  DeliveryStatus,
  DepositStatus,
  DepreciationMethod,
  EntityType,
  EquipmentStatus,
  InvoiceStatus,
  JournalReferenceType,
  PaymentMethod,
  Prisma,
  PrismaClient,
  QuotationStatus,
  RentalStatus,
  RoleName,
} from "@prisma/client";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const dec = (value: string | number) => new Prisma.Decimal(value);

const ids = {
  roles: {
    owner: "role_owner",
    accountant: "role_accountant",
    sales: "role_sales",
    inventory: "role_inventory",
  },
  users: {
    owner: "11111111-1111-1111-1111-111111111111",
    accountant: "22222222-2222-2222-2222-222222222222",
    sales: "33333333-3333-3333-3333-333333333333",
    inventory: "44444444-4444-4444-4444-444444444444",
  },
  customers: {
    individual: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    company: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  },
  warehouses: {
    a: "wh_a",
    b: "wh_b",
  },
  categories: {
    camera: "cat_camera",
    lens: "cat_lens",
  },
  equipment: {
    cam: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    lens: "ffffffff-ffff-ffff-ffff-ffffffffffff",
  },
  maintenance: {
    log: "maint_log_1",
  },
  quotation: {
    id: "11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    item1: "qi_1",
    item2: "qi_2",
  },
  invoice: {
    id: "22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    item1: "ii_1",
    item2: "ii_2",
  },
  rental: {
    id: "rent_1",
  },
  payment: {
    id: "pay_1",
  },
  deposit: {
    id: "dep_1",
  },
  accounts: {
    root: "coa_assets_root",
    cash: "coa_cash",
    receivable: "coa_receivable",
    revenue: "coa_revenue",
    vat: "coa_vat",
    maintenance: "coa_maintenance",
  },
  journal: {
    entry: "je_1",
    line1: "jl_1",
    line2: "jl_2",
  },
  activity: {
    id: "act_1",
  },
  file: {
    id: "file_1",
  },
  delivery: {
    id: "dl_1",
  },
} as const;

async function main() {
  await prisma.role.upsert({
    where: { name: RoleName.OWNER },
    update: { description: "System owner" },
    create: { id: ids.roles.owner, name: RoleName.OWNER, description: "System owner" },
  });
  await prisma.role.upsert({
    where: { name: RoleName.ACCOUNTANT },
    update: { description: "Accounting user" },
    create: { id: ids.roles.accountant, name: RoleName.ACCOUNTANT, description: "Accounting user" },
  });
  await prisma.role.upsert({
    where: { name: RoleName.SALES },
    update: { description: "Sales user" },
    create: { id: ids.roles.sales, name: RoleName.SALES, description: "Sales user" },
  });
  await prisma.role.upsert({
    where: { name: RoleName.INVENTORY_MANAGER },
    update: { description: "Inventory manager" },
    create: { id: ids.roles.inventory, name: RoleName.INVENTORY_MANAGER, description: "Inventory manager" },
  });

  const passwordHash = await bcrypt.hash("Password123!", 10);

  await prisma.user.upsert({
    where: { email: "owner@quickbook.test" },
    update: {
      fullName: "Owner User",
      phone: "+94 77 100 2000",
      passwordHash,
      isActive: true,
      role: { connect: { name: RoleName.OWNER } },
    },
    create: {
      id: ids.users.owner,
      fullName: "Owner User",
      email: "owner@quickbook.test",
      phone: "+94 77 100 2000",
      passwordHash,
      isActive: true,
      role: { connect: { name: RoleName.OWNER } },
    },
  });

  await prisma.user.upsert({
    where: { email: "accountant@quickbook.test" },
    update: {
      fullName: "Accounting Lead",
      phone: "+94 77 100 2001",
      passwordHash,
      isActive: true,
      role: { connect: { name: RoleName.ACCOUNTANT } },
    },
    create: {
      id: ids.users.accountant,
      fullName: "Accounting Lead",
      email: "accountant@quickbook.test",
      phone: "+94 77 100 2001",
      passwordHash,
      isActive: true,
      role: { connect: { name: RoleName.ACCOUNTANT } },
    },
  });

  await prisma.user.upsert({
    where: { email: "sales@quickbook.test" },
    update: {
      fullName: "Sales Coordinator",
      phone: "+94 77 100 2002",
      passwordHash,
      isActive: true,
      role: { connect: { name: RoleName.SALES } },
    },
    create: {
      id: ids.users.sales,
      fullName: "Sales Coordinator",
      email: "sales@quickbook.test",
      phone: "+94 77 100 2002",
      passwordHash,
      isActive: true,
      role: { connect: { name: RoleName.SALES } },
    },
  });

  await prisma.user.upsert({
    where: { email: "inventory@quickbook.test" },
    update: {
      fullName: "Inventory Manager",
      phone: "+94 77 100 2003",
      passwordHash,
      isActive: true,
      role: { connect: { name: RoleName.INVENTORY_MANAGER } },
    },
    create: {
      id: ids.users.inventory,
      fullName: "Inventory Manager",
      email: "inventory@quickbook.test",
      phone: "+94 77 100 2003",
      passwordHash,
      isActive: true,
      role: { connect: { name: RoleName.INVENTORY_MANAGER } },
    },
  });

  await prisma.customer.upsert({
    where: { id: ids.customers.individual },
    update: {
      customerType: CustomerType.INDIVIDUAL,
      fullName: "Kamal Perera",
      companyName: "Kamal Perera Productions",
      nicOrBr: "920123456V",
      email: "kamal@quickbook.test",
      phone: "+94 77 123 4567",
      whatsappNumber: "+94 77 123 4567",
      address: "No. 12, Lake Road, Colombo",
      creditLimit: dec("250000.00"),
      notes: "Preferred weekday pickups.",
    },
    create: {
      id: ids.customers.individual,
      customerType: CustomerType.INDIVIDUAL,
      fullName: "Kamal Perera",
      companyName: "Kamal Perera Productions",
      nicOrBr: "920123456V",
      email: "kamal@quickbook.test",
      phone: "+94 77 123 4567",
      whatsappNumber: "+94 77 123 4567",
      address: "No. 12, Lake Road, Colombo",
      creditLimit: dec("250000.00"),
      notes: "Preferred weekday pickups.",
    },
  });

  await prisma.customer.upsert({
    where: { id: ids.customers.company },
    update: {
      customerType: CustomerType.COMPANY,
      fullName: "Sirius Media",
      companyName: "Sirius Media (Pvt) Ltd",
      nicOrBr: "PV12345",
      email: "accounts@siriusmedia.test",
      phone: "+94 11 234 5678",
      whatsappNumber: "+94 71 234 5678",
      address: "Level 3, Orion City, Colombo",
      creditLimit: dec("750000.00"),
      notes: "Monthly billing cycle.",
    },
    create: {
      id: ids.customers.company,
      customerType: CustomerType.COMPANY,
      fullName: "Sirius Media",
      companyName: "Sirius Media (Pvt) Ltd",
      nicOrBr: "PV12345",
      email: "accounts@siriusmedia.test",
      phone: "+94 11 234 5678",
      whatsappNumber: "+94 71 234 5678",
      address: "Level 3, Orion City, Colombo",
      creditLimit: dec("750000.00"),
      notes: "Monthly billing cycle.",
    },
  });

  await prisma.warehouse.upsert({
    where: { name: "Warehouse A" },
    update: { location: "Colombo" },
    create: { id: ids.warehouses.a, name: "Warehouse A", location: "Colombo" },
  });
  await prisma.warehouse.upsert({
    where: { name: "Warehouse B" },
    update: { location: "Kandy" },
    create: { id: ids.warehouses.b, name: "Warehouse B", location: "Kandy" },
  });

  const warehouseA = await prisma.warehouse.findUnique({ where: { name: "Warehouse A" } });
  const warehouseB = await prisma.warehouse.findUnique({ where: { name: "Warehouse B" } });
  if (!warehouseA || !warehouseB) {
    throw new Error("Warehouses not found after upsert");
  }

  await prisma.equipmentCategory.upsert({
    where: { name: "Camera" },
    update: { name: "Camera" },
    create: { id: ids.categories.camera, name: "Camera" },
  });
  await prisma.equipmentCategory.upsert({
    where: { name: "Lens" },
    update: { name: "Lens" },
    create: { id: ids.categories.lens, name: "Lens" },
  });

  const cameraCategory = await prisma.equipmentCategory.findUnique({ where: { name: "Camera" } });
  const lensCategory = await prisma.equipmentCategory.findUnique({ where: { name: "Lens" } });
  if (!cameraCategory || !lensCategory) {
    throw new Error("Equipment categories not found after upsert");
  }

  await prisma.equipment.upsert({
    where: { internalCode: "CAM-001" },
    update: {
      categoryId: cameraCategory.id,
      name: "Sony FX6 Kit",
      description: "Cinema camera with full-frame sensor",
      imageUrl: "https://example.com/images/fx6.png",
      isActive: true,
      serialNumber: "SN-FX6-0001",
      internalCode: "CAM-001",
      purchaseCost: dec("1400000.00"),
      replacementValue: dec("1600000.00"),
      dailyRate: dec("25000.00"),
      hourlyRate: dec("3500.00"),
      status: EquipmentStatus.RENTED,
      warehouseId: warehouseA.id,
      purchaseDate: new Date("2024-01-15T08:00:00.000Z"),
      depreciationMethod: DepreciationMethod.STRAIGHT_LINE,
      depreciationRate: dec("0.1200"),
      conditionNotes: "Excellent condition, serviced quarterly.",
      locationLabel: "Aisle 2",
    },
    create: {
      id: ids.equipment.cam,
      categoryId: cameraCategory.id,
      name: "Sony FX6 Kit",
      description: "Cinema camera with full-frame sensor",
      imageUrl: "https://example.com/images/fx6.png",
      isActive: true,
      serialNumber: "SN-FX6-0001",
      internalCode: "CAM-001",
      purchaseCost: dec("1400000.00"),
      replacementValue: dec("1600000.00"),
      dailyRate: dec("25000.00"),
      hourlyRate: dec("3500.00"),
      status: EquipmentStatus.RENTED,
      warehouseId: warehouseA.id,
      purchaseDate: new Date("2024-01-15T08:00:00.000Z"),
      depreciationMethod: DepreciationMethod.STRAIGHT_LINE,
      depreciationRate: dec("0.1200"),
      conditionNotes: "Excellent condition, serviced quarterly.",
      locationLabel: "Aisle 2",
    },
  });

  await prisma.equipment.upsert({
    where: { internalCode: "LEN-010" },
    update: {
      categoryId: lensCategory.id,
      name: "Canon RF 24-70mm",
      description: "Versatile zoom lens",
      imageUrl: "https://example.com/images/rf24-70.png",
      isActive: true,
      serialNumber: "SN-RF-2470-0010",
      internalCode: "LEN-010",
      purchaseCost: dec("420000.00"),
      replacementValue: dec("480000.00"),
      dailyRate: dec("6500.00"),
      hourlyRate: dec("900.00"),
      status: EquipmentStatus.AVAILABLE,
      warehouseId: warehouseB.id,
      purchaseDate: new Date("2023-09-12T08:00:00.000Z"),
      depreciationMethod: DepreciationMethod.REDUCING_BALANCE,
      depreciationRate: dec("0.1800"),
      conditionNotes: "Lens hood included.",
      locationLabel: "Rack 4",
    },
    create: {
      id: ids.equipment.lens,
      categoryId: lensCategory.id,
      name: "Canon RF 24-70mm",
      description: "Versatile zoom lens",
      imageUrl: "https://example.com/images/rf24-70.png",
      isActive: true,
      serialNumber: "SN-RF-2470-0010",
      internalCode: "LEN-010",
      purchaseCost: dec("420000.00"),
      replacementValue: dec("480000.00"),
      dailyRate: dec("6500.00"),
      hourlyRate: dec("900.00"),
      status: EquipmentStatus.AVAILABLE,
      warehouseId: warehouseB.id,
      purchaseDate: new Date("2023-09-12T08:00:00.000Z"),
      depreciationMethod: DepreciationMethod.REDUCING_BALANCE,
      depreciationRate: dec("0.1800"),
      conditionNotes: "Lens hood included.",
      locationLabel: "Rack 4",
    },
  });

  const cameraEquipment = await prisma.equipment.findUnique({ where: { internalCode: "CAM-001" } });
  const lensEquipment = await prisma.equipment.findUnique({ where: { internalCode: "LEN-010" } });
  if (!cameraEquipment || !lensEquipment) {
    throw new Error("Equipment not found after upsert");
  }

  await prisma.equipmentMaintenanceLog.upsert({
    where: { id: ids.maintenance.log },
    update: {
      equipmentId: cameraEquipment.id,
      maintenanceDate: new Date("2025-12-05T09:00:00.000Z"),
      description: "Sensor cleaning and firmware update.",
      cost: dec("4500.00"),
      downtimeStart: new Date("2025-12-05T09:00:00.000Z"),
      downtimeEnd: new Date("2025-12-06T16:00:00.000Z"),
      createdById: ids.users.inventory,
    },
    create: {
      id: ids.maintenance.log,
      equipmentId: cameraEquipment.id,
      maintenanceDate: new Date("2025-12-05T09:00:00.000Z"),
      description: "Sensor cleaning and firmware update.",
      cost: dec("4500.00"),
      downtimeStart: new Date("2025-12-05T09:00:00.000Z"),
      downtimeEnd: new Date("2025-12-06T16:00:00.000Z"),
      createdById: ids.users.inventory,
    },
  });

  await prisma.fileObject.upsert({
    where: { id: ids.file.id },
    update: {
      mimeType: "application/pdf",
      storagePath: "invoices/INV-2026-0001.pdf",
      originalName: "INV-2026-0001.pdf",
      version: 1,
    },
    create: {
      id: ids.file.id,
      mimeType: "application/pdf",
      storagePath: "invoices/INV-2026-0001.pdf",
      originalName: "INV-2026-0001.pdf",
      version: 1,
    },
  });

  await prisma.quotation.upsert({
    where: { quotationNumber: "Q-2026-0001" },
    update: {
      customerId: ids.customers.company,
      rentalStartDate: new Date("2026-02-10T03:00:00.000Z"),
      rentalEndDate: new Date("2026-02-12T03:00:00.000Z"),
      status: QuotationStatus.SENT,
      deliveryFee: dec("5000.00"),
      operatorFee: dec("12000.00"),
      securityDeposit: dec("40000.00"),
      subtotal: dec("70000.00"),
      vatAmount: dec("12600.00"),
      discount: dec("2000.00"),
      totalAmount: dec("80600.00"),
      createdById: ids.users.sales,
    },
    create: {
      id: ids.quotation.id,
      quotationNumber: "Q-2026-0001",
      customerId: ids.customers.company,
      rentalStartDate: new Date("2026-02-10T03:00:00.000Z"),
      rentalEndDate: new Date("2026-02-12T03:00:00.000Z"),
      status: QuotationStatus.SENT,
      deliveryFee: dec("5000.00"),
      operatorFee: dec("12000.00"),
      securityDeposit: dec("40000.00"),
      subtotal: dec("70000.00"),
      vatAmount: dec("12600.00"),
      discount: dec("2000.00"),
      totalAmount: dec("80600.00"),
      createdById: ids.users.sales,
    },
  });

  await prisma.quotationItem.upsert({
    where: { id: ids.quotation.item1 },
    update: {
      quotationId: ids.quotation.id,
      equipmentId: cameraEquipment.id,
      quantity: 1,
      manualPrice: dec("25000.00"),
      rentalDays: 2,
      lineTotal: dec("50000.00"),
    },
    create: {
      id: ids.quotation.item1,
      quotationId: ids.quotation.id,
      equipmentId: cameraEquipment.id,
      quantity: 1,
      manualPrice: dec("25000.00"),
      rentalDays: 2,
      lineTotal: dec("50000.00"),
    },
  });

  await prisma.quotationItem.upsert({
    where: { id: ids.quotation.item2 },
    update: {
      quotationId: ids.quotation.id,
      equipmentId: lensEquipment.id,
      quantity: 2,
      manualPrice: dec("10000.00"),
      rentalDays: 2,
      lineTotal: dec("20000.00"),
    },
    create: {
      id: ids.quotation.item2,
      quotationId: ids.quotation.id,
      equipmentId: lensEquipment.id,
      quantity: 2,
      manualPrice: dec("10000.00"),
      rentalDays: 2,
      lineTotal: dec("20000.00"),
    },
  });

  await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2026-0001" },
    update: {
      customerId: ids.customers.company,
      quotationId: ids.quotation.id,
      invoiceDate: new Date("2026-02-12T08:30:00.000Z"),
      dueDate: new Date("2026-02-20T08:30:00.000Z"),
      status: InvoiceStatus.PARTIAL,
      deliveryFee: dec("5000.00"),
      operatorFee: dec("12000.00"),
      securityDeposit: dec("40000.00"),
      subtotal: dec("70000.00"),
      vatAmount: dec("12600.00"),
      discount: dec("2000.00"),
      totalAmount: dec("80600.00"),
      amountPaid: dec("30000.00"),
      balanceDue: dec("50600.00"),
      pdfUrl: "https://example.com/api/v1/files/file_1",
      pdfFileId: ids.file.id,
      createdById: ids.users.accountant,
    },
    create: {
      id: ids.invoice.id,
      invoiceNumber: "INV-2026-0001",
      customerId: ids.customers.company,
      quotationId: ids.quotation.id,
      invoiceDate: new Date("2026-02-12T08:30:00.000Z"),
      dueDate: new Date("2026-02-20T08:30:00.000Z"),
      status: InvoiceStatus.PARTIAL,
      deliveryFee: dec("5000.00"),
      operatorFee: dec("12000.00"),
      securityDeposit: dec("40000.00"),
      subtotal: dec("70000.00"),
      vatAmount: dec("12600.00"),
      discount: dec("2000.00"),
      totalAmount: dec("80600.00"),
      amountPaid: dec("30000.00"),
      balanceDue: dec("50600.00"),
      pdfUrl: "https://example.com/api/v1/files/file_1",
      pdfFileId: ids.file.id,
      createdById: ids.users.accountant,
    },
  });

  await prisma.invoiceItem.upsert({
    where: { id: ids.invoice.item1 },
    update: {
      invoiceId: ids.invoice.id,
      equipmentId: cameraEquipment.id,
      description: "Sony FX6 daily rental",
      quantity: 1,
      unitPrice: dec("25000.00"),
      lineTotal: dec("25000.00"),
    },
    create: {
      id: ids.invoice.item1,
      invoiceId: ids.invoice.id,
      equipmentId: cameraEquipment.id,
      description: "Sony FX6 daily rental",
      quantity: 1,
      unitPrice: dec("25000.00"),
      lineTotal: dec("25000.00"),
    },
  });

  await prisma.invoiceItem.upsert({
    where: { id: ids.invoice.item2 },
    update: {
      invoiceId: ids.invoice.id,
      equipmentId: lensEquipment.id,
      description: "Canon RF 24-70mm daily rental",
      quantity: 2,
      unitPrice: dec("10000.00"),
      lineTotal: dec("20000.00"),
    },
    create: {
      id: ids.invoice.item2,
      invoiceId: ids.invoice.id,
      equipmentId: lensEquipment.id,
      description: "Canon RF 24-70mm daily rental",
      quantity: 2,
      unitPrice: dec("10000.00"),
      lineTotal: dec("20000.00"),
    },
  });

  await prisma.rental.upsert({
    where: { id: ids.rental.id },
    update: {
      invoiceId: ids.invoice.id,
      equipmentId: cameraEquipment.id,
      rentalStart: new Date("2026-02-10T03:00:00.000Z"),
      rentalEnd: new Date("2026-02-12T03:00:00.000Z"),
      actualReturnDate: new Date("2026-02-12T06:00:00.000Z"),
      status: RentalStatus.RETURNED,
      conditionOut: "Clean, fully charged.",
      conditionIn: "Minor scuff on handle.",
      damageNotes: "Surface scuff noted, no functional damage.",
    },
    create: {
      id: ids.rental.id,
      invoiceId: ids.invoice.id,
      equipmentId: cameraEquipment.id,
      rentalStart: new Date("2026-02-10T03:00:00.000Z"),
      rentalEnd: new Date("2026-02-12T03:00:00.000Z"),
      actualReturnDate: new Date("2026-02-12T06:00:00.000Z"),
      status: RentalStatus.RETURNED,
      conditionOut: "Clean, fully charged.",
      conditionIn: "Minor scuff on handle.",
      damageNotes: "Surface scuff noted, no functional damage.",
    },
  });

  await prisma.payment.upsert({
    where: { id: ids.payment.id },
    update: {
      invoiceId: ids.invoice.id,
      paymentDate: new Date("2026-02-12T09:00:00.000Z"),
      paymentMethod: PaymentMethod.BANK,
      amount: dec("30000.00"),
      referenceNumber: "BANK-REF-20260212-01",
      recordedById: ids.users.accountant,
    },
    create: {
      id: ids.payment.id,
      invoiceId: ids.invoice.id,
      paymentDate: new Date("2026-02-12T09:00:00.000Z"),
      paymentMethod: PaymentMethod.BANK,
      amount: dec("30000.00"),
      referenceNumber: "BANK-REF-20260212-01",
      recordedById: ids.users.accountant,
    },
  });

  await prisma.deposit.upsert({
    where: { id: ids.deposit.id },
    update: {
      invoiceId: ids.invoice.id,
      amount: dec("40000.00"),
      status: DepositStatus.PARTIALLY_DEDUCTED,
      refundAmount: dec("35000.00"),
      deductionAmount: dec("5000.00"),
    },
    create: {
      id: ids.deposit.id,
      invoiceId: ids.invoice.id,
      amount: dec("40000.00"),
      status: DepositStatus.PARTIALLY_DEDUCTED,
      refundAmount: dec("35000.00"),
      deductionAmount: dec("5000.00"),
    },
  });

  await prisma.chartOfAccount.upsert({
    where: { accountCode: "1000" },
    update: {
      accountName: "Assets",
      accountType: AccountType.ASSET,
      parentAccountId: null,
    },
    create: {
      id: ids.accounts.root,
      accountCode: "1000",
      accountName: "Assets",
      accountType: AccountType.ASSET,
      parentAccountId: null,
    },
  });

  const rootAccount = await prisma.chartOfAccount.findUnique({
    where: { accountCode: "1000" },
  });
  if (!rootAccount) {
    throw new Error("Root chart of account not found after upsert");
  }

  await prisma.chartOfAccount.upsert({
    where: { accountCode: "1010" },
    update: {
      accountName: "Cash",
      accountType: AccountType.ASSET,
      parentAccountId: rootAccount.id,
    },
    create: {
      id: ids.accounts.cash,
      accountCode: "1010",
      accountName: "Cash",
      accountType: AccountType.ASSET,
      parentAccountId: rootAccount.id,
    },
  });

  await prisma.chartOfAccount.upsert({
    where: { accountCode: "1100" },
    update: {
      accountName: "Accounts Receivable",
      accountType: AccountType.ASSET,
      parentAccountId: rootAccount.id,
    },
    create: {
      id: ids.accounts.receivable,
      accountCode: "1100",
      accountName: "Accounts Receivable",
      accountType: AccountType.ASSET,
      parentAccountId: rootAccount.id,
    },
  });

  await prisma.chartOfAccount.upsert({
    where: { accountCode: "4000" },
    update: {
      accountName: "Rental Income",
      accountType: AccountType.INCOME,
      parentAccountId: rootAccount.id,
    },
    create: {
      id: ids.accounts.revenue,
      accountCode: "4000",
      accountName: "Rental Income",
      accountType: AccountType.INCOME,
      parentAccountId: rootAccount.id,
    },
  });

  await prisma.chartOfAccount.upsert({
    where: { accountCode: "2000" },
    update: {
      accountName: "VAT Payable",
      accountType: AccountType.LIABILITY,
      parentAccountId: rootAccount.id,
    },
    create: {
      id: ids.accounts.vat,
      accountCode: "2000",
      accountName: "VAT Payable",
      accountType: AccountType.LIABILITY,
      parentAccountId: rootAccount.id,
    },
  });

  await prisma.chartOfAccount.upsert({
    where: { accountCode: "5000" },
    update: {
      accountName: "Maintenance Expense",
      accountType: AccountType.EXPENSE,
      parentAccountId: rootAccount.id,
    },
    create: {
      id: ids.accounts.maintenance,
      accountCode: "5000",
      accountName: "Maintenance Expense",
      accountType: AccountType.EXPENSE,
      parentAccountId: rootAccount.id,
    },
  });

  await prisma.chartOfAccount.update({
    where: { id: rootAccount.id },
    data: { parentAccountId: rootAccount.id },
  });

  const receivableAccount = await prisma.chartOfAccount.findUnique({
    where: { accountCode: "1100" },
  });
  const revenueAccount = await prisma.chartOfAccount.findUnique({
    where: { accountCode: "4000" },
  });
  if (!receivableAccount || !revenueAccount) {
    throw new Error("Required chart of accounts not found after upsert");
  }

  await prisma.journalEntry.upsert({
    where: { entryNumber: "JE-2026-0001" },
    update: {
      referenceType: JournalReferenceType.INVOICE,
      referenceId: ids.invoice.id,
      entryDate: new Date("2026-02-12T10:00:00.000Z"),
      description: "Invoice posting for INV-2026-0001",
      createdById: ids.users.accountant,
      invoiceId: ids.invoice.id,
      paymentId: ids.payment.id,
    },
    create: {
      id: ids.journal.entry,
      entryNumber: "JE-2026-0001",
      referenceType: JournalReferenceType.INVOICE,
      referenceId: ids.invoice.id,
      entryDate: new Date("2026-02-12T10:00:00.000Z"),
      description: "Invoice posting for INV-2026-0001",
      createdById: ids.users.accountant,
      invoiceId: ids.invoice.id,
      paymentId: ids.payment.id,
    },
  });

  await prisma.journalLine.upsert({
    where: { id: ids.journal.line1 },
    update: {
      journalEntryId: ids.journal.entry,
      accountId: receivableAccount.id,
      debitAmount: dec("80600.00"),
      creditAmount: dec("0.00"),
    },
    create: {
      id: ids.journal.line1,
      journalEntryId: ids.journal.entry,
      accountId: receivableAccount.id,
      debitAmount: dec("80600.00"),
      creditAmount: dec("0.00"),
    },
  });

  await prisma.journalLine.upsert({
    where: { id: ids.journal.line2 },
    update: {
      journalEntryId: ids.journal.entry,
      accountId: revenueAccount.id,
      debitAmount: dec("0.00"),
      creditAmount: dec("80600.00"),
    },
    create: {
      id: ids.journal.line2,
      journalEntryId: ids.journal.entry,
      accountId: revenueAccount.id,
      debitAmount: dec("0.00"),
      creditAmount: dec("80600.00"),
    },
  });

  await prisma.activityLog.upsert({
    where: { id: ids.activity.id },
    update: {
      userId: ids.users.sales,
      entityType: EntityType.CUSTOMER,
      entityId: ids.customers.company,
      action: ActivityAction.CREATE,
      timestamp: new Date("2026-02-01T10:00:00.000Z"),
    },
    create: {
      id: ids.activity.id,
      userId: ids.users.sales,
      entityType: EntityType.CUSTOMER,
      entityId: ids.customers.company,
      action: ActivityAction.CREATE,
      timestamp: new Date("2026-02-01T10:00:00.000Z"),
    },
  });

  await prisma.deliveryLog.upsert({
    where: { id: ids.delivery.id },
    update: {
      entityType: EntityType.INVOICE,
      entityId: ids.invoice.id,
      channel: DeliveryChannel.EMAIL,
      to: "accounts@siriusmedia.test",
      status: DeliveryStatus.SENT,
      detail: "Invoice emailed with PDF attachment.",
      fileId: ids.file.id,
      quotationId: ids.quotation.id,
      invoiceId: ids.invoice.id,
    },
    create: {
      id: ids.delivery.id,
      entityType: EntityType.INVOICE,
      entityId: ids.invoice.id,
      channel: DeliveryChannel.EMAIL,
      to: "accounts@siriusmedia.test",
      status: DeliveryStatus.SENT,
      detail: "Invoice emailed with PDF attachment.",
      fileId: ids.file.id,
      quotationId: ids.quotation.id,
      invoiceId: ids.invoice.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
