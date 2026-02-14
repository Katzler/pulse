/**
 * Parse date from DD/MM/YYYY or DD/MM/YYYY, HH:mm format.
 * Returns null if the string is empty or cannot be parsed.
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr?.trim()) {
    return null;
  }

  try {
    // Try DD/MM/YYYY, HH:mm format
    const dateTimeMatch = dateStr.match(
      /(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{1,2}):(\d{2})/
    );
    if (dateTimeMatch) {
      const [, day, month, year, hour, minute] = dateTimeMatch;
      return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute)
      );
    }

    // Try DD/MM/YYYY format
    const dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    return null;
  } catch {
    return null;
  }
}
