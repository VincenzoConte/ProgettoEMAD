import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TrainerCardsListPage } from './trainer-cards-list';

@NgModule({
  declarations: [
    TrainerCardsListPage,
  ],
  imports: [
    IonicPageModule.forChild(TrainerCardsListPage),
  ],
})
export class TrainerCardsListPageModule {}
