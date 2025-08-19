import {ComponentFixture, TestBed} from "@angular/core/testing";

import {IpRetrieverComponent} from "./ip-retriever.component";

describe("IpRetrieverComponent", () => {
    let component: IpRetrieverComponent;
    let fixture: ComponentFixture<IpRetrieverComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [IpRetrieverComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(IpRetrieverComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
