import { Button } from "@yiya/ui/components/button";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { isStaleVersionError, reloadForNewVersion } from "@/lib/new-version";

/**
 * Pantalla de error de las rutas, en español (la de TanStack sale en inglés). Si el error
 * es por una versión vieja de la web abierta tras un deploy, recarga sola una vez.
 */
export default function RouteError({ error }: ErrorComponentProps) {
  const isStaleVersion = isStaleVersionError(error);
  const [isReloading, setIsReloading] = useState(isStaleVersion);

  useEffect(() => {
    if (isStaleVersion) {
      setIsReloading(reloadForNewVersion());
    }
  }, [isStaleVersion]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-xl bg-muted">
        {isReloading ? (
          <RefreshCw className="size-7 animate-spin text-muted-foreground motion-reduce:animate-none" />
        ) : (
          <TriangleAlert className="size-7 text-muted-foreground" strokeWidth={1.5} />
        )}
      </div>
      <p className="mt-4 font-heading text-lg font-bold text-foreground">
        {isReloading ? "Hay una versión nueva" : "Algo salió mal"}
      </p>
      <p className="mt-1 text-base text-muted-foreground">
        {isReloading
          ? "Estamos cargándola, un momento."
          : "No pudimos mostrar esta pantalla. Recarga la página; si sigue pasando, avísanos."}
      </p>
      {!isReloading && (
        <Button type="button" className="mt-4" onClick={() => window.location.reload()}>
          <RefreshCw />
          Recargar
        </Button>
      )}
    </div>
  );
}
