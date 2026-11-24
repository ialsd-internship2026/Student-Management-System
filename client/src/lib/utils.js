/**
 * Utility functions
 */

/**
 * Merges class names cleanly, filtering falsy values
 * @param  {...(string|boolean|undefined|null)} classes
 * @returns {string}
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format date string into readable format
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Generate avatar fallback initials from full name
 */
export function getInitials(name = '') {
  if (!name.trim()) return '??';
  return name
    .trim()
    .split(/\s+/)
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
