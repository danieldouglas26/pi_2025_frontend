// src/app/core/models/street.model.ts

// Para ENVIAR dados ao criar/atualizar uma rua
export interface StreetRequest {
  // -> CORREÇÃO: IDs são numéricos
  origemId: number;
  destinoId: number;
  distancia: number;
}

// Para RECEBER dados de uma rua
export interface StreetResponse {
  // -> CORREÇÃO: IDs são numéricos
  id: number;
  origemId: number;
  origemNome: string;
  destinoId: number;
  destinoNome: string;
  distancia: number;
}
