export const createdMessage = (item: any) => {
  return { item, message: 'información creada exitosamente' };
};
export const updatedMessage = (item: any) => {
  return { item, message: 'información actualizada exitosamente' };
};
export const deletedMessage = () => {
  return { message: 'información eliminada exitosamente' };
};
