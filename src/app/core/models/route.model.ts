// Representa um ponto dentro de uma rota retornada pela API
export interface RoutePoint {
  id: string; // ID do ponto de coleta (UUID)
  neighborhoodName: string; // Nome do ponto de coleta
}

// Para ENVIAR dados ao criar uma rota
export interface RouteRequest {
  name: string;
  truckId: string; // UUID do caminhão
  collectionPointIds: string[]; // Apenas a lista de UUIDs dos pontos de coleta
}

// Para RECEBER dados de uma rota
export interface RouteResponse {
  id: string; // UUID da rota
  name: string;
  truckId: string; // UUID do caminhão
  truckLicensePlate: string; // Placa do caminhão para facilitar a exibição
  orderedPoints: RoutePoint[]; // Lista de pontos de coleta em ordem
  totalDistanceKm: number;
  servicedResidueTypes: string[];
}