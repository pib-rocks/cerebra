import { Injectable } from "@angular/core";
import { Observable, BehaviorSubject, tap } from "rxjs";
import { ApiService } from "../../shared/services/api.service";
import { UrlConstants } from "../../shared/services/url.constants";
import { SidebarElement } from "../../shared/interfaces/sidebar-element.interface";
import { MarimoWorkbook } from "../../shared/types/marimo-workbook";

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
    public notebooksSubject = new BehaviorSubject<SidebarElement[]>([]);
    public notebooks: MarimoWorkbook[] = [];

    constructor(private apiService: ApiService) {}

    getNotebooks(): Observable<any> {
        return this.apiService.get(`${this.baseUrl}/notebooks`).pipe(
            tap((res: any) => {
                if (res && res.notebooks) {
                    this.notebooks = res.notebooks.map(
                        (nb: MarimoNotebook) => new MarimoWorkbook(nb.title, nb.name)
                    );
                    this.notebooksSubject.next(this.notebooks);
                }
            })
        );
    }

    createNotebook(name: string, content?: string): Observable<any> {
        return this.apiService.post(`${this.baseUrl}/notebooks`, { name, content }).pipe(
            tap(() => this.getNotebooks().subscribe())
        );
    }

    renameNotebook(oldName: string, newName: string): Observable<any> {
        return this.apiService.post(`${this.baseUrl}/notebooks/${oldName}/rename`, { newName }).pipe(
            tap(() => this.getNotebooks().subscribe())
        );
    }

    deleteNotebook(name: string): Observable<any> {
        return this.apiService.delete(`${this.baseUrl}/notebooks/${name}`).pipe(
            tap(() => this.getNotebooks().subscribe())
        );
    }
}
