import { fail, ok, type Result } from '../result.ts'

// research.md item 4, confirmado em 2026-11-17.
export const PASSWORD_MIN_LENGTH = 6

export const PASSWORD_POLICY_TEXT =
  'A senha precisa de 6 ou mais caracteres, com maiúscula, minúscula, dígito e símbolo.'

export function checkPasswordPolicy(password: string): Result<true> {
  const valid =
    password.length >= PASSWORD_MIN_LENGTH &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  return valid ? ok(true) : fail('WEAK_PASSWORD', PASSWORD_POLICY_TEXT)
}
