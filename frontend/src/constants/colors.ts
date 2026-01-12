/**
 * Unified color palette for the application
 * Use these constants for consistent styling across all components
 */

export const COLORS = {
  // Primary brand colors
  primary: '#3D7A5F',        // Main green (buttons, success states)
  primaryHover: '#2F5F4A',   // Darker green for hover states

  // Notification colors
  success: '#3D7A5F',        // Success messages (green)
  error: '#C75B5B',          // Error messages (red)
  warning: '#D4A855',        // Warning messages (gold/yellow)
  info: '#5B8AC7',           // Info messages (blue)

  // Background colors
  background: '#0E0E0E',     // Main background
  surface: '#1A1A1A',        // Card/surface background
  surfaceHover: '#242424',   // Surface hover state

  // Text colors
  textPrimary: '#F5F5F5',    // Primary text
  textSecondary: 'rgba(245, 245, 245, 0.7)',  // Secondary text
  textTertiary: 'rgba(245, 245, 245, 0.5)',   // Tertiary text
  textDisabled: 'rgba(245, 245, 245, 0.3)',   // Disabled text

  // Border colors
  border: 'rgba(245, 245, 245, 0.1)',        // Default border
  borderHover: 'rgba(245, 245, 245, 0.3)',   // Border hover
  borderFocus: 'rgba(245, 245, 245, 0.4)',   // Border focus

  // State-specific backgrounds (for inline messages, toasts, etc.)
  successBg: 'rgba(61, 122, 95, 0.1)',       // Success background
  successBorder: 'rgba(61, 122, 95, 0.3)',   // Success border

  errorBg: 'rgba(199, 91, 91, 0.1)',         // Error background
  errorBorder: 'rgba(199, 91, 91, 0.3)',     // Error border

  warningBg: 'rgba(212, 168, 85, 0.1)',      // Warning background
  warningBorder: 'rgba(212, 168, 85, 0.3)',  // Warning border

  infoBg: 'rgba(91, 138, 199, 0.1)',         // Info background
  infoBorder: 'rgba(91, 138, 199, 0.3)',     // Info border
} as const;

export type ColorKey = keyof typeof COLORS;
