-- Add a user-facing profile/vault name so each person can create and unlock
-- a separate encrypted vault with a separate master password.
ALTER TABLE "Vault" ADD COLUMN "name" TEXT;

UPDATE "Vault"
SET "name" = 'Vault ' || "id"
WHERE "name" IS NULL;

ALTER TABLE "Vault" ALTER COLUMN "name" SET NOT NULL;

CREATE UNIQUE INDEX "Vault_name_key" ON "Vault"("name");
