import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  // 🔥 IMPORTANT: backend port 5000
  private baseUrl = 'http://localhost:5000/api/customers';

  constructor(private http: HttpClient) { }

  getCustomers(token: string) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get(this.baseUrl, { headers });
  }

  addCustomer(data: any, token: string) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post(this.baseUrl, data, { headers });
  }

  updateCustomer(id: string, data: any, token: string) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.put(`${this.baseUrl}/${id}`, data, { headers });
  }

  deleteCustomer(id: string, token: string) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.delete(`${this.baseUrl}/${id}`, { headers });
  }

}