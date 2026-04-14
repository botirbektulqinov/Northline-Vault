"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldEllipsis } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AppLogo } from "@/components/shared/app-logo";
import { FullPageLoader } from "@/components/shared/full-page-loader";
import { PasswordStrengthMeter } from "@/components/shared/password-strength-meter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LOCK_SCREEN_POINTS } from "@/lib/constants/vault";
import { getErrorMessage } from "@/lib/errors";
import { useVault } from "@/hooks/use-vault";
import { sanitizeReturnPath } from "@/lib/routes";

const unlockSchema = z.object({
  masterPassword: z.string().min(1, "Enter your master password."),
});

const setupSchema = z
  .object({
    masterPassword: z
      .string()
      .min(12, "Use at least 12 characters for the master password."),
    confirmMasterPassword: z.string().min(1, "Confirm the master password."),
  })
  .refine(
    (values) => values.masterPassword === values.confirmMasterPassword,
    {
      path: ["confirmMasterPassword"],
      message: "The confirmation password does not match.",
    },
  );

export function LockScreen() {
  const router = useRouter();
  const { createVault, hasVault, isReady, isUnlocked, status, unlock } = useVault();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const nextPath = useMemo(() => {
    if (typeof window === "undefined") {
      return "/vault";
    }

    return sanitizeReturnPath(
      new URLSearchParams(window.location.search).get("next"),
    );
  }, []);

  const unlockForm = useForm<z.infer<typeof unlockSchema>>({
    resolver: zodResolver(unlockSchema),
    defaultValues: {
      masterPassword: "",
    },
  });

  const setupForm = useForm<z.infer<typeof setupSchema>>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      masterPassword: "",
      confirmMasterPassword: "",
    },
  });

  useEffect(() => {
    if (isUnlocked) {
      router.replace(nextPath);
    }
  }, [isUnlocked, nextPath, router]);

  const isSetup = isReady && !hasVault;
  const setupPassword = setupForm.watch("masterPassword");

  const requirements = useMemo(
    () => [
      {
        label: "12+ characters",
        valid: setupPassword.length >= 12,
      },
      {
        label: "Use a memorable passphrase instead of a short code",
        valid: setupPassword.trim().split(/\s+/).length >= 3 || setupPassword.length >= 16,
      },
      {
        label: "Avoid company names or repeated patterns",
        valid: !/(northline|password|welcome|12345|company)/i.test(setupPassword),
      },
    ],
    [setupPassword],
  );

  if (!isReady || status === "booting") {
    return <FullPageLoader />;
  }

  return (
    <div className="min-h-screen bg-[var(--app-sidebar)] text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative min-h-[360px] overflow-hidden">
          <Image
            src="/images/secure-workspace.jpg"
            alt="A calm workspace with secured company devices"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(20,24,21,0.84),rgba(20,24,21,0.62),rgba(20,24,21,0.3))]" />
          <div className="relative flex h-full flex-col justify-between px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-14">
            <AppLogo className="text-white" tone="inverse" />
            <div className="max-w-xl space-y-6">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.18em] text-white/65">
                  Team password manager
                </p>
                <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Shared company access without shared uncertainty.
                </h1>
                <p className="max-w-xl text-base leading-7 text-white/78 sm:text-lg">
                  Northline Vault keeps credential secrets encrypted in the browser,
                  locks itself on load, and gives teams a clean place to manage shared access.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {LOCK_SCREEN_POINTS.map((point) => (
                  <div
                    key={point}
                    className="rounded-lg border border-white/10 bg-white/7 p-4 backdrop-blur-sm"
                  >
                    <ShieldEllipsis className="mb-3 size-4 text-white/80" />
                    <p className="text-sm leading-6 text-white/80">{point}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/76 backdrop-blur-sm">
              <ShieldCheck className="size-4 text-white" />
              Vault data stays encrypted at rest and decrypts only inside the client session.
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-[var(--app-panel)] px-6 py-10 text-foreground sm:px-10">
          <motion.div
            key={isSetup ? "setup" : "unlock"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="w-full max-w-md space-y-8"
          >
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.16em] text-muted-foreground">
                {isSetup ? "First-time setup" : "Vault locked"}
              </p>
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight">
                  {isSetup ? "Create your master password" : "Unlock the vault"}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {isSetup
                    ? "Choose a strong passphrase. It never leaves the browser, and it cannot be recovered later."
                    : "Enter the master password to derive the client-side encryption keys for this vault."}
                </p>
              </div>
            </div>

            {errorMessage ? (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                aria-live="polite"
                className="rounded-lg border border-[#d3b2aa] bg-[#fff3ef] px-4 py-3 text-sm text-[#7c3b2f]"
              >
                {errorMessage}
              </motion.p>
            ) : null}

            {isSetup ? (
              <form
                className="space-y-5"
                onSubmit={setupForm.handleSubmit(async (values) => {
                  setErrorMessage(null);

                  try {
                    await createVault(values.masterPassword);
                    setupForm.reset({
                      masterPassword: "",
                      confirmMasterPassword: "",
                    });
                  } catch (error) {
                    setErrorMessage(
                      getErrorMessage(error, "Unable to create the vault."),
                    );
                  }
                })}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="master-password">
                    Master password
                  </label>
                  <Input
                    id="master-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Choose a long passphrase"
                    {...setupForm.register("masterPassword")}
                  />
                  {setupForm.formState.errors.masterPassword ? (
                    <p className="text-sm text-destructive">
                      {setupForm.formState.errors.masterPassword.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="confirm-master-password"
                  >
                    Confirm master password
                  </label>
                  <Input
                    id="confirm-master-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirm the passphrase"
                    {...setupForm.register("confirmMasterPassword")}
                  />
                  {setupForm.formState.errors.confirmMasterPassword ? (
                    <p className="text-sm text-destructive">
                      {setupForm.formState.errors.confirmMasterPassword.message}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-xl border border-black/6 bg-background p-4 shadow-sm">
                  <PasswordStrengthMeter password={setupPassword} />
                  <div className="mt-4 grid gap-2">
                    {requirements.map((requirement) => (
                      <div
                        key={requirement.label}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <span
                          className={`size-2 rounded-full ${
                            requirement.valid ? "bg-[#2f6f55]" : "bg-border"
                          }`}
                        />
                        {requirement.label}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full"
                  disabled={setupForm.formState.isSubmitting}
                >
                  {setupForm.formState.isSubmitting
                    ? "Creating vault..."
                    : "Create vault"}
                </Button>
              </form>
            ) : (
              <form
                className="space-y-5"
                onSubmit={unlockForm.handleSubmit(async (values) => {
                  setErrorMessage(null);

                  try {
                    await unlock(values.masterPassword);
                  } catch (error) {
                    setErrorMessage(
                      getErrorMessage(error, "The vault could not be unlocked."),
                    );
                  } finally {
                    unlockForm.reset({ masterPassword: "" });
                  }
                })}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="unlock-password">
                    Master password
                  </label>
                  <Input
                    id="unlock-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter master password"
                    {...unlockForm.register("masterPassword")}
                  />
                  {unlockForm.formState.errors.masterPassword ? (
                    <p className="text-sm text-destructive">
                      {unlockForm.formState.errors.masterPassword.message}
                    </p>
                  ) : null}
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full"
                  disabled={unlockForm.formState.isSubmitting}
                >
                  {unlockForm.formState.isSubmitting ? "Unlocking..." : "Unlock vault"}
                </Button>
              </form>
            )}
          </motion.div>
        </section>
      </div>
    </div>
  );
}
