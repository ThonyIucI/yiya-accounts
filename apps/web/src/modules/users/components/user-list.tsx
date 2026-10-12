import { Skeleton } from "@yiya/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@yiya/ui/components/table";
import { userRoleLabels } from "@yiya/shared/roles";
import type { IUserResource } from "@yiya/shared/users";
import { UserRound } from "lucide-react";

import { formatShortDate } from "@/common/utils/format-date";

const TABLE_SKELETON_COUNT = 4;
const CARD_SKELETON_COUNT = 3;

interface IUserListProps {
  users: IUserResource[];
  isLoading: boolean;
}

const businessLabel = (user: IUserResource): string => user.business?.name ?? "Sin negocio";

/** Usuarios: tabla en escritorio y cards en celular, con el mismo contenido. */
export default function UserList({ users, isLoading }: IUserListProps) {
  return (
    <>
      <UserTable users={users} isLoading={isLoading} />
      <UserCards users={users} isLoading={isLoading} />
    </>
  );
}

function UserTable({ users, isLoading }: IUserListProps) {
  return (
    <div className="hidden overflow-hidden rounded-2xl bg-card shadow-card md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className="w-[40%]">Usuario</TableHead>
            <TableHead>Negocio</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Desde</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: TABLE_SKELETON_COUNT }, (_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-5 w-48 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20 rounded-md" />
                  </TableCell>
                </TableRow>
              ))
            : users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <p className="truncate font-heading font-bold text-foreground">{user.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                  </TableCell>
                  <TableCell className={user.business ? "text-foreground" : "text-muted-foreground"}>
                    {businessLabel(user)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{userRoleLabels[user.role]}</TableCell>
                  <TableCell className="text-muted-foreground">{formatShortDate(user.createdAt)}</TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}

function UserCards({ users, isLoading }: IUserListProps) {
  if (isLoading) {
    return (
      <ul className="space-y-3 md:hidden">
        {Array.from({ length: CARD_SKELETON_COUNT }, (_, index) => (
          <li key={index}>
            <Skeleton className="h-28 w-full rounded-2xl" />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-3 md:hidden">
      {users.map((user) => (
        <li key={user.id}>
          <article className="rounded-2xl bg-card p-4 shadow-card">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserRound className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-heading text-lg font-bold text-foreground">{user.name}</p>
                <p className="truncate text-base text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3 text-sm">
              <span className={user.business ? "font-bold text-foreground" : "text-muted-foreground"}>
                {businessLabel(user)}
              </span>
              <span className="text-muted-foreground">
                {userRoleLabels[user.role]} · {formatShortDate(user.createdAt)}
              </span>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
