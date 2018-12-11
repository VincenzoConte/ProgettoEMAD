import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { FirstAccessPage } from './first-access';

@NgModule({
  declarations: [
    FirstAccessPage,
  ],
  imports: [
    IonicPageModule.forChild(FirstAccessPage),
  ],
})
export class FirstAccessPageModule {}
