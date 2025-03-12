import {Injectable} from "@angular/core";
import {Bricklet, BrickletDTO} from "../types/bricklet";
import {
    BehaviorSubject,
    catchError,
    forkJoin,
    map,
    Observable,
    Subject,
    throwError,
} from "rxjs";
import {ApiService} from "./api.service";
import {UrlConstants} from "./url.constants";
import {UtilService} from "./util.service";
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
            console.log(this.bricklets);
        });
    }

    public getBrickletObservable(): Observable<Bricklet[]> {
        return this.brickletSubject;
    }

    // public renameBrickletUid(brickletUid: string, brickletNumber: number) {
    //     this.renameBrickletUidInDb(brickletUid, brickletNumber).subscribe(
    //         (response) => {
    //             const bricklet = this.getCachedBrickletOfNumber(brickletNumber);
    //             if (bricklet) {
    //                 bricklet.uid = brickletUid;
    //                 console.log(bricklet);
    //                 this.brickletSubject.next(this.bricklets);
    //                 this.matSnackBarService.open("Hardware Ids set successfully!", "", {
    //                     panelClass: "cerebra-toast",
    //                     duration: 3000,
    //                 });
    //             }
    //         },
    //         (error) => {
    //             console.error("error", error);
    //             this.matSnackBarService.open("Error occured!", "", {
    //                 panelClass: "cerebra-toast",
    //                 duration: 3000,
    //             });
    //         }
    //     );
    // }

    public renameBrickletUid2(bricklets: Bricklet[]) {
        // forkJoin(bricklets.map(bricklet => {
        //     this.apiService.put(
        //         UrlConstants.BRICKLET + `/${bricklet.brickletNumber}`,
        //         {"uid": bricklet.uid}
        //     )
        // })).pipe(
        //     catchError((error) => {
        //         return throwError(() => {
        //             console.log(error);
        //             this.matSnackBarService.open("Error occured!", "", {
        //                 panelClass: "cerebra-toast",
        //                 duration: 3000,
        //             });
        //         });
        //     })
        // )

        forkJoin([
            bricklets.map((bricklet) => {
                this.apiService
                    .put(
                        UrlConstants.BRICKLET + `/${bricklet.brickletNumber}`,
                        {uid: bricklet.uid},
                    )
                    .pipe(
                        catchError((err) => {
                            return throwError(() => {
                                console.log(err);
                                this.matSnackBarService.open(
                                    "Error occured!",
                                    "",
                                    {
                                        panelClass: "cerebra-toast",
                                        duration: 3000,
                                    },
                                );
                            });
                        }),
                    )
                    .subscribe(() => {
                        const newbricklet = this.getCachedBrickletOfNumber(
                            bricklet.brickletNumber,
                        );
                        if (newbricklet) {
                            newbricklet.uid = bricklet.uid;
                            console.log(newbricklet);
                            this.brickletSubject.next(this.bricklets);
                            this.matSnackBarService.open(
                                "Hardware-IDs successfully set!",
                                "",
                                {
                                    panelClass: "cerebra-toast",
                                    duration: 3000,
                                },
                            );
                        }
                    });
            }),
        ]);
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

    private renameBrickletUidInDb(
        brickletUid: string,
        brickletNumber: number,
    ): Observable<any> {
        // return this.apiService.put(
        //     `${UrlConstants.BRICKLET}/${brickletNumber}`,
        //     {uid: brickletUid},
        // );
        return UtilService.createResultObservable(
            this.apiService.put(UrlConstants.BRICKLET + `/${brickletNumber}`, {
                uid: brickletUid,
            }),
            (response) => {
                console.log("response:", response);
                return response;
            },
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
