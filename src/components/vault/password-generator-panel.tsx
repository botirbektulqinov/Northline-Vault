"use client";

import { Copy, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { PasswordStrengthMeter } from "@/components/shared/password-strength-meter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useClipboardCopy } from "@/hooks/use-clipboard-copy";
import { PASSWORD_GENERATOR_DEFAULTS } from "@/lib/constants/vault";
import { generatePassword } from "@/lib/passwords";

interface PasswordGeneratorPanelProps {
  clipboardClearSeconds: number;
  onUsePassword: (password: string) => void;
}

export function PasswordGeneratorPanel({
  clipboardClearSeconds,
  onUsePassword,
}: PasswordGeneratorPanelProps) {
  const [length, setLength] = useState(PASSWORD_GENERATOR_DEFAULTS.length);
  const [includeUppercase, setIncludeUppercase] = useState(
    PASSWORD_GENERATOR_DEFAULTS.includeUppercase,
  );
  const [includeNumbers, setIncludeNumbers] = useState(
    PASSWORD_GENERATOR_DEFAULTS.includeNumbers,
  );
  const [includeSymbols, setIncludeSymbols] = useState(
    PASSWORD_GENERATOR_DEFAULTS.includeSymbols,
  );
  const [generatedPassword, setGeneratedPassword] = useState("");
  const copyToClipboard = useClipboardCopy(clipboardClearSeconds);

  useEffect(() => {
    setGeneratedPassword(
      generatePassword({
        length,
        includeUppercase,
        includeNumbers,
        includeSymbols,
      }),
    );
  }, [includeNumbers, includeSymbols, includeUppercase, length]);

  return (
    <section className="rounded-xl border border-black/6 bg-card p-5 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Generator</p>
        <h3 className="text-xl font-semibold tracking-tight">
          Build a stronger shared password
        </h3>
        <p className="text-sm leading-6 text-muted-foreground">
          Generated passwords stay local to this browser session until you apply them.
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="generated-password">Preview</Label>
          <Input
            id="generated-password"
            value={generatedPassword}
            readOnly
            spellCheck={false}
            className="font-mono text-sm"
          />
          <PasswordStrengthMeter password={generatedPassword} compact />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Length</span>
            <span className="text-muted-foreground">{length} characters</span>
          </div>
          <Slider
            value={[length]}
            min={12}
            max={40}
            step={1}
            onValueChange={(value) => {
              const nextValue = Array.isArray(value) ? value[0] : value;
              setLength(nextValue ?? PASSWORD_GENERATOR_DEFAULTS.length);
            }}
          />
        </div>

        <div className="space-y-3 rounded-lg bg-secondary p-4">
          {[
            {
              id: "generator-uppercase",
              label: "Uppercase letters",
              checked: includeUppercase,
              descriptionId: "generator-uppercase-description",
              onCheckedChange: setIncludeUppercase,
            },
            {
              id: "generator-numbers",
              label: "Numbers",
              checked: includeNumbers,
              descriptionId: "generator-numbers-description",
              onCheckedChange: setIncludeNumbers,
            },
            {
              id: "generator-symbols",
              label: "Symbols",
              checked: includeSymbols,
              descriptionId: "generator-symbols-description",
              onCheckedChange: setIncludeSymbols,
            },
          ].map((option) => (
            <div key={option.label} className="flex items-center justify-between gap-3">
              <div>
                <label
                  htmlFor={option.id}
                  id={`${option.id}-label`}
                  className="text-sm font-medium"
                >
                  {option.label}
                </label>
                <p
                  id={option.descriptionId}
                  className="text-xs text-muted-foreground"
                >
                  Lowercase letters stay enabled.
                </p>
              </div>
              <Switch
                id={option.id}
                aria-labelledby={`${option.id}-label`}
                aria-describedby={option.descriptionId}
                checked={option.checked}
                onCheckedChange={option.onCheckedChange}
                aria-label={option.label}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="min-w-[140px] flex-1 justify-center gap-2 whitespace-normal text-center"
            onClick={() =>
              setGeneratedPassword(
                generatePassword({
                  length,
                  includeUppercase,
                  includeNumbers,
                  includeSymbols,
                }),
              )
            }
          >
            <RefreshCw className="size-4" />
            Regenerate
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-w-[140px] flex-1 justify-center gap-2 whitespace-normal text-center"
            onClick={() => copyToClipboard(generatedPassword, "Generated password")}
          >
            <Copy className="size-4" />
            Copy
          </Button>
          <Button
            type="button"
            className="min-w-[140px] flex-1 justify-center gap-2 whitespace-normal text-center"
            onClick={() => onUsePassword(generatedPassword)}
          >
            <Sparkles className="size-4" />
            Use password
          </Button>
        </div>
      </div>
    </section>
  );
}
