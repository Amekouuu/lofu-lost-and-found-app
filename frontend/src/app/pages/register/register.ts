import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/Auth.service';
import { ToastService } from '../../services/Toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  firstName   = '';
  lastName    = '';
  email       = '';
  phone       = '';
  password    = '';
  confirmPass = '';
  showPass    = false;
  showConfirm = false;
  loading     = false;
  error       = '';

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
  ) {}

  get username(): string {
    return (this.firstName + this.lastName).toLowerCase().replace(/\s+/g, '');
  }

  get displayName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  onSubmit() {
    if (!this.firstName || !this.lastName || !this.email || !this.password || !this.confirmPass) {
      this.error = 'Please fill in all required fields.';
      return;
    }
    if (this.password !== this.confirmPass) {
      this.error = 'Passwords do not match.';
      return;
    }
    if (this.password.length < 8) {
      this.error = 'Password must be at least 8 characters.';
      return;
    }

    this.loading = true;
    this.error   = '';

    this.authService.register({
      username:    this.username,
      email:       this.email,
      password:    this.password,
      displayName: this.displayName,
    }).subscribe({
      next: (res) => {
        this.toastService.success(`Welcome to LoFu, ${res.data.displayName || res.data.username}! 🎉`);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error   = err.message || 'Registration failed. Please try again.';
        this.loading = false;
      },
    });
  }
}