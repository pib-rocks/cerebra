import {Injectable} from "@angular/core";
import {Bricklet} from "../types/bricklet";
import {ConnectedBricklet} from "../types/connected-bricklet";
import {
    BehaviorSubject,
    catchError,
    forkJoin,
    map,
    Observable,
    ReplaySubject,
    Subject,
    tap,
    throwError,
} from "rxjs";
import {ApiService} from "./api.service";
import {UrlConstants} from "./url.constants";
import {MatSnackBar} from "@angular/material/snack-bar";

@Injectable({
    providedIn: "root",
})
export class BrickletService {
    private bricklets: Bricklet[] = [];
    private brickletSubject: Subject<Bricklet[]> = new BehaviorSubject(
        this.bricklets,
    );

    constructor(
        private apiService: ApiService,
        private matSnackBarService: MatSnackBar,
    ) {
        this.getAllBrickletsFromDb().subscribe((bricklets) => {
            this.bricklets.push(...bricklets);
            this.brickletSubject.next(this.bricklets);
        });
    }

    public getBrickletObservable(): Observable<Bricklet[]> {
        return this.brickletSubject;
    }

    public reloadBrickletsFromDb(): void {
        this.getAllBrickletsFromDb().subscribe((bricklets) => {
            this.bricklets = bricklets;
            this.brickletSubject.next(this.bricklets);
        });
    }

    /**
     * Two-phase write: a temporary UID first, then the real one, so two slots
     * can swap UIDs without the motors node seeing a duplicate. Emits once
     * the real UID is stored. The cache emission happens before that, inside
     * the successful second write.
     */
    public renameBrickletUid(bricklets: Bricklet[]): Observable<void> {
        const result$ = new ReplaySubject<void>(1);
        const dummyBricklets = bricklets.map((bricklet) => ({
            ...bricklet,
            uid: `temp${bricklet.brickletNumber}`,
        }));

        this.updateBrickletUidsInDb(dummyBricklets, false).subscribe({
            next: () => {
                this.updateBrickletUidsInDb(bricklets, true).subscribe({
                    next: () => {
                        result$.next();
                        result$.complete();
                    },
                    error: () => {
                        this.matSnackBarService.open(
                            "Error! IDs could not be set.",
                            "",
                            {panelClass: "cerebra-toast", duration: 3000},
                        );
                        result$.complete();
                    },
                });
            },
            error: () => {
                this.matSnackBarService.open(
                    "Error! Temporary IDs could not be set. Please try again.",
                    "",
                    {panelClass: "cerebra-toast", duration: 3000},
                );
                result$.complete();
            },
        });
        return result$.asObservable();
    }

    private updateBrickletUidsInDb(
        bricklets: Bricklet[],
        showSnackbar: boolean,
    ): Observable<Bricklet[]> {
        const updateRequests = bricklets.map((bricklet) => {
            return this.apiService.put(
                UrlConstants.BRICKLET + `/${bricklet.brickletNumber}`,
                {
                    // The API contract is: an empty string means "not
                    // configured". null is rejected with 400 ("Bricklet UID
                    // must be a string"), so clearing a slot has to send "".
                    uid: bricklet.uid ? bricklet.uid : "",
                },
            );
        });

        return forkJoin(updateRequests).pipe(
            catchError((err) => {
                return throwError(() => err);
            }),
            tap(() => {
                if (showSnackbar) {
                    this.matSnackBarService.open(
                        "Hardware-IDs successfully set!",
                        "",
                        {panelClass: "cerebra-toast", duration: 3000},
                    );
                    bricklets.forEach((changedBricklet) => {
                        const index = this.bricklets.findIndex(
                            (b) =>
                                b.brickletNumber ===
                                changedBricklet.brickletNumber,
                        );
                        if (index !== -1) {
                            this.bricklets[index] = changedBricklet;
                        }
                    });
                    this.brickletSubject.next(this.bricklets);
                }
            }),
        );
    }

    private getAllBrickletsFromDb(): Observable<Bricklet[]> {
        return this.apiService.get(UrlConstants.BRICKLET).pipe(
            map((brickletsDto) => {
                const brickletDtos = brickletsDto["bricklets"];
                return brickletDtos.map((brickletDto: Bricklet) =>
                    Bricklet.fromDTO(brickletDto),
                );
            }),
        );
    }

    public getBricklet(brickletNumber: number): Bricklet | undefined {
        return this.bricklets.find((b) => b.brickletNumber === brickletNumber);
    }

    /**
     * Reads the Bricklets the hardware actually reports. This is a plain read
     * of the current enumeration and does not touch the configured Bricklets
     * held by this service.
     */
    public getConnectedBricklets(): Observable<ConnectedBricklet[]> {
        return this.apiService
            .get(UrlConstants.BRICKLET_CONNECTED)
            .pipe(
                map(
                    (response): ConnectedBricklet[] =>
                        response?.["bricklets"] ?? [],
                ),
            );
    }
}
