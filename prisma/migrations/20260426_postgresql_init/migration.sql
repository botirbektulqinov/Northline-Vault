-- CreateEnum
CREATE TYPE "PasswordStrength" AS ENUM ('WEAK', 'FAIR', 'STRONG');

-- CreateTable
CREATE TABLE "Vault" (
    "id" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "verifier" TEXT NOT NULL,
    "settingsJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "vaultId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "department" TEXT,
    "project" TEXT,
    "category" TEXT,
    "tagsJson" TEXT NOT NULL,
    "usernameCiphertext" TEXT NOT NULL,
    "passwordCiphertext" TEXT NOT NULL,
    "notesCiphertext" TEXT NOT NULL,
    "passwordStrength" "PasswordStrength" NOT NULL,
    "passwordFingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Credential_vaultId_idx" ON "Credential"("vaultId");

-- CreateIndex
CREATE INDEX "Credential_passwordFingerprint_idx" ON "Credential"("passwordFingerprint");

-- CreateIndex
CREATE INDEX "Credential_serviceName_idx" ON "Credential"("serviceName");

-- CreateIndex
CREATE INDEX "Credential_updatedAt_idx" ON "Credential"("updatedAt");

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "Vault"("id") ON DELETE CASCADE ON UPDATE CASCADE;
