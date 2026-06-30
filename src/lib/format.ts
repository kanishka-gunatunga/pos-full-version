/** Returns the first name from a full name string. */
export function getFirstName(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return "";
  return fullName.trim().split(/\s+/)[0] ?? "";
}

/** Formats a date string to MM/DD/YYYY. */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "N/A";
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  } catch {
    return "N/A";
  }
}
/** Formats a date string to h:mm AM/PM. */
export function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "N/A";
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
  } catch {
    return "N/A";
  }
}

export function formatOptionalField(
  value: string | null | undefined,
  fallback = "N/A"
): string {
  if (value == null) return fallback;
  const s = String(value).trim();
  return s || fallback;
}

export function formatQuantityValue(value: number | string | null | undefined): string {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value ?? "");
  return parseFloat(n.toFixed(6)).toString();
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (numericAmount === null || numericAmount === undefined || isNaN(numericAmount)) {
    return "Rs.0.00";
  }

  return `Rs.${numericAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
