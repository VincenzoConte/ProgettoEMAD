import { TrainerhomePage } from '../pages/trainerhome/trainerhome';
import { Component } from '@angular/core';
import { Platform, AlertController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { LoginPage } from '../pages/login/login';
import { Storage } from '@ionic/storage';
import { TabsPage } from '../pages/tabs/tabs';

//import { ChatPage } from '../pages/chat/chat';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any;
  //public onlineOffline: boolean = navigator.onLine;
  
  constructor(
    platform: Platform, 
    statusBar: StatusBar, 
    splashScreen: SplashScreen, 
    alertCtrl: AlertController,
    private storage: Storage
    ) {

    //this.storage.set('userLoggedID', 'tvq2DppxfiVWq78CobleOX21wOu1');
    //this.storage.set('trainerLoggedID', 'trainer17');   
    this.keepLogin();
    if (!navigator.onLine) {
    //Do task when no internet connection
      alertCtrl.create({
        title: 'Errore di connessione',
        cssClass: 'custom-alert',
        subTitle: 'Non risulti connesso ad Internet, la tua esperienza con Capperfit sarà limitata',
        buttons: [
          {
            text: 'Ok',
            role:'cancel',
            handler: () =>{
              console.log('Cancel clicked');
            }
          }        
        ],
        enableBackdropDismiss: true //se è false, impedisce di chiudere l'alert toccando al di fuori di esso    
      }).present();
    }

    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      splashScreen.hide();
      statusBar.backgroundColorByHexString('#2F71E6');
    });
  }

  /**
   * Metodo per conservare il login
   */
  keepLogin(){
    this.storage.get("userLoggedID").then(result =>{
      if(result !== undefined && result != "" && result != null){
        this.rootPage = TabsPage;
      } else {
        this.storage.get("trainerLoggedID").then(result =>{
          if(result !== undefined && result != "" && result != null){
            this.rootPage = TrainerhomePage;
          } else this.rootPage = LoginPage;
        }).catch(error =>{
          //userLoggedID completamente vuoto
          console.log("Errore durante il recupero di trainerLoggedID! "+error);
          this.rootPage = LoginPage;
        });
      }
    }).catch(error =>{
      console.log("Errore durante il recupero di userLoggedID! "+error);
      this.rootPage = LoginPage;
    });
  }

}
