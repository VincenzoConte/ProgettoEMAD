import { FirstAccessPage } from './../pages/first-access/first-access';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { Component } from '@angular/core';
import { Platform, NavController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
import { LoginPage } from '../pages/login/login';
import firebase from 'firebase';
import { AngularFireDatabase } from '@angular/fire/database';
import { TrainingListPage } from '../pages/training-list/training-list';
import { Storage } from '@ionic/storage';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any;

  constructor(platform: Platform, statusBar: StatusBar, public afDatabase: AngularFireDatabase, 
    splashScreen: SplashScreen, private afAuth: AngularFireAuth, private storage: Storage) {
    this.keepLogin();
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.      
      statusBar.styleDefault();
      splashScreen.hide();
    });
  }

  /**
   * Verifica se l'utente abbia già fatto un login in precedenza
   */
  keepLogin(){        
    let self = this;
  
    this.afAuth.authState.subscribe(data =>{    
      if(data != null && data){      
        let dbRef = firebase.database().ref(`/profile/user/${data.uid}`);
        self.storage.get("userLogin").then((result) =>{
          if(result == "FACEBOOK"){
            //l'utente è connesso tramite Facebook, controlla lo stato della sua registrazione
            dbRef.child('/age').once('value', function(snapshot){
              if(snapshot.exists()){
                //esiste un valore che avrebbe dovuto inserire al primo accesso
                self.rootPage = HomePage;
              } else self.rootPage = FirstAccessPage;
            });
          } else if(result == "MAIL"){
              //l'utente è connesso via mail, controlla lo stato della sua registrazione
              if(data.emailVerified){
                //se la mail è verificata ha sicuramente fatto la prima registrazione
                dbRef.child('/training').once('value', function(snapshot){
                  if(snapshot.exists()){
                    self.rootPage = HomePage;
                  } else self.rootPage = TrainingListPage;
                });
              } else {
                //l'utente non è loggato
                self.rootPage = LoginPage;
              }
          } else {      
            //l'utente non è connesso in alcun modo      
            console.log("Normalmente non dovresti essere in questo stato!"); 
          }
        }); 
      } else {
        //si è verificato un errore con il recupero delle informazioni dell'utente
        self.rootPage = LoginPage;
      }
    });    
  }
}