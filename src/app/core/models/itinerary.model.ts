export interface ItineraryRequest {
  rotaId: number;
  caminhaoId: number;
  data: string;
}

export interface ParadaItinerarioResponse {
  ordem: number;
  bairroId: number;
  bairroNome: string;
}

export interface ItineraryResponse {
  id: number;
  rotaId: number;
  caminhaoId: number;
  rotaNome: string;
  caminhaoPlaca: string;
  motorista: string;
  data: string;
  distanciaTotal: number;
  tipoResiduo: string;
  concluido: boolean;
  paradas: ParadaItinerarioResponse[];
}
