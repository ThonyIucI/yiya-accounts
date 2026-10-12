import StatusBadge from "@/common/components/status-badge";

export default function BusinessStatusBadge({ isActive }: { isActive: boolean }) {
  return <StatusBadge isActive={isActive} inactiveLabel="Desactivado" />;
}
