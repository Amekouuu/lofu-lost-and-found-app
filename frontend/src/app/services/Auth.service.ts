// ────────────────────────────────────────────────────────────────
//  LoFu – Auth Service
//  src/app/services/auth.service.ts
// ────────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuthUser,
  LoginDto,
  RegisterDto,
  AuthResponse,
  ApiResponse,
} from '../models/lofu.models';

const TOKEN_KEY = 'lofu_token';
const USER_KEY  = 'lofu_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // Restore user from localStorage immediately on service init
  private readonly _currentUser$ = new BehaviorSubject<AuthUser | null>(
    this._loadUserFromStorage()
  );

  readonly currentUser$ = this._currentUser$.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // If we have a token, silently refresh user data from server
    if (this.getToken()) {
      this.fetchMe().subscribe({
        error: () => {} // logout is handled inside fetchMe on error
      });
    }
  }

  get currentUser(): AuthUser | null {
    return this._currentUser$.getValue();
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser && !!this.getToken();
  }

  get token(): string | null {
    return this.getToken();
  }

  // ── Register ─────────────────────────────────────────────────
  register(dto: RegisterDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, dto).pipe(
      tap((res) => this._handleAuth(res)),
      catchError((err) =>
        throwError(() => new Error(err.error?.message || 'Registration failed'))
      )
    );
  }

  // ── Login ─────────────────────────────────────────────────────
  login(dto: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, dto).pipe(
      tap((res) => this._handleAuth(res)),
      catchError((err) =>
        throwError(() => new Error(err.error?.message || 'Login failed'))
      )
    );
  }

  // ── Fetch /me ─────────────────────────────────────────────────
  fetchMe(): Observable<ApiResponse<AuthUser>> {
    return this.http.get<ApiResponse<AuthUser>>(`${this.apiUrl}/me`).pipe(
      tap((res) => {
        this._currentUser$.next(res.data);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data));
      }),
      catchError((err) => {
        this.logout();
        return throwError(() => new Error('Session expired'));
      })
    );
  }

  // ── Logout ────────────────────────────────────────────────────
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser$.next(null);
    this.router.navigate(['/']);
  }

  // ── Token helpers ─────────────────────────────────────────────
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  // ── Private: persist auth state ──────────────────────────────
  private _handleAuth(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.data));
    this._currentUser$.next(res.data);
  }

  // ── Private: restore user from localStorage ───────────────────
  private _loadUserFromStorage(): AuthUser | null {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const user  = localStorage.getItem(USER_KEY);

      if (!token || !user) return null;

      // Check token expiry
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return null;
      }

      return JSON.parse(user) as AuthUser;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}