import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "../../shared/services/api.service";
import { UrlConstants } from "../../shared/services/url.constants";

export interface MarimoNotebook {
    name: string;
    title: string;
    path: string;
    updatedAt: number;
    sizeBytes: number;
}

@Injectable({
    providedIn: "root",
})
export class MarimoService {
    private baseUrl = UrlConstants.MARIMO;

    constructor(private apiService: ApiService) {}

    getNotebooks(): Observable<any> {
        return this.apiService.get(`${this.baseUrl}/notebooks`);
    }

    createNotebook(name: string, content?: string): Observable<any> {
        return this.apiService.post(`${this.baseUrl}/notebooks`, { name, content });
    }

    renameNotebook(oldName: string, newName: string): Observable<any> {
        return this.apiService.post(`${this.baseUrl}/notebooks/${oldName}/rename`, { newName });
    }

    deleteNotebook(name: string): Observable<any> {
        return this.apiService.delete(`${this.baseUrl}/notebooks/${name}`);
    }
}
