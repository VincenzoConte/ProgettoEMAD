import { Storage } from '@ionic/storage';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import firebase from 'firebase';
import { LoginPage } from '../login/login';

/**
 * Generated class for the TrainerhomePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-trainerhome',
  templateUrl: 'trainerhome.html',
})
export class TrainerhomePage {

  constructor(public navCtrl: NavController, public navParams: NavParams, public storage: Storage) {
  }

  ionViewDidLoad() {
  }

  logout(){
    this.storage.ready().then(() => {
      this.storage.set("userLogin", "NOT_LOGGED").then(() =>{
        this.storage.set("UserLoginID", "");        
        console.log("logging out...");
        firebase.auth().signOut();
        this.navCtrl.setRoot(LoginPage);
      });    
    });
  }

}
