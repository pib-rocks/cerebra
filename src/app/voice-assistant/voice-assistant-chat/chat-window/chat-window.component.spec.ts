import {ComponentFixture, TestBed} from "@angular/core/testing";

import {ChatWindowComponent} from "./chat-window.component";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {ActivatedRoute} from "@angular/router";
import {BehaviorSubject} from "rxjs";
import {RouterTestingModule} from "@angular/router/testing";

describe("ChatWindowComponent", () => {
    let component: ChatWindowComponent;
    let fixture: ComponentFixture<ChatWindowComponent>;
    const paramsSubject = new BehaviorSubject({
        uuid: "54321",
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ChatWindowComponent],
            imports: [HttpClientTestingModule, RouterTestingModule],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            data: {
                                personality: "12345",
                                chat: "53421",
                            },
                        },
                        params: paramsSubject,
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatWindowComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
