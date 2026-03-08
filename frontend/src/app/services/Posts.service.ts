// ────────────────────────────────────────────────────────────────
//  LoFu – Posts Service
//  src/app/services/posts.service.ts
//
//  Handles all communication with the /api/posts endpoints:
//  - Fetching the filtered public feed (with RxJS BehaviorSubject state)
//  - Creating, updating, deleting posts
//  - Fetching filter metadata (landmarks, categories, colors)
// ────────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
  catchError,
  throwError,
  shareReplay,
} from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Post,
  PostFilters,
  CreatePostDto,
  UpdatePostDto,
  PaginatedResponse,
  ApiResponse,
  FilterMetadata,
} from '../models/lofu.models';

@Injectable({ providedIn: 'root' })
export class PostsService {
  private readonly apiUrl = `${environment.apiUrl}/posts`;

  // ── Filter & Pagination State ──────────────────────────────────
  private readonly _filters$ = new BehaviorSubject<PostFilters>({
    status: 'Active',
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // ── Loading & Error State ─────────────────────────────────────
  private readonly _loading$ = new BehaviorSubject<boolean>(false);
  private readonly _error$ = new BehaviorSubject<string | null>(null);

  // ── Posts State ────────────────────────────────────────────────
  private readonly _posts$ = new BehaviorSubject<Post[]>([]);
  private readonly _totalPages$ = new BehaviorSubject<number>(1);
  private readonly _total$ = new BehaviorSubject<number>(0);

  // ── Public Observables ─────────────────────────────────────────
  readonly filters$ = this._filters$.asObservable();
  readonly loading$ = this._loading$.asObservable();
  readonly error$ = this._error$.asObservable();
  readonly posts$ = this._posts$.asObservable();
  readonly totalPages$ = this._totalPages$.asObservable();
  readonly total$ = this._total$.asObservable();

  // ── Filter metadata cache (landmarks, categories, colors) ──────
  private _filterMetadata$: Observable<FilterMetadata> | null = null;

  constructor(private http: HttpClient) {
    // Automatically fetch posts whenever filters change (debounced)
    this._filters$
      .pipe(
        debounceTime(300),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        tap(() => {
          this._loading$.next(true);
          this._error$.next(null);
        }),
        switchMap((filters) => this._fetchPosts(filters))
      )
      .subscribe({
        next: (response) => {
          this._posts$.next(response.data);
          this._totalPages$.next(response.pagination.totalPages);
          this._total$.next(response.pagination.total);
          this._loading$.next(false);
        },
        error: (err) => {
          this._error$.next(err.message || 'Failed to load posts');
          this._loading$.next(false);
        },
      });
  }

  // ── Private: Build HTTP request ───────────────────────────────
  private _fetchPosts(filters: PostFilters): Observable<PaginatedResponse<Post>> {
    let params = new HttpParams();

    const addParam = (key: string, value: string | number | undefined) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    };

    addParam('status', filters.status);
    addParam('type', filters.type);
    addParam('landmark', filters.landmark);
    addParam('category', filters.category);
    addParam('color', filters.color);
    addParam('dateFrom', filters.dateFrom);
    addParam('dateTo', filters.dateTo);
    addParam('search', filters.search);
    addParam('page', filters.page);
    addParam('limit', filters.limit);
    addParam('sortBy', filters.sortBy);
    addParam('sortOrder', filters.sortOrder);

    return this.http
      .get<PaginatedResponse<Post>>(this.apiUrl, { params })
      .pipe(
        catchError((err) =>
          throwError(() => new Error(err.error?.message || 'Server error'))
        )
      );
  }

  // ── Public: Update one or more filters ────────────────────────
  setFilters(partial: Partial<PostFilters>): void {
    const current = this._filters$.getValue();
    // Reset to page 1 when any non-pagination filter changes
    const resetPage = Object.keys(partial).some((k) => k !== 'page' && k !== 'limit');
    this._filters$.next({
      ...current,
      ...partial,
      page: resetPage ? 1 : (partial.page ?? current.page),
    });
  }

  // ── Public: Clear all filters ─────────────────────────────────
  clearFilters(): void {
    this._filters$.next({
      status: 'Active',
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }

  // ── Public: Navigate pages ────────────────────────────────────
  goToPage(page: number): void {
    this.setFilters({ page });
  }

  nextPage(): void {
    const current = this._filters$.getValue();
    if ((current.page ?? 1) < this._totalPages$.getValue()) {
      this.setFilters({ page: (current.page ?? 1) + 1 });
    }
  }

  prevPage(): void {
    const current = this._filters$.getValue();
    if ((current.page ?? 1) > 1) {
      this.setFilters({ page: (current.page ?? 1) - 1 });
    }
  }

  // ── Public: Force refresh with current filters ─────────────────
  refresh(): void {
    const current = this._filters$.getValue();
    this._filters$.next({ ...current });
  }

  // ── Public: Get single post ────────────────────────────────────
  getPost(id: string): Observable<ApiResponse<Post>> {
    return this.http.get<ApiResponse<Post>>(`${this.apiUrl}/${id}`).pipe(
      catchError((err) =>
        throwError(() => new Error(err.error?.message || 'Post not found'))
      )
    );
  }

  // ── Public: Create post ────────────────────────────────────────
  createPost(dto: CreatePostDto): Observable<ApiResponse<Post>> {
    return this.http.post<ApiResponse<Post>>(this.apiUrl, dto).pipe(
      tap(() => this.refresh()), // Refresh feed after creation
      catchError((err) =>
        throwError(() => new Error(err.error?.message || 'Failed to create post'))
      )
    );
  }

  // ── Public: Update post ────────────────────────────────────────
  updatePost(id: string, dto: UpdatePostDto): Observable<ApiResponse<Post>> {
    return this.http.patch<ApiResponse<Post>>(`${this.apiUrl}/${id}`, dto).pipe(
      tap(() => this.refresh()),
      catchError((err) =>
        throwError(() => new Error(err.error?.message || 'Failed to update post'))
      )
    );
  }

  // ── Public: Delete post ────────────────────────────────────────
  deletePost(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.refresh()),
      catchError((err) =>
        throwError(() => new Error(err.error?.message || 'Failed to delete post'))
      )
    );
  }

  // ── Public: Lazy-loaded filter metadata ───────────────────────
  getFilterMetadata(): Observable<FilterMetadata> {
    if (!this._filterMetadata$) {
      this._filterMetadata$ = this.http
        .get<ApiResponse<FilterMetadata>>(`${this.apiUrl}/meta/filters`)
        .pipe(
          switchMap((res) => [res.data]),
          shareReplay(1) // Cache the response for the life of the service
        );
    }
    return this._filterMetadata$;
  }

  // ── Convenience: Get current filters snapshot ─────────────────
  get currentFilters(): PostFilters {
    return this._filters$.getValue();
  }

  get currentPage(): number {
    return this._filters$.getValue().page ?? 1;
  }

  get isLoading(): boolean {
    return this._loading$.getValue();
  }
}