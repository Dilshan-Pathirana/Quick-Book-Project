import { PrismaClient, RoleName, AccountType } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.role.upsert({
    where: { name: RoleName.OWNER },
    update: { description: "System owner" },
    create: { name: RoleName.OWNER, description: "System owner" },
  });
  await prisma.role.upsert({
    where: { name: RoleName.ACCOUNTANT },
    update: { description: "Accounting user" },
    create: { name: RoleName.ACCOUNTANT, description: "Accounting user" },
  });
  await prisma.role.upsert({
    where: { name: RoleName.SALES },
    update: { description: "Sales user" },
    create: { name: RoleName.SALES, description: "Sales user" },
  });
  await prisma.role.upsert({
    where: { name: RoleName.INVENTORY_MANAGER },
    update: { description: "Inventory manager" },
    create: { name: RoleName.INVENTORY_MANAGER, description: "Inventory manager" },
  });

  const accounts = [
    { accountCode: "1000", accountName: "Cash", accountType: AccountType.ASSET },
    { accountCode: "1100", accountName: "Accounts Receivable", accountType: AccountType.ASSET },
    { accountCode: "1500", accountName: "Equipment (Assets)", accountType: AccountType.ASSET },
    { accountCode: "2000", accountName: "VAT Payable", accountType: AccountType.LIABILITY },
    { accountCode: "4000", accountName: "Rental Income", accountType: AccountType.INCOME },
    { accountCode: "4010", accountName: "Service Income", accountType: AccountType.INCOME },
    { accountCode: "5000", accountName: "Maintenance Expense", accountType: AccountType.EXPENSE },
  ] as const;

  for (const account of accounts) {
    await prisma.chartOfAccount.upsert({
      where: { accountCode: account.accountCode },
      update: { accountName: account.accountName, accountType: account.accountType },
      create: account,
    });
  }

  const categories = ["Camera", "Lens", "Light", "Audio", "Grip", "Drone"];
  for (const name of categories) {
    await prisma.equipmentCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  await prisma.warehouse.upsert({
    where: { name: "Warehouse A" },
    update: { location: "Default" },
    create: { name: "Warehouse A", location: "Default" },
  });
  await prisma.warehouse.upsert({
    where: { name: "Warehouse B" },
    update: { location: "Default" },
    create: { name: "Warehouse B", location: "Default" },
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
