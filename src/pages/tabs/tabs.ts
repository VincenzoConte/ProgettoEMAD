import { ChatPage } from './../chat/chat';
import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Tabs } from 'ionic-angular';
import { HomePage } from '../home/home';
import { UserInfoPage } from '../user-info/user-info';

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

  constructor(){
    
  }
}
