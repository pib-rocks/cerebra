import {Injectable} from "@angular/core";
import {Observable, ReplaySubject} from "rxjs";

@Injectable({
    providedIn: "root",
})
export class UtilService {
    static createResultObservable<Type>(
        obs: Observable<any>,
        mapper: (response: any) => Type,
    ): Observable<Type> {
        const result: ReplaySubject<Type> = new ReplaySubject();
        obs.subscribe({
            next: (res) => result.next(mapper(res)),
            error: (err) => {
                console.log(err);
                result.error(err);
            },
        });
        return result;
    }
}
