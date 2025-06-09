// core/models/enums.ts

/**
 * Representa os tipos de resíduos que o sistema pode manusear.
 * Corresponde ao enum ResidueType do backend.
 */
export enum ResidueType {
  PLASTICO = "PLASTICO",
  PAPEL = "PAPEL",
  METAL = "METAL",
  ORGANICO = "ORGANICO",
  VIDRO = "VIDRO",
  OUTROS = "OUTROS"
}

/**
 * Representa as unidades de capacidade para os caminhões.
 * Corresponde ao enum CapacityUnit do backend.
 */
export enum CapacityUnit {
  KG = "KG",
  TON = "TON",
  M3 = "M3" // Metro cúbico
}