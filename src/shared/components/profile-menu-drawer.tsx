"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  useDrawer,
} from "@/components/ui/drawer";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { ProfileAvatar } from "@/shared/components/profile-avatar";

const profileLinks = [
  { href: "/dashboard", label: "Painel" },
  { href: "/mes", label: "Meu mês" },
  { href: "/space", label: "Gerenciar espaço" },
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
  const drawer = useDrawer();

  return (
    <Drawer {...drawer.props}>
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
        <DrawerHeader className="shrink-0 px-3 pb-3 pt-4 text-left">
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
        <DrawerBody className="!px-2 pb-2">
          <nav className="space-y-2" aria-label="Menu do usuário">
            {profileLinks.map((link) => (
              <Button
                asChild
                key={link.href}
                className="w-full justify-between"
                size="lg"
                trailingIcon="ChevronRightOutline"
                variant="ghost"
              >
                <Link href={link.href} onClick={drawer.closeDrawer}>
                  {link.label}
                </Link>
              </Button>
            ))}
          </nav>
        </DrawerBody>
        <DrawerFooter className="shrink-0 border-t border-line/30 p-2">
          <SignOutButton className="w-full justify-start" />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
