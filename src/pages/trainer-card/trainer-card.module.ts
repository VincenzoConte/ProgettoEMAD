import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TrainerCardPage } from './trainer-card';

@NgModule({
  declarations: [
    TrainerCardPage,
  ],
  imports: [
    IonicPageModule.forChild(TrainerCardPage),
  ],
})
export class TrainerCardPageModule {}
