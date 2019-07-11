import { AngularFireDatabase } from '@angular/fire/database';
import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, NavParams, ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import * as firebase from 'firebase';

import { LoginPage } from '../login/login';
import { ChatHistoryPage } from '../chat-history/chat-history';
import { Observable } from 'rxjs';


@Component({
  selector: 'page-chat',
  templateUrl: 'chat.html', 
})
export class ChatPage { 
  userID:string;
  trainerID;
  timeVisible:boolean=false;
  trainerName:string;
  messages:Observable<any[]>;
  message = '';
  limit = 10;
  intervalID:number;
  oldTrainer:boolean=false;

  constructor(
  public navCtrl: NavController, 
      public navParams: NavParams, 
      private storage: Storage,
      private afDatabase: AngularFireDatabase,
      private changeRef: ChangeDetectorRef, 
      public toast: ToastController
    ){
      this.storage.get('userLoggedID').then(result => {
        if(result === undefined || result === '' || result === null){
          this.navCtrl.setRoot(LoginPage);
        } else { 
          this.userID = result;                  

          afDatabase.object(`/profile/user/${result}/trainer`)
            .snapshotChanges()
            .subscribe(action => {
              this.trainerID = String(action.payload.val()).substr(0, String(action.payload.val()).indexOf('@'));
              let self= this;
              firebase.database().ref(`/profile/trainer/${self.trainerID}/name`).once('value', resp =>{
                self.trainerName = resp.val(); 
              });
              this.loadMessages(this.trainerID);
          });
        }
      });
  }

  ionViewDidLoad(){
    
  }

  openChatHistory(){

  }

  loadMessages(trainerID:string){
    this.messages = this.afDatabase.list(`/chat/${this.userID}/${trainerID}`).valueChanges();
  }

  showTime(){
    this.timeVisible = !this.timeVisible;
  }

  sendMessage(){

  }
/*
  public uid: string; 
  public tid: string;
  timeVisible:boolean=false;
  trainerName: string;
  messages = [];
  message = '';
  limit = 10;
  intervalID: number;
  oldTrainer = false;

  constructor(
      public navCtrl: NavController, 
      public navParams: NavParams, 
      private storage: Storage,
      private changeRef: ChangeDetectorRef, 
      public toast: ToastController
    ){
  }

  sendMessage() {
    if(this.message.trim() === '')
      return;

    if(this.oldTrainer){
      this.toast.create({
          message: "Questa chat non è più attiva",
          duration: 3000,
          cssClass: 'cssToast'
      }).present();
    }
    else{
      firebase.database().ref(`/profile/trainer/${this.tid}/users/${this.uid}`).update({notRead: true});
      let newData = firebase.database().ref(`/chat/${this.uid}/${this.tid}`).push();
      newData.set({
        author:this.uid,
        msg:this.message,
        sendDate:Date(),
        read: false
      });
      this.message='';
    }
  }

  loadMessages(){
    if(this.messages.length < this.limit){
      this.toast.create({
          message: "Non ci sono altri messaggi",
          duration: 3000,
          cssClass: 'cssToast'
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

  showTime(){
    this.timeVisible = !this.timeVisible;
  }


  ionViewWillEnter() {
    this.storage.get('userLoggedID').then(result => {
      if(result === undefined || result == "" || result == null){
        this.navCtrl.setRoot(LoginPage);
      }
      this.uid=result;
      //this.uid='tvq2DppxfiVWq78CobleOX21wOu1';
      let self=this;
      this.tid = this.navParams.get("trainerID");
      this.intervalID = setInterval(() => {
        this.changeRef.detectChanges();
      }, 1000);
      if(this.tid === undefined || this.tid == null || this.tid.trim() == ""){
        firebase.database().ref(`/profile/user/${result}/trainer`).once('value', resp => {
          var email = resp.val();
          self.tid = email.substr(0, email.indexOf('@'));
          firebase.database().ref(`/profile/trainer/${self.tid}`).once('value', resp =>{
            self.trainerName = resp.val().name;
          });
          let chat = firebase.database().ref(`/chat/${self.uid}/${self.tid}`);
          chat.orderByKey().limitToLast(self.limit).on('value', self.messagesCallback, this);
        });
      } else {
        this.trainerName = this.navParams.get("trainerName");
        firebase.database().ref(`/profile/user/${this.uid}`).once('value', resp => {
          var email = resp.val().trainer;
          email = email.substr(0, email.indexOf('@'));
          if(self.tid != email){
            self.oldTrainer = true;
          }
          else{
            self.oldTrainer = false;
          }
          let chat = firebase.database().ref(`/chat/${self.uid}/${self.tid}`);
          chat.orderByKey().limitToLast(self.limit).on('value', self.messagesCallback, this);
        });
      }
    });

  }

  ionViewDidLeave(){
    clearInterval(this.intervalID);
    firebase.database().ref(`/chat/${this.uid}/${this.tid}`).off('value', this.messagesCallback, this);
    this.messages = [];
    this.limit = 10;
  }
*/
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
