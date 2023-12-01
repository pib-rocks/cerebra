import {Observable} from "rxjs";
import {SidebarElement} from "./sidebar-element.interface";

export interface SidebarService {
    getSubject(uuid?: string): Observable<SidebarElement[]>;
}
