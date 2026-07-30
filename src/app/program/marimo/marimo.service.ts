import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
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

    constructor(private http: HttpClient) {}

    getNotebooks(): Observable<{ status: string; notebooks: MarimoNotebook[] }> {
        return this.http.get<{ status: string; notebooks: MarimoNotebook[] }>(
            `${this.baseUrl}/notebooks`
        );
    }

    createNotebook(name: string, content?: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/notebooks`, { name, content });
    }

    renameNotebook(oldName: string, newName: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/notebooks/${oldName}/rename`, { newName });
    }

    deleteNotebook(name: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/notebooks/${name}`);
    }
}
