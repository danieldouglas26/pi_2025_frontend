// Para ENVIAR dados ao criar/atualizar um caminhão
export interface TruckRequest {
  placa: string; // Renomeado de 'licensePlate'
  nomeMotorista: string; // Renomeado de 'driverName'
  capacidade: number;
  tipoResiduos: string[]; // Renomeado de 'allowedResidueTypes' e nome do campo no backend
}

// Para RECEBER dados de um caminhão
export interface TruckResponse {
  id: string; // UUID é representado como string no TS
  placa: string; // Renomeado de 'licensePlate'
  nomeMotorista: string; // Renomeado de 'driverName'
  capacidade: number;
  tipoResiduos: string[]; // Renomeado de 'allowedResidueTypes'
  dataCriacao: string; // LocalDateTime no backend -> string no frontend
  dataAtualizacao: string; // LocalDateTime no backend -> string no frontend
}
