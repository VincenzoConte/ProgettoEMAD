import { Component } from '@angular/core';
import { NavController, NavParams, ToastController, AlertController } from 'ionic-angular';
import { LoginPage } from '../login/login';
import firebase from 'firebase';
import { TrainingListPage } from '../training-list/training-list';
import { Subscription } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';

/**
 * Generated class for the UserProfilePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-user-profile',
  templateUrl: 'user-profile.html',
})
export class UserProfilePage {
 public userID:string;
  public userName:string;
  subs: Subscription[] = [];
  
  constructor(
    private afAuth: AngularFireAuth,
    private storage: Storage, 
    public navCtrl: NavController, 
    public navParams: NavParams, 
    private alertCtrl: AlertController) {

  }

  ionViewDidLoad(){
    //this.checkLogin();
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
    let self = this;
    console.log("check training for ID: "+this.userID);  
    firebase.database().ref(`/profile/user/${this.userID}`)
      .child(`/training`).once('value', function(snapshot){
        if(!snapshot.exists()){
          self.presentAlert(); 
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
