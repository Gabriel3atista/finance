import type { HouseholdMember } from "@/features/transactions/lib/data";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EntryFields({
  members,
  currentUserId,
  month,
  entry,
}: {
  members: HouseholdMember[];
  currentUserId: string;
  month: string;
  entry?: {
    title: string;
    amount: number;
    category: string | null;
    due_date: string | null;
    responsible_user_id: string | null;
  };
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="field-label sm:col-span-2">
        Descrição
        <Input
          name="title"
          maxLength={160}
          required
          defaultValue={entry?.title}
          placeholder="Ex.: Salário, energia, mercado"
        />
      </label>
      <label className="field-label">
        Valor (R$)
        <Input
          name="amount"
          inputMode="decimal"
          required
          defaultValue={
            entry ? entry.amount.toFixed(2).replace(".", ",") : undefined
          }
          placeholder="0,00"
        />
      </label>
      <label className="field-label">
        Categoria
        <Input
          name="category"
          maxLength={80}
          defaultValue={entry?.category ?? ""}
          placeholder="Opcional"
        />
      </label>
      <label className="field-label">
        Vencimento
        <Input
          type="date"
          name="due_date"
          defaultValue={entry?.due_date ?? ""}
        />
      </label>
      <label className="field-label">
        Responsável
        <Select
          name="responsible_user_id"
          defaultValue={entry?.responsible_user_id ?? "__none"}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">Sem responsável</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.user_id} value={member.user_id}>
                {member.user_id === currentUserId
                  ? "Eu"
                  : member.member_role === "owner"
                    ? "Responsável do núcleo"
                    : "Outro membro"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <Input type="hidden" name="competence_month" value={month} />
    </div>
  );
}

export function SeriesFields({
  members,
  currentUserId,
  month,
}: {
  members: HouseholdMember[];
  currentUserId: string;
  month: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="field-label sm:col-span-2">
        Descrição
        <Input name="title" maxLength={160} required />
      </label>
      <label className="field-label">
        Valor (R$)
        <Input name="amount" inputMode="decimal" placeholder="0,00" required />
      </label>
      <label className="field-label">
        Categoria
        <Input name="category" maxLength={80} placeholder="Opcional" />
      </label>
      <label className="field-label">
        Dia de vencimento
        <Input
          name="due_day"
          type="number"
          min={1}
          max={31}
          placeholder="Opcional"
        />
      </label>
      <label className="field-label">
        Responsável
        <Select name="responsible_user_id" defaultValue="__none">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">Sem responsável</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.user_id} value={member.user_id}>
                {member.user_id === currentUserId
                  ? "Eu"
                  : member.member_role === "owner"
                    ? "Responsável do núcleo"
                    : "Outro membro"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <Input type="hidden" name="starts_on" value={month} />
    </div>
  );
}
