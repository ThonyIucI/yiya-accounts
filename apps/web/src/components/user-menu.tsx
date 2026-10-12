import { Button } from "@yiya/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@yiya/ui/components/dropdown-menu";
import { Skeleton } from "@yiya/ui/components/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { parseUserRole } from "@yiya/shared/roles";

import { navItemsForRole } from "@/common/constants/routes";
import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="h-9 w-24" />;
  }

  if (!session) {
    return (
      <Link to="/login">
        <Button variant="outline">Ingresar</Button>
      </Link>
    );
  }

  const role = parseUserRole(session.user.role);

  return (
    <DropdownMenu>
      {/* El nombre se recorta: hay apellidos largos y el encabezado no puede crecer. */}
      <DropdownMenuTrigger render={<Button variant="outline" className="max-w-40" />}>
        <span className="truncate">{session.user.name}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-60 bg-card">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="min-w-0">
            <span className="block truncate font-bold text-foreground">{session.user.name}</span>
            <span className="block truncate text-sm font-normal text-muted-foreground">
              {session.user.email}
            </span>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {navItemsForRole(role).map(({ to, label, icon: Icon }) => (
            <DropdownMenuItem key={to} onClick={() => navigate({ to })}>
              <Icon className="size-4" />
              {label}
            </DropdownMenuItem>
          ))}

          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    navigate({ to: "/login" });
                  },
                  onError: () => {
                    toast.error("No pudimos cerrar la sesión. Inténtalo de nuevo.");
                  },
                },
              });
            }}
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
