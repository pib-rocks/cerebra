import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'cerebra2';
  constructor(private router: Router){}
  routeToLeftArm(){
    this.router.navigate(['/arm/left'])
  }
}
