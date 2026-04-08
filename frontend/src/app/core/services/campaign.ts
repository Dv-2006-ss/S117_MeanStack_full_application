import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EmailBlock {
  type: string;
  content?: string;
  text?: string;
  url?: string;
  align?: 'left' | 'center' | 'right';
}

export interface CampaignHistory {
  _id?: string;
  id?: string;
  name: string;
  status: string;
  createdAt?: string;
}

export interface GeneratedOutputs {
  email: {
    subject: string;
    body: string;
  };
  sms: {
    message: string;
  };
  social: {
    posts: string[];
  };
  ads: {
    headlines: string[];
    body: string;
  };
  landingPage: {
    headline: string;
    subhead: string;
    cta: string;
    sections: string[];
  };
}

export interface Campaign {
  _id?: string;
  id?: string;
  name: string;
  goal?: string;
  subject?: string;
  product?: string;
  offer?: string;
  cta?: string;
  selectedChannels?: string[];
  sourceDataset?: {
    id?: string;
    name: string;
    customerCount?: number;
  };
  sourceSegment?: string;
  blocks?: EmailBlock[];
  htmlContent?: string;
  message?: string;
  targetAudience?: any[];
  status?: string;
  scheduledAt?: string;
  sentCount?: number;
  generatedOutputs?: GeneratedOutputs;
}

export interface CampaignOverview {
  totalCampaigns: number;
  draftCount: number;
  scheduledCount: number;
  sentCount: number;
  audienceReached: number;
  activeDatasets: number;
  nextRecommendedAction: string;
  recentCampaigns: Campaign[];
}

export interface EmailCampaignPayload {
  name: string;
  subject: string;
  product: string;
  offer: string;
  blocks: EmailBlock[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  campaign?: T;
  history?: T;
  overview?: T;
  generatedOutputs?: T;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CampaignService {
  private apiUrl = `${environment.api}/api/campaigns`;

  // --- STATE MANAGEMENT: Angular Signals ---
  public emailSubject = signal<string>('New Email Campaign');
  public emailBlocks = signal<EmailBlock[]>([]);
  public smsBlocks = signal<any[]>([]); // ✅ Added for SMS Canvas support
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
  getHistory(): Observable<CampaignHistory[]> {
    return this.http.get<CampaignHistory[]>(`${this.apiUrl}/history`, { headers: this.getHeaders() });
  }

  saveHistory(data: CampaignHistory): Observable<ApiResponse<CampaignHistory>> {
    return this.http.post<ApiResponse<CampaignHistory>>(`${this.apiUrl}/history`, data, { headers: this.getHeaders() });
  }

  deleteHistory(id: string): Observable<ApiResponse<{}>> {
    return this.http.delete<ApiResponse<{}>>(`${this.apiUrl}/history/${id}`, { headers: this.getHeaders() });
  }

  // ================= CAMPAIGN LIST ENDPOINTS =================
  getCampaigns(): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  saveCampaign(data: Campaign): Observable<ApiResponse<Campaign>> {
    return this.http.post<ApiResponse<Campaign>>(this.apiUrl, data, { headers: this.getHeaders() });
  }

  generateCampaign(data: Partial<Campaign>): Observable<ApiResponse<GeneratedOutputs>> {
    return this.http.post<ApiResponse<GeneratedOutputs>>(`${this.apiUrl}/generate`, data, { headers: this.getHeaders() });
  }

  getOverview(): Observable<ApiResponse<CampaignOverview>> {
    return this.http.get<ApiResponse<CampaignOverview>>(`${this.apiUrl}/overview`, { headers: this.getHeaders() });
  }

  sendCampaign(id: string, payload: Partial<Campaign>): Observable<ApiResponse<Campaign>> {
    return this.http.post<ApiResponse<Campaign>>(`${this.apiUrl}/send/${id}`, payload, { headers: this.getHeaders() });
  }

  // ================= ENDPOINTS FOR JSON/TEMPLATE DRIVEN EMAILS =================
  createEmailCampaign(data: EmailCampaignPayload): Observable<ApiResponse<Campaign>> {
    return this.http.post<ApiResponse<Campaign>>(`${this.apiUrl}/email`, data, { headers: this.getHeaders() });
  }
}
