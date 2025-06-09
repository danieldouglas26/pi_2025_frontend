// Para ENVIAR dados ao criar/atualizar um ponto de coleta
export interface CollectionPointRequest {
  name: string;
  responsibleName: string;
  contactInfo?: string; // Opcional, pois não é @NotBlank
  address: string;
  acceptedResidueTypes: string[];
}

// Para RECEBER dados de um ponto de coleta
export interface CollectionPointResponse {
  id: string; // Vem do backend como UUID
  name: string;
  responsibleName: string;
  contactInfo: string;
  address: string;
  acceptedResidueTypes: string[];
}