import { createFileRoute, redirect } from "@tanstack/react-router";

import { ModeToggle } from "@/components/mode-toggle";
import SignInForm from "@/components/sign-in-form";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
  /* Quien ya tiene sesión no ve el formulario. */
  beforeLoad: async () => {
    const session = await authClient.getSession();

    if (session.data) {
      throw redirect({ to: "/dashboard" });
    }
  },

  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center px-4 py-12">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center font-heading text-3xl font-extrabold text-foreground">
          Yiya Accounts
        </h1>

        <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-sticker-md sm:p-8">
          <SignInForm />
        </div>
      </div>
    </div>
  );
}
