// Para ENVIAR dados ao criar/atualizar um ponto de coleta// Para ENVIAR dados ao criar/atualizar um ponto de coleta
export interface CollectionPointRequest {
  nome: string; // Renomeado de 'name'
  nomeResponsavel: string; // Renomeado de 'responsibleName'
  informacaoContato: string; // Renomeado de 'contactInfo' e agora é OBRIGATÓRIO
  endereco: string; // Renomeado de 'address'
  tiposDeResiduo: string[]; // Renomeado de 'acceptedResidueTypes', continua sendo array de strings (nomes dos enums)
}

// Para RECEBER dados de um ponto de coleta
// Para RECEBER dados de um ponto de coleta
export interface CollectionPointResponse {
  id: string; // UUID é representado como string no TS
  nome: string; // Renomeado de 'name'
  nomeResponsavel: string; // Renomeado de 'responsibleName'
  informacaoContato: string; // Renomeado de 'contactInfo'
  endereco: string; // Renomeado de 'address'
  tiposResiduo: string[]; // Renomeado de 'acceptedResidueTypes' e nome do campo no backend
  dataCriacao: string; // LocalDateTime no backend -> string no frontend (Ex: "2025-06-12T10:30:00")
  dataAtualizacao: string; // LocalDateTime no backend -> string no frontend
}
