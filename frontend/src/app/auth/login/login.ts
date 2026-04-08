import { Component, ChangeDetectorRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, AuthResponse } from '../auth.service';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {

  email = '';
  password = '';
  message = '';
  showPassword = false;
  loading = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) { }

  login() {

    this.message = '';

    // EMAIL VALIDATION
    if (!this.email || !this.email.trim()) {
      this.message = "Enter email";
      return;
    }

    // EMAIL FORMAT
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.message = "Invalid email format";
      return;
    }

    // PASSWORD VALIDATION
    if (!this.password) {
      this.message = "Enter password";
      return;
    }

    this.loading = true;

    // Use centralized AuthService
    this.auth.login(this.email, this.password)
      .subscribe({
        next: (res: AuthResponse) => {
          this.loading = false;
          
          if (res.token && res.user) {
            this.toast.show('Login successful', 'success');
            
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/app/dashboard';
            this.router.navigateByUrl(returnUrl);
          } else {
            this.message = "Login failed: No credentials returned";
          }
          this.cdr.detectChanges();
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.message = err.error?.message || "Invalid credentials or server offline";
          this.cdr.detectChanges();
        }
      });
  }

  goRegister() {
    this.router.navigate(['/register']);
  }

  showGoogleToast() {
    this.toast.show('Google sign-in is not part of the CampaignAI MVP yet.', 'info');
  }
}
