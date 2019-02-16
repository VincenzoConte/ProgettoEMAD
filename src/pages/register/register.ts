import { Component } from '@angular/core';
import { NavController, NavParams, ToastController } from 'ionic-angular';
import { User } from '../../models/user';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';
import * as firebase from 'firebase';
import { FormGroup, NgForm } from '@angular/forms';
import { TrainingListPage } from '../training-list/training-list';
import { Storage } from '@ionic/storage';

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
    public storage: Storage, 
    public navParams: NavParams 
    ){  
  }

  /**
   * Aggiunge al database le informazioni riguardo l'utente
   * @param user inserito nel form
   */
  async register(form :NgForm){
     this.submitted = true;
     var mail = this.user.email.toLowerCase().replace(/\s/g,'');
      console.log("valore mail inserito",this.user.email);
      console.log("valore mail corretto",this.user.email.toLowerCase().replace(/\s/g,''));
     if(form.valid && this.privacyPolicy && this.user.name.match("[a-zA-Z]+")){      
       //this.user.BMI = this.user.weight/((this.user.height/100)*(this.user.height/100));
       this.user.BMI = this.user.weight/Math.pow((this.user.height/100), 2);
       this.user.hasExercise = false;
       console.log("form valido");  
       /*
       console.log("utente: "+this.user.email+", pwd: "+this.user.password);
       console.log("genere utente: "+this.user.gender);
       console.log("Altezza: "+this.user.height+", peso: "+this.user.weight);       
       console.log("BMI: "+this.user.BMI);
       console.log("Has Exercise: "+this.user.hasExercise);
       */
      
       await this.angularAuth.auth.createUserWithEmailAndPassword(mail, this.user.password)
        .then(() =>{
          //let user = firebase.auth().currentUser;
          //user.sendEmailVerification();
          this.user.password = null;
          this.angularAuth.authState.subscribe(auth=>{ //authState.take(1) genera errore
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
          //this.showToast('Grande! Verifica la tua e-mail per entrare.');
          let user = firebase.auth().currentUser;
          console.log("UID dell'utente appena creato:", user.uid);
          this.storage.set("userLoggedID", user.uid).then(()=>{
            this.navCtrl.setRoot(TrainingListPage);
          });          
        }).catch((error)=>{
          console.log("errore nella registrazione", error.code);
          if(error.code === 'auth/email-already-in-use'){              
            this.showToast('Sembra che la mail sia già in uso');
          } else if(error.code === 'auth/weak-password'){ 
            this.showToast('Password troppo debole, deve essere almeno di 6 caratteri');
          } else if(error.code === 'auth/invalid-email'){
            this.showToast('La mail che hai inserito non è valida, controlla!');
          } else this.showToast('Registrazione fallita: '+error.code, 3000);              
        });
     } else if(!this.privacyPolicy){
        this.showToast('Accetta i termini e le condizioni per continuare.');
     } else if(!this.user.name.match("[a-zA-Z]+")){
       this.showToast('Il nome inserito non è valido, riprova');       
     } else {
       this.showToast('Qualcosa è andato storto durante la registrazione');
     }
  }

  showToast(message, time?){
    this.toast.create({
        message: message,
        duration: time || 1500,
        cssClass: 'cssToast'
    }).present();
  }

  /**
   * Aggiorna lo stato della privacy policy
   */
  updatePrivacyPolicy(){
    this.privacyPolicy = !this.privacyPolicy;
  }
}
