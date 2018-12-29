import { LoginPage } from './../login/login';
import { AngularFireDatabase } from '@angular/fire/database';
import { Component } from '@angular/core';
import { NavController, NavParams, ToastController} from 'ionic-angular';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase from 'firebase';
import { TrainingListPage } from '../training-list/training-list';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  public userID:string;
  constructor(private afAuth: AngularFireAuth, private afDatabase: AngularFireDatabase, 
    private toast: ToastController, public navCtrl: NavController, public navParams: NavParams) {
      this.checkUserLogin();    

  }

  checkUserLogin(){
    let self = this;
    this.afAuth.authState.subscribe(data => {
      if(data && data.email && data.uid){
        var username:string;
        var dbFire = firebase.database().ref(`/profile/user/${data.uid}`);
        //recupera il nome dell'utente
        dbFire.child(`/name`).once(`value`, function(snapshot){
          username = snapshot.val();
        })
        //controlla se ha selezionato un allenamento
        dbFire.child(`/training`).once(`value`, function(snapshot){
           if(snapshot.exists()){
            self.toast.create({
              message: "Benvenuto "+username+"!",
              duration: 3500
            }).present();
           } else {
              self.toast.create({
              message: "Va selezionato un allenamento",
              duration: 3500
              }).present();
             self.navCtrl.setRoot(TrainingListPage);
           }
         });        
      } else {
        this.toast.create({
          message: "Sessione non valida, riesegui il login.",
          duration: 4000
        }).present();
        this.navCtrl.setRoot(LoginPage);
      }
    });

    
  }
}
