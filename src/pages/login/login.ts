import { TabsPage } from './../tabs/tabs';
import { RegisterPage } from './../register/register';
import { TrainingListPage } from './../training-list/training-list';
import { FirstAccessPage } from './../first-access/first-access';
import { Storage } from '@ionic/storage';
import { User } from './../../models/user';
import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NavController, NavParams, ToastController } from 'ionic-angular';
import { AngularFireAuth } from '@angular/fire/auth';
import { Facebook } from '@ionic-native/facebook';
import { AngularFireDatabase } from '@angular/fire/database';
import * as firebase from 'firebase';
import { TrainerhomePage } from '../trainerhome/trainerhome';

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
  isLogging:boolean = false;

  constructor(
      public afdatabase: AngularFireDatabase,
      private angAuth: AngularFireAuth,
      private storage: Storage, 
      private toast: ToastController, 
      private fb: Facebook,
      public navCtrl: NavController, 
      public navParams: NavParams
    ){
  }

  async onLogin(form :NgForm){
    this.submitted = true;
    this.isLogging = true;
    var mail = this.user.email.toLowerCase().replace(/\s/g,'');
    if(form.valid){
      //console.log("login completato! email e password: "+this.login.email+", "+this.login.password);
      try{
        this.angAuth.auth.signInWithEmailAndPassword(mail, this.user.password)
        .then(data =>{
          /**
           * Per velocizzare i tempi della registrazione durante la presentazione
           * dell'app, è stato disabilitato il controllo sulla mail verificata
           */
          //if(data.user.emailVerified){
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
          /*} else {
            console.log("(login) email non verificata");
            this.showToast('Devi validare la mail per poter entrare');
          }*/
        }).catch((error)=>{          
          console.log("errore segnalato", error);
          
          //controlla se c'è un errore di connessione
          if(error.code === 'auth/network-request-failed'){
            this.showToast('Errore durante la connessione al server, riprova più tardi.');
            this.isLogging = false;
            return;
          }            
          
          //non esiste un utente con questa mail, controlla se è un personal trainer
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
                  self.navCtrl.setRoot(TrainerhomePage);
                } else
                    self.showToast('Errore durante il login');                
              });
            } else {
              self.isLogging = false; //si è fermato il metodo
              if(error.code === 'auth/invalid-email'){
                self.showToast('La mail che hai inserito non è valida, controlla!');                              
              } else if(error.code === 'auth/wrong-password'){
                self.showToast('La password inserita non è corretta.');
                if(self.errorcount <3){
                  //l'utente sbaglia i dati per il login                
                  ++self.errorcount;
                } else {
                  //l'utente ha sbagliato più volte, mostra il tasto per il recupero pwd
                  self.showToast('Hai dimenticato la password?');
                  self.forgotLogin = true;
                  self.sendverificationmail = true;
                }
              } else if(error.code === 'auth/too-many-requests'){
                  self.showToast('Troppi tentativi falliti in poco tempo, aspetta 5 secondi');
              } else self.showToast('Qualcosa è andato storto durante il login: '+error.code, 3000);
              //non esiste nessun utente o trainer con i dati inseriti              
            } 
          });
        }); 
      } catch(error) {
        this.isLogging = false;
        console.log("(login) Errore durante il login: "+error);
        if(error.code === 'auth/too-many-requests'){
          this.showToast('Troppi tentativi falliti in poco tempo, aspetta 5 secondi');
        } else this.showToast('Errore durante il login: '+error.code);
      } 

    } else {
      this.isLogging = false; 
      console.log("(login) Form non valido");
       this.showToast('Errore durante il login, controlla i tuoi dati.');
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
            duration: 3500,
            cssClass: 'cssToast'
          }).present();
      }).catch((error) => console.log(error));
  }

  showToast(message, time?){
    this.toast.create({
        message: message,
        duration: time || 1500,
        cssClass: 'cssToast'
    }).present();
  }
}
