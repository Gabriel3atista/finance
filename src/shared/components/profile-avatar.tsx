"use client";

import Image from "next/image";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/features/auth/lib/supabase/client";
import { queryKeys } from "@/shared/lib/query-keys";

export function ProfileAvatar({
  userId,
  userName,
  fallbackAvatarUrl,
  className = "size-10",
}: {
  userId: string;
  userName: string;
  fallbackAvatarUrl: string;
  className?: string;
}) {
  const profile = useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("user_profiles")
        .select("avatar_url")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const avatarSources = [profile.data?.avatar_url, fallbackAvatarUrl].filter(
    (url, index, sources): url is string =>
      Boolean(url) && sources.indexOf(url) === index,
  );
  const [failedSources, setFailedSources] = useState<Set<string>>(
    () => new Set(),
  );
  const avatarUrl = avatarSources.find((url) => !failedSources.has(url));
  const initials = userName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("pt-BR");

  return avatarUrl ? (
    <Image
      src={avatarUrl}
      alt={`Foto de ${userName}`}
      className={`${className} shrink-0 rounded-full object-cover`}
      width={40}
      height={40}
      loading="eager"
      unoptimized
      onError={() =>
        setFailedSources((current) => new Set(current).add(avatarUrl))
      }
    />
  ) : (
    <span
      aria-label={`Avatar de ${userName}`}
      className={`grid ${className} shrink-0 place-items-center rounded-full bg-moon-200 text-sm font-semibold text-graphite-900`}
    >
      {initials || "U"}
    </span>
  );
}
