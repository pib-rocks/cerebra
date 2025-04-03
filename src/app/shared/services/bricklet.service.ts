import {Injectable} from "@angular/core";
import {Bricklet} from "../types/bricklet";
import {
    BehaviorSubject,
    catchError,
    forkJoin,
    map,
    Observable,
    Subject,
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
        const updateRequests = bricklets.map((bricklet) => {
            return this.apiService.put(
                UrlConstants.BRICKLET + `/${bricklet.brickletNumber}`,
                {
                    uid: bricklet.uid,
                },
            );
        });

        const fork = forkJoin(updateRequests).pipe(
            catchError((err) => {
                return err;
            }),
        );

        fork.subscribe({
            next: () => {
                this.matSnackBarService.open(
                    "Hardware-IDs successfully set!",
                    "",
                    {
                        panelClass: "cerebra-toast",
                        duration: 3000,
                    },
                );
                this.brickletSubject.next(bricklets);
            },
            error: () => {
                this.matSnackBarService.open(
                    "Error! IDs could not be set.",
                    "",
                    {
                        panelClass: "cerebra-toast",
                        duration: 3000,
                    },
                );
            },
        });
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
}
