import { LoginPage } from './../login/login';
import { AngularFireDatabase } from '@angular/fire/database';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, NavParams, Platform, Content } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import firebase from 'firebase';
import { Observable } from 'rxjs';
import { HistoryTrainingItem } from '../../models/historyTrainingItem';
import 'rxjs/add/operator/map';
import { stringify } from '@angular/core/src/util';
/**
 * Generated class for the TrainingHistoryPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */
declare var google;
@Component({
  selector: 'page-training-history',
  templateUrl: 'training-history.html',
})
export class TrainingHistoryPage {
  @ViewChild('map') mapElement: ElementRef;
  @ViewChild('pageTop') pageTop: Content;
  map:any;
  ionScroll;
  userID:string;
  coordsArray = [];
  currentMapTrack = null;
  isMapHidden:boolean = false;
  infotext:string;    
  infoString = 'Seleziona una corsa';
  item:any;
  activityList = [];
  activityListObservable:Observable<any[]>;
  activityItemsArray = [];
  trainingItemClicked = {} as HistoryTrainingItemClicked;
  
  constructor(
    public navCtrl: NavController, 
    private storage: Storage, 
    public navParams: NavParams,
    private platform: Platform
    ) {
    this.infotext = this.infoString;
  }

  ionViewDidLoad() { 
    this.platform.ready().then(()=>{
      this.getUserData();
      this.configureMap();
      let latLng = new google.maps.LatLng(40.678841, 14.756113); //default di fronte al comune di Salerno 
      this.map.setCenter(latLng);
    });  
  }

  /**
   * Recupera le informazioni circa l'utente
   */
  getUserData(){
    this.storage.get("userLoggedID").then(result=>{
      if(result !== undefined && result !="" && result != null){
        this.userID = result;     
        this.loadOldActivity();
      } else this.navCtrl.setRoot(LoginPage).then(()=>{window.location.reload()});
    }); 
  }

  /**
   * Carica in asincrono le informazioni dell'attività dell'utente
   */
  async loadOldActivity(){   
    console.log("loadOldActivity");
    let self = this;  
    firebase.database()
    .ref(`/oldActivities/${this.userID}`)    
    .once('value', function(snapshot){
      if(snapshot.exists()){                      
        snapshot.forEach(element => {
          self.activityList.push({
            hours: Object.keys(element.val().maps), 
            maps: element.val().maps, 
            date: element.val().date, 
            card: element.val().card,
            isMapHidden: true
          });
        });        
      }
    });    
  }
   
  /**
   * Prende le coordinate cliccate
   * @param hourClicked 
   * @param day 
   */ 
  onClickHour(hourClicked:string, day:string){
    this.trainingItemClicked = this.activityList.find(item => item.date === day); //oggetto cliccato  
    this.isMapHidden = true;
    for(var key in this.trainingItemClicked.maps){
      if(key === hourClicked){
        this.pageTop.scrollToTop();
        this.infotext = `Corsa delle ${hourClicked} del ${day}`;

        var coordsArray = this.trainingItemClicked.maps[key];
        console.log("valore key ",key);
        console.log(`valore maps[${key}]`,coordsArray); 
        let latLng = new google.maps.LatLng(coordsArray[0]);
        this.map.setCenter(latLng);
        this.redrawPath(coordsArray);
      }     
    }
  }

  /**
   * Disegna la polyline
   * @param path 
   */
  redrawPath(path) {
    if (this.currentMapTrack) {
      this.currentMapTrack.setMap(null);
    }
 
    if (path.length > 1) {
      this.currentMapTrack = new google.maps.Polyline({
        zIndex: 1,
        path: path,
        geodesic: true,
        strokeColor: '#00B3FD',
        strokeOpacity: 0.7,
        strokeWeight: 7,
        icons: [{
           repeat: '30px',
          icon: {
            path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
            scale: 1,
            fillOpacity: 0,
            strokeColor: '#fff', //COLORS.white,
            strokeWeight: 1,
            strokeOpacity: 1
          }
        }]
      });
      this.currentMapTrack.setMap(this.map);
    }
  }

  /**
   * Ripulisce la mappa dai polyline
   */
  clearMap(){
    if (this.currentMapTrack) {
      this.currentMapTrack.setMap(null);
      this.isMapHidden = !this.isMapHidden;
      this.infotext = this.infoString;
    }    
  }

  /**
   * Configura Google Maps
   */
  private configureMap(){      
    let mapOptions = {
      zoom: 15,       
      scrollwheel: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      panControl: false,
      rotateControl: false,
      scaleControl: false,
      disableDefaultUI: true,
      clickableIcons: false,
    };    
    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);   
  }
}

export interface HistoryTrainingItemClicked{
    data: any;
    card: any;
    date: string;
    maps: any;
}