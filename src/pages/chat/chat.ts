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

  private uid: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, private storage: Storage) {
  }



  ionViewDidLoad() {
    /*uid=this.storage.get("userLoggedID");
    if(uid==null){
      this.navCtrl.setRoot(LoginPage);
    }*/
      this.uid='tvq2DppxfiVWq78CobleOX21wOu1';
      let chat = firebase.database().ref(`/chat/${this.uid}`);
      let self=this;
      chat.push().set({
        author: self.uid,
        msg: 'ciao'
      });
      chat.orderByKey().limitToLast(5).once('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          console.log(childSnapshot.val().msg)
        });
      });
      chat.on('child_added', function(data) {
        console.log(data.val().msg);
      });
    }

}
