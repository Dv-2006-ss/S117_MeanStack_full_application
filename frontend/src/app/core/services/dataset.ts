import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DatasetService {

    constructor(private http: HttpClient) { }

    saveDataset(data: any, token: string) {
        return this.http.post(
            `${environment.api}/api/datasets`,
            data,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
    }

    getDatasets(token: string) {
        return this.http.get(
            `${environment.api}/api/datasets`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
    }

    deleteDataset(id: string, token: string) {
        return this.http.delete(
            `${environment.api}/api/datasets/${id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
    }

    updateDataset(id: string, data: any, token: string) {
        return this.http.put(
            `${environment.api}/api/datasets/${id}`,
            data,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
    }
}