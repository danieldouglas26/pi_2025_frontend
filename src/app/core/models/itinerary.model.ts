// Para ENVIAR dados ao criar um itinerário// Para ENVIAR dados ao criar um itinerário
export interface ItineraryRequest {
  rotaId: string; // UUID da rota (string no TS)
  caminhaoId: string; // UUID do caminhão (string no TS)
  data: string; // LocalDate no backend -> string no frontend (Formato "yyyy-MM-dd")
}

// Para RECEBER dados de um itinerário
export interface ItineraryResponse {
  id: string; // UUID do itinerário (string no TS)
  rotaId: string;
  rotaNome: string; // Nome da rota
  caminhaoId: string;
  caminhaoPlaca: string; // Placa do caminhão
  motorista: string; // Novo campo
  data: string; // LocalDate no backend -> string no frontend (Formato "yyyy-MM-dd")
  distanciaTotal: number; // Novo campo
  tipoResiduo: string; // Novo campo (Enum como string)
  concluido: boolean; // Novo campo
  paradas: ParadaItinerarioResponseDTO[]; // Novo campo, lista de paradas
}

// NOVO: Adicione esta interface em core/models/itinerary.model.ts ou em um novo arquivo como parada-itinerario.model.ts
export interface ParadaItinerarioResponseDTO {
  ordem: number;
  pontoId: string;
  pontoNome: string;
  endereco: string;
  coletado: boolean;
}
