import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Navbar } from '../../shared/navbar';
import { Footer } from '../../shared/footer';
import { AuthService } from '../../services/Auth.service';
import { ToastService } from '../../services/Toast.service';
import { Post } from '../../models/lofu.models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Navbar, Footer],
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.css',
})
export class PostDetail implements OnInit {
  post: Post | null = null;
  loading           = true;
  error             = '';

  // Image gallery
  activeImageIndex  = 0;

  // Claim
  showClaimModal    = false;
  claimMessage      = '';
  claimLoading      = false;
  claimError        = '';
  claimSuccess      = false;

  // Delete
  showDeleteModal   = false;
  deleteLoading     = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    public authService: AuthService,
    private toastService: ToastService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.loadPost(params['id']);
    });
  }

  loadPost(id: string) {
    this.loading = true;
    this.error   = '';

    this.http.get<any>(`${environment.apiUrl}/posts/${id}`).subscribe({
      next: (res) => {
        this.post    = res.data;
        this.loading = false;
      },
      error: () => {
        this.error   = 'Post not found or has been removed.';
        this.loading = false;
      },
    });
  }

  get isOwner(): boolean {
    return !!this.post && !!this.authService.currentUser &&
      this.post.author._id === this.authService.currentUser._id;
  }

  get isLost(): boolean {
    return this.post?.type === 'Lost';
  }

  setActiveImage(index: number) {
    this.activeImageIndex = index;
  }

  // ── Claim ─────────────────────────────────────────────────────
  openClaimModal() {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    this.showClaimModal = true;
    this.claimMessage   = '';
    this.claimError     = '';
  }

  submitClaim() {
    if (!this.claimMessage.trim()) {
      this.claimError = 'Please describe how you found this item.';
      return;
    }
    this.claimLoading = true;
    this.claimError   = '';

    this.http.post<any>(`${environment.apiUrl}/claims`, {
      postId:  this.post?._id,
      message: this.claimMessage,
    }).subscribe({
      next: () => {
        this.claimLoading = false;
        this.claimSuccess = true;
        setTimeout(() => {
          this.showClaimModal = false;
          this.claimSuccess   = false;
          this.toastService.success('Your claim has been submitted! The owner will be in touch. 🙌');
        }, 1800);
      },
      error: (err) => {
        this.claimError   = err.error?.message || 'Failed to submit claim.';
        this.claimLoading = false;
      },
    });
  }

  // ── Delete ────────────────────────────────────────────────────
  confirmDelete() {
    this.deleteLoading = true;
    this.http.delete(`${environment.apiUrl}/posts/${this.post?._id}`).subscribe({
      next: () => {
        this.toastService.success('Post deleted successfully.');
        this.router.navigate(['/lost-items']);
      },
      error: () => {
        this.toastService.error('Failed to delete post.');
        this.deleteLoading  = false;
        this.showDeleteModal = false;
      },
    });
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Electronics': '📱', 'Wallet / Cards': '👛', 'Keys': '🔑',
      'Bag / Luggage': '🎒', 'Clothing': '👕', 'Jewelry / Accessories': '💍',
      'Documents / IDs': '📄', 'Pet': '🐾', 'Eyewear': '👓',
      'Toy / Children Item': '🧸', 'Medical Equipment': '💊',
      'Vehicle Part': '🔧', 'Cash / Money': '💵', 'Other': '📦',
    };
    return icons[category] || '📦';
  }
}