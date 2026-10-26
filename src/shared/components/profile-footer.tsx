"use client";

import { ProfileAvatar } from "@/shared/components/profile-avatar";

export function ProfileFooter({
  userId,
  userEmail,
  userName,
  fallbackAvatarUrl,
}: {
  userId: string;
  userEmail: string;
  userName: string;
  fallbackAvatarUrl: string;
}) {
  return (
    <div className="mt-auto border-t border-line px-4 py-5">
      <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-canvas px-3 py-3">
        <ProfileAvatar
          userId={userId}
          userName={userName}
          fallbackAvatarUrl={fallbackAvatarUrl}
        />
        <div className="min-w-0">
          <p
            className="truncate text-sm font-semibold text-ink"
            title={userName}
          >
            {userName}
          </p>
          <p className="truncate text-xs text-muted" title={userEmail}>
            {userEmail}
          </p>
        </div>
      </div>
    </div>
  );
}
