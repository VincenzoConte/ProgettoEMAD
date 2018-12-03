import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { AngularFireModule} from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { Facebook } from '@ionic-native/facebook';

const firebaseConfig = {
    apiKey: "AIzaSyBvBtahWOFGtsiz8k6_3ok9ksx-HS70UUs",
    authDomain: "capgemini-personal-fitness.firebaseapp.com",
    databaseURL: "https://capgemini-personal-fitness.firebaseio.com",
    projectId: "capgemini-personal-fitness",
    storageBucket: "capgemini-personal-fitness.appspot.com",
    messagingSenderId: "96328966461"
  };

@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireAuthModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Facebook,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
