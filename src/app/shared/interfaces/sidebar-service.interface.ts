import {BehaviorSubject, Observable} from "rxjs";
import {SidebarElement} from "./sidebar-element.interface";

export interface SidebarService {
    add(element: SidebarElement | string): void;
    update(element: SidebarElement | string): void;
    delete(element: SidebarElement | string): void;
    getSubject(): Observable<SidebarElement[]>;
}
