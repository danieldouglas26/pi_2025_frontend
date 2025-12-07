export interface StreetRequest {
  origemId: number;
  destinoId: number;
  distancia: number;
}

export interface StreetResponse {
  id: number;
  origemId: number;
  origemNome: string;
  destinoId: number;
  destinoNome: string;
  distancia: number;
}
