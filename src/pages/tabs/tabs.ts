import { ChatPage } from './../chat/chat';
import { Component, ViewChild } from '@angular/core';
import { Tabs, AlertController } from 'ionic-angular';
import { HomePage } from '../home/home';
import { UserInfoPage } from '../user-info/user-info';
import { Storage } from '@ionic/storage';
import * as firebase from 'firebase';
import { Observable } from 'rxjs';
import 'rxjs/add/observable/interval';


/**
 * Generated class for the TabsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-tabs',
  templateUrl: 'tabs.html',
})
export class TabsPage {
  @ViewChild("navTabs") navTabs: Tabs;
  tab1Root = HomePage;
  tab2Root = ChatPage;
  tab3Root = UserInfoPage;
  notify = "";
  uid: string;
  tid: string;
  isAlertShown:boolean;

  constructor(public storage: Storage, public alertCtrl: AlertController){  
    this.storage.get('userLoggedID').then(result => {
      if(result !== undefined && result != "" && result != null){
        this.uid=result;
        let self=this;
        firebase.database().ref(`/profile/user/${this.uid}`).once('value', resp => {
          console.log("tabs) valore user", this.uid) ;
          console.log("tabs) valore trainer", resp.val().trainer);
          var email = resp.val().trainer;
          self.tid = email.substr(0, email.indexOf('@'));
          let chat = firebase.database().ref(`/chat/${self.uid}/${self.tid}`);

          chat.orderByKey().limitToLast(10).on('value', resp => {
            let notRead = 0;
            resp.forEach(childSnapshot => {
              if(!childSnapshot.val().read && childSnapshot.val().author != self.uid)
              notRead = notRead + 1;
            });
            if(notRead == 0){
              self.notify = "";
            } else if(notRead == 10){
              self.notify = "10+"
            } else{
              self.notify = String(notRead);
            }
          });
        });
      }
    });
  }

  checkConnection(){
    let self = this;
    var connectedRef = firebase.database().ref(".info/connected");
    connectedRef.on("value", function(snap) {
      if (snap.val() === true) {
        //alert("connected");
      } else { 
        //alert("not connected");
        if(!self.isAlertShown){        
          self.isAlertShown = true;  
          self.alertCtrl.create({
            title: 'Nessuna connessione ad Internet',
            cssClass: 'custom-alert',
            subTitle: "Sembra che tu non sia connesso ad Internet, verrà fatto un nuovo tentativo di connessione tra un minuto",
            buttons: [{
              text: 'Ok',
              handler: () => { self.isAlertShown = false; }           
            }]
          }).present();      
        }
      }
    });
  } 

  ionViewDidLoad(){
    //Controlla ogni minuto se l'app è connessa ad internet
    Observable.interval(60000)
    .subscribe(() => { this.checkConnection() });       
  }
}
