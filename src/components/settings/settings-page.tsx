"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Download, KeyRound, ShieldCheck } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useVault } from "@/hooks/use-vault";
import { CLIPBOARD_PRESETS, ROTATION_PRESETS } from "@/lib/constants/vault";
import { getErrorMessage } from "@/lib/errors";
import { formatTimestamp } from "@/lib/format";
import { settingsSchema } from "@/lib/schemas";
import type { VaultSettings } from "@/lib/types";

const masterPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter the current master password."),
    nextPassword: z.string().min(12, "Use at least 12 characters."),
    confirmPassword: z.string().min(1, "Confirm the new master password."),
  })
  .refine((values) => values.currentPassword !== values.nextPassword, {
    path: ["nextPassword"],
    message: "Choose a different master password.",
  })
  .refine((values) => values.nextPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "The new password confirmation does not match.",
  });

export function SettingsPage() {
  const { changeMasterPassword, exportBackup, health, settings, updateSettings, vault } =
    useVault();

  const preferenceForm = useForm<VaultSettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  const masterPasswordForm = useForm<z.infer<typeof masterPasswordSchema>>({
    resolver: zodResolver(masterPasswordSchema),
    defaultValues: {
      currentPassword: "",
      nextPassword: "",
      confirmPassword: "",
    },
  });

  const backupFilename = useMemo(() => {
    const suffix = new Date().toISOString().replaceAll(":", "-");
    return `northline-vault-backup-${suffix}.json`;
  }, []);

  useEffect(() => {
    preferenceForm.reset(settings);
  }, [preferenceForm, settings]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-black/6 bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Vault created</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {vault ? formatTimestamp(vault.createdAt) : "Unavailable"}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Single-vault local setup for this assessment environment.
          </p>
        </div>
        <div className="rounded-xl border border-black/6 bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Credential count</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {vault?.credentialCount ?? 0}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Searchable metadata with encrypted secret fields.
          </p>
        </div>
        <div className="rounded-xl border border-black/6 bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Security score</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{health.score}/100</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Based on password reuse, strength mix, missing classification, and review age.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-xl border border-black/6 bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Session and visibility
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Tune how the vault behaves on shared machines
            </h1>
          </div>

          <form
            className="mt-8 space-y-6"
            onSubmit={preferenceForm.handleSubmit(async (values) => {
              preferenceForm.clearErrors("root");

              try {
                await updateSettings(values);
                toast.success("Settings updated");
              } catch (error) {
                preferenceForm.setError("root", {
                  message: getErrorMessage(error, "Settings could not be updated."),
                });
              }
            })}
          >
            {preferenceForm.formState.errors.root?.message ? (
              <p
                role="alert"
                className="rounded-lg border border-[#d3b2aa] bg-[#fff3ef] px-4 py-3 text-sm text-[#7c3b2f]"
              >
                {preferenceForm.formState.errors.root.message}
              </p>
            ) : null}

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="auto-lock">
                  Auto-lock timeout (minutes)
                </label>
                <Input
                  id="auto-lock"
                  type="number"
                  min={1}
                  max={240}
                  {...preferenceForm.register("autoLockMinutes", { valueAsNumber: true })}
                />
                {preferenceForm.formState.errors.autoLockMinutes ? (
                  <p className="text-sm text-destructive">
                    {preferenceForm.formState.errors.autoLockMinutes.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="reveal-duration">
                  Reveal duration (seconds)
                </label>
                <Input
                  id="reveal-duration"
                  type="number"
                  min={3}
                  max={60}
                  disabled={!preferenceForm.watch("allowPasswordReveal")}
                  {...preferenceForm.register("revealDurationSeconds", {
                    valueAsNumber: true,
                  })}
                />
                {preferenceForm.formState.errors.revealDurationSeconds ? (
                  <p className="text-sm text-destructive">
                    {preferenceForm.formState.errors.revealDurationSeconds.message}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Applies only when password reveal controls are enabled.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="clipboard-clear">
                  Clipboard clear timeout (seconds)
                </label>
                <Input
                  id="clipboard-clear"
                  type="number"
                  min={0}
                  max={300}
                  list="clipboard-presets"
                  {...preferenceForm.register("clipboardClearSeconds", {
                    valueAsNumber: true,
                  })}
                />
                <datalist id="clipboard-presets">
                  {CLIPBOARD_PRESETS.map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>
                {preferenceForm.formState.errors.clipboardClearSeconds ? (
                  <p className="text-sm text-destructive">
                    {preferenceForm.formState.errors.clipboardClearSeconds.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="rotation-days">
                  Rotation review threshold (days)
                </label>
                <Input
                  id="rotation-days"
                  type="number"
                  min={30}
                  max={365}
                  list="rotation-presets"
                  {...preferenceForm.register("rotationReviewDays", {
                    valueAsNumber: true,
                  })}
                />
                <datalist id="rotation-presets">
                  {ROTATION_PRESETS.map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>
                {preferenceForm.formState.errors.rotationReviewDays ? (
                  <p className="text-sm text-destructive">
                    {preferenceForm.formState.errors.rotationReviewDays.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-4 rounded-xl bg-secondary p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p id="allow-password-reveal-label" className="font-medium">
                    Allow password reveal controls
                  </p>
                  <p
                    id="allow-password-reveal-description"
                    className="text-sm text-muted-foreground"
                  >
                    Disable reveals entirely if your team mostly works from shared screens.
                  </p>
                </div>
                <Switch
                  id="allow-password-reveal"
                  aria-labelledby="allow-password-reveal-label"
                  aria-describedby="allow-password-reveal-description"
                  checked={preferenceForm.watch("allowPasswordReveal")}
                  onCheckedChange={(checked) =>
                    preferenceForm.setValue("allowPasswordReveal", checked, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p id="mask-usernames-label" className="font-medium">
                    Mask usernames in the vault list
                  </p>
                  <p
                    id="mask-usernames-description"
                    className="text-sm text-muted-foreground"
                  >
                    Leave usernames partially hidden until someone needs to copy them.
                  </p>
                </div>
                <Switch
                  id="mask-usernames"
                  aria-labelledby="mask-usernames-label"
                  aria-describedby="mask-usernames-description"
                  checked={preferenceForm.watch("maskUsernames")}
                  onCheckedChange={(checked) =>
                    preferenceForm.setValue("maskUsernames", checked, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
              </div>
            </div>

            <Button
              type="submit"
              className="gap-2"
              disabled={preferenceForm.formState.isSubmitting}
            >
              <ShieldCheck className="size-4" />
              {preferenceForm.formState.isSubmitting ? "Saving..." : "Save preferences"}
            </Button>
          </form>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-black/6 bg-card p-6 shadow-sm">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Encrypted backup</p>
              <h2 className="text-2xl font-semibold tracking-tight">
                Export the vault as encrypted JSON
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Exports include vault metadata plus encrypted credential fields. Plaintext
                secrets are not written to disk.
              </p>
            </div>
            <Button
              className="mt-6 gap-2"
              onClick={() => {
                const backup = exportBackup();

                if (!backup) {
                  toast.error("Unlock the vault before exporting a backup.");
                  return;
                }

                const blob = new Blob([JSON.stringify(backup, null, 2)], {
                  type: "application/json",
                });
                const objectUrl = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = objectUrl;
                anchor.download = backupFilename;
                anchor.click();
                URL.revokeObjectURL(objectUrl);
                toast.success("Encrypted backup exported");
              }}
            >
              <Download className="size-4" />
              Export encrypted backup
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">
              Store the backup separately from the master password. Both are required
              to recover access safely.
            </p>
          </section>

          <section className="rounded-xl border border-black/6 bg-card p-6 shadow-sm">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Master password</p>
              <h2 className="text-2xl font-semibold tracking-tight">
                Rotate the vault master password
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Changing the master password derives fresh keys and re-encrypts every
                secret field before the updated ciphertext is saved.
              </p>
            </div>
            <form
              className="mt-6 space-y-4"
              onSubmit={masterPasswordForm.handleSubmit(async (values) => {
                masterPasswordForm.clearErrors("root");

                try {
                  await changeMasterPassword(
                    values.currentPassword,
                    values.nextPassword,
                  );
                  masterPasswordForm.reset();
                  toast.success("Master password updated");
                } catch (error) {
                  masterPasswordForm.reset({
                    currentPassword: "",
                    nextPassword: values.nextPassword,
                    confirmPassword: values.confirmPassword,
                  });
                  masterPasswordForm.setError("root", {
                    message: getErrorMessage(
                      error,
                      "The master password could not be updated.",
                    ),
                  });
                }
              })}
            >
              {masterPasswordForm.formState.errors.root?.message ? (
                <p
                  role="alert"
                  className="rounded-lg border border-[#d3b2aa] bg-[#fff3ef] px-4 py-3 text-sm text-[#7c3b2f]"
                >
                  {masterPasswordForm.formState.errors.root.message}
                </p>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="current-password">
                  Current master password
                </label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  {...masterPasswordForm.register("currentPassword")}
                />
                {masterPasswordForm.formState.errors.currentPassword ? (
                  <p className="text-sm text-destructive">
                    {masterPasswordForm.formState.errors.currentPassword.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="next-password">
                  New master password
                </label>
                <Input
                  id="next-password"
                  type="password"
                  autoComplete="new-password"
                  {...masterPasswordForm.register("nextPassword")}
                />
                {masterPasswordForm.formState.errors.nextPassword ? (
                  <p className="text-sm text-destructive">
                    {masterPasswordForm.formState.errors.nextPassword.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="confirm-password">
                  Confirm new master password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  {...masterPasswordForm.register("confirmPassword")}
                />
                {masterPasswordForm.formState.errors.confirmPassword ? (
                  <p className="text-sm text-destructive">
                    {masterPasswordForm.formState.errors.confirmPassword.message}
                  </p>
                ) : null}
              </div>
              <Button
                type="submit"
                className="gap-2"
                disabled={masterPasswordForm.formState.isSubmitting}
              >
                <KeyRound className="size-4" />
                {masterPasswordForm.formState.isSubmitting
                  ? "Rotating..."
                  : "Change master password"}
              </Button>
            </form>
          </section>
        </div>
      </section>
    </div>
  );
}
