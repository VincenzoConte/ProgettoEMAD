import { AngularFireDatabase, snapshotChanges } from '@angular/fire/database';
import { LoginPage } from './../login/login';
import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform, ToastController, AlertController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import firebase from 'firebase';
import { Observable } from 'rxjs';
import { TrainerCardPage } from '../trainer-card/trainer-card';
/**
 * Generated class for the TrainerCardsListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-trainer-cards-list',
  templateUrl: 'trainer-cards-list.html',
})
export class TrainerCardsListPage {  
  usersList:Observable<any>;
  myUsers=[];
  trainerID:string;

  constructor(
    public navCtrl: NavController, 
    public platform: Platform,
    public storage: Storage,
    public alertCtrl: AlertController,
    public toastCtrl: ToastController,
    public afDatabase: AngularFireDatabase,
    public navParams: NavParams
    ) {
    this.myUsers = [];
  }

  ionViewDidLoad(){
    this.platform.ready().then(() => {
      this.storage.get("trainerLoggedID").then(result => {
        this.trainerID = result;
      }).then(()=>{
        this.getUsers();
      });
    });
  }
 
  /**
   * Restituisce la lista degli utenti che sono con il personal trainer
   */
  getUsers(){
    this.usersList = this.afDatabase.list(`/profile/trainer/${this.trainerID}/users`).valueChanges();
  }

  /**
   * Viene creata una scheda per l'utente selezionato
   * @param userClicked l'utente cliccato
   */
  onClickUser(userClicked){
    /*
    console.log("nome: "+userClicked.name);
    console.log("training: "+userClicked.training);
    console.log("ha la scheda?: "+userClicked.hasExercise);
    console.log("UID: "+userClicked.UID);
    */
    if(!userClicked.hasExercise){
      this.createCard(userClicked);
    } else this.hasAlreadyAnExerciseAlert(userClicked);        
  }

  /**
   * Mostra un toast del messaggio passato
   * @param message
   * @param time
   */
  showToast(message, time?){
    this.toastCtrl.create({
            message: message,
            duration: time || 3500
        }).present();
  }

  /**
   * Metodo per aprire la pagina per la creazione della scheda
   * @param userClicked 
   */
  createCard(userClicked){
    this.navCtrl.push(TrainerCardPage, {
        user: userClicked,
        trainer: this.trainerID,
        parentPage: this
      });
  }

  /**
   * Avvisa il personal trainer che l'utente selezionato
   * Ha già una scheda, può decidere se annullare o sostituire
   * con una scheda aggiornata
   * @param userClicked 
   */
  hasAlreadyAnExerciseAlert(userClicked){
    this.alertCtrl.create({
     title: "Gli hai già dato una scheda!",
      subTitle: 'Sei sicuro di voler annullare la scheda corrente e mandargliene una nuova?',
      buttons: [
        {
          text: 'Si',
          handler: () =>{
            this.createCard(userClicked);
          }
        },
        {
          text: 'No',
          handler: () =>{
          }
        }
      ],
    }).present();
  } 

  logout(){
    this.storage.ready().then(() => {
      this.storage.set("trainerLoggedID", "").then(() =>{
        console.log("logging out...");
        firebase.auth().signOut();
        this.showToast("Alla prossima!", 3500);
        window.location.reload();
      });
    });
  }

}
