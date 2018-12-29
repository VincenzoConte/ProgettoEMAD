import { AngularFireDatabase } from '@angular/fire/database';
import { TrainingListPage } from './../training-list/training-list';
import { AngularFireAuth } from '@angular/fire/auth';
import { Component, OnInit } from '@angular/core';
import { NavController, NavParams, ToastController } from 'ionic-angular';
import { User } from '../../models/user';
import {Validators, FormBuilder, FormGroup, FormControl } from '@angular/forms';


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
export class FirstAccessPage implements OnInit{
  //userData = {} as UserData;
  user = {} as User;
  isenabled:boolean=false;

  privacyPolicy:boolean=false;

  formgroup:FormGroup;
  public fbUserID:string;

  constructor(public navCtrl: NavController, public afDatabase: AngularFireDatabase, public navParams: NavParams, 
              private afAuth: AngularFireAuth, public toast: ToastController, private formBuilder: FormBuilder) {
    this.setUserID(); 
  }

  ngOnInit(): void{
    this.formgroup = new FormGroup({
      age: new FormControl('', [Validators.required, Validators.pattern('[0-9]*'), Validators.maxLength(3)]),
      height: new FormControl('', [Validators.required, Validators.pattern('[0-9]*'), Validators.maxLength(3)]),
      weight: new FormControl('', [Validators.required, Validators.pattern('[0-9]*')])
    });
  }
  
  /**
   * Aggiunge al database le informazioni riguardo l'utente
   * @param user inserito nel form
   */
  async userDataAdded(){
    this.user.age = this.formgroup.value['age'];
    this.user.height = this.formgroup.value['height'];
    this.user.weight = this.formgroup.value['weight'];

    if(this.privacyPolicy && String(this.user.age) != "" && String(this.user.height) != "" && String(this.user.weight) != ""){
      this.afDatabase.object(`profile/user/${this.fbUserID}`).update(this.user)
        .then(() => {
          console.log("Dati utente inseriti!");            
          this.navCtrl.push(TrainingListPage);
      });   
    } else {
       this.toast.create({
              message: "Riempi tutti i campi richiesti!",
              duration: 3000
            }).present();
    }
         
  }

  /**
   * Recupera l'ID utente per poter effettuare correttemente le query
   */
  setUserID(){
    let self = this;
     this.afAuth.authState.take(1).subscribe(user =>{
       if(user){
         console.log("setUserID - taking: "+user.uid);
         self.fbUserID = user.uid;
       }
     });    
  }

  /**
   * Si assicura che sia stata accettata la policy di privacy
   */
  updatePrivacyPolicy(){
    this.privacyPolicy = !this.privacyPolicy;
    console.log("privacy policy state: "+this.privacyPolicy);
    if(this.privacyPolicy)
      this.isenabled = true;
      else this.isenabled = false;
  }

  /**
   * Controlla che i campi di testo non siano vuoti
   */
  isDataNotNull():boolean{
    if(this.user.name != null && this.user.age != null && this.user.height != null && this.user.weight != null)
      if(this.user.name != "" && String(this.user.age) != "" && String(this.user.height) != "" && String(this.user.weight) != "")
        return true;
    else return false;
  }

  /*
  async userDataAdded(user: User){
      if(!this.isDataNotNull()){
         this.toast.create({
          message: "Riempi tutti i campi!",
          duration: 2500
        }).present();            
      } else if(!this.privacyPolicy){
         this.toast.create({
          message: "Accetta le condizioni d'uso per continuare.",
          duration: 2500
         }).present();  
      } else {              
        this.afDatabase.object(`profile/user/${this.fbUserID}`).update(this.user)
        .then(() => {
          console.log("Dati utente inseriti!");            
          this.navCtrl.push(TrainingListPage);
        });        
      }
  }
  */
}