// Para ENVIAR dados ao criar/atualizar uma rota
export interface RouteRequest {
  nome: string;
  // -> CORREÇÃO: IDs são numéricos e referem-se a bairros
  caminhaoId: number;
  origemBairroId: number;
  destinoBairroId: number;
  tipoResiduo: string;
}

// Representa uma parada (bairro) dentro de uma rota
export interface ParadaRotaResponse {
  ordem: number;
  // -> CORREÇÃO: A parada é um bairro
  bairroId: number;
  bairroNome: string;
}

// Para RECEBER dados de uma rota
export interface RouteResponse {
  // -> CORREÇÃO: IDs são numéricos
  id: number;
  nome: string;
  caminhaoId: number;
  caminhaoPlaca: string;
  tipoResiduo: string;
  distanciaTotalKm: number;
  paradas: ParadaRotaResponse[];
}
