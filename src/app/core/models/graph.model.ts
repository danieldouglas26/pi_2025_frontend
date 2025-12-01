// Define a estrutura de um "nó" (um bairro)
export interface GraphNode {
  id: string;
  label: string;
}

export interface GraphEdge {
  id?: string;
  source: string;
  target: string;
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
