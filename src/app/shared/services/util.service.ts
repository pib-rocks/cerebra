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

    getFromMapOrDefault<KeyType, ValueType>(
        map: Map<KeyType, ValueType>,
        key: KeyType,
        defaultValueGenerator: () => ValueType,
    ): ValueType {
        let value = map.get(key);
        if (value === undefined) {
            value = defaultValueGenerator();
            map.set(key, value);
        }
        return value;
    }
}
