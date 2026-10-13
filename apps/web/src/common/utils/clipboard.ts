import { toast } from "sonner";

const FAILED_MESSAGE = "No pudimos copiar. Mantén presionado el texto para copiarlo a mano.";

/**
 * Copia seleccionando el texto en la página y usando `execCommand("copy")`. Es la forma
 * vieja, pero funciona donde `navigator.clipboard` no existe: fuera de HTTPS, como al abrir
 * `pnpm dev` desde el celular por la IP de la red (`http://192.168…`).
 *
 * Se selecciona un `<span>` y no un `<textarea>`: en iPhone, enfocar un campo abre el
 * teclado y hace zoom, y la selección de un campo de solo lectura no siempre se copia.
 */
const copyBySelection = (text: string): boolean => {
  const span = document.createElement("span");
  span.textContent = text;
  span.style.position = "fixed";
  span.style.top = "0";
  span.style.opacity = "0";
  span.style.whiteSpace = "pre";
  span.style.userSelect = "text";
  span.style.webkitUserSelect = "text";
  document.body.appendChild(span);

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(span);
  selection?.removeAllRanges();
  selection?.addRange(range);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    selection?.removeAllRanges();
    span.remove();
  }
};

/**
 * Copia un texto al portapapeles y avisa con un toast. Devuelve si se pudo.
 * Primero prueba la API moderna (solo existe en HTTPS) y, si no está o la rechaza, la de
 * selección. Si ninguna funciona, se avisa en español.
 */
export const copyToClipboard = async (text: string, successMessage = "Copiado"): Promise<boolean> => {
  let isCopied = false;

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      isCopied = true;
    } catch {
      isCopied = false;
    }
  }

  if (!isCopied) {
    isCopied = copyBySelection(text);
  }

  if (isCopied) {
    toast.success(successMessage);
  } else {
    toast.error(FAILED_MESSAGE);
  }
  return isCopied;
};
