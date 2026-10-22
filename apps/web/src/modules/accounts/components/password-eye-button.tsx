import { IconButton } from "@yiya/ui/components/icon-button";
import { Eye, EyeOff } from "lucide-react";

interface IPasswordEyeButtonProps {
  isVisible: boolean;
  onToggle: () => void;
  size?: "xs" | "sm";
}

/** El ojo que muestra u oculta una contraseña. No deja pasar el clic a la fila o la card. */
export default function PasswordEyeButton({ isVisible, onToggle, size = "sm" }: IPasswordEyeButtonProps) {
  return (
    <IconButton
      size={size}
      label={isVisible ? "Ocultar contraseña" : "Ver contraseña"}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
    >
      {isVisible ? <EyeOff /> : <Eye />}
    </IconButton>
  );
}
