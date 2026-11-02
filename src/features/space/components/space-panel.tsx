"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  useDrawer,
} from "@/components/ui/drawer";
import { createClient } from "@/features/auth/lib/supabase/client";
import { Eyebrow } from "@/shared/components/eyebrow";
import { fetchSpacePage, type SpaceMember } from "@/features/space/lib/queries";
import { queryKeys } from "@/shared/lib/query-keys";
import { formatDate } from "@/shared/lib/date";
import { createSpaceSchema } from "@/features/space/lib/form-schemas";

export function SpacePanel({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedInvitationId = searchParams.get("invite");
  const queryClient = useQueryClient();
  const spaceQuery = useQuery({
    queryKey: queryKeys.space(userId),
    queryFn: () => fetchSpacePage(userId, email),
  });
  const [createError, setCreateError] = useState("");
  const [acceptError, setAcceptError] = useState("");
  const [memberToRemove, setMemberToRemove] = useState<SpaceMember | null>(
    null,
  );
  const [removeMemberError, setRemoveMemberError] = useState("");
  const [memberNotice, setMemberNotice] = useState("");
  const createSpaceForm = useForm<{ name: string }>({
    resolver: zodResolver(createSpaceSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { name: "" },
  });
  const space = spaceQuery.data?.space ?? null;
  const invitations = spaceQuery.data?.invitations ?? [];
  const requestedInvitation = invitations.find(
    (invitation) => invitation.id === requestedInvitationId,
  );
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("login");
      const { error } = await supabase
        .from("spaces")
        .insert({ name, created_by: user.id });
      if (error) throw error;
    },
    onSuccess: async () => {
      createSpaceForm.reset();
      await queryClient.invalidateQueries({
        queryKey: queryKeys.space(userId),
      });
    },
    onError: () =>
      setCreateError("Não foi possível criar o espaço. Tente novamente."),
  });
  const acceptMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const supabase = createClient();
      const { data: invitation, error: invitationError } = await supabase
        .from("space_invitations")
        .select("space_id")
        .eq("id", invitationId)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      if (invitationError || !invitation)
        throw new Error("invitation-unavailable");
      const { error } = await supabase.from("space_members").insert({
        space_id: invitation.space_id,
        user_id: userId,
        member_role: "member",
      });
      if (error) throw error;
    },
    onSuccess: () => router.push("/dashboard"),
    onError: () =>
      setAcceptError(
        "Este convite não está mais disponível. Atualize a página e tente novamente.",
      ),
  });
  const removeMemberMutation = useMutation({
    mutationFn: async ({
      spaceId,
      userId: memberUserId,
    }: {
      spaceId: string;
      userId: string;
    }) => {
      const { data, error } = await createClient().rpc("remove_space_member", {
        p_space_id: spaceId,
        p_user_id: memberUserId,
      });
      if (error || !data) throw new Error("remove-space-member");
    },
    onSuccess: async () => {
      setMemberNotice("Pessoa removida do espaço.");
      removeMemberDrawer.forceCloseDrawer();
      await queryClient.invalidateQueries({
        queryKey: queryKeys.space(userId),
      });
    },
    onError: () =>
      setRemoveMemberError(
        "Não foi possível remover esta pessoa. Tente novamente.",
      ),
  });
  const removeMemberDrawer = useDrawer({
    canClose: () => !removeMemberMutation.isPending,
    onOpenChange: (open) => {
      if (open) {
        removeMemberMutation.reset();
        setRemoveMemberError("");
      }
    },
    onCloseComplete: () => setMemberToRemove(null),
  });
  if (spaceQuery.isPending) {
    return (
      <div aria-live="polite" aria-busy="true" className="flex flex-col gap-6">
        <SpacePageHeading title="Organize seu espaço financeiro" />
        <Card className="flex min-h-48 flex-col gap-3 p-5 sm:p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </Card>
      </div>
    );
  }
  if (spaceQuery.isError) {
    return (
      <div className="flex flex-col gap-6">
        <SpacePageHeading title="Organize seu espaço financeiro" />
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-graphite-700 p-5 sm:p-6"
        >
          <p className="text-sm text-rose-500">
            Não foi possível carregar as informações do espaço.
          </p>
          <Button
            onClick={() => {
              void spaceQuery.refetch();
            }}
            type="button"
            variant="secondary"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="flex flex-col gap-6">
        <SpacePageHeading title="Organize seu espaço financeiro" />
        <div className="grid items-start gap-3 lg:grid-cols-2">
          <Card sections className="overflow-hidden">
            <CardHeader className="flex flex-col gap-2 bg-graphite-600 p-5 sm:p-6">
              <Eyebrow tone="accent">Comece por aqui</Eyebrow>
              <CardTitle className="text-xl tracking-tight">
                Crie seu espaço
              </CardTitle>
              <CardDescription className="max-w-md leading-6">
                Você poderá organizar suas finanças e convidar outras pessoas
                para compartilhar os mesmos dados.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <form
                onSubmit={createSpaceForm.handleSubmit(({ name }) => {
                  setCreateError("");
                  createMutation.mutate(name.trim());
                })}
                className="flex flex-col gap-3"
                noValidate
              >
                <Input
                  label="Nome do espaço"
                  containerClassName="gap-2"
                  className="min-h-11 px-3.5 focus:border-accent mobile-app:focus:!border-line"
                  error={createSpaceForm.formState.errors.name?.message}
                  maxLength={100}
                  placeholder="Ex.: Pessoal"
                  {...createSpaceForm.register("name")}
                />
                {createError && (
                  <p role="alert" className="text-sm text-rose-500">
                    {createError}
                  </p>
                )}
                <Button
                  className="w-full sm:w-auto sm:self-start"
                  disabled={createMutation.isPending}
                  type="submit"
                >
                  {createMutation.isPending ? "Criando…" : "Criar espaço"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card sections className="overflow-hidden">
            <CardHeader className="flex flex-col gap-2 bg-graphite-600 p-5 sm:p-6">
              <Eyebrow tone="accent">Convites recebidos</Eyebrow>
              <CardTitle className="text-xl tracking-tight">
                Acesse um espaço existente
              </CardTitle>
              <CardDescription className="leading-6">
                Convites enviados ao seu e-mail aparecem aqui.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-5 sm:p-6">
              {invitations.length ? (
                <div className="flex flex-col gap-3">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex flex-col items-start gap-3 rounded-xl border border-line/50 bg-graphite-800 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink">
                          Convite para compartilhar finanças
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Expira em {formatDate(invitation.expires_at)}
                        </p>
                      </div>
                      <Button
                        className="w-full sm:w-auto"
                        disabled={acceptMutation.isPending}
                        onClick={() => {
                          setAcceptError("");
                          acceptMutation.mutate(invitation.id);
                        }}
                        size="sm"
                        type="button"
                      >
                        {requestedInvitationId === invitation.id
                          ? "Aceitar este convite"
                          : "Aceitar convite"}
                      </Button>
                    </div>
                  ))}
                  {acceptError && (
                    <p role="alert" className="text-sm text-rose-500">
                      {acceptError}
                    </p>
                  )}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-line px-4 py-3 text-sm leading-6 text-muted">
                  {requestedInvitationId
                    ? "Este convite não está disponível para a conta conectada. Entre com o e-mail confirmado que recebeu o convite."
                    : acceptError ||
                      "Quando alguém convidar seu e-mail, o convite aparecerá aqui."}
                </p>
              )}
              {requestedInvitationId &&
                !requestedInvitation &&
                invitations.length > 0 && (
                  <p
                    role="alert"
                    className="mt-3 text-sm leading-6 text-rose-500"
                  >
                    O link não está disponível para a conta conectada. Entre com
                    o e-mail confirmado que recebeu o convite.
                  </p>
                )}
              {requestedInvitationId && requestedInvitation && (
                <p className="mt-3 text-sm leading-6 text-muted">
                  Você está conectado como {email}. O convite só pode ser aceito
                  por esta conta se o e-mail confirmado corresponder ao endereço
                  convidado.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const members = spaceQuery.data?.members ?? [];

  return (
    <div className="flex flex-col gap-6">
      <SpacePageHeading title={space.name} />
      <div className="flex flex-wrap items-center gap-3">
        {space.member_role === "owner" && (
          <Button asChild>
            <Link href="/space/invite">Convidar uma pessoa</Link>
          </Button>
        )}
        <Button
          onClick={() => router.push("/dashboard")}
          type="button"
          variant="secondary"
        >
          Ir para o painel
        </Button>
      </div>
      <Card sections className="overflow-hidden">
        <CardHeader className="flex flex-col gap-2 bg-graphite-600 p-5 sm:p-6">
          <Eyebrow tone="accent">Acesso</Eyebrow>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-xl tracking-tight">
              Pessoas do espaço
            </CardTitle>
            <Badge variant="secondary">{members.length}</Badge>
          </div>
          <CardDescription className="leading-6">
            Quem pode acompanhar as finanças compartilhadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-3 sm:p-4">
          {memberNotice && (
            <p role="status" className="px-2 text-sm text-mint-300">
              {memberNotice}
            </p>
          )}
          {members.map((member) => (
            <div
              className="flex min-w-0 items-center gap-3 rounded-xl border border-line/50 bg-graphite-800 p-3"
              key={member.user_id}
            >
              <SpaceMemberAvatar member={member} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="min-w-0 break-words text-sm font-medium text-ink">
                    {member.display_name}
                  </p>
                  <Badge size="sm" variant="secondary">
                    {member.member_role === "owner" ? "Proprietário" : "Membro"}
                  </Badge>
                </div>
                <p className="mt-1 break-all text-xs text-muted">
                  {member.email ?? "E-mail indisponível"}
                </p>
              </div>
              {space.member_role === "owner" &&
                member.member_role === "member" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-label={`Gerenciar ${member.display_name}`}
                        disabled={removeMemberMutation.isPending}
                        icon="VerticalDots"
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => {
                          setMemberToRemove(member);
                          setRemoveMemberError("");
                          setMemberNotice("");
                          removeMemberDrawer.openDrawer();
                        }}
                        leadingIcon="TrashOutline"
                        variant="destructive-ghost"
                      >
                        Remover do espaço
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Drawer {...removeMemberDrawer.props}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Remover pessoa do espaço?</DrawerTitle>
            <DrawerDescription>
              {memberToRemove?.display_name} perderá acesso às informações
              compartilhadas deste espaço.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            {removeMemberError && (
              <p role="alert" className="py-2 text-sm text-rose-500">
                {removeMemberError}
              </p>
            )}
          </DrawerBody>
          <DrawerFooter className="border-t border-line/50">
            <div className="grid grid-cols-2 gap-3">
              <Button
                disabled={removeMemberMutation.isPending}
                onClick={removeMemberDrawer.closeDrawer}
                type="button"
                variant="secondary"
              >
                Cancelar
              </Button>
              <Button
                disabled={!memberToRemove}
                leadingIcon="TrashOutline"
                loading={removeMemberMutation.isPending}
                onClick={() => {
                  if (!memberToRemove) return;
                  removeMemberMutation.mutate({
                    spaceId: space.id,
                    userId: memberToRemove.user_id,
                  });
                }}
                type="button"
                variant="destructive"
              >
                Remover
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function SpacePageHeading({ title }: { title: string }) {
  return (
    <header>
      <h1 className="break-words text-[28px] font-semibold tracking-[-0.04em] text-ink sm:text-[34px]">
        {title}
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
        Seus dados ficam disponíveis para você e para as pessoas que convidar.
      </p>
    </header>
  );
}

function SpaceMemberAvatar({ member }: { member: SpaceMember }) {
  const [hasImageError, setHasImageError] = useState(false);
  const initials = member.display_name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("pt-BR");

  return (
    <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-graphite-600 text-xs font-semibold text-ink">
      {member.avatar_url && !hasImageError ? (
        <Image
          alt=""
          className="size-full object-cover"
          height={40}
          onError={() => setHasImageError(true)}
          src={member.avatar_url}
          unoptimized
          width={40}
        />
      ) : (
        initials || "?"
      )}
    </div>
  );
}
