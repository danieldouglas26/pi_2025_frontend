export interface TruckRequest {
  placa: string;
  nomeMotorista: string;
  capacidade: number;
  tipoResiduos: string[];
}

export interface TruckResponse {
  id: number;
  placa: string;
  nomeMotorista: string;
  capacidade: number;
  tipoResiduos: string[];

}
