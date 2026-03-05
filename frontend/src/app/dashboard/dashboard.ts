import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  userName: string = '';
  isLogged: boolean = false;

  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit() {
    this.isLogged = this.auth.isLoggedIn();
    const user = this.auth.getCurrentUser();
    if (user && user.name) {
      this.userName = user.name;
    }
  }

  onBuildClick() {
    if (this.isLogged) {
      this.router.navigate(['/customers']);
    } else {
      this.router.navigate(['/login']);
    }
  }

}
