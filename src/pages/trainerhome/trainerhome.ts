import { Storage } from '@ionic/storage';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import firebase from 'firebase';
import { LoginPage } from '../login/login';
import { TrainerChatPage } from '../trainer-chat/trainer-chat';

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
      if(result === undefined || result == "" || result == null){
        navCtrl.setRoot(LoginPage);
      }
      this.tid=result;
      let users = firebase.database().ref(`/profile/trainer/${this.tid}/users`);
      let self=this;

      users.orderByKey().on('value', resp => {
        self.myUsers = [];
        resp.forEach(child => {
          firebase.database().ref(`/profile/user/${child.val().uid}`).once('value', user => {
            self.myUsers.push({name: user.val().name, uid: user.key});
          });
        });
      });
    });

  }

  ionViewDidLoad() {
  }


  openUser(uid: string, name: string){
    this.navCtrl.push( TrainerChatPage, {
      userID: uid,
      name: name
    });
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
