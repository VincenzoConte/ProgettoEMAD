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

  myUsers = [];
  tid: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, public storage: Storage) {

    this.storage.get("trainerLoggedID").then(result => {
      this.tid=result;
      let users = firebase.database().ref(`/profile/trainer/${this.tid}/myUsers`);
      let self=this;

      users.orderByKey().on('value', resp => {
        self.myUsers = [];
        self.myUsers = snapshotToArray(resp);
      });
    });

  }

  ionViewDidLoad() {
  }

  openUser(uid: string){
    
  }

  logout(){
    this.storage.ready().then(() => {
      this.storage.set("userLogin", "NOT_LOGGED").then(() =>{
        this.storage.set("trainerLoggedID", "");
        console.log("logging out...");
        firebase.auth().signOut();
        this.navCtrl.setRoot(LoginPage);
      });
    });
  }

}


export const snapshotToArray = snapshot => {
    let returnArr = [];

    snapshot.forEach(childSnapshot => {
        let item = childSnapshot.val();
        returnArr.push(item);
    });

    return returnArr;
};
