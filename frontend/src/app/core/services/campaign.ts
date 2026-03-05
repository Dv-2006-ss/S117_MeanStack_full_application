import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CampaignService {
  private apiUrl = `${environment.api}/api/campaigns`;

  // --- STATE MANAGEMENT: Angular Signals ---
  public emailSubject = signal<string>('New Email Campaign');
  public emailBlocks = signal<any[]>([]);
  public companyName = signal<string>('Company');

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ================= HISTORY ENDPOINTS =================
  getHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history`, { headers: this.getHeaders() });
  }

  saveHistory(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/history`, data, { headers: this.getHeaders() });
  }

  deleteHistory(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/history/${id}`, { headers: this.getHeaders() });
  }

  // ================= CAMPAIGN LIST ENDPOINTS =================
  getCampaigns(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  saveCampaign(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data, { headers: this.getHeaders() });
  }

  // ================= ENDPOINTS FOR JSON/TEMPLATE DRIVEN EMAILS =================
  createEmailCampaign(data: { name: string, subject: string, product: string, offer: string, blocks: any[] }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/email`, data, { headers: this.getHeaders() });
  }
}
