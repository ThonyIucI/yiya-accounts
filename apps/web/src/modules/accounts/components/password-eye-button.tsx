import { Button } from "@yiya/ui/components/button";
import { Eye, EyeOff } from "lucide-react";

interface IPasswordEyeButtonProps {
  isVisible: boolean;
  onToggle: () => void;
  size?: "xs" | "sm";
}

/** El ojo que muestra u oculta una contraseña. No deja pasar el clic a la fila o la card. */
export default function PasswordEyeButton({ isVisible, onToggle, size = "sm" }: IPasswordEyeButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size={size === "xs" ? "icon-xs" : "icon-sm"}
      aria-label={isVisible ? "Ocultar contraseña" : "Ver contraseña"}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
    >
      {isVisible ? <EyeOff /> : <Eye />}
    </Button>
  );
}
