import { FirstAccessPage } from './../pages/first-access/first-access';
import { RegisterPage } from './../pages/register/register';
import { LoginPage } from './../pages/login/login';
import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { AngularFireModule} from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { IonicStorageModule } from '@ionic/storage';
import { Facebook } from '@ionic-native/facebook';
import { TrainingListPage } from '../pages/training-list/training-list';
import { TrainerhomePage } from '../pages/trainerhome/trainerhome';
import { ChatPage } from '../pages/chat/chat';
import { TrainerChatPage } from '../pages/trainer-chat/trainer-chat';
import { ChatHistoryPage } from '../pages/chat-history/chat-history';
import { TabsPage } from '../pages/tabs/tabs';
import { UserInfoPage } from '../pages/user-info/user-info';
import { StatsPage } from '../pages/stats/stats';
import { TrainerCardPage } from '../pages/trainer-card/trainer-card';
import { SocialSharing } from '@ionic-native/social-sharing/';
import { TrainingHistoryPage } from '../pages/training-history/training-history';
import * as firebase from 'firebase';

const firebaseConfig = {
    apiKey: "AIzaSyBvBtahWOFGtsiz8k6_3ok9ksx-HS70UUs",
    authDomain: "capgemini-personal-fitness.firebaseapp.com",
    databaseURL: "https://capgemini-personal-fitness.firebaseio.com",
    projectId: "capgemini-personal-fitness",
    storageBucket: "capgemini-personal-fitness.appspot.com",
    messagingSenderId: "96328966461"  
  };
firebase.initializeApp(firebaseConfig);
@NgModule({
  declarations: [
    MyApp,
    HomePage,
    LoginPage,
    RegisterPage,
    FirstAccessPage,
    TrainerhomePage,
    TrainingListPage,
    ChatPage,
    TabsPage,
    UserInfoPage,
    TrainerChatPage,
    TrainerCardPage,
    TrainingHistoryPage,
    ChatHistoryPage,
    StatsPage

  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireAuthModule,
    AngularFireDatabaseModule,
    AngularFirestoreModule,
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    LoginPage,
    RegisterPage,
    FirstAccessPage,
    TrainerhomePage,
    TrainingListPage,
    ChatPage,
    TabsPage,
    UserInfoPage,
    TrainerCardPage,
    TrainerChatPage,
    TrainingHistoryPage,
    ChatHistoryPage,
    StatsPage

  ],
  providers: [
    StatusBar,
    SplashScreen,
    Facebook,
    SocialSharing,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
