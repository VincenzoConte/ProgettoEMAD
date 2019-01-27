import { ChatPage } from './../chat/chat';
import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Tabs } from 'ionic-angular';
import { HomePage } from '../home/home';
import { UserInfoPage } from '../user-info/user-info';
import { Storage } from '@ionic/storage';
import * as firebase from 'firebase';

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

  constructor(public storage: Storage){
    this.storage.get('userLoggedID').then(result => {
      if(result !== undefined && result != "" && result != null){
        this.uid=result;
        let self=this;
        firebase.database().ref(`/profile/user/${this.uid}`).once('value', resp => {
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
}
