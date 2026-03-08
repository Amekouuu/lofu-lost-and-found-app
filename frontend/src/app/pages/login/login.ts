import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/Auth.service';
import { ToastService } from '../../services/Toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email    = '';
  password = '';
  remember = false;
  showPass = false;
  loading  = false;
  error    = '';

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
  ) {}

  onSubmit() {
    if (!this.email || !this.password) {
      this.error = 'Please fill in all fields.';
      return;
    }
    this.loading = true;
    this.error   = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.toastService.success(`Welcome back, ${res.data.displayName || res.data.username}! 👋`);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error   = err.message || 'Invalid email or password.';
        this.loading = false;
      },
    });
  }
}