// src/app/core/models/bairro.model.ts

// Para RECEBER dados de um bairro
export interface BairroResponse {
  id: number;
  nome: string;
}

// Para ENVIAR dados ao criar/atualizar um bairro
export interface BairroRequest {
  nome: string;
}
