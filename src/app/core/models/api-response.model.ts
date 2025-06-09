// core/models/api-response.model.ts (para referência)
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  errors?: any; // Pode ser string, array de strings, ou objeto (para erros de validação)
}

