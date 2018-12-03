import { Component } from '@angular/core';
import { NavController, NavParams, ToastController } from 'ionic-angular';
import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(private angularAuth: AngularFireAuth, private toast: ToastController,
    public navCtrl: NavController, public navParams: NavParams) {

  }

  ionViewWillLoad(){
    this.angularAuth.authState.subscribe(data => {
      if(data && data.email && data.uid){
          this.toast.create({
          message: "Benvenuto!",
          duration: 3500
        }).present();
      } else {
        this.toast.create({
          message: "Sessione non valida, riesegui il login.",
          duration: 5000
        }).present();
      }
    });
  }

}
