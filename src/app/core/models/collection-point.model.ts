export interface CollectionPointRequest {
  nome: string;
  idBairro: number;
  nomeResponsavel: string;
  email: string;
  telefone: string;
  endereco: string;
  tiposDeResiduo: string[];
}

export interface CollectionPointResponse {
  id: number;
  nome: string;
  endereco: string;
  responsavel: string;
  email: string;
  telefone: string;
  tiposResiduo: string[];
  coletado: boolean;
  horarioFuncionamento?: string;
  idBairro?: number;

}
