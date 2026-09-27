export const recoveryChecks = (value = '') => ({
  length: value.length >= 10,
  upper: /[A-Z]/.test(value),
  lower: /[a-z]/.test(value),
  number: /\d/.test(value),
  symbol: /[^A-Za-z0-9]/.test(value),
})
export const isValidRecoveryKey = value => Object.values(recoveryChecks(value)).every(Boolean)
export const normaliseMessage = value => value.trim().replace(/\s{3,}/g, '  ')
