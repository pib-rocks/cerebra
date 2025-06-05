import {Injectable} from "@angular/core";
import {Bricklet} from "../types/bricklet";
import {
    BehaviorSubject,
    catchError,
    forkJoin,
    map,
    Observable,
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

    public renameBrickletUid(bricklets: Bricklet[]) {
        const dummyBricklets = bricklets.map((bricklet) => ({
            ...bricklet,
            uid: `temp${bricklet.brickletNumber}`,
        }));

        this.updateBrickletUidsInDb(dummyBricklets, false).subscribe({
            next: () => {
                this.updateBrickletUidsInDb(bricklets, true).subscribe({
                    error: () => {
                        this.matSnackBarService.open(
                            "Error! IDs could not be set.",
                            "",
                            {panelClass: "cerebra-toast", duration: 3000},
                        );
                    },
                });
            },
            error: () => {
                this.matSnackBarService.open(
                    "Error! Temporary IDs could not be set. Please try again.",
                    "",
                    {panelClass: "cerebra-toast", duration: 3000},
                );
            },
        });
    }

    private updateBrickletUidsInDb(
        bricklets: Bricklet[],
        showSnackbar: boolean,
    ): Observable<Bricklet[]> {
        const updateRequests = bricklets.map((bricklet) => {
            return this.apiService.put(
                UrlConstants.BRICKLET + `/${bricklet.brickletNumber}`,
                {
                    uid: bricklet.uid ? bricklet.uid : null,
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
}
