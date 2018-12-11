import { AngularFireAuth } from '@angular/fire/auth';
import { UserData } from './../../models/userData';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { AngularFirestore } from '@angular/fire/firestore';

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
  userData = {} as UserData;
  isenabled:boolean=false;
  privacyPolicy:boolean=false;

  userDoc;
  public fbUserName;
  public userID:string;

  constructor(public navCtrl: NavController, public navParams: NavParams, private afAuth: AngularFireAuth,
    private firestore: AngularFirestore, public toast: ToastController) {
    this.fbUserName = navParams.get("fbUserName");
    
    if(navParams.get("userID") == null){
      this.setUserID();
      console.log("passato un userID nullo");
    } else this.userID = navParams.get("userID");

    if(this.fbUserName != null){
      this.userData.name = this.fbUserName;
    }  
    
  }

  setUserID(){
    if(this.userID == null){
      this.afAuth.authState.subscribe(user => {
        if(user){ //l'utente era già loggato in precedenza              
          console.log("user ID in first-access.ts: "+user.uid);  
          this.userID = user.uid;        
      }});
    } else {
      //console.log("user ID in first-access.ts GIA' PASSATO IN PRECEDENZA: "+this.userID);
    }
    this.userDoc = this.firestore.doc<any>('user/'+this.userID);
  }

  updatePrivacyPolicy(){
    console.log("privacy policy state: "+this.privacyPolicy);

    if(this.isDataNotNull() && this.privacyPolicy)
      this.isenabled = true;
  }

  isDataNotNull(){
    if(this.userData.name != null && this.userData.age != null && this.userData.height != null && this.userData.weight != null)
      if(this.userData.name != "" && String(this.userData.age) != "" && String(this.userData.height) != "" && String(this.userData.weight) != "")
        return true;
    else return false;
  }

  async userDataAdded(userData: UserData){
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
      }else{              
        this.setUserID();
        //console.log("userID al click del tasto::: "+this.userID);
        this.userDoc.set({
          name: userData.name,
          age: userData.age,
          height: userData.height,
          weight: userData.weight
        });
        console.log("user weight: "+userData.weight);
      }
  }

}
