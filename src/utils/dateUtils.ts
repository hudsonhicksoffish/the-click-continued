/**
 * Formats a date into a consistent string key for storage
 * Format: YYYY-MM-DD
 */
export const formatDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Returns time until next day in hours:minutes:seconds format
 */
export const getTimeUntilTomorrow = (): string => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const diffMs = tomorrow.getTime() - now.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  return `${String(diffHrs).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}:${String(diffSecs).padStart(2, '0')}`;
};

/**
 * Returns the current day number (days since Jan 1, 2025)
 */
export const getCurrentDayNumber = (): number => {
  const start = new Date(2025, 0, 1); // Jan 1, 2025
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};
