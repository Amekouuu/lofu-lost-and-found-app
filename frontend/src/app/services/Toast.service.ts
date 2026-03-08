// ────────────────────────────────────────────────────────────────
//  LoFu – Toast Service
//  src/app/services/toast.service.ts
// ────────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id:      number;
  message: string;
  type:    'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts$ = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this._toasts$.asObservable();
  private _nextId  = 0;

  success(message: string, duration = 3500) {
    this._add({ message, type: 'success' }, duration);
  }

  error(message: string, duration = 4000) {
    this._add({ message, type: 'error' }, duration);
  }

  info(message: string, duration = 3500) {
    this._add({ message, type: 'info' }, duration);
  }

  dismiss(id: number) {
    this._toasts$.next(this._toasts$.getValue().filter(t => t.id !== id));
  }

  private _add(toast: Omit<Toast, 'id'>, duration: number) {
    const id = this._nextId++;
    this._toasts$.next([...this._toasts$.getValue(), { ...toast, id }]);
    setTimeout(() => this.dismiss(id), duration);
  }
}