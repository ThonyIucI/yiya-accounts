/** «Sin cuentas» · «1 cuenta» · «3 cuentas». */
export const formatAccountCount = (count: number): string => {
  if (count === 0) {
    return "Sin cuentas";
  }
  return count === 1 ? "1 cuenta" : `${count} cuentas`;
};
