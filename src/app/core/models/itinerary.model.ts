// Para ENVIAR dados ao criar um itinerário
export interface ItineraryRequest {
  routeId: string; // UUID da rota
  truckId: string; // UUID do caminhão
  collectionDate: string; // Formato "yyyy-MM-dd"
}

// Para RECEBER dados de um itinerário
export interface ItineraryResponse {
  id: string; // UUID do itinerário
  routeId: string;
  routeName: string; // Nome da rota
  truckId: string;
  truckLicensePlate: string; // Placa do caminhão
  collectionDate: string; // Formato "yyyy-MM-dd"
}