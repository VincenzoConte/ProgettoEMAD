import { Storage } from '@ionic/storage';
import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import firebase from 'firebase';

import { LoginPage } from '../login/login';
import { ChatPage } from '../chat/chat';



@Component({
  selector: 'page-chat-history',
  templateUrl: 'chat-history.html',
})
export class ChatHistoryPage {

  myChats = [];
  uid: string;
  intervalID: number;

  constructor(public navCtrl: NavController, public navParams: NavParams, public storage: Storage, private changeRef: ChangeDetectorRef) {

    this.storage.get("userLoggedID").then(result => {
      if(result === undefined || result == "" || result == null){
        navCtrl.setRoot(LoginPage);
      }
      this.uid=result;
      this.intervalID = setInterval(() => {
        this.changeRef.detectChanges();
      }, 1000);
      let users = firebase.database().ref(`/chat/${this.uid}`);
      let self=this;

      users.orderByKey().on('value', resp => {
        self.myChats = [];
        let chats = snapshotToArray(resp);
        chats.reverse();
        chats.forEach(child => {
          console.log(child.key);
          firebase.database().ref(`/profile/trainer/${child.key}`).once('value', trainer => {
            self.myChats.push({name: trainer.val().name, tid: trainer.key});
          });
        });
      });
    });
  }

  openChat(tid: string, name: string){
    this.navCtrl.push(ChatPage, {
      trainerID: tid,
      trainerName: name
    });
  }

  ionViewDidLoad() {

  }

  ionViewDidLeave(){
    clearInterval(this.intervalID);
  }

}


export const snapshotToArray = snapshot => {
    let returnArr = [];
    snapshot.forEach(childSnapshot => {
        let item = childSnapshot.val();
        item.key = childSnapshot.key;
        returnArr.push(item);
    });

    return returnArr;
};
