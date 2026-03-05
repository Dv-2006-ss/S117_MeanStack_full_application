import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {

  // =========================
  // REACTIVE LOGIN STATE
  // =========================
  private authState = new BehaviorSubject<boolean>(this.hasToken());
  authState$ = this.authState.asObservable();
  private apiUrl = `${environment.api}/api/auth`;

  constructor(private http: HttpClient) { }

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // =========================
  // LOGIN (LOCAL STORAGE)
  // =========================
  login(email: string, password: string): boolean {

    const users = this.getUsers();

    const user = users.find((u: any) =>
      u.email === email && u.password === password
    );

    if (user) {
      this.loginSuccess('logged', user);
      return true;
    }

    return false;
  }

  // =========================
  // LOGIN SUCCESS HANDLER
  // =========================
  loginSuccess(token: string, user: any) {
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.authState.next(true);
  }

  // =========================
  // MANUAL LOGIN STATE SETTER
  // =========================
  setLoggedIn(value: boolean) {
    this.authState.next(value);
  }

  // =========================
  // REGISTER
  // =========================
  register(data: any): boolean {

    const users = this.getUsers();

    const exists = users.find((u: any) => u.email === data.email);
    if (exists) return false;

    users.push(data);
    localStorage.setItem('users', JSON.stringify(users));
    return true;
  }

  // =========================
  // LOGOUT
  // =========================
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('active_dataset');
    this.authState.next(false);
  }

  // =========================
  // CHECK LOGIN
  // =========================
  isLoggedIn(): boolean {
    return this.hasToken();
  }

  // =========================
  // CURRENT USER
  // =========================
  getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  // =========================
  // SAFE USER LIST
  // =========================
  private getUsers(): any[] {
    try {
      return JSON.parse(localStorage.getItem('users') || '[]');
    } catch {
      return [];
    }
  }

  // =========================
  // BACKEND INTEGRATION
  // =========================
  updateProfile(data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, data, { headers: this.getHeaders() });
  }

  updatePassword(data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/password`, data, { headers: this.getHeaders() });
  }

  updateNotifications(data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/notifications`, data, { headers: this.getHeaders() });
  }
}
