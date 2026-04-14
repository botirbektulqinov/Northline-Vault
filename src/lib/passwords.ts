import { PASSWORD_GENERATOR_DEFAULTS } from "@/lib/constants/vault";
import type {
  PasswordEvaluation,
  PasswordGeneratorOptions,
  PasswordStrength,
} from "@/lib/types";

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?";

function randomInt(max: number): number {
  if (max <= 0) {
    throw new Error("max must be greater than zero");
  }

  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const bytes = new Uint32Array(1);

  do {
    crypto.getRandomValues(bytes);
  } while (bytes[0] >= limit);

  return bytes[0] % max;
}

function pickRandomCharacter(characterSet: string): string {
  return characterSet[randomInt(characterSet.length)];
}

function shuffleCharacters(characters: string[]): string[] {
  const output = [...characters];

  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }

  return output;
}

export function generatePassword(
  options: Partial<PasswordGeneratorOptions> = {},
): string {
  const normalized: PasswordGeneratorOptions = {
    ...PASSWORD_GENERATOR_DEFAULTS,
    ...options,
  };

  const pools = [LOWERCASE];
  const requiredCharacters = [pickRandomCharacter(LOWERCASE)];

  if (normalized.includeUppercase) {
    pools.push(UPPERCASE);
    requiredCharacters.push(pickRandomCharacter(UPPERCASE));
  }

  if (normalized.includeNumbers) {
    pools.push(NUMBERS);
    requiredCharacters.push(pickRandomCharacter(NUMBERS));
  }

  if (normalized.includeSymbols) {
    pools.push(SYMBOLS);
    requiredCharacters.push(pickRandomCharacter(SYMBOLS));
  }

  const mergedPool = pools.join("");
  const finalLength = Math.max(normalized.length, requiredCharacters.length, 8);
  const characters = [...requiredCharacters];

  while (characters.length < finalLength) {
    characters.push(pickRandomCharacter(mergedPool));
  }

  return shuffleCharacters(characters).join("");
}

function getPasswordVariety(password: string): number {
  let variety = 0;

  if (/[a-z]/.test(password)) {
    variety += 1;
  }
  if (/[A-Z]/.test(password)) {
    variety += 1;
  }
  if (/\d/.test(password)) {
    variety += 1;
  }
  if (/[^a-zA-Z0-9]/.test(password)) {
    variety += 1;
  }

  return variety;
}

export function evaluatePasswordStrength(password: string): PasswordEvaluation {
  const value = password ?? "";

  if (!value) {
    return {
      value: "WEAK",
      label: "Weak",
      score: 0,
      feedback: "Add more length before sharing this credential with a team.",
    };
  }

  const length = value.length;
  const variety = getPasswordVariety(value);
  const uniqueRatio = new Set(value).size / length;
  let score = 0;

  if (length >= 12) {
    score += 2;
  } else if (length >= 8) {
    score += 1;
  }

  if (length >= 18) {
    score += 1;
  }

  score += variety;

  if (uniqueRatio >= 0.7) {
    score += 1;
  }

  if (/(password|company|team|shared|welcome|admin|qwerty|12345)/i.test(value)) {
    score -= 2;
  }

  if (/(.)\1{2,}/.test(value)) {
    score -= 1;
  }

  let strength: PasswordStrength = "WEAK";
  let feedback = "Increase the length and mix of character types.";

  if (length >= 12 && variety >= 3 && score >= 6) {
    strength = "STRONG";
    feedback = "Strong length and diversity for a shared company account.";
  } else if (length >= 10 && variety >= 2 && score >= 4) {
    strength = "FAIR";
    feedback = "Usable, but adding length or symbols would improve resilience.";
  }

  return {
    value: strength,
    label: strength === "WEAK" ? "Weak" : strength === "FAIR" ? "Fair" : "Strong",
    score: Math.max(0, Math.min(10, score)),
    feedback,
  };
}
