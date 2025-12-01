export interface RouteRequest {
  nome: string;
  caminhaoId: number;
  origemId: number;
  destinoId: number;
  tipoResiduo: string;
}

export interface ParadaRotaResponse {
  ordem: number;
  bairroId: number;
  bairroNome: string;
}

export interface RouteResponse {
  id: number;
  nome: string;
  caminhaoId: number;
  caminhaoPlaca: string;
  tipoResiduo: string;
  distanciaTotalKm: number;
  paradas: ParadaRotaResponse[];
}
