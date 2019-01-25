import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
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

  constructor(public navCtrl: NavController, public navParams: NavParams, private storage: Storage, private changeRef: ChangeDetectorRef) {


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
      this.tid = navParams.get("trainerID");
      if(this.tid === undefined || this.tid == null || this.tid.trim() == ""){
        firebase.database().ref(`/profile/user/${this.uid}`).once('value', resp => {
          var email = resp.val().trainer;
          self.tid = email.substr(0, email.indexOf('@'));
          firebase.database().ref(`/profile/trainer/${self.tid}`).once('value', resp =>{
            self.trainerName = resp.val().name;
          });
          let chat = firebase.database().ref(`/chat/${self.uid}/${self.tid}`);

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
        });
      } else {
        this.trainerName = navParams.get("trainerName");
        let chat = firebase.database().ref(`/chat/${self.uid}/${self.tid}`);

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
    });


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

  openChatHistory(){
    this.navCtrl.push(ChatHistoryPage);
  }


  /*ionViewCanEnter(): Promise<any>{
   return new Promise((resolve, reject) => {
     this.storage.get("userLoggedID").then(result => {
       if(result === undefined || result == "" || result == null){
         resolve(false);
       }
       this.uid=result;
       //this.uid='tvq2DppxfiVWq78CobleOX21wOu1';
       let self=this;

       firebase.database().ref(`/profile/user/${this.uid}`).once('value', resp => {
         var email = resp.val().trainer;
         self.tid = email.substr(0, email.indexOf('@'));
         let chat = firebase.database().ref(`/chat/${self.uid}/${self.tid}`);

         chat.orderByKey().limitToLast(10).on('value', resp => {
           self.messages = [];
           self.messages = snapshotToArray(resp);
           resolve(true);
         });
       });
     });
   });
 }*/


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
