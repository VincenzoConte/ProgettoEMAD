import { AngularFireDatabase } from '@angular/fire/database';
import { Storage } from '@ionic/storage';
import { Component } from '@angular/core';
import { NavController, NavParams, ToastController, AlertController } from 'ionic-angular';
import firebase from 'firebase';
import { LoginPage } from '../login/login';
import { TrainerChatPage } from '../trainer-chat/trainer-chat';
import { TrainerCardPage } from '../trainer-card/trainer-card';
import { Observable } from 'rxjs';

/**
 * Generated class for the TrainerhomePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-trainerhome',
  templateUrl: 'trainerhome.html',
})
export class TrainerhomePage {

  myUsers = [];
  tid: string;
  intervalID: number;
  usersList:Observable<any[]>;
  isAlertShown:boolean=false;

  constructor(
    public navCtrl: NavController, 
    private toastCtrl: ToastController, 
    public navParams: NavParams, 
    public storage: Storage, 
    public afDatabase: AngularFireDatabase,
    public alertCtrl: AlertController
    ){
      
  }

  ionViewDidLoad(){
    this.storage.get("trainerLoggedID").then(result => {
      if(result === undefined || result == "" || result == null){
        this.navCtrl.setRoot(LoginPage);
      }
      this.tid=result;
      this.getUsersList(result);
    });
     
  } 

  getUsersList(trainerID){
    this.usersList = this.afDatabase.list(`/profile/trainer/${trainerID}/users`).valueChanges();
  }

  ionViewWillEnter() {
/*
    this.storage.get("trainerLoggedID").then(result => {
      if(result === undefined || result == "" || result == null){
        this.navCtrl.setRoot(LoginPage);
      }
      this.tid=result;
      this.intervalID = setInterval(() => {
        this.changeRef.detectChanges();
      }, 1000);
      let users = firebase.database().ref(`/profile/trainer/${this.tid}/users`);
      let self=this;     
    });
    */
  }

  findUser(element, index, array){
    return element.uid == this;
  }

  checkChat(resp){
    if(resp.exists()){
      resp.forEach(msg => {
        if(!msg.val().read && msg.val().author != this.tid){
          let userID = resp.ref.parent.key;
          let curUserIndex = this.myUsers.findIndex(this.findUser, userID);
          let curUser = this.myUsers[curUserIndex];
          this.myUsers.splice(curUserIndex, 1);
          curUser.notRead = true;
          this.myUsers.unshift(curUser);
        }
      });
    }
  }

  ionViewDidLeave(){
    clearInterval(this.intervalID);
    this.myUsers.forEach(user => {
      firebase.database().ref(`/chat/${user.uid}/${this.tid}`).off('value', this.checkChat, this);
    });
  }


  openUserChat(user){
    console.log("user id per la chat MAIUSC",user.UID);     
    console.log("username per la chat", user.username);
    this.navCtrl.push( TrainerChatPage, {
      userID: user.UID, //user.uid,
      name: user.username
    });
  }

  /**
   * Mostra un toast del messaggio passato
   * @param message
   * @param time
   */
  showToast(message, time?){
    this.toastCtrl.create({
            message: message,
            duration: time || 3500,
            cssClass: 'cssToast'
        }).present();
  }

  onClickUser(userClicked){
    /*console.log("nome: "+userClicked.username);
    console.log("training: "+userClicked.training);
    console.log("ha la scheda?: "+userClicked.hasExercise);
    console.log("UID: "+userClicked.UID);*/    
    if(!userClicked.hasExercise){
      this.createCard(userClicked);
    } else this.hasAlreadyAnExerciseAlert(userClicked);
  }

  /** 
   * Metodo per aprire la pagina per la creazione della scheda
   * @param userClicked
   */
  createCard(userClicked){
    this.navCtrl.push(TrainerCardPage, {
        user: userClicked,
        trainer: this.tid,
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
      title: 'Ha già una scheda!',
      cssClass: 'custom-alert',
      subTitle: 'Sei sicuro di voler annullare la scheda corrente e mandargliene una nuova?',
      buttons: [
        {
          text: 'Si',
          handler: () =>{
            this.createCard(userClicked);
          }
        },
        {
          text: 'No'
        }
      ],
    }).present();
  }

  logout(){
    this.showToast("Alla prossima!", 3500);
    this.storage.ready().then(() => {
      this.storage.remove("trainerLoggedID").then(() =>{
        console.log("logging out...");
        window.location.reload();
      });
    });
  }

}
