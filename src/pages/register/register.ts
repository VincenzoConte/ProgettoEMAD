import { Component, OnInit } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { User } from '../../models/user';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';
import * as firebase from 'firebase';
import { LoginPage } from '../login/login';
import { Storage } from '@ionic/storage';
import {Validators, FormBuilder, FormGroup, FormControl } from '@angular/forms';

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
export class RegisterPage implements OnInit{

  user = {} as User;
  formgroup:FormGroup;
  privacyPolicy = false;
  EMAILPATTERN = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;

  constructor(private angularAuth: AngularFireAuth, private storage: Storage, private afDatabase: AngularFireDatabase, 
              private toast: ToastController,  public navCtrl: NavController, public navParams: NavParams, private formBuilder: FormBuilder) {      
  }
  
  ngOnInit(): void {
    this.formgroup = new FormGroup({
        name: new FormControl('', [Validators.required, Validators.pattern('[a-zA-Z ]*')]),
        mail: new FormControl('', [Validators.required, Validators.pattern(this.EMAILPATTERN)]),
        password: new FormControl('', [Validators.required, Validators.pattern('[a-zA-Z ]*'), Validators.minLength(5)]),
        age: new FormControl('', [Validators.required, Validators.pattern('[0-9 ]*'),  Validators.maxLength(3)]),
        height: new FormControl('', [Validators.required, Validators.pattern('[0-9]*')]),
        weight: new FormControl('', [Validators.required, Validators.pattern('[0-9]*')])
      });
  }

  async register(){
    //vengono copiate le informazioni nell'oggetto User
    console.log("password inserita: "+this.formgroup.value['password']);
    this.user.name = this.formgroup.value['name'];
    this.user.email = this.formgroup.value['mail'];
    this.user.age = this.formgroup.value['age'];
    this.user.height = this.formgroup.value['height'];
    this.user.weight = this.formgroup.value['weight'];

    if(this.privacyPolicy && String(this.user.name) != "" && String(this.user.email) != "" 
        && String(this.user.age) != "" && String(this.user.height) != "" && String(this.user.weight) != ""){
        try{
          await this.angularAuth.auth.createUserWithEmailAndPassword(this.user.email,this.formgroup.value['password'])
            .then(() =>{          
              let user = firebase.auth().currentUser;
              user.sendEmailVerification();      
              this.angularAuth.authState.take(1).subscribe(auth=>{
                this.afDatabase.object(`profile/user/${auth.uid}`).update(this.user);
              })
            }).then(()=>{
              this.navCtrl.setRoot(LoginPage);
            });            
        } catch(error){
          this.toast.create({
            message: "C'è qualcosa che non va nei campi, controlla!",
            duration: 3000
          }).present();          
          console.log("errore!: "+error);    
        }
    } else if(!this.privacyPolicy){
      this.toast.create({
            message: "Accetta le condizioni d'uso per continuare.",
            duration: 3000
          }).present();
    } else {
      this.toast.create({
            message: "C'è qualcosa che non va nei campi, controlla!",
            duration: 3000
          }).present();
    }
  }

  updatePrivacyPolicy(){
    this.privacyPolicy = !this.privacyPolicy;
    //console.log("privacy policy state: "+this.privacyPolicy);
  }
}