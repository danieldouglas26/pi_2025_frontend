// Para ENVIAR dados ao criar/atualizar um caminhão
export interface TruckRequest {
  licensePlate: string;
  driverName: string;
  capacity: number;
  capacityUnit: string; // Ex: "KILOGRAMS", "LITERS" (conforme seu Enum no backend)
  allowedResidueTypes: string[]; // Ex: ["ORGANIC", "PLASTIC"]
}

// Para RECEBER dados de um caminhão (em listagens ou após criação)
export interface TruckResponse {
  id: string; // Vem do backend como UUID
  licensePlate: string;
  driverName: string;
  capacity: number;
  capacityUnit: string;
  allowedResidueTypes: string[];
}