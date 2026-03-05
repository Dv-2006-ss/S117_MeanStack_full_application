import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './layout/navbar/navbar';
import { SidebarComponent } from './layout/sidebar/sidebar';
import { AuthService } from './auth/auth.service';
import { GlobalToastComponent } from './layout/global-toast';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent, GlobalToastComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  constructor(private auth: AuthService) {
    if (localStorage.getItem('token')) {
      console.log("Session restored");
    }
  }

  isLogged(): boolean {
    return this.auth.isLoggedIn();
  }
}
