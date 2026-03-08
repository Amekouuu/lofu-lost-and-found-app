// ────────────────────────────────────────────────────────────────
//  LoFu – JWT Auth Interceptor
//  src/app/interceptors/auth.interceptor.ts
//
//  Automatically attaches the JWT Bearer token to every outbound
//  HTTP request that targets the LoFu API.
// ────────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/Auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Only inject token for requests to our own API
    const isApiRequest = request.url.startsWith(environment.apiUrl);
    const token = this.authService.getToken();

    if (isApiRequest && token) {
      request = request.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Auto-logout on 401 Unauthorized
        if (error.status === 401 && isApiRequest) {
          this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }
}