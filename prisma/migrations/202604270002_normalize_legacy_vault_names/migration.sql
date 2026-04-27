WITH legacy_vaults AS (
    SELECT
        "id",
        row_number() OVER (ORDER BY "createdAt", "id") AS "position"
    FROM "Vault"
    WHERE "name" LIKE 'Vault c%'
)
UPDATE "Vault"
SET "name" = CASE
    WHEN legacy_vaults."position" = 1
        AND NOT EXISTS (
            SELECT 1
            FROM "Vault" existing
            WHERE existing."name" = 'Team workspace'
                AND existing."id" <> legacy_vaults."id"
        )
        THEN 'Team workspace'
    ELSE 'Team workspace ' || substring(legacy_vaults."id" from 1 for 8)
END
FROM legacy_vaults
WHERE "Vault"."id" = legacy_vaults."id";
