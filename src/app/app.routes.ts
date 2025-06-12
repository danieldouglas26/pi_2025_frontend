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
      // Trucks
      {
        path: 'trucks',
        loadComponent: () => import('./components/trucks/truck-list/truck-list.component').then(m => m.TruckListComponent),
        title: 'Trucks - GreenLog'
      },
      {
        path: 'trucks/edit/:id',
        loadComponent: () => import('./components/trucks/truck-form/truck-form.component').then(m => m.TruckFormComponent),
        title: 'Edit Truck - GreenLog'
      },
      {
        path: 'trucks/new',
        loadComponent: () => import('./components/trucks/truck-form/truck-form.component').then(m => m.TruckFormComponent),
        title: 'New Truck - GreenLog'
      },
      // Collection Points
      {
        path: 'collection-points',
        loadComponent: () => import('./components/collection-points/collection-point-list/collection-point-list.component').then(m => m.CollectionPointListComponent),
        title: 'Collection Points - GreenLog'
      },
      {
        path: 'collection-points/edit/:id',
        loadComponent: () => import('./components/collection-points/collection-point-form/collection-point-form.component').then(m => m.CollectionPointFormComponent),
        title: 'Edit Collection Point - GreenLog'
      },
      {
        path: 'collection-points/new',
        loadComponent: () => import('./components/collection-points/collection-point-form/collection-point-form.component').then(m => m.CollectionPointFormComponent),
        title: 'New Collection Point - GreenLog'
      },
      // Routes
      {
        path: 'routes',
        loadComponent: () => import('./components/routes/route-list/route-list.component').then(m => m.RouteListComponent),
        title: 'Routes - GreenLog'
      },
      {
        path: 'routes/edit/:id',
        loadComponent: () => import('./components/routes/route-form/route-form.component').then(m => m.RouteFormComponent),
        title: 'Edit Route - GreenLog'
      },
      {
        path: 'routes/new',
        loadComponent: () => import('./components/routes/route-form/route-form.component').then(m => m.RouteFormComponent),
        title: 'New Route - GreenLog'
      },
      // Itineraries
      {
        path: 'itineraries',
        loadComponent: () => import('./components/itineraries/itinerary-planner/itinerary-planner.component').then(m => m.ItineraryPlannerComponent),
        title: 'Itinerary Planner - GreenLog'
      },
      {
        path: 'itineraries/edit/:id',
        loadComponent: () => import('./components/itineraries/itinerary-form/itinerary-form.component').then(m => m.ItineraryFormComponent),
        title: 'Edit Itinerary - GreenLog'
      },
      {
        path: 'itineraries/new',
        loadComponent: () => import('./components/itineraries/itinerary-form/itinerary-form.component').then(m => m.ItineraryFormComponent),
        title: 'New Itinerary - GreenLog'
      },
      // Ruas (Streets) - NOVO!
      {
        path: 'streets',
        loadComponent: () => import('./components/streets/street-list/street-list.component').then(m => m.StreetListComponent),
        title: 'Streets - GreenLog'
      },
      {
        path: 'streets/edit/:id',
        loadComponent: () => import('./components/streets/street-form/street-form.component').then(m => m.StreetFormComponent),
        title: 'Edit Street - GreenLog'
      },
      {
        path: 'streets/new',
        loadComponent: () => import('./components/streets/street-form/street-form.component').then(m => m.StreetFormComponent),
        title: 'New Street - GreenLog'
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./components/shared/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Page Not Found - GreenLog'
  }
];
