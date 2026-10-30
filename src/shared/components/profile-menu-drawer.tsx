"use client";

import { useState } from "react";
import Link from "next/link";
import { NextIcon } from "@/components/atoms/next-icon";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { ProfileAvatar } from "@/shared/components/profile-avatar";

const profileLinks = [
  { href: "/dashboard", label: "Painel" },
  { href: "/mes", label: "Meu mês" },
  { href: "/household", label: "Gerenciar família" },
] as const;

export function ProfileMenuDrawer({
  userId,
  userName,
  userEmail,
  fallbackAvatarUrl,
}: {
  userId: string;
  userName: string;
  userEmail: string;
  fallbackAvatarUrl: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="size-11 rounded-full p-0"
          aria-label={`Abrir menu de ${userName}`}
        >
          <ProfileAvatar
            userId={userId}
            userName={userName}
            fallbackAvatarUrl={fallbackAvatarUrl}
            className="size-8"
          />
        </Button>
      </DrawerTrigger>

      <DrawerContent className="border-line bg-graphite-900 text-ink">
        <DrawerHeader className="grid-cols-[1fr_auto] items-start gap-4 px-5 pb-0 pt-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <ProfileAvatar
              userId={userId}
              userName={userName}
              fallbackAvatarUrl={fallbackAvatarUrl}
              className="size-12"
            />
            <div className="min-w-0">
              <DrawerTitle className="truncate text-base font-semibold text-ink">
                {userName}
              </DrawerTitle>
              <p className="truncate text-sm text-muted">{userEmail}</p>
            </div>
          </div>
        </DrawerHeader>
        <DrawerBody className="pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <nav
            className="mt-6 space-y-1 px-5 sm:px-6"
            aria-label="Menu do usuário"
          >
            {profileLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-moon-600 mobile-app:focus:!outline-none flex min-h-12 items-center rounded-xl px-4 text-sm font-medium text-ink hover:bg-canvas"
              >
                {link.label}
                <NextIcon
                  className="ml-auto text-muted"
                  name="ChevronRightOutline"
                  size={16}
                />
              </Link>
            ))}
          </nav>

          <div className="mx-5 mt-5 border-t border-line pt-4 sm:mx-6">
            <SignOutButton className="w-full justify-start px-4" />
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
