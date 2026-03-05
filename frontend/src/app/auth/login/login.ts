import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../core/services/toast';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {

  email = '';
  password = '';
  message = '';
  showPassword = false;
  loading = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private toast: ToastService
  ) { }

  login() {

    this.message = '';

    // EMAIL VALIDATION
    if (!this.email || !this.email.trim()) {
      this.message = "Enter email";
      return;
    }

    // EMAIL FORMAT
    const emailRegex = /^[^\s@]+@[^\s@]+.[^\s@]+$/;
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

    // ===== API LOGIN =====
    this.http.post<any>(`${environment.api}/api/auth/login`, {
      email: this.email,
      password: this.password
    })
      .subscribe({

        next: (res: any) => {


          console.log("LOGIN RESPONSE:", res); // debug

          if (!res.token) {
            this.message = "Login failed: no token";
            this.loading = false;
            return;
          }

          // ✅ FIX: use service method so navbar gets user data
          this.auth.loginSuccess(res.token, res.user);

          // (kept your original lines — not removed)
          localStorage.setItem('token', res.token);
          localStorage.setItem('username', res.user?.name || 'User');

          this.auth.setLoggedIn(true);

          this.loading = false;

          // redirect
          const returnUrl =
            this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

          this.router.navigateByUrl(returnUrl);


        },

        error: (err) => {
          this.loading = false;
          this.message = err.error?.message || "Invalid credentials or server offline";
        }
      });

  }

  // register navigation
  goRegister() {
    this.router.navigate(['/register']);
  }

  showGoogleToast() {
    this.toast.show('Google Workspace integration is coming soon!', 'info');
  }
}
