"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sanitizeTags } from "@/lib/format";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({
  value,
  onChange,
  placeholder = "Add a tag and press Enter",
  maxTags = 8,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const commitTag = () => {
    const nextDraft = draft.trim();

    if (!nextDraft) {
      return false;
    }

    const nextValue = sanitizeTags([...value, nextDraft]);
    if (nextValue.length === value.length || value.length >= maxTags) {
      return false;
    }

    onChange(nextValue.slice(0, maxTags));
    setDraft("");
    return true;
  };

  return (
    <div className="space-y-3">
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={value.length >= maxTags ? "Remove a tag to add another" : placeholder}
        disabled={value.length >= maxTags}
        onBlur={() => {
          void commitTag();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            void commitTag();
          }

          if (event.key === "Backspace" && !draft && value.length > 0) {
            event.preventDefault();
            onChange(value.slice(0, -1));
          }
        }}
      />
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
            >
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-4 rounded-sm"
                onClick={() => onChange(value.filter((item) => item !== tag))}
                aria-label={`Remove ${tag}`}
              >
                <X className="size-3" />
              </Button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Tags help teams find the right shared account faster.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {value.length >= maxTags
          ? `Maximum of ${maxTags} tags reached.`
          : `${value.length}/${maxTags} tags used.`}
      </p>
    </div>
  );
}
