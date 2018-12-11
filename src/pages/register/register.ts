import { UserData } from './../../models/userData';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, Toast } from 'ionic-angular';
import { User } from '../../models/user';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';
import * as firebase from 'firebase';
import { LoginPage } from '../login/login';
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
  userdata = {} as UserData;

  constructor(private angularAuth: AngularFireAuth, private storage: Storage, private afDatabase: AngularFireDatabase, 
              private toast: ToastController,  public navCtrl: NavController, public navParams: NavParams) {
  }

  async registerUser(user: User){
    try{
    const result = await this.angularAuth.auth.createUserWithEmailAndPassword(user.email, user.password)
    .then(res =>{
        let user = firebase.auth().currentUser;
        user.sendEmailVerification();
        this.storage.set('firstaccess', true);

          this.angularAuth.authState.take(1).subscribe(auth =>{
            //this.userdata.userID = auth.uid;
            this.userdata.age = this.user.age;
            this.userdata.email = this.user.email;
            this.userdata.height = 170;
            this.userdata.weight = this.user.weight;
            this.afDatabase.object(`profile/${auth.uid}`).set(this.userdata)
          //.then(() => this.navCtrl.push(HomePage));
          //firebase.database().ref('profile').child(user.uid).once('value', function(snapshot) {
          //    console.log("snapshot exists?: "+snapshot.exists());
          //});
          });
        //console.log("User: "+user);    
        //console.log("UserData: "+this.userdata);    
        this.navCtrl.setRoot(LoginPage);
      });
    } catch(e){
     this.toast.create({
        message: "C'è qualcosa che non va nei campi, controlla!",
        duration: 3000
      }).present();
    }
  }
}
