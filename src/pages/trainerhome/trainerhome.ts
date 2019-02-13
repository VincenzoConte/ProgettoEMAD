import { Storage } from '@ionic/storage';
import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, NavParams, ToastController } from 'ionic-angular';
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
  intervalID: number;

  constructor(public navCtrl: NavController, private toastCtrl: ToastController, public navParams: NavParams, public storage: Storage, private changeRef: ChangeDetectorRef) {


  }

  ionViewWillEnter() {

    this.storage.get("trainerLoggedID").then(result => {
      if(result === undefined || result == "" || result == null){
        this.navCtrl.setRoot(LoginPage);
      }
      this.tid=result;
      this.intervalID = setInterval(() => {
        this.changeRef.detectChanges();
      }, 1000);
      let users = firebase.database().ref(`/profile/trainer/${this.tid}/users`);
      let self=this;

      users.orderByKey().on('value', resp => {
        self.myUsers = [];
        resp.forEach(child => {
          /*firebase.database().ref(`/profile/user/${child.val().uid}`).once('value', user => {
            self.myUsers.push({name: user.val().name, uid: user.key, notRead: false});
            firebase.database().ref(`/chat/${child.val().uid}/${self.tid}`).orderByKey().limitToLast(1).on('value', self.checkChat, self);
          });*/

          self.myUsers.push({name: child.val().username, uid: child.key, training: child.val().training, notRead: false});
          firebase.database().ref(`/chat/${child.key}/${self.tid}`).orderByKey().limitToLast(1).on('value', self.checkChat, self);
        });
      });
    });
  }

  findUser(element, index, array){
    return element.uid == this;
  }

  checkChat(resp){
    if(resp.exists()){
      resp.forEach(msg => {
        if(!msg.val().read && msg.val().author != this.tid){
          let userID = resp.ref.parent.key;
          let curUserIndex = this.myUsers.findIndex(this.findUser, userID);
          let curUser = this.myUsers[curUserIndex];
          this.myUsers.splice(curUserIndex, 1);
          curUser.notRead = true;
          this.myUsers.unshift(curUser);
        }
      });
    }
  }

  ionViewDidLeave(){
    clearInterval(this.intervalID);
    this.myUsers.forEach(user => {
      firebase.database().ref(`/chat/${user.uid}/${this.tid}`).off('value', this.checkChat, this);
    });
  }


  openUser(uid: string, name: string){
    this.navCtrl.push( TrainerChatPage, {
      userID: uid,
      name: name
    });
  }

  /**
   * Mostra un toast del messaggio passato
   * @param message
   * @param time
   */
  showToast(message, time?){
    this.toastCtrl.create({
            message: message,
            duration: time || 3500
        }).present();
  }

  logout(){
    this.storage.ready().then(() => {
      this.storage.set("trainerLoggedID", "").then(() =>{
        console.log("logging out...");
        firebase.auth().signOut();
        this.showToast("Alla prossima!", 3500);
        window.location.reload();
      });
    });
  }

}
