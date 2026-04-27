"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShieldEllipsis,
  User,
} from "lucide-react";
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
import type { VaultSummary } from "@/lib/types";

type LockView = "home" | "lookup" | "unlock" | "setup";

const unlockSchema = z.object({
  masterPassword: z.string().min(1, "Enter your master password."),
});

const workspaceLookupSchema = z.object({
  workspaceName: z
    .string()
    .trim()
    .min(2, "Enter the workspace name.")
    .max(40, "Workspace names stay under 40 characters."),
});

const setupSchema = z
  .object({
    vaultName: z
      .string()
      .trim()
      .min(2, "Profile name must be at least 2 characters.")
      .max(40, "Profile name must be under 40 characters.")
      .regex(
        /^[a-zA-Z0-9_\-\s]+$/,
        "Only letters, numbers, spaces, hyphens and underscores.",
      ),
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
  const {
    bootError,
    createVault,
    hasVault,
    isReady,
    isUnlocked,
    lookupVault,
    recentVault,
    reloadVault,
    status,
    unlock,
  } = useVault();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [view, setView] = useState<LockView>("home");
  const [selectedVault, setSelectedVault] = useState<VaultSummary | null>(null);

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

  const workspaceLookupForm = useForm<z.infer<typeof workspaceLookupSchema>>({
    resolver: zodResolver(workspaceLookupSchema),
    defaultValues: {
      workspaceName: "",
    },
  });

  const setupForm = useForm<z.infer<typeof setupSchema>>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      vaultName: "",
      masterPassword: "",
      confirmMasterPassword: "",
    },
  });

  useEffect(() => {
    if (isUnlocked) {
      router.replace(nextPath);
    }
  }, [isUnlocked, nextPath, router]);

  useEffect(() => {
    if (isReady && !hasVault) {
      setView("setup");
    }
  }, [hasVault, isReady]);

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

  const handleSelectVault = (vaultSummary: VaultSummary) => {
    setSelectedVault(vaultSummary);
    setErrorMessage(null);
    unlockForm.reset({ masterPassword: "" });
    setView("unlock");
  };

  const handleBackToHome = () => {
    setSelectedVault(null);
    setErrorMessage(null);
    workspaceLookupForm.reset({ workspaceName: "" });
    setView("home");
  };

  const handleShowSetup = () => {
    setErrorMessage(null);
    workspaceLookupForm.reset({ workspaceName: "" });
    setupForm.reset({ vaultName: "", masterPassword: "", confirmMasterPassword: "" });
    setView("setup");
  };

  const handleShowWorkspaceLookup = () => {
    setErrorMessage(null);
    workspaceLookupForm.reset({
      workspaceName: recentVault?.name ?? "",
    });
    setView("lookup");
  };

  if (!isReady || status === "booting") {
    return <FullPageLoader />;
  }

  if (bootError) {
    const message =
      bootError === "Unexpected server error."
        ? "Secure storage is not reachable right now. Try again in a moment."
        : bootError;

    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-canvas)] px-6 text-foreground">
        <div className="w-full max-w-md rounded-lg border border-[#d8c8bd] bg-card p-6 text-center shadow-sm">
          <div className="mx-auto flex size-14 items-center justify-center rounded-lg bg-[#fff3ef] text-[#8f3f32]">
            <AlertTriangle className="size-6" />
          </div>
          <div className="mt-5 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Secure storage unavailable
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">{message}</p>
          </div>
          <Button
            type="button"
            className="mt-6 h-11 w-full gap-2"
            onClick={() => void reloadVault()}
          >
            <RefreshCw className="size-4" />
            Retry
          </Button>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            The vault remains locked. No decrypted secrets were loaded into this
            browser session.
          </p>
        </div>
      </div>
    );
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
            key={view}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="w-full max-w-md space-y-8"
          >
            {/* ===== HOME VIEW ===== */}
            {view === "home" && (
              <>
                <div className="space-y-3">
                  <p className="text-sm uppercase tracking-[0.16em] text-muted-foreground">
                    Workspace access
                  </p>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-semibold tracking-tight">
                      Welcome back
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Open your own workspace without exposing everyone else&apos;s.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() =>
                      recentVault
                        ? handleSelectVault(recentVault)
                        : handleShowWorkspaceLookup()
                    }
                    className="flex w-full items-center gap-4 rounded-xl border border-black/8 bg-background p-4 text-left shadow-sm transition-all hover:border-black/16 hover:shadow-md active:scale-[0.99]"
                  >
                    <div className="flex size-11 items-center justify-center rounded-full bg-[#2f6f55]/10">
                      <User className="size-5 text-[#2f6f55]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        My workspace
                      </p>
                      <p className="mt-1 truncate text-base font-semibold">
                        {recentVault?.name ?? "Find your workspace"}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {recentVault
                          ? "Continue to the workspace last used on this browser."
                          : "Use your workspace name and master password to continue."}
                      </p>
                    </div>
                    <ShieldEllipsis className="size-4 text-muted-foreground" />
                  </button>
                </div>

                {recentVault ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 w-full"
                    onClick={handleShowWorkspaceLookup}
                  >
                    Use another workspace
                  </Button>
                ) : null}

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full gap-2"
                  onClick={handleShowSetup}
                >
                  <Plus className="size-4" />
                  Create personal vault
                </Button>
              </>
            )}

            {/* ===== LOOKUP VIEW ===== */}
            {view === "lookup" && (
              <>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleBackToHome}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="size-3.5" />
                    Back
                  </button>
                  <div className="space-y-2">
                    <p className="text-sm uppercase tracking-[0.16em] text-muted-foreground">
                      My workspace
                    </p>
                    <h2 className="text-3xl font-semibold tracking-tight">
                      Find your workspace
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Enter the workspace name you created earlier. You will enter the
                      master password on the next step.
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

                <form
                  className="space-y-5"
                  onSubmit={workspaceLookupForm.handleSubmit(async (values) => {
                    setErrorMessage(null);

                    try {
                      const matchedVault = await lookupVault(values.workspaceName);

                      if (!matchedVault) {
                        setErrorMessage(
                          "Workspace not found. Check the name or create a new personal vault.",
                        );
                        return;
                      }

                      handleSelectVault(matchedVault);
                    } catch (error) {
                      setErrorMessage(
                        getErrorMessage(
                          error,
                          "The workspace could not be looked up.",
                        ),
                      );
                    }
                  })}
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="workspace-name">
                      Workspace name
                    </label>
                    <Input
                      id="workspace-name"
                      type="text"
                      autoComplete="organization"
                      placeholder="Enter your workspace name"
                      {...workspaceLookupForm.register("workspaceName")}
                    />
                    {workspaceLookupForm.formState.errors.workspaceName ? (
                      <p className="text-sm text-destructive">
                        {workspaceLookupForm.formState.errors.workspaceName.message}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    type="submit"
                    className="h-11 w-full"
                    disabled={workspaceLookupForm.formState.isSubmitting}
                  >
                    {workspaceLookupForm.formState.isSubmitting
                      ? "Finding workspace..."
                      : "Continue"}
                  </Button>
                </form>
              </>
            )}

            {/* ===== UNLOCK VIEW ===== */}
            {view === "unlock" && selectedVault && (
              <>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleBackToHome}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="size-3.5" />
                    Back
                  </button>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-[#2f6f55]/10">
                        <User className="size-4 text-[#2f6f55]" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold tracking-tight">
                          {selectedVault.name}
                        </h2>
                        <p className="text-xs text-muted-foreground">Vault locked</p>
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Enter the master password to derive the client-side encryption keys for this vault.
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

                <form
                  className="space-y-5"
                  onSubmit={unlockForm.handleSubmit(async (values) => {
                    setErrorMessage(null);

                    try {
                      await unlock(selectedVault.id, values.masterPassword);
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
              </>
            )}

            {/* ===== SETUP (CREATE) VIEW ===== */}
            {view === "setup" && (
              <>
                <div className="space-y-3">
                  {hasVault && (
                    <button
                      type="button"
                      onClick={handleBackToHome}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <ArrowLeft className="size-3.5" />
                      Back
                    </button>
                  )}
                  <p className="text-sm uppercase tracking-[0.16em] text-muted-foreground">
                    {hasVault ? "New workspace" : "First-time setup"}
                  </p>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-semibold tracking-tight">
                      Create your personal vault
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Each person gets a separate encrypted vault with a separate master password.
                      The password never leaves the browser and cannot be recovered later.
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

                <form
                  className="space-y-5"
                  onSubmit={setupForm.handleSubmit(async (values) => {
                    setErrorMessage(null);

                    try {
                      await createVault(values.vaultName, values.masterPassword);
                      setupForm.reset({
                        vaultName: "",
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
                    <label className="text-sm font-medium" htmlFor="vault-name">
                      Profile name
                    </label>
                    <Input
                      id="vault-name"
                      type="text"
                      autoComplete="username"
                      placeholder="e.g. Botir, Finance Ops, Dev Team"
                      {...setupForm.register("vaultName")}
                    />
                    {setupForm.formState.errors.vaultName ? (
                      <p className="text-sm text-destructive">
                        {setupForm.formState.errors.vaultName.message}
                      </p>
                    ) : null}
                  </div>

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
              </>
            )}
          </motion.div>
        </section>
      </div>
    </div>
  );
}
