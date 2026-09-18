import { apiClient } from './apiClient';

// Types for profile data (subset for CRUD operations)
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  lastLoginAt?: string | null;
}

export interface OrganizationProfile {
  id: string;
  name: string;
  timezone: string;
  shiftStartTime: string;
  industry?: string | null;
  companySize?: string | null;
}

export interface ProfileData {
  user: UserProfile;
  organization: OrganizationProfile;
  // Additional fields can be added as needed for other sections (attendance, leaves, etc.)
}

/**
 * Fetch the current user's profile.
 */
export const getMyProfile = async (): Promise<ProfileData> => {
  const { data } = await apiClient.get<ProfileData>('/users/me/profile');
  return data;
};

/**
 * Create a new profile for the current user.
 * Typically used only during onboarding; most users will already have a profile.
 */
export const createProfile = async (payload: Partial<ProfileData>): Promise<ProfileData> => {
  const { data } = await apiClient.post<ProfileData>('/users/me/profile', payload);
  return data;
};

/**
 * Update personal details of the current user's profile.
 * Only mutable fields are sent; the backend should merge changes.
 */
export const updateProfile = async (payload: { user: Partial<UserProfile> }): Promise<ProfileData> => {
  const { data } = await apiClient.patch<ProfileData>('/users/me/profile', payload);
  return data;
};

/**
 * Delete the current user's profile.
 * Use with caution – this typically represents account deletion.
 */
export const deleteProfile = async (): Promise<void> => {
  await apiClient.delete('/users/me/profile');
};

// ─────────────────────────────────────────────────────────
// Profile photo (one per user, unique on the backend)
// ─────────────────────────────────────────────────────────

/**
 * Fetch the current user's profile photo.
 * Returns null when no photo has been uploaded.
 */
export const getMyPhoto = async (): Promise<string | null> => {
  const { data } = await apiClient.get<{ photoUrl: string | null }>('/users/me/photo');
  return data.photoUrl;
};

/**
 * Upload (or replace) the current user's profile photo.
 * `image` is a base64 data URL of the selected file.
 */
export const uploadMyPhoto = async (image: string): Promise<string> => {
  const { data } = await apiClient.post<{ photoUrl: string }>('/users/me/photo', { image });
  return data.photoUrl;
};

/**
 * Remove the current user's profile photo.
 * The UI falls back to the initials avatar everywhere.
 */
export const removeMyPhoto = async (): Promise<void> => {
  await apiClient.delete('/users/me/photo');
};
