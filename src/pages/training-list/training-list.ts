import { TabsPage } from './../tabs/tabs';
import { Storage } from '@ionic/storage';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, ToastController } from 'ionic-angular';
import { LoginPage } from '../login/login';
import { AngularFireDatabase } from '@angular/fire/database';
import firebase from 'firebase';
import { Observable } from 'rxjs';

/**
 * Generated class for the TrainingListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-training-list',
  templateUrl: 'training-list.html',
})
export class TrainingListPage {
  userDoc:any;
  userID:string;
  trainings:Observable<any[]>;
  userTrainingID:string;
  userPersonalTrainerID:string;
  userName:string;
  parentPage:any;

  constructor(
    public navCtrl: NavController, 
    public afDatabase: AngularFireDatabase, 
    public storage: Storage,
    private afAuth: AngularFireAuth, 
    public firestore: AngularFirestore, 
    public alertCtrl: AlertController,
    public toast: ToastController,
    public navParams: NavParams
    ) {
      this.userPersonalTrainerID = navParams.get('userTrainerID');
      this.userTrainingID = navParams.get('userTraining');
      this.userName = navParams.get('userName');
      this.parentPage = navParams.get('parentPage');
      console.log("userPTID ="+this.userPersonalTrainerID+", navParams: "+navParams.get('userTrainerID'));         

      
  }

  ionViewDidLoad() {    
    this.afAuth.authState.subscribe(user =>{
     user ? this.userID = user.uid : this.navCtrl.setRoot(LoginPage);
     //workaround per l'eliminazione della verifica della mail che causava un bug
     this.storage.set("userLoggedID", this.userID); 
    });
    this.getTrainings();    
  }

  getTrainings(){
    let self = this;
    var connectedRef = firebase.database().ref(".info/connected");
    connectedRef.on("value", function(snap) {
      if (snap.val() === true) {
        self.trainings = self.afDatabase.list(`/gym/trainings`).valueChanges();
      } else {
        //alert("not connected");
        self.alertCtrl.create({
          title:"Errore di connessione",
          cssClass: 'custom-alert',
          subTitle: "Sembra che tu non sia connesso ad Internet, l'esperienza d'uso può risentirne",
          buttons: [{
            text: 'Ok'
          }]
        }).present();
      }
    });
    
  }

  onClickTraining(trainingID, trainingName){
    if(this.userPersonalTrainerID && this.userTrainingID !== trainingID){
      let self = this;
      firebase.database()
        .ref(`/gym/trainings/${trainingID}/trainers/${this.userPersonalTrainerID}`)
        .once('value', function(snapshot){
          if(snapshot.exists()){
            //l'attuale allenatore fa anche questo allenamento
            self.sameOldTrainerEvent(trainingID, trainingName);
          } else {
            //allenamento e allenatore nuovi
            self.chooseRandomTrainer(trainingID, trainingName);
          }
        });
    } else if(this.userPersonalTrainerID && this.userTrainingID === trainingID){
        this.toast.create({
            message: "Fai già questo allenamento!",
            duration: 3500,
            cssClass: 'cssToast'
          }).present();
    } else this.chooseRandomTrainer(trainingID, trainingName);  
  }

  sameOldTrainerEvent(trainingID, trainingName){
    console.log("sameOldTrainerEvent");
    this.alertCtrl.create({
     title: "Il tuo allenatore è qui!",
      subTitle: 'Sembra che il tuo allenatore copra anche questo tipo di allenamento, vuoi continuare con lui?',
      buttons: [
        {
          text: 'Si',
          handler: () =>{
            this.modifyTrainingKeepTrainer(trainingID, trainingName);
          }
        },
        {
          text: 'No',
          handler: () =>{
            this.chooseRandomTrainer(trainingID, trainingName);
          }
        }
      ],
      enableBackdropDismiss: false //se si clicca fuori dall'alert non viene chiuso
    }).present();
  }

  chooseRandomTrainer(trainingID, trainingName){
    console.log("chooseRandomTrainer, userName", this.userName);
    console.log("chooseRandomTrainer, trainingID", trainingID); 
    console.log("chooseRandomTrainer, userPTID: "+this.userPersonalTrainerID);
    var trainerList= new Array();
    this.afDatabase.list(`/gym/trainings/${trainingID}/trainers`)
      .valueChanges().subscribe(snapshots =>{
        snapshots.forEach(snapshot => {          
          trainerList.push(snapshot);
        });
      
      this.getRandomTrainer(trainerList).then(result =>{
        console.log("result: "+result);
        var resultID = result.substr(0, result.indexOf('@'));
 
        //aggiorna il nodo utente
        this.afDatabase.object(`/profile/user/${this.userID}/`).update({
          trainer: result,
          training: trainingID,
          trainingName: trainingName,
          card: null,
          hasExercise: false          
        }).then(() =>{
            //rimuove l'utente dal precedente personal trainer
            if(this.userPersonalTrainerID){   
              console.log("rimozione utente a sott a "+this.userPersonalTrainerID);
              this.afDatabase
              .object(`/profile/trainer/${this.userPersonalTrainerID}/users/${this.userID}`).remove();
            }

            //aggiorna il nuovo personal trainer
            let self = this;
              firebase.database()
                  .ref(`/profile/user/${this.userID}/name`)
                  .on('value', function(snapshot){
                    console.log("username preso da firebase", snapshot.val());
                    self.afDatabase
                      .object(`/profile/trainer/${resultID}/users/${self.userID}`)
                      .update({
                          UID: self.userID,
                          username: snapshot.val(),
                          training: trainingName,
                          hasExercise: false,
                          notRead: false
                    }).then(() =>{
                        if(self.parentPage){
                          self.parentPage.loadUserData(); //aggiorna le informazioni nella schermata precedente
                          self.navCtrl.pop();
                        } else self.navCtrl.setRoot(TabsPage);                
                      });  
              }); /*                       
            this.afDatabase
                .object(`/profile/trainer/${resultID}/users/${this.userID}`)
                .update({
                    UID: this.userID,
                    training: trainingName
                }).then(() =>{
                    if(this.parentPage){
                      this.parentPage.loadUserData(); //aggiorna le informazioni nella schermata precedente
                      this.navCtrl.pop();
                    } else this.navCtrl.setRoot(TabsPage);                
                }); */           
        });
      });
    });  
  }

  async getRandomTrainer(list):Promise<String>{
    var mailPicked = list[this.getTrainerFromList(0, (list.length-1))];
    console.log("mail picked: "+mailPicked);
    var trainerIDPicked = mailPicked.substr(0, mailPicked.indexOf('@'));
    return trainerIDPicked === this.userPersonalTrainerID ? this.getRandomTrainer(list) : mailPicked;    
  }

  //Restituisce l'indirizzo mail di un personal trainer con cui allenarsi   
  getTrainerFromList(min, max) {
    return Math.floor(min + Math.random()*(max + 1 - min));
  }


  modifyTrainingKeepTrainer(trainingID, trainingName){
    console.log("modifyTraining");
    //aggiorna il nodo utente
    this.afDatabase.object(`/profile/user/${this.userID}/`).update({
      training: trainingID,
      trainingName: trainingName,
      card: null,
      hasExercise: false
    }).then(() =>{
  
      //aggiorna il personal trainer
      this.afDatabase
          .object(`/profile/trainer/${this.userPersonalTrainerID}/users/${this.userID}`)
          .update({
             UID: this.userID,
             username: this.userName,
             training: trainingName,
             hasExercise: false
          }).then(() =>{
              this.parentPage.loadUserData();
              this.navCtrl.pop();
          });
        });    
  }

/*  //vecchia versione
  trainingClicked(trainingID:String){
    var trainerList= new Array();
    this.afDatabase.list(`/gym/trainings/${trainingID}/trainers`).valueChanges().subscribe(snapshots =>{
      snapshots.forEach(snapshot => {
        //console.log("ID allenamento: "+trainingID+", mail: "+snapshot);
        trainerList.push(snapshot);
      });
      //momentaneamente la selezione dell'allenatore è completamente randomica      
      var mailPicked = trainerList[this.getTrainer(0, (trainerList.length-1))];

       return Math.floor(0 + Math.random()*((list.length-1) + 1 - 0));
      console.log("email presa: "+mailPicked);

      //inserisce la mail dell'allenatore
      this.afDatabase.object(`/profile/user/${this.userID}/`).update({
        trainer: mailPicked,
        training: trainingID
        }).then(() =>{
          this.navCtrl.setRoot(TabsPage);
        });

      var trainerID = mailPicked.substr(0, mailPicked.indexOf('@'));
      this.afDatabase.list(`/profile/trainer/${trainerID}/users/`).push({uid: this.userID});
    });
  }
  
  //Restituisce l'indirizzo mail di un personal trainer con cui allenarsi   
  getTrainer(min, max) {
    return Math.floor(min + Math.random()*(max + 1 - min));
  }
  */
}
