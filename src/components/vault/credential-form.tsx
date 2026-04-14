"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { PasswordGeneratorPanel } from "@/components/vault/password-generator-panel";
import { PasswordStrengthMeter } from "@/components/shared/password-strength-meter";
import { TagInput } from "@/components/shared/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useVault } from "@/hooks/use-vault";
import { getErrorMessage } from "@/lib/errors";
import {
  credentialFormSchema,
  type CredentialFormInput,
  type CredentialFormSchema,
} from "@/lib/schemas";
import type { CredentialFormValues, DecryptedCredential } from "@/lib/types";

interface CredentialFormProps {
  mode: "create" | "edit";
  credential?: DecryptedCredential;
}

export function CredentialForm({ mode, credential }: CredentialFormProps) {
  const router = useRouter();
  const { saveCredential, settings } = useVault();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<CredentialFormInput, unknown, CredentialFormSchema>({
    resolver: zodResolver(credentialFormSchema),
    defaultValues: {
      serviceName: credential?.serviceName ?? "",
      url: credential?.url ?? "",
      username: credential?.username ?? "",
      password: credential?.password ?? "",
      notes: credential?.notes ?? "",
      department: credential?.department ?? "",
      project: credential?.project ?? "",
      category: credential?.category ?? "",
      tags: credential?.tags ?? [],
    },
  });

  const password = form.watch("password");

  const onSubmit = async (values: CredentialFormValues) => {
    form.clearErrors("root");

    try {
      const saved = await saveCredential(values, credential?.id);
      toast.success(
        mode === "create"
          ? `${saved.serviceName} added to the vault`
          : `${saved.serviceName} updated`,
      );
      router.push("/vault");
    } catch (error) {
      form.setError("root", {
        message: getErrorMessage(
          error,
          mode === "create"
            ? "The credential could not be saved."
            : "The credential could not be updated.",
        ),
      });
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="rounded-xl border border-black/6 bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/vault"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to vault
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {mode === "create" ? "Add a shared credential" : "Edit shared credential"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Sensitive fields are encrypted in the browser before they are persisted.
            </p>
          </div>
          <Button
            type="submit"
            form="credential-form"
            className="gap-2"
            disabled={form.formState.isSubmitting}
          >
            <Save className="size-4" />
            {form.formState.isSubmitting
              ? mode === "create"
                ? "Saving..."
                : "Updating..."
              : mode === "create"
                ? "Save credential"
                : "Update credential"}
          </Button>
        </div>

        <form
          id="credential-form"
          className="mt-8 space-y-7"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {form.formState.errors.root?.message ? (
            <p
              role="alert"
              className="rounded-lg border border-[#d3b2aa] bg-[#fff3ef] px-4 py-3 text-sm text-[#7c3b2f]"
            >
              {form.formState.errors.root.message}
            </p>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="service-name">
                Service or platform
              </label>
              <Input id="service-name" placeholder="AWS Production" {...form.register("serviceName")} />
              {form.formState.errors.serviceName ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.serviceName.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="service-url">
                URL
              </label>
              <Input
                id="service-url"
                placeholder="https://console.aws.amazon.com"
                {...form.register("url")}
              />
              {form.formState.errors.url ? (
                <p className="text-sm text-destructive">{form.formState.errors.url.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="department">
                Department
              </label>
              <Input id="department" placeholder="IT" {...form.register("department")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="project">
                Project
              </label>
              <Input id="project" placeholder="Northline web revamp" {...form.register("project")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="category">
                Category
              </label>
              <Input id="category" placeholder="Infrastructure" {...form.register("category")} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <TagInput
              value={form.watch("tags") ?? []}
              onChange={(value) =>
                form.setValue("tags", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            {form.formState.errors.tags ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.tags.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="username">
                Username or email
              </label>
              <Input
                id="username"
                placeholder="ops@company.com"
                autoComplete="off"
                {...form.register("username")}
              />
              {form.formState.errors.username ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.username.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                {settings.allowPasswordReveal ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto px-0 text-muted-foreground"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="mr-2 size-4" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 size-4" />
                        Show
                      </>
                    )}
                  </Button>
                ) : null}
              </div>
              <Input
                id="password"
                type={showPassword && settings.allowPasswordReveal ? "text" : "password"}
                autoComplete="new-password"
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
              <PasswordStrengthMeter password={password} compact />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="notes">
              Notes
            </label>
            <Textarea
              id="notes"
              rows={6}
              placeholder="Environment details, account owner, MFA notes, or access reminders"
              {...form.register("notes")}
            />
            {form.formState.errors.notes ? (
              <p className="text-sm text-destructive">{form.formState.errors.notes.message}</p>
            ) : null}
          </div>
        </form>
      </section>

      <div className="space-y-6">
        <PasswordGeneratorPanel
          clipboardClearSeconds={settings.clipboardClearSeconds}
          onUsePassword={(nextPassword) => {
            form.setValue("password", nextPassword, {
              shouldDirty: true,
              shouldValidate: true,
            });
            toast.success("Generated password applied");
          }}
        />
        <section className="rounded-xl border border-black/6 bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Save behavior</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight">
            What gets encrypted
          </h3>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <li>Username, password, and notes are encrypted with AES-GCM in the browser.</li>
            <li>Only metadata such as service name, URL, and tags stay searchable in plaintext.</li>
            <li>Password reuse checks rely on a derived deterministic fingerprint, not the plaintext secret.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
