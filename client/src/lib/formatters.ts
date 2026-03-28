/**
 * Indian Currency Formatter
 * Uses the Indian numbering system: ₹1,00,000.00
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Date formatter — DD/MM/YYYY
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Date + Time formatter — DD/MM/YYYY HH:MM
 */
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return `${formatDate(d)} ${d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })}`;
}

/**
 * Fiscal year string from a date
 * April 1 - March 31 → "2025-26"
 */
export function getFiscalYear(date: Date = new Date()): string {
  const month = date.getMonth(); // 0-indexed
  const year = date.getFullYear();
  if (month >= 3) {
    // Apr–Dec: current year to next year
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    // Jan–Mar: previous year to current year
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
}

/**
 * Format phone number for display
 * e.g., 7006083933 → 700-608-3933
 */
export function formatPhone(phone: string): string {
  if (phone.length === 10) {
    return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
  }
  return phone;
}

/**
 * Relative time (e.g., "2 days ago", "just now")
 */
export function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(d);
}
