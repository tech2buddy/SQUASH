import { useEffect, useState } from 'react';
import { getTesterProfile } from '../lib/profileApi';

export function useTesterAvatarUrl(userId?: string) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let active = true;
    getTesterProfile(userId)
      .then((profile) => {
        if (active) setAvatarUrl(profile?.avatarUrl || null);
      })
      .catch(() => {
        // The shared SQUASH fallback remains visible if profile data is unavailable.
      });

    const handleProfilePhotoUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string; avatarUrl?: string }>).detail;
      if (detail?.userId === userId && detail.avatarUrl) setAvatarUrl(detail.avatarUrl);
    };

    window.addEventListener('squash_profile_photo_updated', handleProfilePhotoUpdated);
    return () => {
      active = false;
      window.removeEventListener('squash_profile_photo_updated', handleProfilePhotoUpdated);
    };
  }, [userId]);

  return avatarUrl;
}
