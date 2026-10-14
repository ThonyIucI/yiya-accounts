import type { IAccountResource } from "@yiya/shared/accounts";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { EASE_OUT } from "@/common/constants/motion";

import AccountCard, { AccountCardSkeleton } from "./account-card";
import type { IAccountListHandlers } from "./account-list-props";

const SKELETON_COUNT = 3;
const STAGGER_SECONDS = 0.04;
const MAX_STAGGERED = 8;

interface IAccountMobileListProps extends IAccountListHandlers {
  accounts: IAccountResource[];
  isLoading: boolean;
}

/** Cards en celular. Oculta desde `md`: allí se usa `AccountTable`. */
export default function AccountMobileList({
  accounts,
  isLoading,
  togglingId,
  buildActions,
  onToggleActive,
  onOpen,
}: IAccountMobileListProps) {
  const prefersReducedMotion = useReducedMotion();

  if (isLoading) {
    return (
      <ul className="space-y-3 md:hidden">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <li key={index}>
            <AccountCardSkeleton />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-3 md:hidden">
      <AnimatePresence initial={false} mode="popLayout">
        {accounts.map((account, index) => (
          <motion.li
            key={account.id}
            layout
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, transform: "translateY(8px)" }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, transform: "translateY(0px)" }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, transform: "scale(0.97)" }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.22,
              ease: EASE_OUT,
              delay: prefersReducedMotion ? 0 : Math.min(index, MAX_STAGGERED) * STAGGER_SECONDS,
            }}
          >
            <AccountCard
              account={account}
              actions={buildActions(account)}
              isToggling={togglingId === account.id}
              onToggleActive={() => onToggleActive(account)}
              onOpen={() => onOpen(account)}
            />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
