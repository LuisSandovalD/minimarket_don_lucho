-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "requestHash" TEXT;

-- AlterTable
ALTER TABLE "SaleRefund" ADD COLUMN     "creditAmount" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Operation" (
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "resetsAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "CreditPaymentAllocation" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "CreditPaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleBatchAllocation" (
    "id" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "SaleBatchAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetCleanup" (
    "publicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetCleanup_pkey" PRIMARY KEY ("publicId")
);

-- CreateIndex
CREATE INDEX "RateLimit_resetsAt_idx" ON "RateLimit"("resetsAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreditPaymentAllocation_saleId_paymentId_key" ON "CreditPaymentAllocation"("saleId", "paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "SaleBatchAllocation_saleItemId_batchId_key" ON "SaleBatchAllocation"("saleItemId", "batchId");

-- AddForeignKey
ALTER TABLE "CreditPaymentAllocation" ADD CONSTRAINT "CreditPaymentAllocation_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditPaymentAllocation" ADD CONSTRAINT "CreditPaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "CreditPayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleBatchAllocation" ADD CONSTRAINT "SaleBatchAllocation_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleBatchAllocation" ADD CONSTRAINT "SaleBatchAllocation_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
