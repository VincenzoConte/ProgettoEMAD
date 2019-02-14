import { AngularFireDatabase } from '@angular/fire/database';
import { Component } from '@angular/core';
import { NavController, NavParams, ToastController } from 'ionic-angular';

/**
 * Generated class for the TrainerCardPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-trainer-card',
  templateUrl: 'trainer-card.html',
})
export class TrainerCardPage {
  user:any;
  trainer:any;
  parentPage:any;
  card:string[] = [];
  todo:string;

  constructor(
    public afDatabase: AngularFireDatabase,
    public navCtrl: NavController,
    public navParams: NavParams,
    public toastCtrl: ToastController,
    ) {
    this.trainer = navParams.get('trainer');
    this.user = navParams.get('user');
    this.parentPage = navParams.get('parentPage');
  }

  /**
   * Aggiunge l'attività alla lista
   */
  add(){
    if(this.todo && this.todo != ""){
      this.card.push(this.todo);
      this.todo = "";
    } else console.log("campo vuoto: "+this.todo);
    
  }

  /**
  * Cancella l'elemento dalla lista
  */
  delete(item){
    var index = this.card.indexOf(item, 0);
    if(index > -1){
      this.card.splice(index,1);
    }
  }

  /**
   * Invia la scheda all'utente
   */
  sendToUser(){
    console.log("user id: "+this.user.UID);
      this.afDatabase.object(`/profile/user/${this.user.UID}/`)
        .update({
          card: this.card,
          hasExercise: true
        }).then(()=>{
            this.toastCtrl.create({
              message: "Scheda inviata!",
              duration: 3000,
              cssClass: 'cssToast'
            }).present();
            //aggiorna l'hasExercise nel nodo del personal trainer
            this.afDatabase.object(`/profile/trainer/${this.trainer}/users/${this.user.UID}/`)
              .update({hasExercise: true});
            this.navCtrl.pop();
            //this.parentPage.getUsers();
      }).catch(error =>{
        this.toastCtrl.create({
          message: "Errore durante l'invio della scheda",
          duration: 3000,
          cssClass: 'cssToast'
        }).present();
        console.log("Errore durante l'invio della scheda: "+error);
      });
  }


}
