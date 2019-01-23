import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import * as firebase from 'firebase';

import { TrainerhomePage } from '../trainerhome/trainerhome';
import { LoginPage } from '../login/login';

/**
 * Generated class for the TrainerChatPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-trainer-chat',
  templateUrl: 'trainer-chat.html',
})
export class TrainerChatPage {

  uid: string;
  userName: string;
  tid: string;
  messages = [];
  message = '';
  limit = 10;

  constructor(public navCtrl: NavController, public navParams: NavParams, private storage: Storage) {

    this.uid = navParams.get("userID");
    if(this.uid === undefined || this.uid == null || this.uid.trim() == ""){
      navCtrl.setRoot(TrainerhomePage)
    }
    this.userName = navParams.get("name");
    this.storage.get("trainerLoggedID").then(result => {
      if(result === undefined || result.trim() == "" || result == null){
        navCtrl.setRoot(LoginPage);
      }
      this.tid = result;

      let self = this;

      let chat = firebase.database().ref(`/chat/${self.uid}/${self.tid}`);
      /*chat.push().set({
        author: self.uid,
        msg: 'ciao'
      });*/
      chat.orderByKey().limitToLast(self.limit).on('value', resp => {
        self.messages = [];
        self.messages = snapshotToArray(resp);
        self.messages.forEach(msg => {
          if(msg.author != self.tid && !msg.read){
            firebase.database().ref(`/chat/${self.uid}/${self.tid}/${msg.key}`).update({
              read: true
            });
          }
        });
      });
    });
  }

  sendMessage() {
    if(this.message.trim() === '')
      return;
    let newData = firebase.database().ref(`/chat/${this.uid}/${this.tid}`).push();
    newData.set({
      author:this.tid,
      msg:this.message,
      sendDate:Date(),
      read: false
    });
    this.message='';
  }

  loadMessages(){
    this.limit += 10;
    let self = this;
    let chat = firebase.database().ref(`/chat/${self.uid}/${self.tid}`);
    chat.off('value');
    chat.orderByKey().limitToLast(self.limit).on('value', resp => {
      self.messages = [];
      self.messages = snapshotToArray(resp);
      self.messages.forEach(msg => {
        if(msg.author != self.uid && !msg.read){
          firebase.database().ref(`/chat/${self.uid}/${self.tid}/${msg.key}`).update({
            read: true
          });
        }
      });
    });
  }

  ionViewDidLoad() {
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
