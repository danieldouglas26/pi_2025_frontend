// src/app/core/models/truck.model.ts

// Para ENVIAR dados ao criar/atualizar um caminhão
export interface TruckRequest {
  placa: string;
  nomeMotorista: string;
  capacidade: number;
  tipoResiduos: string[];
}

// Para RECEBER dados de um caminhão
export interface TruckResponse {
  // -> CORREÇÃO: O ID no backend é um Long, que corresponde a 'number' em TypeScript.
  id: number;
  placa: string;
  nomeMotorista: string;
  capacidade: number;
  tipoResiduos: string[];

  // -> CORREÇÃO: Removidos, pois o CaminhaoResponseDTO do backend não envia esses campos.
  // dataCriacao: string;
  // dataAtualizacao: string;
}
