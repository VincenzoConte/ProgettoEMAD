import { Storage } from '@ionic/storage';
import { AngularFireDatabase } from '@angular/fire/database';
import { TrainingListPage } from './../training-list/training-list';
import { AngularFireAuth } from '@angular/fire/auth';
import { Component, OnInit } from '@angular/core';
import { NavController, NavParams, ToastController } from 'ionic-angular';
import { User } from '../../models/user';
import { Validators, FormBuilder, FormGroup, FormControl, NgForm } from '@angular/forms';


/**
 * Generated class for the FirstAccessPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-first-access',
  templateUrl: 'first-access.html',
})
export class FirstAccessPage {
  user = {} as User;
  isenabled:boolean=false;
  privacyPolicy:boolean=false;
  submitted = false;

  formgroup:FormGroup;
  public fbUserID:string;

  constructor(public navCtrl: NavController, public afDatabase: AngularFireDatabase, public navParams: NavParams, public storage: Storage,
              private afAuth: AngularFireAuth, public toast: ToastController, private formBuilder: FormBuilder) {
    this.setUserID();
  }


  /**
   * Aggiunge al database le informazioni riguardo l'utente
   * @param user inserito nel form
   */
  async register(form: NgForm){
    this.submitted = true;
    if(form.valid && this.privacyPolicy){
      console.log("(first-access) form valido");
      this.afDatabase.object(`profile/user/${this.fbUserID}`).update(this.user)
        .then(() => {
          console.log("Dati utente inseriti!");
          this.navCtrl.setRoot(TrainingListPage);
        });
    } else if(!this.privacyPolicy){
      this.toast.create({
                message: "Accetta i termini e le condizioni per continuare",
                duration: 3000
      }).present();
    } else {
      console.log("form NON valido");
      this.toast.create({
                message: "Ricontrolla i tuoi dati",
                duration: 3000
      }).present();
    }
  }

  /**
   * Recupera l'ID utente per poter effettuare correttemente la query
   */
  setUserID(){
    let self = this;
     this.afAuth.authState.take(1).subscribe(user =>{
       if(user){
         console.log("(first-access) ID Facebook preso: "+user.uid);
         self.fbUserID = user.uid;
       }
     });
  }

  /**
   * Aggiorna lo stato della privacy policy
   */
  updatePrivacyPolicy(){
    this.privacyPolicy = !this.privacyPolicy;
  }
}
