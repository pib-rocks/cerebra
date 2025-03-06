import {Injectable} from "@angular/core";
import {Bricklet, BrickletDTO} from "../types/bricklet";
import {BehaviorSubject, map, Observable, Subject} from "rxjs";
import {ApiService} from "./api.service";
import {UrlConstants} from "./url.constants";

@Injectable({
    providedIn: "root",
})
export class BrickletService {
    private bricklets: Bricklet[] = [];
    private brickletSubject: Subject<Bricklet[]> = new BehaviorSubject(
        this.bricklets,
    );

    constructor(private apiService: ApiService) {
        this.getAllBrickletsFromDb().subscribe((bricklets) => {
            this.bricklets.push(...bricklets);
            this.brickletSubject.next(this.bricklets);
            console.log(this.bricklets);
        });
    }

    public getBrickletObservable(): Observable<Bricklet[]> {
        return this.brickletSubject;
    }

    public renameBrickletUid(brickletUid: string, brickletNumber: number) {
        this.renameBrickletUidInDb(brickletUid, brickletNumber).subscribe(
            () => {
                const bricklet = this.getCachedBrickletOfNumber(brickletNumber);
                if (bricklet) {
                    bricklet.uid = brickletUid;
                    console.log(bricklet);
                    this.brickletSubject.next(this.bricklets);
                }
            },
        );
    }

    private getAllBrickletsFromDb(): Observable<Bricklet[]> {
        return this.apiService.get(UrlConstants.BRICKLET).pipe(
            map((brickletsDto) => {
                const brickletDtos: BrickletDTO[] = brickletsDto["bricklets"];
                return brickletDtos.map(
                    (dto) => new Bricklet(dto.uid, dto.brickletNumber),
                );
            }),
        );
    }

    private renameBrickletUidInDb(brickletUid: string, brickletNumber: number) {
        return this.apiService.put(
            `${UrlConstants.BRICKLET}/${brickletNumber}`,
            {uid: brickletUid ? brickletUid : null},
        );
    }

    private getCachedBrickletOfNumber(
        brickletNumber: number,
    ): Bricklet | undefined {
        return this.bricklets.find(
            (bricklet) => bricklet.brickletNumber === brickletNumber,
        );
    }
}
