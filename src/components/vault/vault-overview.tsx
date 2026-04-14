"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Plus, Search, ShieldAlert, ShieldCheck, TimerReset } from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { CredentialCard } from "@/components/vault/credential-card";
import { SecurityHealthCenter } from "@/components/vault/security-health-center";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVault } from "@/hooks/use-vault";

type ClassificationType = "department" | "project" | "category" | "tag";

interface ClassificationOption {
  type: ClassificationType;
  label: string;
  normalizedValue: string;
  selectValue: string;
}

const CLASSIFICATION_LABELS: Record<ClassificationType, string> = {
  department: "Departments",
  project: "Projects",
  category: "Categories",
  tag: "Tags",
};

export function VaultOverview() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const { credentials, deleteCredential, health, settings, vault } = useVault();
  const [search, setSearch] = useState("");
  const [classificationFilter, setClassificationFilter] = useState("all");
  const [strengthFilter, setStrengthFilter] = useState("all");
  const [updatedFilter, setUpdatedFilter] = useState("all");
  const [reusedOnly, setReusedOnly] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.getAttribute("contenteditable") === "true";

      if (!isTyping && event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const classificationOptions = useMemo(() => {
    const optionMap = new Map<string, ClassificationOption>();

    for (const credential of credentials) {
      if (credential.department) {
        const normalizedValue = credential.department.toLowerCase();
        optionMap.set(`department:${normalizedValue}`, {
          type: "department",
          label: credential.department,
          normalizedValue,
          selectValue: `department:${normalizedValue}`,
        });
      }
      if (credential.project) {
        const normalizedValue = credential.project.toLowerCase();
        optionMap.set(`project:${normalizedValue}`, {
          type: "project",
          label: credential.project,
          normalizedValue,
          selectValue: `project:${normalizedValue}`,
        });
      }
      if (credential.category) {
        const normalizedValue = credential.category.toLowerCase();
        optionMap.set(`category:${normalizedValue}`, {
          type: "category",
          label: credential.category,
          normalizedValue,
          selectValue: `category:${normalizedValue}`,
        });
      }

      credential.tags.forEach((tag) => {
        const normalizedValue = tag.toLowerCase();
        optionMap.set(`tag:${normalizedValue}`, {
          type: "tag",
          label: tag,
          normalizedValue,
          selectValue: `tag:${normalizedValue}`,
        });
      });
    }

    return Array.from(optionMap.values()).sort((left, right) => {
      if (left.type !== right.type) {
        return left.type.localeCompare(right.type);
      }

      return left.label.localeCompare(right.label);
    });
  }, [credentials]);

  const classificationGroups = useMemo(() => {
    return classificationOptions.reduce<
      Record<ClassificationType, ClassificationOption[]>
    >(
      (accumulator, option) => {
        accumulator[option.type].push(option);
        return accumulator;
      },
      {
        department: [],
        project: [],
        category: [],
        tag: [],
      },
    );
  }, [classificationOptions]);

  const filteredCredentials = useMemo(() => {
    const query = search.trim().toLowerCase();

    return credentials.filter((credential) => {
      if (query) {
        const searchable = [
          credential.serviceName,
          credential.url,
          credential.department ?? "",
          credential.project ?? "",
          credential.category ?? "",
          credential.username,
          credential.tags.join(" "),
        ]
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(query)) {
          return false;
        }
      }

      if (classificationFilter !== "all") {
        const [filterType, ...filterValueParts] = classificationFilter.split(":");
        const filterValue = filterValueParts.join(":");

        if (!filterValue) {
          return false;
        }

        if (filterType === "department") {
          if (credential.department?.toLowerCase() !== filterValue) {
            return false;
          }
        } else if (filterType === "project") {
          if (credential.project?.toLowerCase() !== filterValue) {
            return false;
          }
        } else if (filterType === "category") {
          if (credential.category?.toLowerCase() !== filterValue) {
            return false;
          }
        } else if (filterType === "tag") {
          const hasMatchingTag = credential.tags.some(
            (tag) => tag.toLowerCase() === filterValue,
          );

          if (!hasMatchingTag) {
            return false;
          }
        } else {
          return false;
        }
      }

      if (strengthFilter !== "all" && credential.passwordStrength !== strengthFilter) {
        return false;
      }

      if (reusedOnly && credential.reusedCount < 2) {
        return false;
      }

      if (updatedFilter !== "all" && credential.ageInDays > Number(updatedFilter)) {
        return false;
      }

      return true;
    });
  }, [
    classificationFilter,
    credentials,
    reusedOnly,
    search,
    strengthFilter,
    updatedFilter,
  ]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    classificationFilter !== "all" ||
    strengthFilter !== "all" ||
    updatedFilter !== "all" ||
    reusedOnly;

  if (credentials.length === 0) {
    return (
      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="rounded-2xl border border-black/6 bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Empty vault</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Add your first shared credential
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
            Start with the team accounts people reach for first: support systems,
            cloud consoles, billing tools, and vendor portals.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="gap-2" onClick={() => router.push("/vault/new")}>
              <Plus className="size-4" />
              Add first credential
            </Button>
            <Button variant="outline" onClick={() => router.push("/settings")}>
              Review security settings
            </Button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Tag every record",
                description: "Department and project context make shared accounts easier to audit.",
              },
              {
                title: "Use the generator",
                description: "Long, unique passwords reduce blast radius across vendors and consoles.",
              },
              {
                title: "Keep rotation current",
                description: "Settings can flag older credentials before they become stale team knowledge.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-secondary p-4">
                <p className="font-medium">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-black/6 shadow-sm">
          <Image
            src="/images/empty-vault.jpg"
            alt="A tidy desk waiting for a secure credentials workflow"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(25,31,27,0.12),rgba(25,31,27,0.62))]" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
            <p className="text-sm uppercase tracking-[0.16em] text-white/70">
              First-time experience
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">
              Build the vault around how your team actually works
            </h3>
            <p className="mt-2 max-w-lg text-sm leading-7 text-white/78">
              Group credentials by department, vendor, or project so teammates can
              find the right account without exposing more than they need.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total credentials",
            value: vault?.credentialCount ?? credentials.length,
            hint: "Encrypted records stored in the vault",
            icon: ShieldCheck,
          },
          {
            label: "Health score",
            value: health.score,
            hint: "Blend of strength, reuse, and rotation signals",
            icon: ShieldCheck,
          },
          {
            label: "Reused passwords",
            value: health.reusedEntries,
            hint: "Entries sharing the same password fingerprint",
            icon: ShieldAlert,
          },
          {
            label: "Rotation due",
            value: health.staleEntries,
            hint: `Older than ${settings.rotationReviewDays} days`,
            icon: TimerReset,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              layout
              className="rounded-xl border border-black/6 bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.hint}</p>
                </div>
                <div className="flex size-11 items-center justify-center rounded-lg bg-secondary">
                  <Icon className="size-5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>

      <SecurityHealthCenter health={health} />

      <section className="rounded-xl border border-black/6 bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Credential list</p>
            <h2 className="text-2xl font-semibold tracking-tight">
              Search, copy, and review shared access
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => router.push("/settings")}>
              Preferences
            </Button>
            <Button className="gap-2" onClick={() => router.push("/vault/new")}>
              <Plus className="size-4" />
              Add credential
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.8fr))_auto]">
          <label htmlFor="vault-search" className="sr-only">
            Search credentials
          </label>
          <InputGroup className="h-12">
            <InputGroupAddon
              align="inline-start"
              className="cursor-default py-0 pl-3 pr-0 [&_svg]:block"
            >
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="vault-search"
              ref={searchInputRef}
              value={search}
              data-vault-search
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by service, URL, tag, project, or username"
              className="h-full py-0 pr-3 pl-2"
            />
          </InputGroup>
          <Select
            value={classificationFilter}
            onValueChange={(value) => setClassificationFilter(value ?? "all")}
          >
            <SelectTrigger
              aria-label="Filter by department, project, category, or tag"
              className="h-12 w-full"
            >
              <SelectValue placeholder="Department, project, category, or tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All labels</SelectItem>
              {(Object.keys(classificationGroups) as ClassificationType[]).map((type) =>
                classificationGroups[type].length > 0 ? (
                  <SelectGroup key={type}>
                    <SelectLabel>{CLASSIFICATION_LABELS[type]}</SelectLabel>
                    {classificationGroups[type].map((option) => (
                      <SelectItem
                        key={option.selectValue}
                        value={option.selectValue}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null,
              )}
            </SelectContent>
          </Select>
          <Select
            value={strengthFilter}
            onValueChange={(value) => setStrengthFilter(value ?? "all")}
          >
            <SelectTrigger
              aria-label="Filter by password strength"
              className="h-12 w-full"
            >
              <SelectValue placeholder="Strength" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All strengths</SelectItem>
              <SelectItem value="WEAK">Weak</SelectItem>
              <SelectItem value="FAIR">Fair</SelectItem>
              <SelectItem value="STRONG">Strong</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={updatedFilter}
            onValueChange={(value) => setUpdatedFilter(value ?? "all")}
          >
            <SelectTrigger
              aria-label="Filter by recently updated"
              className="h-12 w-full"
            >
              <SelectValue placeholder="Recently updated" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any update time</SelectItem>
              <SelectItem value="7">Updated in 7 days</SelectItem>
              <SelectItem value="30">Updated in 30 days</SelectItem>
              <SelectItem value="90">Updated in 90 days</SelectItem>
            </SelectContent>
          </Select>
          <label
            htmlFor="reused-only-filter"
            className="flex h-12 items-center gap-3 rounded-lg border px-3 text-sm"
          >
            <Checkbox
              id="reused-only-filter"
              checked={reusedOnly}
              onCheckedChange={(checked) => setReusedOnly(Boolean(checked))}
            />
            Reused only
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            Showing {filteredCredentials.length} of {credentials.length} credentials
          </p>
          {hasActiveFilters ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-0 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSearch("");
                setClassificationFilter("all");
                setStrengthFilter("all");
                setUpdatedFilter("all");
                setReusedOnly(false);
                toast.success("Filters cleared");
              }}
            >
              Clear active filters
            </Button>
          ) : null}
        </div>

        <div className="mt-6 space-y-4">
          {filteredCredentials.length > 0 ? (
            filteredCredentials.map((credential) => (
              <CredentialCard
                key={credential.id}
                credential={credential}
                settings={settings}
                onDelete={deleteCredential}
              />
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-black/10 bg-secondary/60 px-6 py-10 text-center">
              <p className="text-lg font-medium">No credentials match the current filters.</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Clear one of the filters or add a new credential with broader tags.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearch("");
                  setClassificationFilter("all");
                  setStrengthFilter("all");
                  setUpdatedFilter("all");
                  setReusedOnly(false);
                  toast.success("Filters cleared");
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
