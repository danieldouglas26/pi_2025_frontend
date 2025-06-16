// Define a estrutura de um "nó" (um bairro)
export interface GraphNode {
  id: string;
  label: string;
}

// Define a estrutura de uma "aresta" (uma rua/conexão)
export interface GraphEdge {
  id?: string;
  source: string; // ID do nó de origem
  target: string; // ID do nó de destino
  label?: string;  // Texto que aparece na linha (ex: distância)
}

// Agrupa os nós e as arestas
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
