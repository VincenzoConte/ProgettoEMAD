import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import * as firebase from 'firebase';

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
  messages=[];
  message = '';

  constructor(public navCtrl: NavController, public navParams: NavParams, private storage: Storage) {

    /*uid=this.storage.get("userLoggedID");
    if(uid==null){
      this.navCtrl.setRoot(LoginPage);
    }*/
    this.uid='tvq2DppxfiVWq78CobleOX21wOu1';
    let chat = firebase.database().ref(`/chat/${this.uid}`);
    let self=this;
    /*chat.push().set({
      author: self.uid,
      msg: 'ciao'
    });*/
    chat.orderByKey().limitToLast(5).on('value', resp => {
      self.messages = [];
      self.messages = snapshotToArray(resp);
    });

  }

  sendMessage() {
    let newData = firebase.database().ref(`/chat/${this.uid}`).push();
    newData.set({
      author:this.uid,
      msg:this.message,
      //sendDate:Date()
    });
    this.message='';
  }



  ionViewDidLoad() {

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
