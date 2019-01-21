import { TrainerhomePage } from './../pages/trainerhome/trainerhome';
import { AngularFireAuth } from '@angular/fire/auth';
import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { HomePage } from '../pages/home/home';
import { LoginPage } from '../pages/login/login';
import { AngularFireDatabase } from '@angular/fire/database';
import { Storage } from '@ionic/storage';

//import { ChatPage } from '../pages/chat/chat';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any;

  constructor(platform: Platform, statusBar: StatusBar, public afDatabase: AngularFireDatabase,
    splashScreen: SplashScreen, private afAuth: AngularFireAuth, private storage: Storage) {

    //this.storage.set("userLoggedID", "tvq2DppxfiVWq78CobleOX21wOu1");
    this.keepLogin();
    //this.rootPage=ChatPage;
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      //statusBar.styleDefault();
      splashScreen.hide();
      if(platform.is('android') || platform.is('ios')) {
        statusBar.backgroundColorByHexString('#757575');
      }
    });
  }

  /**
   * Metodo per conservare il login
   */
  keepLogin(){
    this.storage.get("userLoggedID").then(result =>{
      console.log("(appComponent) userLoggedID stauts: "+result);
      if(result !== undefined && result != "" && result != null){
        this.rootPage = HomePage;
      } else {
        this.storage.get("trainerLoggedID").then(result =>{
          console.log("(appComponent) trainerLoggedID stauts: "+result);
          if(result !== undefined && result != "" && result != null){
            this.rootPage = TrainerhomePage;
          } else this.rootPage = LoginPage;
        }).catch((error) =>{
          //userLoggedID completely empty
          console.log("Fatal error! "+error);
          this.rootPage = LoginPage;
        });
      }
    });
  }

}
