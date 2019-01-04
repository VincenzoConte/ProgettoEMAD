import { LoginPage } from './../login/login';
import { Storage } from '@ionic/storage';
import { AngularFireDatabase } from '@angular/fire/database';
import { Component } from '@angular/core';
import { NavController, NavParams, ToastController} from 'ionic-angular';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase from 'firebase';
import { Subscription } from 'rxjs';
import { TrainingListPage } from '../training-list/training-list';
import { AlertController } from 'ionic-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  public userID:string;
  public userName:string;
  subs: Subscription[] = [];
  
  constructor(private afAuth: AngularFireAuth, private afDatabase: AngularFireDatabase, 
    private storage: Storage, private toast: ToastController, public navCtrl: NavController, 
    public navParams: NavParams, private alertCtrl: AlertController) {

  }

  ionViewDidLoad(){
    this.checkLogin();
    console.log("userID: "+this.userID);      
  }

  presentAlert() {    
    let alert = this.alertCtrl.create({
      title: "E l'allenamento?",    
      subTitle: 'Seleziona un allenamento per proseguire',
      buttons: [{
        text: 'OK',
        handler: () =>{
          console.log("ok clicked");
          this.navCtrl.push(TrainingListPage);
        }
      }],
      enableBackdropDismiss: false //se si clicca fuori dall'alert non viene chiuso    
    });
    alert.present();     
  }

  checkTraining(){  
    console.log("check training for ID: "+this.userID);  
    let self = this;
    firebase.database().ref(`/profile/user/${this.userID}`)
      .child(`/training`).once('value', function(snapshot){
        if(!snapshot.exists()){
          this.presentAlert(); 
        }        
    });
  }

  checkLogin(){      
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
          } else self.checkTraining();
        }               
      });
    });              
  }

  logout(){    
    this.storage.ready().then(() => {
      firebase.auth().signOut();
      this.storage.set("userLoggedID", "").then(() =>{
        console.log("logging out...");
        this.navCtrl.setRoot(LoginPage);
      });    
    });
  }
}