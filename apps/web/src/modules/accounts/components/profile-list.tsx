import {
  type IProfileResource,
  PROFILE_NAME_MAX_LENGTH,
  PROFILE_PIN_MESSAGE,
  PROFILE_PIN_PATTERN,
} from "@yiya/shared/accounts";
import { Trash2 } from "lucide-react";

import RowActions from "@/common/components/row-actions";
import { useUpdateProfile } from "@/modules/accounts/hooks/use-profiles";
import { profileChipLabel } from "@/modules/accounts/utils/profile-occupancy";

import InlineTextField from "./inline-text-field";

const validateName = (value: string): string | null =>
  value === "" ? "Escribe el nombre del perfil." : null;

/* Vacío = sin PIN. */
const validatePin = (value: string): string | null =>
  value === "" || PROFILE_PIN_PATTERN.test(value) ? null : PROFILE_PIN_MESSAGE;

interface IProfileListProps {
  profiles: IProfileResource[];
  onSaved: (profile: IProfileResource) => void;
  onDelete: (profile: IProfileResource) => void;
}

/** Los perfiles de la cuenta en el detalle: nombre y PIN editables ahí mismo. */
export default function ProfileList({ profiles, onSaved, onDelete }: IProfileListProps) {
  const UpdateProfile = useUpdateProfile();
  const canDelete = profiles.length > 1;

  const save = async (profile: IProfileResource, payload: { name?: string; pin?: string | null }) => {
    const saved = await UpdateProfile.handler(profile.id, payload);
    if (saved) {
      onSaved(saved);
    }
    return saved !== null;
  };

  return (
    <ul className="divide-y divide-border/60">
      {profiles.map((profile) => (
        <li key={profile.id} className="flex items-start gap-2 py-3 first:pt-0 last:pb-0">
          <span className="mt-8 w-8 shrink-0 font-heading text-sm font-extrabold text-muted-foreground">
            {profileChipLabel(profile)}
          </span>
          <InlineTextField
            id={`profile-${profile.id}-name`}
            label="Nombre"
            className="flex-1"
            value={profile.name}
            maxLength={PROFILE_NAME_MAX_LENGTH}
            validate={validateName}
            onSave={(name) => save(profile, { name })}
          />
          <InlineTextField
            id={`profile-${profile.id}-pin`}
            label="PIN"
            className="w-24 shrink-0"
            value={profile.pin ?? ""}
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            placeholder="—"
            validate={validatePin}
            onSave={(pin) => save(profile, { pin: pin || null })}
          />
          <div className="mt-7 shrink-0">
            <RowActions
              actions={
                canDelete
                  ? [{ icon: Trash2, label: "Eliminar", variant: "destructive", onClick: () => onDelete(profile) }]
                  : []
              }
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
