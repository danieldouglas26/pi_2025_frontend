// src/app/core/models/itinerary.model.ts

// Para ENVIAR dados ao criar/atualizar um itinerário
export interface ItineraryRequest {
  // -> CORREÇÃO: IDs são numéricos
  rotaId: number;
  caminhaoId: number;
  data: string; // Formato "yyyy-MM-dd"
}

// -> CORREÇÃO: Esta interface agora reflete os dados do Bairro enviados pelo backend
export interface ParadaItinerarioResponse {
  ordem: number;
  bairroId: number;
  bairroNome: string;
}

// Para RECEBER dados de um itinerário
export interface ItineraryResponse {
  // -> CORREÇÃO: IDs são numéricos
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
