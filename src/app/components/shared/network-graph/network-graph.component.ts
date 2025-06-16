import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Network, DataSet } from 'vis-network/standalone/esm/vis-network.js';
import { GraphEdge, GraphNode } from '../../../core/models/graph.model';

@Component({
  selector: 'app-network-graph',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './network-graph.component.html',
  styleUrls: ['./network-graph.component.scss']
})
export class NetworkGraphComponent implements OnChanges, AfterViewInit {
  @Input() nodes: GraphNode[] | null = [];
  @Input() edges: GraphEdge[] | null = [];

  @ViewChild('networkContainer') networkContainer!: ElementRef;

  private networkInstance: Network | null = null;

  ngAfterViewInit(): void {
    this.renderGraph();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.networkInstance && (changes['nodes'] || changes['edges'])) {
      this.renderGraph();
    }
  }

  private renderGraph(): void {
    if (!this.networkContainer || !this.nodes || !this.edges) {
      return;
    }

    const visNodes = new DataSet(this.nodes);
    const visEdges = new DataSet(this.edges.map(edge => ({
      id: edge.id,
      from: edge.source,
      to: edge.target,
      label: edge.label
    })));

    const data = {
      nodes: visNodes,
      edges: visEdges
    };

    // Opções de customização do grafo
    const options = {
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: { gravitationalConstant: -50, centralGravity: 0.01, springLength: 100 },
      },
      nodes: {
        shape: 'box',
        // -> CORREÇÃO AQUI: 'margin' deve ser um objeto
        margin: {
          top: 10,
          right: 15,
          bottom: 10,
          left: 15
        },
        font: { color: '#ffffff', size: 14, face: 'Arial' },
        color: { border: '#0056b3', background: '#007bff', highlight: { background: '#4da3ff', border: '#0056b3' } },
        borderWidth: 2,
      },
      edges: {
        width: 2,
        arrows: { to: { enabled: true, scaleFactor: 0.5 } },
        color: { color: '#aaa', highlight: '#007bff' },
        font: { align: 'middle', size: 12, color: '#666' },
      },
      interaction: {
        hover: true,
        dragNodes: true,
        zoomView: true,
        dragView: true
      },
    };

    // Esta linha agora funcionará sem erro de tipo
    this.networkInstance = new Network(this.networkContainer.nativeElement, data, options);
  }
}
