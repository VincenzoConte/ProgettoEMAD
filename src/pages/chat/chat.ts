import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import * as firebase from 'firebase';

import { LoginPage } from '../login/login';

/**
 * Generated class for the ChatPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-chat',
  templateUrl: 'chat.html',
})
export class ChatPage {

  public uid: string;
  public tid: string;
  messages = [];
  message = '';

  constructor(public navCtrl: NavController, public navParams: NavParams, private storage: Storage) {

    this.storage.get("userLoggedID").then(result => {
      if(result === undefined || result == "" || result == null){
        this.navCtrl.setRoot(LoginPage);
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
          self.messages.forEach(msg => {
            if(msg.author != self.uid && !msg.read){
              firebase.database().ref(`/chat/${self.uid}/${self.tid}/${msg.key}`).update({
                read: true
              });
            }
          });
        });
      });
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
    this.messages.forEach(msg => {
      if(msg.author != this.uid && msg.read == false){
        console.log("update");
        firebase.database().ref(`/chat/${this.uid}/${this.tid}/${msg.key}`).update({
          read: true
        });
      }
    });
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
