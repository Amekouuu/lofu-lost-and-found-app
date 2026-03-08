import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PostsService } from '../../services/Posts.service';
import { AuthService } from '../../services/Auth.service';
import { Navbar } from '../../shared/navbar';
import { Footer } from '../../shared/footer';
import { Post, ANGELES_CITY_LANDMARKS, ITEM_CATEGORIES } from '../../models/lofu.models';

@Component({
  selector: 'app-lost-items',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Navbar, Footer],
  templateUrl: './lost-items.html',
  styleUrl: './lost-items.css',
})
export class LostItems implements OnInit, OnDestroy {
  landmarks  = ANGELES_CITY_LANDMARKS;
  categories = ITEM_CATEGORIES;

  searchQuery       = '';
  selectedLandmark  = '';
  selectedCategory  = '';
  private destroy$  = new Subject<void>();
  private searchTimer: any;

  constructor(
    public postsService: PostsService,
    public authService: AuthService,
  ) {}

  ngOnInit() {
    this.postsService.setFilters({ type: 'Lost', status: 'Active' });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.applyFilters(), 400);
  }

  applyFilters() {
    this.postsService.setFilters({
      type:     'Lost',
      status:   'Active',
      search:   this.searchQuery   || undefined,
      landmark: this.selectedLandmark  as any || undefined,
      category: this.selectedCategory  as any || undefined,
    });
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
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