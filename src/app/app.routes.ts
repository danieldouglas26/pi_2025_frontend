import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./components/layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard - GreenLog'
      },

      {
        path: 'bairros',
        loadComponent: () => import('./components/bairros/bairro-list/bairro-list.component').then(m => m.BairroListComponent),
        title: 'Bairros - GreenLog'
      },
      {
        path: 'bairros/new',
        loadComponent: () => import('./components/bairros/bairro-form/bairro-form.component').then(m => m.BairroFormComponent),
        title: 'Novo Bairro - GreenLog'
      },
      {
        path: 'bairros/edit/:id',
        loadComponent: () => import('./components/bairros/bairro-form/bairro-form.component').then(m => m.BairroFormComponent),
        title: 'Editar Bairro - GreenLog'
      },
      {
        path: 'trucks',
        loadComponent: () => import('./components/trucks/truck-list/truck-list.component').then(m => m.TruckListComponent),
        title: 'Caminhões - GreenLog'
      },
      {
        path: 'trucks/edit/:id',
        loadComponent: () => import('./components/trucks/truck-form/truck-form.component').then(m => m.TruckFormComponent),
        title: 'Editar Caminhão - GreenLog'
      },
      {
        path: 'trucks/new',
        loadComponent: () => import('./components/trucks/truck-form/truck-form.component').then(m => m.TruckFormComponent),
        title: 'Novo Caminhão - GreenLog'
      },
      {
        path: 'collection-points',
        loadComponent: () => import('./components/collection-points/collection-point-list/collection-point-list.component').then(m => m.CollectionPointListComponent),
        title: 'Pontos de Coleta - GreenLog'
      },
      {
        path: 'collection-points/edit/:id',
        loadComponent: () => import('./components/collection-points/collection-point-form/collection-point-form.component').then(m => m.CollectionPointFormComponent),
        title: 'Editar Ponto de Coleta - GreenLog'
      },
      {
        path: 'collection-points/new',
        loadComponent: () => import('./components/collection-points/collection-point-form/collection-point-form.component').then(m => m.CollectionPointFormComponent),
        title: 'Novo Ponto de Coleta - GreenLog'
      },
      {
        path: 'routes',
        loadComponent: () => import('./components/routes/route-list/route-list.component').then(m => m.RouteListComponent),
        title: 'Rotas - GreenLog'
      },
      {
        path: 'routes/edit/:id',
        loadComponent: () => import('./components/routes/route-form/route-form.component').then(m => m.RouteFormComponent),
        title: 'Editar Rota - GreenLog'
      },
      {
        path: 'routes/new',
        loadComponent: () => import('./components/routes/route-form/route-form.component').then(m => m.RouteFormComponent),
        title: 'Nova Rota - GreenLog'
      },
      {
        path: 'itineraries',
        loadComponent: () => import('./components/itineraries/itinerary-planner/itinerary-planner.component').then(m => m.ItineraryPlannerComponent),
        title: 'Planejador de Itinerários - GreenLog'
      },
      {
        path: 'itineraries/edit/:id',
        loadComponent: () => import('./components/itineraries/itinerary-form/itinerary-form.component').then(m => m.ItineraryFormComponent),
        title: 'Editar Itinerário - GreenLog'
      },
      {
        path: 'itineraries/new',
        loadComponent: () => import('./components/itineraries/itinerary-form/itinerary-form.component').then(m => m.ItineraryFormComponent),
        title: 'Novo Itinerário - GreenLog'
      },
      {
        path: 'streets',
        loadComponent: () => import('./components/streets/street-list/street-list.component').then(m => m.StreetListComponent),
        title: 'Ruas - GreenLog'
      },
      {
        path: 'streets/edit/:id',
        loadComponent: () => import('./components/streets/street-form/street-form.component').then(m => m.StreetFormComponent),
        title: 'Editar Rua - GreenLog'
      },
      {
        path: 'streets/new',
        loadComponent: () => import('./components/streets/street-form/street-form.component').then(m => m.StreetFormComponent),
        title: 'Nova Rua - GreenLog'
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./components/shared/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Página Não Encontrada - GreenLog'
  }
];
