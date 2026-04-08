import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  password?: string;
  role?: string;
  companyName?: string;
  timezone?: string;
  notifications?: any;
  brandProfile?: {
    brandVoice: string;
    primaryOffer: string;
    audienceDescription: string;
    preferredChannels: string[];
  };
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  notifications?: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

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
  // REAL BACKEND LOGIN
  // =========================
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(res => {
          if (res.token && res.user) {
            this.loginSuccess(res.token, res.user);
          }
        })
      );
  }

  // =========================
  // REAL BACKEND REGISTER
  // =========================
  register(data: User): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data);
  }

  // =========================
  // AUTH HELPERS
  // =========================
  loginSuccess(token: string, user: User) {
    localStorage.setItem('token', token);
    localStorage.setItem('username', user.name || 'User');
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.authState.next(true);
  }

  setLoggedIn(value: boolean) {
    this.authState.next(value);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('active_dataset');
    this.authState.next(false);
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  // =========================
  // SETTINGS UPDATES
  // =========================
  updateProfile(data: Partial<User>): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.apiUrl}/profile`, data, { headers: this.getHeaders() });
  }

  updatePassword(data: any): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.apiUrl}/password`, data, { headers: this.getHeaders() });
  }

  updateNotifications(data: any): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.apiUrl}/notifications`, data, { headers: this.getHeaders() });
  }
}
