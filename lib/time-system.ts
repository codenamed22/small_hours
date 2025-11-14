/**
 * Time of Day System
 *
 * Calculates time progression based on customers served
 * Provides lighting and atmosphere data for visual components
 */

export type TimeOfDay = "morning" | "afternoon" | "evening";

export interface TimeData {
  period: TimeOfDay;
  hour: number; // 0-23
  minute: number; // 0-59
  progress: number; // 0-1 (percentage through the day)
}

export interface LightingData {
  skyColor: string;
  ambientColor: string;
  shadowColor: string;
  overlayColor: string;
  overlayOpacity: number;
}

// ============================================================================
// TIME CALCULATION
// ============================================================================

const CAFE_OPEN_HOUR = 7; // 7 AM
const CAFE_CLOSE_HOUR = 19; // 7 PM
const TOTAL_SERVICE_HOURS = CAFE_CLOSE_HOUR - CAFE_OPEN_HOUR; // 12 hours

/**
 * Calculate current time based on customers served
 */
export function calculateTimeOfDay(
  customersServed: number,
  targetCustomers: number
): TimeData {
  // Progress through the day (0 to 1)
  const progress = Math.min(customersServed / targetCustomers, 1);

  // Calculate hour and minute
  const totalMinutes = progress * (TOTAL_SERVICE_HOURS * 60);
  const hour = CAFE_OPEN_HOUR + Math.floor(totalMinutes / 60);
  const minute = Math.floor(totalMinutes % 60);

  // Determine period
  let period: TimeOfDay;
  if (hour < 11) {
    period = "morning";
  } else if (hour < 16) {
    period = "afternoon";
  } else {
    period = "evening";
  }

  return { period, hour, minute, progress };
}

/**
 * Format time for display
 */
export function formatTime(timeData: TimeData): string {
  const hour12 = timeData.hour > 12 ? timeData.hour - 12 : timeData.hour;
  const period = timeData.hour >= 12 ? "PM" : "AM";
  const minuteStr = timeData.minute.toString().padStart(2, "0");
  return `${hour12}:${minuteStr} ${period}`;
}

// ============================================================================
// LIGHTING CALCULATIONS
// ============================================================================

/**
 * Get lighting data for current time
 */
export function getLightingForTime(timeData: TimeData): LightingData {
  const { hour, minute } = timeData;
  const timeValue = hour + minute / 60;

  // Morning (7-11am): Sunrise → Bright
  if (timeValue < 11) {
    const progress = (timeValue - 7) / 4; // 0 to 1
    return {
      skyColor: lerpColor("#FFE5B4", "#87CEEB", progress), // Peach → Sky Blue
      ambientColor: lerpColor("#FFF8DC", "#F5F5DC", progress), // Warm → Neutral
      shadowColor: lerpColor("#E8D5B5", "#D3D3D3", progress), // Soft → Medium
      overlayColor: lerpColor("#FFD700", "#FFFFFF", progress), // Gold → White
      overlayOpacity: lerp(0.15, 0.05, progress),
    };
  }

  // Afternoon (11am-4pm): Bright → Golden
  else if (timeValue < 16) {
    const progress = (timeValue - 11) / 5; // 0 to 1
    return {
      skyColor: lerpColor("#87CEEB", "#FFD89B", progress), // Sky Blue → Pale Orange
      ambientColor: lerpColor("#F5F5DC", "#FFE4B5", progress), // Neutral → Warm
      shadowColor: lerpColor("#D3D3D3", "#C4A57B", progress), // Medium → Warm
      overlayColor: lerpColor("#FFFFFF", "#FFB347", progress), // White → Orange
      overlayOpacity: lerp(0.05, 0.12, progress),
    };
  }

  // Evening (4pm-7pm): Golden hour → Dusk
  else {
    const progress = (timeValue - 16) / 3; // 0 to 1
    return {
      skyColor: lerpColor("#FFD89B", "#FF6B6B", progress), // Pale Orange → Sunset Red
      ambientColor: lerpColor("#FFE4B5", "#FFD4A3", progress), // Warm → Deep Warm
      shadowColor: lerpColor("#C4A57B", "#9B7653", progress), // Warm → Deep
      overlayColor: lerpColor("#FFB347", "#FF8C42", progress), // Orange → Deep Orange
      overlayOpacity: lerp(0.12, 0.2, progress),
    };
  }
}

/**
 * Linear interpolation between two values
 */
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Linear interpolation between two hex colors
 */
function lerpColor(startHex: string, endHex: string, t: number): string {
  const start = hexToRgb(startHex);
  const end = hexToRgb(endHex);

  const r = Math.round(lerp(start.r, end.r, t));
  const g = Math.round(lerp(start.g, end.g, t));
  const b = Math.round(lerp(start.b, end.b, t));

  return rgbToHex(r, g, b);
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get emoji for time of day
 */
export function getTimeEmoji(period: TimeOfDay): string {
  switch (period) {
    case "morning":
      return "🌅";
    case "afternoon":
      return "☀️";
    case "evening":
      return "🌆";
  }
}

/**
 * Get description for time of day
 */
export function getTimeDescription(period: TimeOfDay): string {
  switch (period) {
    case "morning":
      return "Morning Rush";
    case "afternoon":
      return "Afternoon Service";
    case "evening":
      return "Evening Wind-Down";
  }
}
