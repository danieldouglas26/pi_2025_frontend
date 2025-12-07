import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UIService {
  private sidebarState = new BehaviorSubject<boolean>(true);

  isSidebarOpen$: Observable<boolean> = this.sidebarState.asObservable();

  toggleSidebar(): void {
    this.sidebarState.next(!this.sidebarState.value);
  }
}
