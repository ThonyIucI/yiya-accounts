import type { IAccountResource } from "@yiya/shared/accounts";

import type { IRowAction } from "@/common/components/row-actions";

/** Lo que la tabla y las cards necesitan de la página. */
export interface IAccountListHandlers {
  togglingId: string | null;
  buildActions: (account: IAccountResource) => IRowAction[];
  onToggleActive: (account: IAccountResource) => void;
  onOpen: (account: IAccountResource) => void;
}
