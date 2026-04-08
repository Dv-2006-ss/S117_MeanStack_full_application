import { Component, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, AuthResponse } from '../auth.service';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast';
import { 
  LucideAngularModule, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Chrome, 
  Twitter, 
  Gamepad2 
} from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, LucideAngularModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements AfterViewInit {
  readonly MailIcon = Mail;
  readonly LockIcon = Lock;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly ChromeIcon = Chrome;
  readonly TwitterIcon = Twitter;
  readonly Gamepad2Icon = Gamepad2;

  email = '';
  password = '';
  message = '';
  showPassword = false;
  loading = false;
  remember = false;
  isSuccess = false;

  @ViewChild('videoBackground') videoRef!: ElementRef<HTMLVideoElement>;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) { }

  ngAfterViewInit() {
    if (this.videoRef && this.videoRef.nativeElement) {
      this.videoRef.nativeElement.muted = true;
      this.videoRef.nativeElement.play().catch(err => console.error('Video autoplay failed:', err));
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login(event?: Event) {
    if (event) {
      event.preventDefault();
    }

    this.message = '';

    if (!this.email || !this.email.trim()) {
      this.message = "Enter email";
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.message = "Invalid email format";
      return;
    }

    if (!this.password) {
      this.message = "Enter password";
      return;
    }

    this.loading = true;

    this.auth.login(this.email, this.password)
      .subscribe({
        next: (res: AuthResponse) => {
          if (res.token && res.user) {
            this.isSuccess = true;
            this.cdr.detectChanges();
            
            setTimeout(() => {
              this.loading = false;
              this.isSuccess = false;
              this.toast.show('Login successful', 'success');
              const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/app/dashboard';
              this.router.navigateByUrl(returnUrl);
            }, 1000);
          } else {
            this.loading = false;
            this.message = "Login failed: No credentials returned";
          }
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.message = err.error?.message || "Invalid credentials or server offline";
          this.cdr.detectChanges();
        }
      });
  }

  goRegister(event?: Event) {
    if (event) event.preventDefault();
    this.router.navigate(['/register']);
  }

  showGoogleToast(event?: Event) {
    if (event) event.preventDefault();
    this.toast.show('Google/Social sign-in is not active yet.', 'info');
  }
}
