import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, Toast } from 'ionic-angular';
import { User } from '../../models/user';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase';

/**
 * Generated class for the RegisterPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-register',
  templateUrl: 'register.html',
})
export class RegisterPage {
  user = {} as User;
  constructor(private angularAuth: AngularFireAuth, private toast: ToastController,
    public navCtrl: NavController, public navParams: NavParams) {
  }

  async registerUser(user: User){
    try{
    const result = await this.angularAuth.auth.createUserWithEmailAndPassword(user.email, user.password)
    .then(res =>{
      let user = firebase.auth().currentUser;
      user.sendEmailVerification();
      this.navCtrl.setRoot('LoginPage');
    });
    console.log(result);
    } catch(e){
     this.toast.create({
        message: "C'è qualcosa che non va nei campi, controlla!",
        duration: 3000
      }).present();
    }
  }
}
