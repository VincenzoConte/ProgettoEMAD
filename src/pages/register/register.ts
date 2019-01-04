import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { User } from '../../models/user';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';
import * as firebase from 'firebase';
import { LoginPage } from '../login/login';
import { Storage } from '@ionic/storage';
import {Validators, FormBuilder, FormGroup, NgForm } from '@angular/forms';

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
  EMAILPATTERN = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;

  constructor(private angularAuth: AngularFireAuth, private storage: Storage, private afDatabase: AngularFireDatabase, 
              private toast: ToastController,  public navCtrl: NavController, public navParams: NavParams, private formBuilder: FormBuilder) {      
  }

  /**
   * Aggiunge al database le informazioni riguardo l'utente
   * @param user inserito nel form
   */
  async register(form :NgForm){
     this.submitted = true;
    console.log("utente: "+this.user.email+", pwd: "+this.user.password);
     if(form.valid && this.privacyPolicy){       
       console.log("form valido");      
       await this.angularAuth.auth.createUserWithEmailAndPassword(this.user.email, this.user.password)
        .then(() =>{
          let user = firebase.auth().currentUser;
          user.sendEmailVerification();
          this.user.password = null;
          this.angularAuth.authState.take(1).subscribe(auth=>{
            this.afDatabase.object(`profile/user/${auth.uid}`).update(this.user);
          });          
        }).then(()=>{
          this.navCtrl.setRoot(LoginPage);
          this.toast.create({
                message: "Grande! Valida la mail per entrare.",
                duration: 3000
              }).present();
        }).catch(()=>{
              this.toast.create({
                message: "Sicuro di aver messo una mail valida?",
                duration: 3000
              }).present();
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
   * Aggiorna lo stato della privacy policy
   */
  updatePrivacyPolicy(){
    this.privacyPolicy = !this.privacyPolicy;
  }
}