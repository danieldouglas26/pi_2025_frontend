// Representa um ponto dentro de uma rota retornada pela API
// NOVO/AJUSTADO: Representa uma parada dentro de uma rota
export interface ParadaRotaResponse {
  ordem: number;
  pontoId: string; // ID do ponto de coleta (UUID)
  pontoNome: string; // Nome do ponto de coleta
  pontoEndereco: string; // Endereço do ponto de coleta
}
// Para ENVIAR dados ao criar uma rota
export interface RouteRequest {
  nome: string; // Nome da rota (novo campo de request)
  caminhaoId: string; // UUID do caminhão (string no TS)
  origemId: string; // UUID do ponto de origem (string no TS)
  destinoId: string; // UUID do ponto de destino (string no TS)
  tipoResiduo: string; // Tipo de resíduo (Enum como string)
}
// Para RECEBER dados de uma rota
export interface RouteResponse {
  id: string; // UUID da rota (string no TS)
  nome: string; // Renomeado de 'name'
  caminhaoId: string; // UUID do caminhão (string no TS)
  caminhaoPlaca: string; // Placa do caminhão para facilitar a exibição
  tipoResiduo: string; // Novo campo
  distanciaTotalKm: number; // Renomeado de 'totalDistanceKm'
  paradas: ParadaRotaResponse[]; // Renomeado de 'orderedPoints', usando a interface ParadaRotaResponse criada acima
}
