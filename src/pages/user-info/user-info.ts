import { User } from './../../models/user';
import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, ToastController } from 'ionic-angular';
import { Subscription } from 'rxjs';
import { TrainingListPage } from '../training-list/training-list';
import firebase from 'firebase';
import { LoginPage } from '../login/login';
import { Storage } from '@ionic/storage';
import { StatsPage } from '../stats/stats';
import { AngularFireDatabase } from '@angular/fire/database';
import { TrainingHistoryPage } from '../training-history/training-history';
import BackgroundGeolocation from 'cordova-background-geolocation-lt';

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
  userBMI;
  subs: Subscription[] = [];
  userTrainerID:string;
  userTrainingID:string;

  constructor(
    private storage: Storage,
    public afDatabase: AngularFireDatabase, 
    private toastCtrl: ToastController,
    public navCtrl: NavController,
    public navParams: NavParams,
    private alertCtrl: AlertController
    ){
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
      cssClass: 'custom-alert',
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
   * Aggiorna il peso dell'utente
   */
  updateWeight(){
    console.log("updateWeight");
    let self = this;
    var connectedRef = firebase.database().ref(".info/connected");
    connectedRef.on("value", function(snap) {
      if (snap.val() === true) {
        //alert("connected");
        console.log("connesso ad internet");
        self.alertCtrl.create({
          title: "Nuovo peso",
          subTitle: "Aggiorna il tuo peso inserendolo nell'area sottostante",
          cssClass: 'custom-alert',
          inputs: [{
            name: 'Weight',
            type: 'number',
            value: self.user.weight.toString(),
            placeholder: self.user.weight.toString()
          }],
          buttons: [
            {
              text: 'Annulla',
              role: 'cancel'       
            }, {
              text: 'Aggiorna',
              handler: data => {
                if(data.Weight){
                  let newWeight = data.Weight;
                  let newBMI = newWeight/((self.user.height/100)*(self.user.height/100));
                  self.user.weight = newWeight;
                  self.user.BMI = newBMI;
                  self.afDatabase.object(`profile/user/${self.userID}`).update(self.user);
                  var rootRef = firebase.database().refFromURL("https://capgemini-personal-fitness.firebaseio.com/");
                  var date = new Date().toISOString().split('T')[0];
                  var urlRefBMI =  rootRef.child("/Stats/"+self.userID+"/BMI/"+date+"/Value");
                  var urlRefPeso =  rootRef.child("/Stats/"+self.userID+"/Peso/"+date+"/Value");
                  urlRefPeso.set(newWeight);
                  urlRefBMI.set(newBMI);
              }
            }
          }
        ],
        }).present();
      } else { 
        //alert("not connected");
        console.log("NON connesso ad internet");
          self.alertCtrl.create({
            title: 'Errore di connessione al server',
            cssClass: 'custom-alert',
            subTitle: "Sembra che tu non sia connesso ad Internet, e per garantire l'integrità dei dati per favore aggiorna il peso quando tornerà la connessione.",
            buttons: [{
              text: 'Ok',
              role: 'cancel'         
            }]
          }).present();        
      }
    });    
  }

  /**
   * Carica le informazioni riguardo l'utente
   * NON c'è un controllo sulla rete dal momento che il controllo
   * viene effettuato solo in caso di interazione col database
   * col fine di modificarne alcuni valori
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
    console.log("cambio training");
    let self = this;
    var connectedRef = firebase.database().ref(".info/connected");
    connectedRef.on("value", function(snap) {
      if (snap.val() === true) {
        //alert("connected");
        self.alertCtrl.create({
          title: "Sei sicuro?",
          cssClass: 'custom-alert',
          subTitle: 'Stai per cambiare il tuo allenamento, sei sicuro della tua decisione?',
          buttons: [
            {
              text: 'Si',
              handler: () =>{
                self.changeTraining();
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
      } else { 
        //alert("not connected");
          self.alertCtrl.create({
            title: 'Nessuna connessione ad Internet',
            cssClass: 'custom-alert',
            subTitle: "Sembra che tu non sia connesso ad Internet, verrà fatto un nuovo tentativo di connessione tra un minuto",
            buttons: [{
              text: 'Ok',
              role: 'cancel'
            }]
          }).present();
        }      
    });  
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
    let self = this;
    var connectedRef = firebase.database().ref(".info/connected");
    connectedRef.on("value", function(snap) {
      if (snap.val() === true) {
        //alert("connected"); 
        self.alertCtrl.create({
          title: "Sei sicuro?",
          cssClass: 'custom-alert',
          subTitle: 'Stai per cambiare il tuo allenatore, sei sicuro della tua decisione?',
          buttons: [
            {
              text: 'Si',
              handler: () =>{
                self.changeTrainer();
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
      } else { 
        //alert("not connected");
          self.alertCtrl.create({
            title: 'Nessuna connessione ad Internet',
            cssClass: 'custom-alert',
            subTitle: "Sembra che tu non sia connesso ad Internet, verrà fatto un nuovo tentativo di connessione tra un minuto",
            buttons: [{
              text: 'Ok',
              role: 'cancel'            
            }]
          }).present();
        }      
    });    
  }

  onClickLoadHistory(){
    this.navCtrl.push(TrainingHistoryPage);
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
            card: null,
            hasExercise: false           
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
                      training: trainingName,
                      hasExercise: false,
                      notRead: false
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
            duration: time || 3500,
            cssClass: 'cssToast'
        }).present();
  }

  /**
   * Esegue il logout dall'applicazione
   */
  logout(){
    this.alertCtrl.create({
      title: 'Logout',
      subTitle: 'Sicuro di voler uscire da Capperfit?',
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Sì',
          handler: () =>{
              this.storage.ready().then(() => {
                  //si assicura che il tracking sia stoppato                  
                  firebase.auth().signOut();
                  //si assicura che non ci siano errori al logout
                  this.storage.set('userLoggedID','').then(()=>{   
                    this.storage.remove("userLoggedID").then(() =>{
                      BackgroundGeolocation.stop();
                      console.log("logging out...");        
                      //this.navCtrl.setRoot(LoginPage); //genera un bug nel tabbed layout
                      window.location.reload();          //workaround
                    });
                  }); 
                });                                   
          }
      },
      {
        text: 'No',
        role: 'cancel'
      }]
    }).present();    
  }

  /**
   * Porta alla schermata delle statistiche dell'utente
   */
  loadStats(){
    this.navCtrl.push(StatsPage);
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


}
