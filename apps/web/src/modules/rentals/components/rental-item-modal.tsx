import { Button } from "@yiya/ui/components/button";
import type { IAccountResource, IProfileResource } from "@yiya/shared/accounts";
import { addMonths, isIsoDate, todayInLima } from "@yiya/shared/dates";
import { formatSoles } from "@yiya/shared/money";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import Modal from "@/common/components/modal";
import type { TProfileHolders } from "@/modules/rentals/utils/profile-options";
import { type ICartLine, buildLine, monthsOf, nextProfileOf } from "@/modules/rentals/utils/rental-cart";
import ServiceAvatar from "@/modules/services/components/service-avatar";

import { DurationBadges, DurationRange, shortcutOf } from "./duration-badges";
import ProfilePicker from "./profile-picker";

interface IRentalItemModalProps {
  /** La cuenta abierta; `null` cierra la modal. */
  account: IAccountResource | null;
  /** Con línea: se cambia esa (un perfil). Sin línea: se agregan uno o varios. */
  line?: ICartLine;
  lines: ICartLine[];
  holders: TProfileHolders;
  profilePrice: number | null;
  onAdd: (lines: ICartLine[]) => void;
  onSave: (line: ICartLine) => void;
  onClose: () => void;
}

/**
 * El detalle de una cuenta en el carrito, como la modal de producto de id-pos (acordado
 * 2026-11-04): la imagen del servicio, al lado los 4 tiempos como badges y, abajo, sus
 * perfiles como cards para elegir. Se abre al tocar la cuenta en el catálogo (agregar) o
 * una línea del carrito (cambiarla).
 */
export default function RentalItemModal({
  account,
  line,
  lines,
  holders,
  profilePrice,
  onAdd,
  onSave,
  onClose,
}: IRentalItemModalProps) {
  const isEdit = Boolean(line);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [startsOn, setStartsOn] = useState(todayInLima());
  const [expiresOn, setExpiresOn] = useState(addMonths(todayInLima(), 1));
  const [areDatesShown, setAreDatesShown] = useState(false);

  /* Al abrir: lo de la línea, o el siguiente perfil libre y un mes. */
  useEffect(() => {
    if (!account) {
      return;
    }
    if (line) {
      setSelectedIds([line.profileId]);
      setStartsOn(line.startsOn);
      setExpiresOn(line.expiresOn);
      /* Fechas que no son un atajo: se abren las fechas para verlas. */
      setAreDatesShown(shortcutOf(line) === null);
      return;
    }
    const next = nextProfileOf(account, lines, holders);
    const today = todayInLima();
    setSelectedIds(next ? [next] : []);
    setStartsOn(today);
    setExpiresOn(addMonths(today, 1));
    setAreDatesShown(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, line]);

  const inCartIds = new Set(
    lines.filter((other) => other.key !== line?.key).map((other) => other.profileId),
  );
  const amount = (profilePrice ?? 0) * monthsOf({ startsOn, expiresOn }) * selectedIds.length;

  const handleToggle = (profile: IProfileResource) => {
    if (inCartIds.has(profile.id)) {
      toast.info(`${profile.name} ya está en el carrito.`);
      return;
    }
    if (isEdit) {
      setSelectedIds([profile.id]);
      return;
    }
    setSelectedIds((previous) =>
      previous.includes(profile.id) ? previous.filter((id) => id !== profile.id) : [...previous, profile.id],
    );
  };

  const handleConfirm = () => {
    if (!account) {
      return;
    }
    if (selectedIds.length === 0) {
      toast.error("Elige al menos un perfil.");
      return;
    }
    if (!isIsoDate(startsOn) || !isIsoDate(expiresOn) || expiresOn < startsOn) {
      toast.error("Revisa las fechas: el vencimiento va después del inicio.");
      return;
    }
    if (line) {
      onSave({ ...line, profileId: selectedIds[0]!, startsOn, expiresOn });
    } else {
      onAdd(selectedIds.map((profileId) => ({ ...buildLine(account.id, profileId), startsOn, expiresOn })));
    }
    onClose();
  };

  const confirmLabel = isEdit
    ? "Guardar"
    : selectedIds.length === 1
      ? "Agregar 1 perfil"
      : `Agregar ${selectedIds.length} perfiles`;

  return (
    <Modal
      open={account !== null}
      title={account?.service.name ?? "Cuenta"}
      subtitle={account?.email}
      width="lg"
      onClose={onClose}
      footer={
        <Button type="button" size="lg" className="w-full justify-between" onClick={handleConfirm}>
          <span>{confirmLabel}</span>
          {amount > 0 && <span className="tabular-nums">{formatSoles(amount)}</span>}
        </Button>
      }
    >
      {account && (
        <div className="space-y-5">
          <div className="flex gap-4">
            {/* Izquierda: la imagen y, debajo, el precio grande. */}
            <div className="flex w-24 shrink-0 flex-col items-center gap-2 text-center sm:w-32">
              <ServiceAvatar
                name={account.service.name}
                imageUrl={account.service.imageUrl}
                className="size-24 rounded-lg sm:size-32"
              />
              <div>
                <p className="font-heading text-xl font-bold text-foreground tabular-nums">
                  {profilePrice === null ? "Sin precio" : formatSoles(profilePrice)}
                </p>
                {profilePrice !== null && <p className="text-xs text-muted-foreground">por perfil al mes</p>}
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="font-heading font-semibold text-foreground">Tiempo</p>
              <DurationBadges
                dates={{ startsOn, expiresOn }}
                isCustomOpen={areDatesShown}
                onChange={(next) => {
                  setExpiresOn(next);
                  setAreDatesShown(false);
                }}
                onToggleCustom={() => setAreDatesShown((shown) => !shown)}
              />
              {/* Con «Más…», los inputs van en el lugar del rango: es lo mismo, editable. */}
              <DurationRange
                dates={{ startsOn, expiresOn }}
                isEditable={areDatesShown}
                onStartsOnChange={(next) => {
                  /* Correr el inicio corre el vencimiento: se mantiene la duración. */
                  const months = monthsOf({ startsOn, expiresOn });
                  setStartsOn(next);
                  if (isIsoDate(next)) {
                    setExpiresOn(addMonths(next, months));
                  }
                }}
                onExpiresOnChange={setExpiresOn}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-heading font-semibold text-foreground">
              Perfiles
              <span className="font-semibold text-muted-foreground">
                {" "}
                · {isEdit ? "elige uno" : "elige uno o varios"}
              </span>
            </p>
            <ProfilePicker
              profiles={account.profiles}
              holders={holders}
              selectedIds={selectedIds}
              inCartIds={inCartIds}
              onToggle={handleToggle}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
