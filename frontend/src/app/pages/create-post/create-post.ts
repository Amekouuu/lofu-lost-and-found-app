import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Navbar} from '../../shared/navbar';
import { Footer } from '../../shared/footer';
import { PostsService } from '../../services/Posts.service';
import { AuthService } from '../../services/Auth.service';
import { ToastService } from '../../services/Toast.service';

import {
  ANGELES_CITY_LANDMARKS,
  ITEM_CATEGORIES,
  ITEM_COLORS,
  PostType,
} from '../../models/lofu.models';


@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule,Navbar, Footer],
  templateUrl: './create-post.html',
  styleUrl: './create-post.css',
})
export class CreatePost implements OnInit {
  landmarks  = ANGELES_CITY_LANDMARKS;
  categories = ITEM_CATEGORIES;
  colors     = ITEM_COLORS;
  timeOptions = ['Morning', 'Afternoon', 'Evening', 'Night', 'Unknown'];

  // Form fields
  type: PostType        = 'Lost';
  itemName              = '';
  category              = '';
  color                 = '';
  secondaryColor        = '';
  brand                 = '';
  description           = '';
  landmark              = '';
  landmarkDetail        = '';
  incidentDate          = '';
  incidentTimeApprox    = 'Unknown';
  tags                  = '';

  // Image previews (base64 for preview only — real upload would use Cloudinary/S3)
  imagePreviews: string[] = [];
  imageFiles: File[]      = [];

  loading  = false;
  error    = '';
  step     = 1; // 1 = Item Info, 2 = Location & Date, 3 = Review

  constructor(
    private postsService: PostsService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
  ) {}

  ngOnInit() {
    // Redirect if not logged in
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
    }
  }

  get isStep1Valid(): boolean {
    return !!(this.itemName && this.type && this.category && this.color && this.description);
  }

  get isStep2Valid(): boolean {
    return !!(this.landmark && this.incidentDate);
  }

  get parsedTags(): string[] {
    return this.tags.split(',').map(t => t.trim()).filter(Boolean);
  }

  nextStep() {
    if (this.step === 1 && !this.isStep1Valid) {
      this.error = 'Please fill in all required fields.';
      return;
    }
    if (this.step === 2 && !this.isStep2Valid) {
      this.error = 'Please select a landmark and date.';
      return;
    }
    this.error = '';
    this.step++;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prevStep() {
    this.error = '';
    this.step--;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    Array.from(input.files).forEach(file => {
      if (this.imageFiles.length >= 4) return; // max 4 images
      this.imageFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviews.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number) {
    this.imagePreviews.splice(index, 1);
    this.imageFiles.splice(index, 1);
  }

  onSubmit() {
    if (!this.isStep1Valid || !this.isStep2Valid) {
      this.error = 'Please complete all required fields.';
      return;
    }

    this.loading = true;
    this.error   = '';

    // NOTE: Image upload to Cloudinary/S3 would happen here before creating the post.
    // For now we submit without images until cloud storage is configured.
    this.postsService.createPost({
      type:               this.type,
      itemName:           this.itemName,
      category:           this.category as any,
      color:              this.color as any,
      secondaryColor:     this.secondaryColor as any || undefined,
      brand:              this.brand || undefined,
      description:        this.description,
      landmark:           this.landmark as any,
      landmarkDetail:     this.landmarkDetail || undefined,
      incidentDate:       this.incidentDate,
      incidentTimeApprox: this.incidentTimeApprox as any,
      tags:               this.parsedTags,
    }).subscribe({
      next: (res) => {
  this.toastService.success('Your post has been submitted! 🎉');
  this.router.navigate(['/lost-items']);
},
      error: (err) => {
        this.error   = err.message || 'Failed to create post. Please try again.';
        this.loading = false;
      },
    });
  }
}