import { Component, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent {

  isLogged = false;
  isDropdownOpen = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private eRef: ElementRef
  ) {
    // REALTIME SUBSCRIBE
    this.auth.authState$.subscribe(state => {
      this.isLogged = state;
    });
  }

  getUserName(): string {

    // 🔹 get stored user safely
    const user = this.auth.getCurrentUser?.()
      || JSON.parse(localStorage.getItem("user") || "null");

    // 🔹 debug log removed to prevent change detection spam

    // 🔹 return priority order
    return user?.name
      || user?.Name
      || user?.companyName
      || 'User';
  }

  logout() {
    this.closeDropdown();
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }
}