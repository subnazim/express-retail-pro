import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.setting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      companyName: "Express Retail Pro",
      currency: "BDT",
      currencySymbol: "৳",
      language: "en",
      invoicePrefix: "INV-",
      purchasePrefix: "PO-",
      address: "Dhaka, Bangladesh",
      phone: "+880 1700 000000",
      email: "info@example.com",
    },
    update: {},
  });

  const mainBranch = await prisma.branch.upsert({
    where: { id: "main" },
    create: { id: "main", name: "Main Branch", isMain: true, address: "Dhaka" },
    update: {},
  });
  const secondBranch = await prisma.branch.upsert({
    where: { id: "branch-2" },
    create: { id: "branch-2", name: "Chittagong Branch", address: "Chittagong" },
    update: {},
  });

  await prisma.setting.update({
    where: { id: "default" },
    data: { defaultBranchId: mainBranch.id },
  });

  // Users
  const adminPwd = await bcrypt.hash("admin123", 10);
  const cashierPwd = await bcrypt.hash("cashier123", 10);
  const managerPwd = await bcrypt.hash("manager123", 10);
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    create: {
      name: "Admin",
      email: "admin@example.com",
      passwordHash: adminPwd,
      role: "ADMIN",
      branchId: mainBranch.id,
    },
    update: {},
  });
  await prisma.user.upsert({
    where: { email: "manager@example.com" },
    create: {
      name: "Manager",
      email: "manager@example.com",
      passwordHash: managerPwd,
      role: "MANAGER",
      branchId: mainBranch.id,
    },
    update: {},
  });
  await prisma.user.upsert({
    where: { email: "cashier@example.com" },
    create: {
      name: "Cashier",
      email: "cashier@example.com",
      passwordHash: cashierPwd,
      role: "CASHIER",
      branchId: mainBranch.id,
    },
    update: {},
  });

  // Categories
  const catNames = ["Grocery", "Beverage", "Snacks", "Stationery", "Electronics"];
  const cats = [];
  for (const name of catNames) {
    cats.push(
      await prisma.category.upsert({
        where: { name },
        create: { name },
        update: {},
      }),
    );
  }
  // Units
  const unitNames = ["pcs", "kg", "ltr", "box", "pack"];
  const units = [];
  for (const name of unitNames) {
    units.push(
      await prisma.unit.upsert({ where: { name }, create: { name }, update: {} }),
    );
  }

  // Expense categories
  const expCats = ["Rent", "Utilities", "Transport", "Office Supplies", "Misc"];
  for (const name of expCats) {
    await prisma.expenseCategory.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  // Accounts
  const cash = await prisma.account.upsert({
    where: { id: "acct-cash-1" },
    create: {
      id: "acct-cash-1",
      name: "Counter Cash",
      type: "CASH",
      branchId: mainBranch.id,
      openingBalance: 5000,
    },
    update: {},
  });
  const bank = await prisma.account.upsert({
    where: { id: "acct-bank-1" },
    create: {
      id: "acct-bank-1",
      name: "Main Bank Account",
      type: "BANK",
      bankName: "Sample Bank",
      accountNumber: "0001234567890",
      branchId: mainBranch.id,
      openingBalance: 100000,
    },
    update: {},
  });
  console.log(`   ✓ Accounts: ${cash.name}, ${bank.name}`);

  // Sample products
  type Sample = {
    sku: string;
    name: string;
    cost: number;
    price: number;
    cat: number;
    unit: number;
    stock: number;
  };
  const samples: Sample[] = [
    { sku: "P001", name: "Rice 5kg", cost: 280, price: 320, cat: 0, unit: 1, stock: 100 },
    { sku: "P002", name: "Sugar 1kg", cost: 90, price: 110, cat: 0, unit: 1, stock: 200 },
    { sku: "P003", name: "Cooking Oil 5L", cost: 700, price: 780, cat: 0, unit: 2, stock: 50 },
    { sku: "P004", name: "Tea 500g", cost: 250, price: 320, cat: 1, unit: 1, stock: 80 },
    { sku: "P005", name: "Coffee Sachet", cost: 8, price: 12, cat: 1, unit: 0, stock: 500 },
    { sku: "P006", name: "Biscuits Pack", cost: 25, price: 35, cat: 2, unit: 4, stock: 300 },
    { sku: "P007", name: "Chips 100g", cost: 30, price: 50, cat: 2, unit: 0, stock: 250 },
    { sku: "P008", name: "Notebook A4", cost: 50, price: 80, cat: 3, unit: 0, stock: 150 },
    { sku: "P009", name: "Pen Box", cost: 60, price: 100, cat: 3, unit: 3, stock: 100 },
    { sku: "P010", name: "USB Cable", cost: 90, price: 150, cat: 4, unit: 0, stock: 60 },
  ];
  for (const s of samples) {
    const p = await prisma.product.upsert({
      where: { sku: s.sku },
      create: {
        sku: s.sku,
        name: s.name,
        costPrice: s.cost,
        salePrice: s.price,
        categoryId: cats[s.cat]?.id,
        unitId: units[s.unit]?.id,
        reorderLevel: 10,
      },
      update: {},
    });
    await prisma.productStock.upsert({
      where: { productId_branchId: { productId: p.id, branchId: mainBranch.id } },
      create: { productId: p.id, branchId: mainBranch.id, quantity: s.stock },
      update: {},
    });
    await prisma.productStock.upsert({
      where: { productId_branchId: { productId: p.id, branchId: secondBranch.id } },
      create: {
        productId: p.id,
        branchId: secondBranch.id,
        quantity: Math.floor(s.stock / 2),
      },
      update: {},
    });
  }

  // Customers
  await prisma.customer.upsert({
    where: { id: "cust-1" },
    create: { id: "cust-1", name: "Walk-in", phone: "" },
    update: {},
  });
  await prisma.customer.upsert({
    where: { id: "cust-2" },
    create: {
      id: "cust-2",
      name: "Karim Traders",
      phone: "+880 1711 111111",
      address: "New Market, Dhaka",
    },
    update: {},
  });

  // Suppliers
  await prisma.supplier.upsert({
    where: { id: "sup-1" },
    create: {
      id: "sup-1",
      name: "ABC Wholesale",
      phone: "+880 1722 222222",
      address: "Old Dhaka",
    },
    update: {},
  });
  await prisma.supplier.upsert({
    where: { id: "sup-2" },
    create: {
      id: "sup-2",
      name: "City Distributors",
      phone: "+880 1733 333333",
    },
    update: {},
  });

  // Employee
  await prisma.employee.upsert({
    where: { id: "emp-1" },
    create: {
      id: "emp-1",
      name: "Rahim Ali",
      designation: "Sales Associate",
      branchId: mainBranch.id,
      baseSalary: 18000,
      phone: "+880 1744 444444",
    },
    update: {},
  });

  console.log("✅ Seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
