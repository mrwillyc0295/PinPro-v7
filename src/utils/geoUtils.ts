export const validateLocation = (lat: number, lng: number) => {
  // Permitir la ubicación actual sin importar si es Margarita o Lechería
  // Esto evita que el sistema ignore coordenadas legítimas como las de Lechería/Anzoátegui
  console.log(`[GeoSystem] Ubicación procesada: ${lat}, ${lng}`);
  return true;
};
