import { RegisterPage } from './../register/register';
import { TrainingListPage } from './../training-list/training-list';
import { FirstAccessPage } from './../first-access/first-access';
import { Storage } from '@ionic/storage';
import { User } from './../../models/user';
import { HomePage } from './../home/home';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { AngularFireAuth } from '@angular/fire/auth';
import { Facebook } from '@ionic-native/facebook';
import { AngularFireDatabase } from '@angular/fire/database';

import * as firebase from 'firebase';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})

export class LoginPage {
  user = {} as User;
  errorcount = 0; //counter degli errori che fa l'utente al login
  forgotLogin: boolean = false; //tasto del login dimenticato inizializzato a false

  constructor(public afdatabase: AngularFireDatabase, private angAuth: AngularFireAuth, 
      private storage: Storage, private toast: ToastController, private fb: Facebook, 
      public navCtrl: NavController, public navParams: NavParams) {
  }
  
  /**
   * Controlla se sia il primo avvio dell'app per l'utente tramite il database
   * @param userID 
   */
  checkFirstAccess(userID: string){      
    let self = this;
    let dbRef = firebase.database().ref(`/profile/user/${userID}`);

    //controlla se esiste un utente con userID
    dbRef.once('value', function(snapshot){    
      if(snapshot.exists()){      
        //se esiste, controlla se ha già un allenamento
        dbRef.child('/training').once('value', function(snapshot){
          if(snapshot.exists()){
            self.navCtrl.push(HomePage);
            //se non lo ha, porta l'utente a selezionarne uno
          } else self.navCtrl.push(TrainingListPage);
        });        
      } else {
        //altrimenti, porta alla creazione di un profilo
        //non dovrebbe avvenire questa condizione, è per aumentare la stabilità del codice
        self.navCtrl.push(FirstAccessPage, {userID: userID}); 
      }
    });    
  }
 
  /**
   *  Procedura di login via e-mail
   *  @param user
   */
  async loginMail(user: User){
    try{
      //const result = await this.angAuth.auth.signInWithEmailAndPassword(user.email, user.password)
      this.angAuth.auth.signInWithEmailAndPassword(user.email, user.password)
        .then(data =>{
          let self = this;
          //salva in memoria il login via mail
          self.storage.set("userLogin", "MAIL");
          if(data.user.emailVerified)        
            this.checkFirstAccess(data.user.uid);         
          else {
              this.toast.create({
              message: "Devi validare la mail per poter entrare.",
              duration: 3000
            }).present();
          }
        }).catch(() => {          
          if(this.errorcount <3){   
            //l'utente sbaglia i dati per il login
            this.toast.create({
              message: "Errore durante il login, riprova",
              duration: 2500
            }).present();           
            ++this.errorcount;
          } else {  
            //l'utente ha sbagliato per 4 volte, mostra il tasto per il recupero pwd                
            this.toast.create({
              message: "Hai dimenticato la password?",
              duration: 2500
            }).present();
            this.forgotLogin = true;
            }
        });      
    } catch (error){
      //l'utente non inserisce mail e/o password     
      if(user.password == null || user.email == null){
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
        }).catch((error) => console.log(error));
  }

  /**
   * Login via Facebook
   */
  async loginFacebook(){
    return this.fb.login(['email']).then( response =>{
      const facebookCredential = firebase.auth.FacebookAuthProvider
               .credential(response.authResponse.accessToken);

      firebase.auth().signInWithCredential(facebookCredential).then(success =>{
        let self = this;
        //salva in memoria il login via Facebook
        self.storage.set("userLogin", "FACEBOOK");
        let dbRef = firebase.database().ref(`/profile/user/${success.uid}`);

        //controlla se esiste un utente con questo ID
        dbRef.once('value', function(snapshot){
          if(snapshot.exists()){
            //se esiste, vede se ha già un allenamento
             dbRef.child('/training').once('value', function(snapshot){
               if(snapshot.exists()){
                 self.navCtrl.setRoot(HomePage);
                 //se non lo ha, porta l'utente a selezionarne uno
               } else self.navCtrl.setRoot(TrainingListPage);
             }); 
          } else {
             //se non esiste, porta alla creazione di un nuovo profilo
             self.user.name = success.displayName;
             self.user.email = success.email;              
             self.afdatabase.object(`profile/user/${success.uid}`).update(self.user);                            
             self.navCtrl.setRoot(FirstAccessPage); 
          }
        });
      }).catch((error) => console.log(error));
    });
  } 
}