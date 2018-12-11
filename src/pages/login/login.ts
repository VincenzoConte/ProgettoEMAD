import { FirstAccessPage } from './../first-access/first-access';
import { Storage } from '@ionic/storage';
import { User } from './../../models/user';
import { HomePage } from './../home/home';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { AngularFireAuth } from '@angular/fire/auth';
import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook';
import { AngularFireDatabase } from '@angular/fire/database';

import * as firebase from 'firebase';
import { RegisterPage } from '../register/register';
import { AngularFirestore } from '@angular/fire/firestore';

/**
 * Generated class for the LoginPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})

export class LoginPage {
  user = {} as User;
  errorcount = 0; //counter degli errori che fa l'utente al login
  private forgotLogin: boolean = false; //tasto del login dimenticato inizializzato a false

  constructor(public afdatabase: AngularFireDatabase, private angAuth: AngularFireAuth, private firestore: AngularFirestore,
  private storage: Storage, private toast: ToastController, private fb: Facebook, public navCtrl: NavController, public navParams: NavParams) {
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
                console.log("(login.ts | checkFirstAccess) dato esistente");
                return true;
              } else {
                console.log("(login.ts | checkFirstAccess) dato NON esistente");
                return false;                
              }}).catch(function(error){
                console.log("(login.ts | checkFirstAccess) errore nel recuperare il doc");
              });                                         
  }
 
  /**
   *  Procedura di login via e-mail
   *  @param user
   */
  loginMail(user: User){
    try{
      //const result = await this.angAuth.auth.signInWithEmailAndPassword(user.email, user.password)
      this.angAuth.auth.signInWithEmailAndPassword(user.email, user.password)            //prova ad entrare
        .then(data =>{        
          if(data.user.emailVerified){          
            if(this.checkFirstAccess(data.user.uid)){
              console.log("(login.ts | loginMail) pushing HomePage");
              this.navCtrl.push(HomePage);
            } else {
              console.log("(login.ts | loginMail) pushing FirstAccessPage");
              this.navCtrl.push(FirstAccessPage, {
                userID: data.user.uid
              });
            }
          } else {
              this.toast.create({
              message: "Devi validare la mail per poter entrare.",
              duration: 3000
            }).present();
            }
        })
        .catch((error) => {
          if(this.errorcount <3){      //l'utente sbaglia i dati per il login
            this.toast.create({
              message: "Errore durante il login, riprova",
              duration: 2500
            }).present();           
            ++this.errorcount;
          } else {                  //l'utente ha sbagliato troppe volte, forse non ricorda la password
            this.toast.create({
              message: "Hai dimenticato la password?",
              duration: 2500
            }).present();
            this.forgotLogin = true;
      }
        });      //il catch crasha se messo come istruzione per il signin di angularFire
    } catch (error){    
      if(user.password == null || user.email == null){    //l'utente non inserisce mail e/o password 
        this.toast.create({
          message: "Inserisci mail e password!",
          duration: 2500
        }).present();    
      }  
    }
  }

  /**
   * Rimanda alla pagina di registrazione della mail
   */
  registerMail(){
    this.navCtrl.push(RegisterPage);
  }

  /**
   * Procedura per il reset della password, se ne occupa Firebase per il codice dedicato
   */
  async forgotPassword(){
    var auth = firebase.auth();
      return auth.sendPasswordResetEmail(this.user.email)
        .then(() => {
          this.toast.create({
              message: "Abbiamo inviato una mail di recupero account.",
              duration: 3500
            }).present();
        }).catch((error) => console.log(error))
  }

  /**
   * Login via Facebook
   */
  async loginFacebook(){
    return this.fb.login(['email'])
      .then( response =>{
        const facebookCredential = firebase.auth.FacebookAuthProvider
                  .credential(response.authResponse.accessToken);
        
        firebase.auth().signInWithCredential(facebookCredential)
            .then( success =>{
              //console.log("Firebase success: "+ JSON.stringify(success)); //stampa in console tutto il risultato di Fb
              if(this.checkFirstAccess(success.uid)){
                console.log("(login.ts | loginFacebook) pushing HomePage");
                this.navCtrl.push(HomePage);
              } else {
                console.log("(login.ts | loginFacebook) pushing FirstAccessPage");
                //console.log("login.ts - login.ts - name passed: "+success.displayName);
                this.navCtrl.push(FirstAccessPage, {
                  fbUserName: success.displayName,
                  userID: success.uid
                });
              }
            });
      }).catch((error) => { console.log(error)});
  }
}