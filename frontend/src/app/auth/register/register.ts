import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ToastService } from '../../core/services/toast';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {

  name = '';
  companyName = '';
  email = '';
  password = '';
  confirmPassword = '';
  brandVoice = 'Clear, practical, and trustworthy';
  primaryOffer = '';
  audienceDescription = '';
  preferredChannels: string[] = ['email', 'sms'];
  showPassword = false;

  message = '';
  loading = false;
  success = false;

  constructor(
    private router: Router,
    private auth: AuthService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) { }

  register() {

    this.message = "";

    // NAME
    if (!this.name.trim()) {
      this.message = "Enter name";
      return;
    }

    // COMPANY NAME
    if (!this.companyName.trim()) {
      this.message = "Enter company name";
      return;
    }

    // EMAIL
    if (!this.email.trim()) {
      this.message = "Enter email";
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.message = "Invalid email format";
      return;
    }

    // PASSWORD STRENGTH
    if (!this.passwordStrong) {
      this.message = "Weak password (min 6 chars)";
      return;
    }

    // MATCH CHECK
    if (!this.passwordsMatch) {
      this.message = "Passwords do not match";
      return;
    }

    this.loading = true;

    // Use centralized AuthService
    this.auth.register({
      name: this.name,
      companyName: this.companyName,
      email: this.email,
      password: this.password,
      brandProfile: {
        brandVoice: this.brandVoice,
        primaryOffer: this.primaryOffer,
        audienceDescription: this.audienceDescription,
        preferredChannels: this.preferredChannels
      }
    })
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.success = true;
          if (res.token && res.user) {
            this.auth.loginSuccess(res.token, res.user);
          }
          this.toast.show('Registration successful', 'success');
          
          setTimeout(() => {
            this.router.navigate(['/app/dashboard']);
          }, 1200);
        },
        error: (err) => {
          this.loading = false;
          this.message = err.error?.message || "Registration failed";
          // Important for ensuring UI updates in all Angular versions
          if (this.cdr) this.cdr.detectChanges();
        }
      });
  }

  get passwordStrong() {
    return this.password && this.password.length >= 6;
  }

  get passwordsMatch() {
    return this.password === this.confirmPassword && this.confirmPassword.length > 0;
  }

  goLogin() {
    this.router.navigate(['/login']);
  }

  togglePreferredChannel(channel: string): void {
    if (this.preferredChannels.includes(channel)) {
      this.preferredChannels = this.preferredChannels.filter((entry) => entry !== channel);
      return;
    }

    this.preferredChannels = [...this.preferredChannels, channel];
  }

  showGoogleToast() {
    this.toast.show('Google sign-in is not part of the CampaignAI MVP yet.', 'info');
  }
}
