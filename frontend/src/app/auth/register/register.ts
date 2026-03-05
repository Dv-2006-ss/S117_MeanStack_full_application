import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth.service';
import { ToastService } from '../../core/services/toast';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {

  name = '';
  companyName = ''; // ✅ added
  age = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;

  message = '';
  loading = false;
  success = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private auth: AuthService,
    private toast: ToastService
  ) { }

  register() {

    this.message = "";

    // NAME
    if (!this.name.trim()) {
      this.message = "Enter name";
      return;
    }

    // COMPANY NAME ✅ REQUIRED
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
      this.message = "Weak password";
      return;
    }

    // MATCH CHECK
    if (!this.passwordsMatch) {
      this.message = "Passwords do not match";
      return;
    }

    this.loading = true;

    // ✅ CORRECT PAYLOAD
    this.http.post<any>(`${environment.api}/api/auth/register`, {
      name: this.name,
      companyName: this.companyName,
      email: this.email,
      password: this.password
    })
      .subscribe({

        next: (res) => {

          this.loading = false;
          this.success = true;

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1200);
        },

        error: (err) => {
          this.loading = false;
          this.message = err.error?.message || "Registration failed";
        }
      });
  }

  get passwordStrong() {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$/.test(this.password);
  }

  get passwordsMatch() {
    return this.password === this.confirmPassword && this.confirmPassword.length > 0;
  }

  goLogin() {
    this.router.navigate(['/login']);
  }

  showGoogleToast() {
    this.toast.show('Google Workspace integration is coming soon!', 'info');
  }
}
