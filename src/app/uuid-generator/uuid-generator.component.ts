import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { v1 as uuidv1 } from 'uuid';
import { v4 as uuidv4 } from 'uuid';
import { UtilService } from '../util.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-uuid-generator',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './uuid-generator.component.html',
  styleUrl: './uuid-generator.component.scss',
})
export class UuidGeneratorComponent {
  public uuidv1: string = '';
  public uuidv4: string = '';

  constructor(private utilService: UtilService) {
    this.generateUuid();
  }

  public generateUuid() {
    this.uuidv1 = uuidv1();
    this.uuidv4 = uuidv4();
  }

  public copyToClipboard(text: string | number) {
    this.utilService.copyToClipboard(text);
  }
}
