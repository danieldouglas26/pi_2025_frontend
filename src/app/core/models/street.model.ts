// Para ENVIAR dados ao criar/atualizar uma rua
export interface StreetRequest {
  origemId: string;
  destinoId: string;
  distancia: number;
}

// Para RECEBER dados de uma rua
export interface StreetResponse {
  id: string;
  origemId: string;
  origemNome: string;
  destinoId: string;
  destinoNome: string;
  distancia: number;
}
