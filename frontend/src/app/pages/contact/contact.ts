import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar';
import { Footer} from '../../shared/footer';

// ── EmailJS ──────────────────────────────────────────────────────
// 1. Run: npm install @emailjs/browser
// 2. Replace the three constants below with your EmailJS credentials
// 3. Create a template in EmailJS with variables:
//    {{from_name}}, {{from_email}}, {{phone}}, {{message}}
// ─────────────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';   // e.g. 'service_abc123'
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';  // e.g. 'template_xyz789'
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';   // e.g. 'user_aBcDeFgHiJk'

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Navbar, Footer],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact {
  name     = '';
  email    = '';
  phone    = '';
  message  = '';

  loading  = false;
  error    = '';
  showModal = false;

  async onSubmit() {
    if (!this.name || !this.email || !this.message) {
      this.error = 'Please fill in your name, email, and message.';
      return;
    }

    this.loading = true;
    this.error   = '';

    try {
      // Dynamically import EmailJS so it's only loaded when needed
      const emailjs = await import('@emailjs/browser');

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name:  this.name,
          from_email: this.email,
          phone:      this.phone || 'Not provided',
          message:    this.message,
        },
        EMAILJS_PUBLIC_KEY,
      );

      // Success — show modal and reset form
      this.showModal = true;
      this.name      = '';
      this.email     = '';
      this.phone     = '';
      this.message   = '';

    } catch (err: any) {
      this.error = 'Failed to send message. Please try again or email us directly.';
      console.error('EmailJS error:', err);
    } finally {
      this.loading = false;
    }
  }

  closeModal() {
    this.showModal = false;
  }
}