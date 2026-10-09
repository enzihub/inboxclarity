// services/timezone.ts

export const getUserTimezone = (): string => {
  try {
    // Try to get timezone using Intl API (most reliable)
    const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezoneName || 'UTC';
  } catch (error) {
    // Fallback to UTC if detection fails
    console.error('Error detecting timezone:', error);
    return 'UTC';
  }
};
