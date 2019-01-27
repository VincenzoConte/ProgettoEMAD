import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, NavParams, ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import * as firebase from 'firebase';

import { LoginPage } from '../login/login';
import { ChatHistoryPage } from '../chat-history/chat-history';


@Component({
  selector: 'page-chat',
  templateUrl: 'chat.html',
})
export class ChatPage {

  public uid: string;
  public tid: string;
  trainerName: string;
  messages = [];
  message = '';
  limit = 10;
  intervalID: number;

  constructor(public navCtrl: NavController, public navParams: NavParams, private storage: Storage,
    private changeRef: ChangeDetectorRef, public toast: ToastController) {




  }

  sendMessage() {
    if(this.message.trim() === '')
      return;
    let newData = firebase.database().ref(`/chat/${this.uid}/${this.tid}`).push();
    newData.set({
      author:this.uid,
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
      chat.off('value', this.messagesCallback, this);
      chat.orderByKey().limitToLast(self.limit).on('value', self.messagesCallback, this);
    }
  }

  messagesCallback(resp){
    console.log("callback");
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

  openChatHistory(){

    this.navCtrl.push(ChatHistoryPage);
  }


  ionViewWillEnter() {
    this.storage.get('userLoggedID').then(result => {
      if(result === undefined || result == "" || result == null){
        this.navCtrl.setRoot(LoginPage);
      }
      this.uid=result;
      this.intervalID = setInterval(() => {
        this.changeRef.detectChanges();
      }, 1000);
      //this.uid='tvq2DppxfiVWq78CobleOX21wOu1';
      let self=this;
      this.tid = this.navParams.get("trainerID");
      this.intervalID = setInterval(() => {
        this.changeRef.detectChanges();
      }, 1000);
      if(this.tid === undefined || this.tid == null || this.tid.trim() == ""){
        firebase.database().ref(`/profile/user/${this.uid}`).once('value', resp => {
          var email = resp.val().trainer;
          self.tid = email.substr(0, email.indexOf('@'));
          firebase.database().ref(`/profile/trainer/${self.tid}`).once('value', resp =>{
            self.trainerName = resp.val().name;
          });
          let chat = firebase.database().ref(`/chat/${self.uid}/${self.tid}`);
          chat.orderByKey().limitToLast(self.limit).on('value', self.messagesCallback, this);
        });
      } else {
        this.trainerName = this.navParams.get("trainerName");
        let chat = firebase.database().ref(`/chat/${self.uid}/${self.tid}`);
        chat.orderByKey().limitToLast(self.limit).on('value', self.messagesCallback, this);
      }
    });
  }

  ionViewDidLeave(){
    firebase.database().ref(`/chat/${this.uid}/${this.tid}`).off('value', this.messagesCallback, this);
    this.messages = [];
    this.limit = 10;
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
