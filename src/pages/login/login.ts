import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { User } from '../../models/user';
import { AngularFireAuth } from '@angular/fire/auth';
import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook';
import * as firebase from 'firebase';
/**
 * Generated class for the LoginPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {
  user = {} as User;
  errorcount = 0; //counter degli errori che fa l'utente al login
  
  constructor(private angAuth: AngularFireAuth, private toast: ToastController, private fb: Facebook,
  public navCtrl: NavController, public navParams: NavParams) {
  }

  public forgotLogin: boolean = false; //tasto del login dimenticato inizializzato a false


  async loginMail(user: User){
    try{
      this.angAuth.auth.signInWithEmailAndPassword(user.email, user.password)
        .then(data =>{
            this.navCtrl.setRoot('HomePage');
        })
        .catch(error =>{
          if(this.errorcount <3){
            this.toast.create({
              message: "Errore durante il login, riprova",
              duration: 3000
            }).present();
            ++this.errorcount;
          } else {
            this.toast.create({
              message: "Hai dimenticato la password?",
              duration: 3000
            }).present();
            this.forgotLogin = true;
          }
        });
    } catch (error){
      this.toast.create({
        message: "Non puoi lasciare campi vuoti!",
        duration: 3000
      }).present();
    }
  }
/*
  async loginFacebook(){
    return this.fb.login(['email'])
      .then( response =>{
        const facebookCredential = firebase.auth.FacebookAuthProvider
                  .credential(response.authResponse.accessToken);
        
        firebase.auth().signInWithCredential(facebookCredential)
            .then( success =>{
              console.log("Firebase success: "+ JSON.stringify(success));
            });
      }).catch((error) => { console.log(error)});
  }*/

  loginFacebook(): Promise<any> {
  return this.fb.login(['email'])
    .then( response => {
      const facebookCredential = firebase.auth.FacebookAuthProvider
        .credential(response.authResponse.accessToken);

      firebase.auth().signInWithCredential(facebookCredential)
        .then( success => { 
          console.log("Firebase success: " + JSON.stringify(success)); 
        });

    }).catch((error) => { console.log(error) });
}

  
  registerMail(){
    this.navCtrl.push('RegisterPage');
  }

}
