/**
 * Password Strength Validator
 * Provides comprehensive password security checking
 */

export interface PasswordStrength {
  score: number; // 0-4 (0: very weak, 4: very strong)
  feedback: string[];
  isStrong: boolean;
  color: string;
  label: string;
}

/**
 * Common weak passwords to check against
 */
const COMMON_PASSWORDS = [
  'password',
  'password123',
  '123456',
  '12345678',
  'qwerty',
  'abc123',
  'monkey',
  '1234567',
  'letmein',
  'trustno1',
  'dragon',
  'baseball',
  'iloveyou',
  'master',
  'sunshine',
  'ashley',
  'bailey',
  'passw0rd',
  'shadow',
  '123123',
  '654321',
  'superman',
  'qazwsx',
  'michael',
  'football',
  'welcome',
  'admin',
  'administrator',
  'root',
  'toor',
];

/**
 * Get color for password strength score
 */
export function getPasswordStrengthColor(score: number): string {
  const colors = {
    0: '#ff4d4f', // red
    1: '#ff7a45', // orange-red
    2: '#ffa940', // orange
    3: '#52c41a', // green
    4: '#389e0d', // dark green
  };
  return colors[score as keyof typeof colors] || colors[0];
}

/**
 * Get text label for password strength score
 */
export function getPasswordStrengthText(score: number): string {
  const texts = {
    0: 'Very Weak',
    1: 'Weak',
    2: 'Fair',
    3: 'Strong',
    4: 'Very Strong',
  };
  return texts[score as keyof typeof texts] || texts[0];
}

/**
 * Validate password strength and provide feedback
 */
export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return {
      score: 0,
      feedback: ['Password is required'],
      isStrong: false,
      color: getPasswordStrengthColor(0),
      label: getPasswordStrengthText(0),
    };
  }

  // Length checks
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('Password should be at least 8 characters');
  }

  if (password.length >= 12) {
    score++;
  }

  if (password.length >= 16) {
    score++;
  }

  // Character variety checks
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  if (hasLowerCase && hasUpperCase) {
    score++;
  } else {
    feedback.push('Use both uppercase and lowercase letters');
  }

  if (hasNumbers) {
    score++;
  } else {
    feedback.push('Include at least one number');
  }

  if (hasSpecialChars) {
    score++;
  } else {
    feedback.push('Include at least one special character (!@#$%^&*)');
  }

  // Pattern detection (reduce score for weak patterns)

  // All same character
  if (/^(.)\1+$/.test(password)) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid repeating the same character');
  }

  // Sequential numbers
  if (/(?:012|123|234|345|456|567|678|789|890)/.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid sequential number patterns');
  }

  // Sequential letters
  if (
    /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(
      password,
    )
  ) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid sequential letter patterns');
  }

  // Common password check
  const lowerPassword = password.toLowerCase();
  const isCommon = COMMON_PASSWORDS.some((p) => lowerPassword.includes(p));
  if (isCommon) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid common passwords');
  }

  // Keyboard patterns
  if (/(?:qwerty|asdfgh|zxcvbn)/i.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid keyboard patterns');
  }

  // Cap score at 4
  score = Math.min(4, score);

  // Determine if strong (score >= 3)
  const isStrong = score >= 3;

  if (isStrong && feedback.length === 0) {
    feedback.push('Password is strong!');
  }

  return {
    score,
    feedback,
    isStrong,
    color: getPasswordStrengthColor(score),
    label: getPasswordStrengthText(score),
  };
}

/**
 * Calculate password entropy (bits)
 * Higher entropy = harder to crack
 */
export function calculatePasswordEntropy(password: string): number {
  if (!password) return 0;

  let poolSize = 0;

  if (/[a-z]/.test(password)) poolSize += 26; // lowercase
  if (/[A-Z]/.test(password)) poolSize += 26; // uppercase
  if (/\d/.test(password)) poolSize += 10; // digits
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) poolSize += 32; // special chars

  const entropy = password.length * Math.log2(poolSize);
  return Math.round(entropy);
}

/**
 * Estimate time to crack password
 */
export function estimateCrackTime(password: string): string {
  const entropy = calculatePasswordEntropy(password);

  // Assuming 1 billion attempts per second
  const attemptsPerSecond = 1_000_000_000;
  const possibleCombinations = Math.pow(2, entropy);
  const secondsToCrack = possibleCombinations / (2 * attemptsPerSecond); // Divide by 2 for average

  if (secondsToCrack < 1) return 'Instant';
  if (secondsToCrack < 60) return 'Less than a minute';
  if (secondsToCrack < 3600)
    return `${Math.round(secondsToCrack / 60)} minutes`;
  if (secondsToCrack < 86400)
    return `${Math.round(secondsToCrack / 3600)} hours`;
  if (secondsToCrack < 31536000)
    return `${Math.round(secondsToCrack / 86400)} days`;
  if (secondsToCrack < 3153600000)
    return `${Math.round(secondsToCrack / 31536000)} years`;

  return 'Centuries';
}
