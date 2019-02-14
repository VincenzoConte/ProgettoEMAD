import { Component } from '@angular/core';
import { NavController, NavParams, ToastController } from 'ionic-angular';
import { User } from '../../models/user';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';
import * as firebase from 'firebase';
import { LoginPage } from '../login/login';
import { FormGroup, NgForm } from '@angular/forms';
import { TrainingListPage } from '../training-list/training-list';

/**
 * Generated class for the RegisterPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-register',
  templateUrl: 'register.html',
})

export class RegisterPage {
  user = {} as User;
  formgroup:FormGroup;
  privacyPolicy = false;
  submitted = false;

  constructor(
    private angularAuth: AngularFireAuth, 
    private afDatabase: AngularFireDatabase, 
    private toast: ToastController,  
    public navCtrl: NavController, 
    public navParams: NavParams 
    ){  
  }

  /**
   * Aggiunge al database le informazioni riguardo l'utente
   * @param user inserito nel form
   */
  async register(form :NgForm){
     this.submitted = true;
   

     if(form.valid && this.privacyPolicy){      
       console.log("form valido");  
       console.log("utente: "+this.user.email+", pwd: "+this.user.password);
       console.log("genere utente: "+this.user.gender);
       console.log("Altezza: "+this.user.height+", peso: "+this.user.weight);
       this.user.BMI = this.user.weight/((this.user.height/100)*(this.user.height/100));
       this.user.hasExercise = false;
       console.log("BMI: "+this.user.BMI);
       console.log("Has Exercise: "+this.user.hasExercise);
      
       await this.angularAuth.auth.createUserWithEmailAndPassword(this.user.email.toLowerCase(), this.user.password)
        .then(() =>{
          //let user = firebase.auth().currentUser;
          //user.sendEmailVerification();
          this.user.password = null;
          this.angularAuth.authState.take(1).subscribe(auth=>{
            this.afDatabase.object(`profile/user/${auth.uid}`).update(this.user);
            //Salva il Peso e il BMI nel database delle Statistiche
            var rootRef = firebase.database().refFromURL("https://capgemini-personal-fitness.firebaseio.com/");
            var date = new Date().toISOString().split('T')[0];
            var urlRefBMI =  rootRef.child("/Stats/"+auth.uid+"/BMI/"+date+"/Value");
            var urlRefPeso =  rootRef.child("/Stats/"+auth.uid+"/Peso/"+date+"/Value");
            urlRefPeso.set(this.user.weight);
            urlRefBMI.set(this.user.BMI);
          });          
        }).then(()=>{          
          /*
          this.toast.create({
                message: "Grande! Verifica la tua e-mail per entrare.",
                duration: 3000,
                cssClass: 'cssToast'
              }).present();
          this.navCtrl.setRoot(LoginPage);    
          */
          this.navCtrl.setRoot(TrainingListPage);
        }).catch(()=>{
              this.toast.create({
                message: "Sicuro di aver inserito una mail valida?",
                duration: 3000,
                cssClass: 'cssToast'
              }).present();
        });        
     } else if(!this.privacyPolicy){
       this.toast.create({
                message: "Accetta i termini e le condizioni per continuare.",
                duration: 3000,
                cssClass: 'cssToast'
        }).present();
     } else {
       console.log("form NON valido");
       this.toast.create({
                message: "Ricontrolla i tuoi dati",
                duration: 3000,
                cssClass: 'cssToast'
        }).present();        
     }     
  }

  /**
   * Aggiorna lo stato della privacy policy
   */
  updatePrivacyPolicy(){
    this.privacyPolicy = !this.privacyPolicy;
  }
}
