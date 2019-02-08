import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { TrainerCardsListPage } from '../trainer-cards-list/trainer-cards-list';
import { TrainerhomePage } from '../trainerhome/trainerhome';


/**
 * Generated class for the TrainerTabsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-trainer-tabs',
  templateUrl: 'trainer-tabs.html',
})
export class TrainerTabsPage {
  trainerTab1 = TrainerCardsListPage;
  trainerTab2 = TrainerhomePage;
  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams) {
    
  }
}