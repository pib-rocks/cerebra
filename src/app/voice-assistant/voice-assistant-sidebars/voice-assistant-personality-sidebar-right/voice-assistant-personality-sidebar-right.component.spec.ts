// import {ComponentFixture, TestBed} from "@angular/core/testing";
//
// import {HttpClientTestingModule} from "@angular/common/http/testing";
// import {ActivatedRoute} from "@angular/router";
// import {BehaviorSubject, Subject} from "rxjs";
// import {RouterTestingModule} from "@angular/router/testing";
// import {ChatService} from "src/app/shared/services/chat.service";
// import {VoiceAssistantPersonalitySidebarRightComponent} from "./voice-assistant-personality-sidebar-right.component";
//
// describe("ChatWindowComponent", () => {
//     let component: VoiceAssistantPersonalitySidebarRightComponent;
//     let fixture: ComponentFixture<VoiceAssistantPersonalitySidebarRightComponent>;
//     let chatService: jasmine.SpyObj<ChatService>;
//     let paramsSubject: Subject<{chatUuid: string}>;
//
//     beforeEach(async () => {
//         paramsSubject = new BehaviorSubject<{chatUuid: string}>({chatUuid: ""});
//
//         const chatServiceSpy: jasmine.SpyObj<ChatService> =
//             jasmine.createSpyObj(ChatService, [
//                 "getChatMessagesObservable",
//                 "getChat",
//             ]);
//         await TestBed.configureTestingModule({
//             declarations: [VoiceAssistantPersonalitySidebarRightComponent],
//             imports: [HttpClientTestingModule, RouterTestingModule],
//             providers: [
//                 {
//                     provide: ActivatedRoute,
//                     useValue: {
//                         snapshot: {
//                             data: {
//                                 personality: "12345",
//                             },
//                         },
//                         params: paramsSubject,
//                     },
//                 },
//                 {
//                     provide: ChatService,
//                     useValue: chatServiceSpy,
//                 },
//             ],
//         }).compileComponents();
//
//         chatService = TestBed.inject(
//             ChatService,
//         ) as jasmine.SpyObj<ChatService>;
//
//         fixture = TestBed.createComponent(
//             VoiceAssistantPersonalitySidebarRightComponent,
//         );
//         component = fixture.componentInstance;
//         fixture.detectChanges();
//     });

// it("should create", () => {
//     expect(component).toBeTruthy();
// });

//Test für
//adjustThreshold
// it("should test if adjustThreshold sets the pausethreshold correctly", () =>{
//     component.thresholdString = "0.7"
//     component.adjustThreshold("0.1")
//     expect(component.thresholdString).toBe("0.9")
// });
//deletePersonality
//updateForm
//updatePersonality
// });
