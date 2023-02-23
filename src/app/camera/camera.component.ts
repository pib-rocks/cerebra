import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.css']
})
export class CameraComponent {
  componentName = "Live view";

  sliderTrigger$ = new Subject<string>();
  refreshRateControl = new FormControl(0.5);
  selectedSize = '480p';

  setActive(event: MouseEvent) {
    const target = event.target as HTMLAnchorElement;

    const items = target.parentElement?.parentElement?.querySelectorAll(".dropdown-item") as NodeListOf<HTMLAnchorElement>;
    items.forEach(item => item.classList.remove('active'));

    target.classList.add('active');
    this.selectedSize = target.textContent ?  target.textContent.split(' ')[0] : '';
  }
}
