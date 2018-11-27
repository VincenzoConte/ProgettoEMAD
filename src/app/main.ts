import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import firebase from 'firebase';
import { AppModule } from './app.module';
var config = {
    apiKey: "AIzaSyBvBtahWOFGtsiz8k6_3ok9ksx-HS70UUs",
    authDomain: "capgemini-personal-fitness.firebaseapp.com",
    databaseURL: "https://capgemini-personal-fitness.firebaseio.com",
    projectId: "capgemini-personal-fitness",
    storageBucket: "capgemini-personal-fitness.appspot.com",
    messagingSenderId: "96328966461"
  };
  firebase.initializeApp(config);

platformBrowserDynamic().bootstrapModule(AppModule);
