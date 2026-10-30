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

      <DrawerContent>
        <DrawerHeader className="grid-cols-[1fr_auto] items-start gap-4 px-3 pb-0 pt-3">
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
        <DrawerBody className="pb-0">
          <nav className="mt-6 space-y-1 px-0" aria-label="Menu do usuário">
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

          <div className="-mx-3 mt-5 border-t border-line px-3 pt-4">
            <SignOutButton className="w-full justify-start px-4" />
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
