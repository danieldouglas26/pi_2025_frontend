// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withDebugTracing } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http'; // Importe withInterceptorsFromDi e HTTP_INTERCEPTORS
import { JwtInterceptor } from './core/interceptors/jwt.interceptor'; // Importe o interceptor

import { routes } from './app.routes'; // Suas rotas

export const appConfig: ApplicationConfig = {
  providers: [
        provideRouter(routes), // Adicione withDebugTracing() aqui

    provideHttpClient(withInterceptorsFromDi()), // Habilita interceptores baseados em DI
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true } // Registre o interceptor
  ]
};


/* src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations'; // OR provideNoopAnimations
import { JwtInterceptor } from './core/interceptors/jwt.interceptor'; // Importe o interceptor

// import { provideNoopAnimations } from '@angular/platform-browser/animations';


import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    provideAnimations(), // Ensure this line is present and correctly imported
    // or use provideNoopAnimations() if you don't need animations:
    // provideNoopAnimations(),
  ]
}; */
