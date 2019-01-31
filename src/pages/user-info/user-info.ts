import { User } from './../../models/user';
import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, ToastController } from 'ionic-angular';
import { Subscription } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/auth';
import { TrainingListPage } from '../training-list/training-list';
import firebase from 'firebase';
import { LoginPage } from '../login/login';
import { Storage } from '@ionic/storage';
import { StatsPage } from '../stats/stats';
import { AngularFireDatabase } from '@angular/fire/database';
/**
 * Generated class for the UserInfoPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-user-info',
  templateUrl: 'user-info.html',
})
export class UserInfoPage {
  public userID:string;
  public userName:string;
  user = {} as User;
  userBMI:string;
  subs: Subscription[] = [];
  userTrainerID:string;
  userTrainingID:string;

  constructor(
    private afAuth: AngularFireAuth,
    private storage: Storage,
    public afDatabase: AngularFireDatabase, 
    private toastCtrl: ToastController,
    public navCtrl: NavController,
    public navParams: NavParams,
    private alertCtrl: AlertController) {

  }

   ionViewDidLoad(){
    //this.checkLogin();
    this.storage.get("userLoggedID").then(result =>{
      if(result !== undefined && result != "" && result != null){
        this.userID = result;
      } else this.navCtrl.setRoot(LoginPage);
    }).then(() =>{
      this.loadUserData();
    });
  }

  checkTraining(){
    let self = this;
    console.log("check training for ID: "+this.userID);
    firebase.database().ref(`/profile/user/${this.userID}`)
      .child(`/training`).once('value', function(snapshot){
        if(!snapshot.exists()){
          self.presentAlert();
        }
    });   
  }

  /**
   * Mostra un alert per
   */
  presentAlert() {
    let alert = this.alertCtrl.create({
      title: "E l'allenamento?",
      subTitle: 'Seleziona un allenamento per proseguire',
      buttons: [{
        text: 'OK',
        handler: () =>{
          this.navCtrl.push(TrainingListPage);
        }
      }],
      enableBackdropDismiss: false //se si clicca fuori dall'alert non viene chiuso
    });
    alert.present();
  }

  /**
   * Controlla i dati sul login
   */
  /*
  public checkLogin(){
   this.storage.get("userLoggedID").then(result =>{
      if(result !== undefined && result != "" && result != null){
        this.userID = result;
        console.log("(home) storage user id: "+result);
      } else this.navCtrl.setRoot(LoginPage);
    }).then(()=>{
      let self = this;
      this.afAuth.authState.subscribe(user =>{
        if(user && user.email && user.uid){
          console.log("(home) authstate user id: "+user.uid);
          if(self.userID != user.uid){
            console.log("(home) L'user ID su Firebase non combacia con quello sul cellulare");
            //cancella l'id salvato e manda al login per questioni di sicurezza
            self.storage.remove("userLoggedID");
            self.navCtrl.setRoot(LoginPage);
          } else {
            this.loadUserData();            
          }
        }
      });
    });
  }
  */

  /**
   * Carica le informazioni riguardo l'utente
   */
  public loadUserData(){
    let self = this;            
    firebase.database().ref(`/profile/user/${self.userID}/`)
            .once('value', function(snapshot){
              if(snapshot.exists()){
                self.user = snapshot.val();
                self.userBMI = self.user.BMI.toFixed(2);                  
              } else {
                console.log("ERRORE! Nessun utente trovato con questo ID!");
              }
            }).then(()=>{
                console.log("user name"+self.user.name);
                self.userTrainingID = self.user.training;
                self.userTrainerID = self.user.trainer;
                self.checkTraining();
            });
  }

  /**
   * Mostra un alert per confermare l'intenzione di cambiare allenamento
   */
  onClickChangeTraining(){
    this.alertCtrl.create({
     title: "Sei sicuro?",
      subTitle: 'Stai per cambiare il tuo allenamento, sei sicuro della tua decisione?',
      buttons: [
        {
          text: 'Si',
          handler: () =>{
            this.changeTraining();
          }
        },
        {
          text: 'No',
          handler: () =>{
            console.log("alert dismissed");            
          }
        }
      ],
      enableBackdropDismiss: false //se si clicca fuori dall'alert non viene chiuso
    }).present();
  }

  /**
   * Cambia l'allenamento dell'utente
   */
  public changeTraining(){
    //allenatore: trainer10@mail.com, allenamento: definition
    var trainerIDpassed = this.user.trainer.substr(0, this.user.trainer.indexOf('@'));
    console.log("User-info) valori passati alla training list: "+this.userTrainerID+", allenamento: "+this.userTrainingID);
    this.navCtrl.push(TrainingListPage,{
      userTrainerID: trainerIDpassed,
      userTraining: this.userTrainingID,
      userName: this.user.name,
      parentPage: this
    });
  }

  /**
   * Mostra un alert per confermare l'intenzione di cambiare allenatore
   */
  onClickChangeTrainer(){
    this.alertCtrl.create({
     title: "Sei sicuro?",
      subTitle: 'Stai per cambiare il tuo allenatore, sei sicuro della tua decisione?',
      buttons: [
        {
          text: 'Si',
          handler: () =>{
            this.changeTrainer();
          }
        },
        {
          text: 'No',
          handler: () =>{
            console.log("alert dismissed");            
          }
        }
      ],
      enableBackdropDismiss: false //se si clicca fuori dall'alert non viene chiuso
    }).present();
  }
  
  /**
   * Cambia l'allenatore
   */
  changeTrainer(){
    console.log("ChangeTrainer called");
    var trainerList= new Array();
    this.afDatabase.list(`/gym/trainings/${this.user.training}/trainers`)
      .valueChanges().subscribe(snapshots =>{
        snapshots.forEach(snapshot => {          
          trainerList.push(snapshot);
        });
        this.getRandomTrainer(trainerList).then(result =>{
          //aggiorna l'utente
          this.afDatabase.object(`/profile/user/${this.userID}/`).update({
            trainer: result,            
          }).then(()=>{
            //rimuove l'utente dall'attuale personal trainer
            var currTrainerID = this.user.trainer.substr(0, this.user.trainer.indexOf('@'));
            this.afDatabase
              .object(`/profile/trainer/${currTrainerID}/users/${this.userID}`).remove();

            //inserisce l'utente nella lista del nuovo personal trainer
            var trainingName;            
            firebase.database().ref(`/gym/trainings/${this.user.training}/name`)
            .once('value', function(snapshot){
              trainingName = snapshot.val();
            }).then(()=>{
                var resultID = result.substr(0, result.indexOf('@'));
                this.afDatabase
                  .object(`/profile/trainer/${resultID}/users/${this.userID}`)
                  .update({
                      UID: this.userID,
                      username: this.user.name,
                      training: trainingName
                }).then(() =>{
                  this.showToast("Allenatore cambiato con successo!");
                  this.loadUserData();
                });
            });            
          });     
        });
      });
  }

  /**
   * Recupera un allenatore, se recupera quello attuale riesegue la modalità random
   * @param list lista degli allenatori
   */
  async getRandomTrainer(list):Promise<String>{
    var mailPicked = list[this.getTrainerFromList(0, (list.length-1))];
    console.log("mail presa: "+mailPicked);    
    return mailPicked === this.user.trainer ? this.getRandomTrainer(list) : mailPicked;    
  }

  //Restituisce l'indirizzo mail di un personal trainer con cui allenarsi   
  getTrainerFromList(min, max) {
    return Math.floor(min + Math.random()*(max + 1 - min));
  }

  /**
   * Cerca la cronologia delle attività dell'utente
   */
  userActivity(){
    this.showToast("Cronologia utente");
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
   * Esegue il logout dall'applicazione
   */
  logout(){
    this.storage.ready().then(() => {
      firebase.auth().signOut();
      this.storage.set("userLoggedID", "").then(() =>{
        console.log("logging out...");
        this.showToast("Arrivederci!");
        //this.navCtrl.setRoot(LoginPage); //genera un bug nel tabbed layout
        window.location.reload();          //workaround
      });
    });
  }

  /**
   * Porta alla schermata delle statistiche dell'utente
   */
  loadStats(){
    this.navCtrl.push(StatsPage);
  }

}
