import { TabsPage } from './../tabs/tabs';
import { RegisterPage } from './../register/register';
import { TrainingListPage } from './../training-list/training-list';
import { FirstAccessPage } from './../first-access/first-access';
import { Storage } from '@ionic/storage';
import { User } from './../../models/user';
import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { AngularFireAuth } from '@angular/fire/auth';
import { Facebook } from '@ionic-native/facebook';
import { AngularFireDatabase } from '@angular/fire/database';

import * as firebase from 'firebase';
import { TrainerhomePage } from '../trainerhome/trainerhome';
import { TrainerTabsPage } from '../trainer-tabs/trainer-tabs';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})

export class LoginPage {
  submitted = false;
  user = {} as User;
  errorcount = 0; //counter degli errori che fa l'utente al login
  forgotLogin: boolean = false; //tasto del login dimenticato inizializzato a false
  sendverificationmail: boolean = false;

  constructor(public afdatabase: AngularFireDatabase, private angAuth: AngularFireAuth, 
      private storage: Storage, private toast: ToastController, private fb: Facebook, 
      public navCtrl: NavController, public navParams: NavParams) {
  }

  async onLogin(form :NgForm){
    this.submitted = true;
    
    if(form.valid){
      //console.log("login completato! email e password: "+this.login.email+", "+this.login.password);
      try{
        this.angAuth.auth.signInWithEmailAndPassword(this.user.email, this.user.password)
        .then(data =>{          
          if(data.user.emailVerified){
            //salva il login
            this.storage.set("userLoggedID", data.user.uid);
            //console.log("(login) email verificata!");
            let dbUser = firebase.database().ref(`/profile/user/${data.user.uid}`);
            let self = this;

            //controlla se esiste un utente con questo ID
            dbUser.once('value', function(snapshot){
              if(snapshot.exists()){
                //esiste, controlla se ha un allenamento
                dbUser.child(`/training`).once('value', function(snapshot){
                  if(snapshot.exists()){
                    self.navCtrl.setRoot(TabsPage);
                  } else self.navCtrl.setRoot(TrainingListPage);
                });
              } else {
                //non esiste ma non dovrebbe succedere dato il 
                //login via mail che presuppone la registrazione
                console.log("(login) non hai del tutto eliminato l'utente da Firebase!");
              }
            });
          } else {
            console.log("(login) email non verificata");
            this.toast.create({
                message: "Devi validare la mail per poter entrare.",
                duration: 3000
            }).present();
          }
        }).catch(()=>{
          //non esiste un utente con questa mail,
          //controlla se è un personal trainer
          let self = this;
          var trainerMail = this.user.email.substr(0, this.user.email.indexOf('@'));
          var dbTrainer = firebase.database().ref(`/profile/trainer/${trainerMail}`);
          var pwd;
          dbTrainer.once('value', function(snapshot){
            if(snapshot.exists()){
              //Sta loggando un personal trainer, controlla la password inserita
              dbTrainer.child(`/pwd`).once('value', function(snapshot){
                pwd = snapshot.val();
              }).then(()=>{                
                if(self.user.password === pwd){
                  self.storage.set("trainerLoggedID", trainerMail);
                  self.navCtrl.setRoot(TrainerTabsPage);
                } else {                  
                  self.toast.create({
                    message: "Errore durante il login, riprova",
                    duration: 2500
                  }).present();
                } 
              });
            } else {
              //non esiste nessun utente o trainer con i dati inseriti
              if(self.errorcount <3){   
                //l'utente sbaglia i dati per il login
                self.toast.create({
                  message: "Errore durante il login, riprova",
                  duration: 2500
                }).present();           
                ++self.errorcount;
              } else {  
                //l'utente ha sbagliato più volte, mostra il tasto per il recupero pwd                
                self.toast.create({
                  message: "Hai dimenticato la password?",
                  duration: 2500
                }).present();
                self.forgotLogin = true;
                self.sendverificationmail = true;
              }
            }
          });          
        });
      } catch(error) {
        console.log("(login) Errore durante il login: "+error);
        this.toast.create({
          message: "Errore durante il login, riprova.",
          duration: 2500
        }).present(); 
      }
      
    } else {
      console.log("(login) Form non valido");
       this.toast.create({
          message: "Errore durante il login, riprova.",
          duration: 2500
        }).present();
    }
  }

  onRegister(){
    console.log("(login) registrazione");
    this.navCtrl.push(RegisterPage);
  }

  loginFacebook(){
    console.log("facebook login");
    return this.fb.login(['email']).then(response =>{
      const facebookCredential = firebase.auth.FacebookAuthProvider
              .credential(response.authResponse.accessToken);
      
      firebase.auth().signInWithCredential(facebookCredential).then(success =>{
        let self = this;        
        let dbFacebook = firebase.database().ref(`/profile/user/${success.uid}`);        
        self.storage.set("userLoggedID", success.uid);  //salva il login

        //controlla se esiste un utente con questo ID
        dbFacebook.once('value', function(snapshot){
          if(snapshot.exists()){
            console.log("(login) profilo Facebook già esistente, controllo peso"); 
            dbFacebook.child(`/weight`).once('value', function(snapshot){
              if(snapshot.exists()){
                console.log("(login) peso esistente, controllo allenamento"); 
                dbFacebook.child(`/training`).once('value', function(snapshot){
                  if(snapshot.exists()){
                    console.log("(login) allenamento esistente"); 
                    self.navCtrl.setRoot(TabsPage);
                  } else self.navCtrl.setRoot(TrainingListPage);
                });
              } else{
                console.log("peso non presente nel database");
                self.navCtrl.setRoot(FirstAccessPage);
              } 
            });           
          } else {
            console.log("(login) creazione nuovo profilo da Facebook");
            //se non esiste, porta alla creazione di un nuovo profilo
            self.user.name = success.displayName;
            self.user.email = success.email;            
            self.afdatabase.object(`/profile/user/${success.uid}`).update(self.user);
            self.navCtrl.setRoot(FirstAccessPage);
          }
        });
      }).catch((error) => console.log(error));
    });
  }

  helpLogin(){
    console.log("(login) help login");    
    return firebase.auth().sendPasswordResetEmail(this.user.email)
      .then(() => {
        this.toast.create({
            message: "Abbiamo inviato una mail di recupero account.",
            duration: 3500
          }).present();
      }).catch((error) => console.log(error));
  }     
}