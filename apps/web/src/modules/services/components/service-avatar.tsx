import { cn } from "@yiya/ui/lib/utils";
import { useState } from "react";

interface IServiceAvatarProps {
  name: string;
  imageUrl: string | null;
  className?: string;
}

/**
 * Imagen del servicio (el PNG que Thony aloja afuera). Sin link, o si el link no carga, se
 * muestra la inicial del nombre: un link roto no deja un hueco en la lista.
 */
export default function ServiceAvatar({ name, imageUrl, className }: IServiceAvatarProps) {
  /* Se recuerda qué link falló: si después cambia el link, se vuelve a intentar. */
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = imageUrl !== null && imageUrl !== failedUrl;

  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 font-heading text-lg font-extrabold text-primary",
        className,
      )}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className="size-full object-contain"
          onError={() => setFailedUrl(imageUrl)}
        />
      ) : (
        name.trim().charAt(0).toUpperCase()
      )}
    </span>
  );
}
