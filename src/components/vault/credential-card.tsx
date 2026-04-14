"use client";

import { motion } from "framer-motion";
import {
  Clock3,
  Copy,
  Eye,
  EyeOff,
  FolderSearch,
  PencilLine,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useClipboardCopy } from "@/hooks/use-clipboard-copy";
import {
  formatRelativeTimestamp,
  getHostnameLabel,
  maskSecret,
  maskUsername,
} from "@/lib/format";
import { getErrorMessage } from "@/lib/errors";
import type { DecryptedCredential, VaultSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CredentialCardProps {
  credential: DecryptedCredential;
  settings: VaultSettings;
  onDelete: (id: string) => Promise<void>;
}

const STRENGTH_CLASS = {
  WEAK: "bg-[#fff5f3] text-[#9b4b3d] border-[#ead0ca]",
  FAIR: "bg-[#fdf8f0] text-[#8a6a2b] border-[#eadfc8]",
  STRONG: "bg-[#f4faf6] text-[#2f6f55] border-[#d9e8df]",
} as const;

export function CredentialCard({
  credential,
  settings,
  onDelete,
}: CredentialCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const copyToClipboard = useClipboardCopy(settings.clipboardClearSeconds);

  useEffect(() => {
    if (!revealed || !settings.allowPasswordReveal) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setRevealed(false);
    }, settings.revealDurationSeconds * 1000);

    return () => window.clearTimeout(timeout);
  }, [revealed, settings.allowPasswordReveal, settings.revealDurationSeconds]);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-black/6 bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold tracking-tight">
                  {credential.serviceName}
                </h3>
                <Badge
                  variant="outline"
                  className={STRENGTH_CLASS[credential.passwordStrength]}
                >
                  {credential.passwordStrength.toLowerCase()}
                </Badge>
                {credential.reusedCount > 1 ? (
                  <Badge variant="outline" className="border-[#ead0ca] text-[#9b4b3d]">
                    <ShieldAlert className="mr-1 size-3.5" />
                    Reused in {credential.reusedCount} entries
                  </Badge>
                ) : null}
                {credential.requiresReview ? (
                  <Badge variant="outline" className="border-[#eadfc8] text-[#8a6a2b]">
                    <Clock3 className="mr-1 size-3.5" />
                    Review due
                  </Badge>
                ) : null}
                {credential.isUngrouped ? (
                  <Badge variant="outline" className="border-black/10 text-muted-foreground">
                    <FolderSearch className="mr-1 size-3.5" />
                    Missing classification
                  </Badge>
                ) : null}
              </div>
              <a
                href={credential.url}
                target="_blank"
                rel="noreferrer"
                className="break-all text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                {getHostnameLabel(credential.url)}
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              Updated {formatRelativeTimestamp(credential.updatedAt)}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Username
              </p>
              <p className="break-all font-medium">
                {settings.maskUsernames ? maskUsername(credential.username) : credential.username}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Password
              </p>
              <p className="break-all font-mono text-sm">
                {revealed && settings.allowPasswordReveal
                  ? credential.password
                  : maskSecret(credential.password, 0)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 xl:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 whitespace-normal"
                onClick={() => copyToClipboard(credential.username, "Username")}
              >
                <Copy className="size-4" />
                Copy username
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 whitespace-normal"
                onClick={() => copyToClipboard(credential.password, "Password")}
              >
                <Copy className="size-4" />
                Copy password
              </Button>
              {settings.allowPasswordReveal ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={revealed ? "Hide password" : "Reveal password"}
                  onClick={() => setRevealed((value) => !value)}
                >
                  {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {credential.department ? <Badge variant="secondary">{credential.department}</Badge> : null}
            {credential.project ? <Badge variant="secondary">{credential.project}</Badge> : null}
            {credential.category ? <Badge variant="secondary">{credential.category}</Badge> : null}
            {credential.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
            {credential.notes ? (
              <Badge variant="outline" className="text-muted-foreground">
                Notes included
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex gap-2 lg:flex-col">
          <Link
            href={`/vault/${credential.id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
          >
            <PencilLine className="size-4" />
            Edit
          </Link>
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="outline" size="sm" className="gap-2" />}
            >
              <Trash2 className="size-4" />
              Delete
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {credential.serviceName}?</AlertDialogTitle>
                <AlertDialogDescription>
                  The encrypted record will be removed from the vault. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);

                    try {
                      await onDelete(credential.id);
                      toast.success(`${credential.serviceName} removed`);
                    } catch (error) {
                      toast.error(
                        getErrorMessage(
                          error,
                          `${credential.serviceName} could not be removed.`,
                        ),
                      );
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                >
                  {isDeleting ? "Deleting..." : "Delete credential"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </motion.article>
  );
}
