import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UIService {
  // Estado inicial do menu lateral (aberto por padrão)
  private sidebarState = new BehaviorSubject<boolean>(true);

  // Observable público para o estado do menu
  isSidebarOpen$: Observable<boolean> = this.sidebarState.asObservable();

  /**
   * Alterna o estado de abertura/fechamento do menu lateral.
   */
  toggleSidebar(): void {
    this.sidebarState.next(!this.sidebarState.value);
  }
}
