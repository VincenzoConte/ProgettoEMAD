import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, NavParams, ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import * as firebase from 'firebase';

import { TrainerhomePage } from '../trainerhome/trainerhome';
import { LoginPage } from '../login/login';




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
  intervalID: number;

  constructor(public navCtrl: NavController, public navParams: NavParams, private storage: Storage, private changeRef: ChangeDetectorRef, public toast: ToastController) {


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
    if(this.messages.length < this.limit){
      this.toast.create({
          message: "Non ci sono altri messaggi",
          duration: 3000
      }).present();
    } else{
      this.limit += 10;
      let self = this;
      let chat = firebase.database().ref(`/chat/${self.uid}/${self.tid}`);
      chat.off('value');
      chat.orderByKey().limitToLast(self.limit).on('value', self.messagesCallback, this);
    }
  }

  messagesCallback(resp){
    this.messages = [];
    this.messages = snapshotToArray(resp);
    let notRead = 0;
    this.messages.forEach(msg => {
      if(msg.author != this.uid && !msg.read){
        notRead = notRead + 1;
        firebase.database().ref(`/chat/${this.uid}/${this.tid}/${msg.key}`).update({
          read: true
        });
      }
    });
    if(notRead == 10)
      this.loadMessages();
  }

  ionViewWillEnter() {
    this.uid = this.navParams.get("userID");
    if(this.uid === undefined || this.uid == null || this.uid.trim() == ""){
      this.navCtrl.setRoot(TrainerhomePage)
    }
    this.userName = this.navParams.get("name");
    this.storage.get("trainerLoggedID").then(result => {
      if(result === undefined || result.trim() == "" || result == null){
        this.navCtrl.setRoot(LoginPage);
      }
      this.tid = result;
      this.intervalID = setInterval(() => {
        this.changeRef.detectChanges();
      }, 1000);

      let chat = firebase.database().ref(`/chat/${this.uid}/${this.tid}`);
      chat.orderByKey().limitToLast(this.limit).on('value', this.messagesCallback, this);
    });
  }

  ionViewDidLeave(){
    clearInterval(this.intervalID);
    firebase.database().ref(`/chat/${this.uid}/${this.tid}`).off('value', this.messagesCallback, this);
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
