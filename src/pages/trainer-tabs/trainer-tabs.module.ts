import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TrainerTabsPage } from './trainer-tabs';

@NgModule({
  declarations: [
    TrainerTabsPage,
  ],
  imports: [
    IonicPageModule.forChild(TrainerTabsPage),
  ],
})
export class TrainerTabsPageModule {}
