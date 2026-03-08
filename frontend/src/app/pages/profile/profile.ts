import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Navbar } from '../../shared/navbar';
import { Footer } from '../../shared/footer';
import { AuthService } from '../../services/Auth.service';
import { PostsService } from '../../services/Posts.service';
import { User, Post } from '../../models/lofu.models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Navbar, Footer],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  user: User | null        = null;
  posts: Post[]            = [];
  isOwnProfile             = false;
  loading                  = true;
  postsLoading             = true;
  error                    = '';

  // Edit form fields
  editDisplayName          = '';
  editPhone                = '';
  editBarangay             = '';
  editLandmark             = '';
  avatarPreview: string | null = null;
  avatarFile: File | null  = null;

  // Modal states
  showEditModal            = false;
  showDeleteModal          = false;
  showSaveModal            = false;
  saving                   = false;
  saveError                = '';

  // Active tab
  activeTab: 'posts' | 'about' = 'posts';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    public authService: AuthService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.loadProfile(params['id']);
    });
  }

  loadProfile(id: string) {
    this.loading = true;
    this.error   = '';

    this.http.get<any>(`${environment.apiUrl}/users/${id}`).subscribe({
      next: (res) => {
        this.user        = res.data;
        this.posts       = res.data.recentPosts || [];
        this.postsLoading = false;
        this.isOwnProfile = this.authService.currentUser?._id === id;
        this.prefillEditForm();
        this.loading = false;
      },
      error: () => {
        this.error   = 'User not found.';
        this.loading = false;
      },
    });
  }

  prefillEditForm() {
    if (!this.user) return;
    this.editDisplayName = this.user.displayName || '';
    this.editPhone       = this.user.phoneNumber || '';
    this.editBarangay    = this.user.location?.barangay || '';
    this.editLandmark    = this.user.location?.landmark || '';
  }

  openEditModal() {
    this.prefillEditForm();
    this.saveError    = '';
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal  = false;
    this.avatarPreview  = null;
    this.avatarFile     = null;
  }

  onAvatarSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.avatarFile = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.avatarPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  // Save changes — opens confirmation modal
  requestSave() {
    this.showSaveModal = true;
  }

  confirmSave() {
    this.showSaveModal = false;
    this.saving        = true;
    this.saveError     = '';

    const updates: any = {
      displayName: this.editDisplayName,
      phoneNumber:  this.editPhone,
      location: {
        barangay: this.editBarangay,
        landmark: this.editLandmark,
      },
    };

    // NOTE: For avatar upload, integrate Cloudinary/S3 here and pass the URL as avatarUrl
    // if (this.avatarFile) { upload file → get URL → updates.avatarUrl = url }

    this.http.patch<any>(`${environment.apiUrl}/users/me`, updates).subscribe({
      next: (res) => {
        this.user         = { ...this.user!, ...res.data };
        this.saving       = false;
        this.showEditModal = false;
        this.avatarPreview = null;
        this.avatarFile    = null;
        // Refresh auth user
        this.authService.fetchMe().subscribe();
      },
      error: (err) => {
        this.saveError = err.error?.message || 'Failed to save changes.';
        this.saving    = false;
      },
    });
  }

  // Delete account
  openDeleteModal()  { this.showDeleteModal = true; }
  closeDeleteModal() { this.showDeleteModal = false; }

  confirmDelete() {
    this.http.delete(`${environment.apiUrl}/users/me`).subscribe({
      next: () => {
        this.authService.logout();
        this.router.navigate(['/']);
      },
      error: () => {
        this.showDeleteModal = false;
        this.error = 'Failed to delete account. Please try again.';
      },
    });
  }

  getBadgeLabel(type: string): string {
    const map: Record<string, string> = {
      verified_finder:  '✦ Verified Finder',
      good_samaritan:   '🌟 Good Samaritan',
      community_hero:   '🏆 Community Hero',
      first_return:     '🎉 First Return',
    };
    return map[type] || type;
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