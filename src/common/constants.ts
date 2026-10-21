export const USER_ROLES = ['explorer', 'owner', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const RESTAURANT_STATUSES = [
  'draft',
  'pending_review',
  'active',
  'suspended',
] as const;
export type RestaurantStatus = (typeof RESTAURANT_STATUSES)[number];

export const ANALYTICS_EVENT_TYPES = [
  'view_menu',
  'click_navigation',
  'save',
  'view_pin',
] as const;
export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];
