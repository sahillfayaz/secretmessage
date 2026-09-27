export function randomToken() {
  const values = crypto.getRandomValues(new Uint8Array(24))
  return btoa(String.fromCharCode(...values)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}
export function getSession() { try { return JSON.parse(localStorage.getItem('secretbox_session')) } catch { return null } }
export function saveSession(session) { localStorage.setItem('secretbox_session', JSON.stringify(session)) }
export function clearSession() { localStorage.removeItem('secretbox_session') }
