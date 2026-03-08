import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Conversation,
  ApiResponse,
  MessageAttachment,
} from '../models/lofu.models';

@Injectable({ providedIn: 'root' })
export class ClaimsService {
  private readonly apiUrl = `${environment.apiUrl}/claims`;

  constructor(private http: HttpClient) {}

  startClaim(postId: string, initialMessage?: string): Observable<ApiResponse<Conversation>> {
    return this.http
      .post<ApiResponse<Conversation>>(this.apiUrl, { postId, initialMessage })
      .pipe(catchError(this._handleError('Failed to start claim')));
  }

  getMyConversations(): Observable<ApiResponse<Conversation[]>> {
    return this.http
      .get<ApiResponse<Conversation[]>>(this.apiUrl)
      .pipe(catchError(this._handleError('Failed to load conversations')));
  }

  getConversation(id: string): Observable<ApiResponse<Conversation>> {
    return this.http
      .get<ApiResponse<Conversation>>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this._handleError('Failed to load conversation')));
  }

  sendMessage(
    conversationId: string,
    content: string,
    attachments: Partial<MessageAttachment>[] = []
  ): Observable<ApiResponse<any>> {
    return this.http
      .post<ApiResponse<any>>(`${this.apiUrl}/${conversationId}/messages`, {
        content,
        attachments,
      })
      .pipe(catchError(this._handleError('Failed to send message')));
  }

  submitProof(
    conversationId: string,
    description: string,
    attachments: Partial<MessageAttachment>[] = []
  ): Observable<ApiResponse<Conversation>> {
    return this.http
      .post<ApiResponse<Conversation>>(`${this.apiUrl}/${conversationId}/proof`, {
        description,
        attachments,
      })
      .pipe(catchError(this._handleError('Failed to submit proof')));
  }

  approveClaim(
    conversationId: string,
    details: { finderNote?: string; meetupLocation?: string; meetupScheduled?: string }
  ): Observable<ApiResponse<Conversation>> {
    return this.http
      .patch<ApiResponse<Conversation>>(`${this.apiUrl}/${conversationId}/approve`, details)
      .pipe(catchError(this._handleError('Failed to approve claim')));
  }

  rejectClaim(
    conversationId: string,
    finderNote?: string
  ): Observable<ApiResponse<Conversation>> {
    return this.http
      .patch<ApiResponse<Conversation>>(`${this.apiUrl}/${conversationId}/reject`, { finderNote })
      .pipe(catchError(this._handleError('Failed to reject claim')));
  }

  private _handleError(fallbackMsg: string) {
    return (err: any) =>
      throwError(() => new Error(err.error?.message || fallbackMsg));
  }
}