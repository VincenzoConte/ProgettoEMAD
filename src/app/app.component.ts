import { FirstAccessPage } from './../pages/first-access/first-access';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
import { LoginPage } from '../pages/login/login';
import { FirebaseAuth } from '@angular/fire';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {

  //rootPage:any = 'LoginPage';
  //rootPage:any = LoginPage;
  rootPage:any;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, private afAuth: AngularFireAuth, private firestore: AngularFirestore) {
    this.keepLogin();
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      
      statusBar.styleDefault();
      splashScreen.hide();
    });
  }

  keepLogin(){
      this.afAuth.authState.subscribe(user => {
        if(user){ //l'utente era già loggato in precedenza              
          if(this.checkFirstAccess(user.uid)){
            this.rootPage = HomePage; 
          } else this.rootPage = FirstAccessPage;
        } else { 
          this.rootPage = LoginPage;
        }
      });
  }

 /**
   * Controlla se sia il primo avvio dell'app per l'utente controllando la sua presenza nel database
   * @param userID 
   */
  checkFirstAccess(userID: string){
    console.log("(login.ts | checkFirstAccess) userID passed: ", userID);
    this.firestore.collection("users/").doc(userID).ref.get()
          .then(function(doc){
              if(doc.exists){                            
                console.log("app.component.ts | checkFirstAccess - dato esistente");
                return true;
              } else {
                console.log("app.component.ts | checkFirstAccess - dato NON esistente");
                return false;                
              }}).catch(function(error){
                console.log("app.component.ts | checkFirstAccess - errore nel recuperare il doc: "+error);
              });                                         
  }

}

