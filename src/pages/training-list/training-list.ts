import { Storage } from '@ionic/storage';
import { HomePage } from './../home/home';
import { Training } from './../../models/training';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
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

  constructor(public navCtrl: NavController, public afDatabase: AngularFireDatabase, public storage: Storage,
  private afAuth: AngularFireAuth, public firestore: AngularFirestore, public navParams: NavParams) {

  }

  ionViewDidLoad() {
    this.afAuth.authState.subscribe(user =>{
     user ? this.userID = user.uid : this.navCtrl.setRoot(LoginPage);
    });
    this.getTrainings();
  }

  getTrainings(){
    this.trainings = this.afDatabase.list(`/gym/trainings`).valueChanges();
  }

  trainingClicked(trainingID:String){
    var trainerList= new Array();
    this.afDatabase.list(`/gym/trainings/${trainingID}/trainers`).valueChanges().subscribe(snapshots =>{
      snapshots.forEach(snapshot => {
        //console.log("ID allenamento: "+trainingID+", mail: "+snapshot);
        trainerList.push(snapshot);
      });
      //momentaneamente la selezione dell'allenatore è completamente randomica
      var mailPicked = trainerList[this.getTrainer(trainerList)];
      //console.log("email presa: "+mailPicked);

      //inserisce la mail dell'allenatore
      this.afDatabase.object(`/profile/user/${this.userID}/`).update({
        trainer: mailPicked,
        training: trainingID
        }).then(() =>{
          this.navCtrl.setRoot(HomePage);
        });

      var trainerID = mailPicked.substr(0, mailPicked.indexOf('@'));
      this.afDatabase.list(`/profile/trainer/${trainerID}/users`).push({uid: this.userID});
    });
  }

  /**
   * Restituisce l'indirizzo mail di un personal trainer con cui allenarsi
   */
  getTrainer(trainerList) {
    if(trainerList.lenght==0){
      throw new Error("La lista di allenatori disponibili per l'allenamento è vuota!");
    }else if(trainerList.lenght==1){
      return 0;
    }else{
      //implementare algoritmo di selezione
      return Math.floor(0 + Math.random()*(trainerList.lenght + 1 - 0))
    }
  }
}
