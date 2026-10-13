import { toast } from "sonner";

/**
 * Copia un texto al portapapeles y avisa con un toast. Devuelve si se pudo: el navegador lo
 * bloquea fuera de HTTPS o sin permiso, y ahí se avisa en español.
 */
export const copyToClipboard = async (text: string, successMessage = "Copiado"): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
    return true;
  } catch {
    toast.error("No pudimos copiar. Mantén presionado el texto para copiarlo a mano.");
    return false;
  }
};
