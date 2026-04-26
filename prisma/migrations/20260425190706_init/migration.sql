-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'CASHIER', 'ACCOUNTANT');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CASH', 'BANK');

-- CreateEnum
CREATE TYPE "TxnType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "SalePaymentStatus" AS ENUM ('PAID', 'DUE', 'PARTIAL');

-- CreateEnum
CREATE TYPE "PurchasePaymentStatus" AS ENUM ('PAID', 'DUE', 'PARTIAL');

-- CreateEnum
CREATE TYPE "StockMoveReason" AS ENUM ('PURCHASE', 'PURCHASE_RETURN', 'SALE', 'SALE_RETURN', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT', 'OPENING');

-- CreateEnum
CREATE TYPE "SalaryStatus" AS ENUM ('PENDING', 'PAID');

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CASHIER',
    "branchId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT 'Express Retail Pro',
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "currencySymbol" TEXT NOT NULL DEFAULT '৳',
    "language" TEXT NOT NULL DEFAULT 'en',
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV-',
    "purchasePrefix" TEXT NOT NULL DEFAULT 'PO-',
    "defaultBranchId" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "vatPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "barcode" TEXT,
    "description" TEXT,
    "categoryId" TEXT,
    "unitId" TEXT,
    "costPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "salePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reorderLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStock" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ProductStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "openingDue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "openingDue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerLedger" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refType" TEXT NOT NULL,
    "refId" TEXT,
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "CustomerLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierLedger" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refType" TEXT NOT NULL,
    "refId" TEXT,
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "SupplierLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branchId" TEXT NOT NULL,
    "customerId" TEXT,
    "userId" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "due" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentStatus" "SalePaymentStatus" NOT NULL DEFAULT 'PAID',
    "notes" TEXT,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleReturn" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleReturnItem" (
    "id" TEXT NOT NULL,
    "saleReturnId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SaleReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "poNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branchId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "due" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentStatus" "PurchasePaymentStatus" NOT NULL DEFAULT 'DUE',
    "notes" TEXT,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseReturn" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseReturnItem" (
    "id" TEXT NOT NULL,
    "purchaseReturnId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PurchaseReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMove" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" DOUBLE PRECISION NOT NULL,
    "reason" "StockMoveReason" NOT NULL,
    "refId" TEXT,
    "notes" TEXT,

    CONSTRAINT "StockMove_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransfer" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,
    "fromBranchId" TEXT NOT NULL,
    "toBranchId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branchId" TEXT NOT NULL,
    "categoryId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "branchId" TEXT,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountTxn" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "TxnType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "notes" TEXT,
    "saleId" TEXT,
    "purchaseId" TEXT,

    CONSTRAINT "AccountTxn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "designation" TEXT,
    "address" TEXT,
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branchId" TEXT,
    "baseSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryPayment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "bonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "status" "SalaryStatus" NOT NULL DEFAULT 'PENDING',
    "paidDate" TIMESTAMP(3),
    "accountId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_name_key" ON "Unit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "ProductStock_branchId_idx" ON "ProductStock"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductStock_productId_branchId_key" ON "ProductStock"("productId", "branchId");

-- CreateIndex
CREATE INDEX "CustomerLedger_customerId_date_idx" ON "CustomerLedger"("customerId", "date");

-- CreateIndex
CREATE INDEX "SupplierLedger_supplierId_date_idx" ON "SupplierLedger"("supplierId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_invoiceNo_key" ON "Sale"("invoiceNo");

-- CreateIndex
CREATE INDEX "Sale_date_idx" ON "Sale"("date");

-- CreateIndex
CREATE INDEX "Sale_branchId_date_idx" ON "Sale"("branchId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_poNo_key" ON "Purchase"("poNo");

-- CreateIndex
CREATE INDEX "Purchase_date_idx" ON "Purchase"("date");

-- CreateIndex
CREATE INDEX "Purchase_branchId_date_idx" ON "Purchase"("branchId", "date");

-- CreateIndex
CREATE INDEX "StockMove_productId_date_idx" ON "StockMove"("productId", "date");

-- CreateIndex
CREATE INDEX "StockMove_branchId_date_idx" ON "StockMove"("branchId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_name_key" ON "ExpenseCategory"("name");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "AccountTxn_accountId_date_idx" ON "AccountTxn"("accountId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryPayment_employeeId_monthYear_key" ON "SalaryPayment"("employeeId", "monthYear");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStock" ADD CONSTRAINT "ProductStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStock" ADD CONSTRAINT "ProductStock_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerLedger" ADD CONSTRAINT "CustomerLedger_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierLedger" ADD CONSTRAINT "SupplierLedger_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleReturn" ADD CONSTRAINT "SaleReturn_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleReturnItem" ADD CONSTRAINT "SaleReturnItem_saleReturnId_fkey" FOREIGN KEY ("saleReturnId") REFERENCES "SaleReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturnItem" ADD CONSTRAINT "PurchaseReturnItem_purchaseReturnId_fkey" FOREIGN KEY ("purchaseReturnId") REFERENCES "PurchaseReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMove" ADD CONSTRAINT "StockMove_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_fromBranchId_fkey" FOREIGN KEY ("fromBranchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_toBranchId_fkey" FOREIGN KEY ("toBranchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountTxn" ADD CONSTRAINT "AccountTxn_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountTxn" ADD CONSTRAINT "AccountTxn_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountTxn" ADD CONSTRAINT "AccountTxn_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryPayment" ADD CONSTRAINT "SalaryPayment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
