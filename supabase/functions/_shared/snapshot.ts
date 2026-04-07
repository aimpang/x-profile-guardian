export interface ProfileSnapshot {
  username?: string;
  display_name?: string;
  bio?: string;
  profile_image?: string;
  banner?: string;
  followers?: number;
  verified?: boolean;
}

/**
 * Normalizes a profile snapshot to ensure consistent field names and values
 * across X API, webhook, polling, and OAuth paths. Prevents null vs '' 
 * mismatches that cause spurious bio alerts on name changes.
 */
export function normalizeSnapshot(raw: any): ProfileSnapshot {
  const normalized: ProfileSnapshot = {
    username: raw.username || raw.screen_name,
    display_name: raw.display_name || raw.name,
    bio: raw.bio || raw.description || "",
    profile_image: raw.profile_image || raw.profile_image_url?.replace("_normal", "") || null,
    banner: raw.banner || raw.profile_banner_url || null,
    followers: raw.followers ?? raw.public_metrics?.followers_count ?? undefined,
    verified: raw.verified ?? false,
  };
  return normalized;
}
