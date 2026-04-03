import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './layout/navbar/navbar';
import { SidebarComponent } from './layout/sidebar/sidebar';
import { AuthService } from './auth/auth.service';
import { GlobalToastComponent } from './layout/global-toast';
import { filter } from 'rxjs/operators';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent, GlobalToastComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  currentUrl = '';

  constructor(private auth: AuthService, private router: Router) {
    if (localStorage.getItem('token')) {
      console.log("Session restored");
    }

    this.currentUrl = this.router.url;
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl = (event as NavigationEnd).urlAfterRedirects;
      });
  }

  isLogged(): boolean {
    return this.auth.isLoggedIn();
  }

  isAuthRoute(): boolean {
    return this.currentUrl.startsWith('/login') || this.currentUrl.startsWith('/register');
  }
}
