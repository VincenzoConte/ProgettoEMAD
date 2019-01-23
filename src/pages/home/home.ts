import { Storage } from '@ionic/storage';

import {
  Component,
  ViewChild,
  ElementRef,
  NgZone
} from '@angular/core';

import {
  IonicPage,
  NavController,
  NavParams,
  ToastController,
  AlertController,
  LoadingController,
  Platform
} from 'ionic-angular';

import BackgroundGeolocation, {
  State,
  Config,
  Location,
  LocationError,
  Geofence,
  HttpEvent,
  MotionActivityEvent,
  ProviderChangeEvent,
  MotionChangeEvent,
  GeofenceEvent,
  GeofencesChangeEvent,
  HeartbeatEvent,
  ConnectivityChangeEvent
} from 'cordova-background-geolocation-lt';

// Cordova plugins Device & Dialogs
//import { Device } from '@ionic-native/device';
//import { Dialogs } from '@ionic-native/dialogs';

//Lo <script> di Google Maps si trova in index.html
declare var google;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  @ViewChild('map') mapElement: ElementRef;

  //Variabili per la geolocalizzazione in background
  isRunning: boolean;
  state: any;
  enabled: boolean;
  isMoving: boolean;
  distanceFilter: number;
  stopTimeout: number;
  autoSync: boolean;
  stopOnTerminate: boolean;
  startOnBoot: boolean;
  debug: boolean;
  provider: any;

  //Elementi dell UI
  menuActive: boolean;
  motionActivity: string;
  odometer: string;
  circlePosColor = '#0336FF';
  circlePosStrokeColor = '#ffffff';
  stationaryColor = '#FF0000';
  stationaryStrokeColor = '#FF0000';

  //Riferimenti a Google Maps
  map: any;
  locationMarkers: any;
  currentLocationMarker: any;
  lastLocation: any;
  //stationaryRadiusCircle: any; //per riattivarlo, cercare tutte le chiamate in cui è stato commentato
  polyline: any;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private zone:NgZone,
    private platform:Platform,
    //private device:Device,
    //private dialogs:Dialogs
    ){
      this.platform.ready().then(this.onDeviceReady.bind(this));
  }

  onDeviceReady(){    
    this.configureBackgroundGeolocation();
  }

  ionViewDidLoad() {
    this.configureMap();
  }

  private configureBackgroundGeolocation(){
    //STEP 1/3: Creazione listener degli eventi
    BackgroundGeolocation.onLocation(this.onLocation.bind(this));
    BackgroundGeolocation.onMotionChange(this.onMotionChange.bind(this));
    BackgroundGeolocation.onActivityChange(this.onActivityChange.bind(this));
    //BackgroundGeolocation.onHttp(this.onHttpSuccess.bind(this));
    BackgroundGeolocation.onProviderChange(this.onProviderChange.bind(this));
    //BackgroundGeolocation.onHeartbeat(this.onHeartbeat.bind(this));
    BackgroundGeolocation.onPowerSaveChange(this.onPowerSaveChange.bind(this));
    BackgroundGeolocation.onConnectivityChange(this.onConnectivityChange.bind(this));

    //STEP 2/3: Inizializzazione plugin
    BackgroundGeolocation.ready({
      reset: true, //impostato a true per applicare SEMPRE la configurazione fornita, non solo al primo lancio.
      debug: false, //Se impostato a true, il plugin emette suoni e mostra la notifica durante lo sviluppo. (se è impostato a true, bisogna pagare per caricarla sullo store)
      activityType: BackgroundGeolocation.ACTIVITY_TYPE_FITNESS,  //opzione per iOS
      activityRecognitionInterval: 1000, //Controlla la frequenza di campionamento del sistema di riconoscimento dell'attività di movimento.
      logLevel: BackgroundGeolocation.LOG_LEVEL_DEBUG,
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH, //GPS + Wifi + Rete cellulare
      distanceFilter: 7, //La distanza minima (in metri) che un device deve percorrere orizzontalmente prima che un evento update venga generato
      stopTimeout: 20,    //se non si muove entro 20 minuti viene disattivata la corsa in automatico
      //url: 'http://my.server.com/locations',
      //autoSync: true, //sincronizzazione automatica con il server per uppare le coordinate
      stopOnTerminate: false, //Controlla se continuare il tracciamento della posizione dopo che l'applicazione è terminata.
      startOnBoot: false, //Controlla se riprendere il tracking dopo l'avvio del telefono
      foregroundService: true //Configura il servizio del plugin come un "Foreground Service". True di default da Android 8.0+
    }, (state) => {
      console.log("[ready] BackgroundGeolocation pronto all'uso");
      if (!state.enabled) {
        //STEP 3/3: Inizio tracking
        this.isRunning = false;      
        BackgroundGeolocation.start();
      }
    });
  }

  /**
   * @event location
   */
  onLocation(location:Location){
    console.log('[event] location ', location);
    this.zone.run(()=>{
      this.odometer = (location.odometer/1000).toFixed(1)+'km';
    });

    this.updateCurrentLocationMarker(location);
  }

  /**
  * @event motionchange
  */
  onMotionChange(event:MotionChangeEvent) {
    console.log('[event] motionchange, isMoving: ', event.isMoving, event.location);

    this.zone.run(() => {
      this.isMoving = event.isMoving;
    });
  
    // Show / hide the big, red stationary radius circle
    /*
    if (!event.isMoving) {
      let coords = event.location.coords;
      let radius = 200;
      let center = new google.maps.LatLng(coords.latitude, coords.longitude);

      this.stationaryRadiusCircle.setRadius(radius);
      this.stationaryRadiusCircle.setCenter(center);
      this.stationaryRadiusCircle.setMap(this.map);
      this.map.setCenter(center);
    } else if (this.stationaryRadiusCircle) {
      this.stationaryRadiusCircle.setMap(null);
    }
    */
  }

  /**
  * @event activitychange
  */
  onActivityChange(event:MotionActivityEvent) {
    console.log('[event] activitychange: ', event);
    this.zone.run(() => {
      this.motionActivity = `${event.activity}:${event.confidence}%`;
    });
  }

 
   /**
  * @event heartbeat
  */
  onHeartbeat(event:HeartbeatEvent) {
    let location = event.location;
    // NOTE:  this is merely the last *known* location.  It is not the *current* location.  If you want the current location,
    // fetch it yourself with #getCurrentPosition here.
    console.log('- heartbeat: ', location);
  }

  /**
  * @event powersavechange
  */
  onPowerSaveChange(isPowerSaveEnabled) {
    //this.dialogs.alert('[event] powersavechnage, Power-save mode enabled? ' + isPowerSaveEnabled);
    console.log('[event] powersavechange, isPowerSaveEnabled: ', isPowerSaveEnabled);
  }

  onConnectivityChange(event:ConnectivityChangeEvent) {
    console.log('[event] connectivitychange, connected? ', event.connected);
    this.toast('[event] connectivitychange: Network connected? ', event.connected);
  }

  /**
  * @event providerchange
  */
  onProviderChange(provider:ProviderChangeEvent) {
    this.provider = provider;
    console.log('[event] providerchange: ', provider);
  }


  /**
  * #start / #stop tracking
  */
  onToggleEnabled() {
    console.log('- enabled: ', this.enabled);

    if (this.enabled) {
      BackgroundGeolocation.start((state) => {
        console.log('- Start success: ', state);
      });
    } else {
      this.isMoving = false;
      //this.stationaryRadiusCircle.setMap(null);
      BackgroundGeolocation.stop((state) => {
        console.log('- Stop success: ', state);
      });
    }
  }

  /**
  * Toggle moving / stationary state
  */
  onClickChangePace() {
    if (!this.enabled) {
      this.toast('You cannot changePace while plugin is stopped');
      return;
    }
    this.isMoving = !this.isMoving;
    BackgroundGeolocation.changePace(this.isMoving, () => {
      console.log('- changePace success');
    });
  }

  onClickRunning(){
    console.log('- enabled: ', this.isRunning);

    if (!this.isRunning) {
      this.isRunning = true;
      BackgroundGeolocation.start((state) => {
        console.log('- Start success: ', state);
        BackgroundGeolocation.changePace(true, () => {
          console.log('- changePace success');
        });
      });
    } else {
      this.isRunning = false;
      //this.stationaryRadiusCircle.setMap(null);
      BackgroundGeolocation.changePace(false, () => {
        BackgroundGeolocation.stop((state) => {
          console.log('- Stop success: ', state);
        });
      });
     
    }
  }

  /**
  * Get the current position
  */
  onClickGetCurrentPosition() {
    BackgroundGeolocation.getCurrentPosition({}, (location) => {
      console.log('- getCurrentPosition success: ', location);
    });
  }

  /**
  * Configure the google map
  */
  private configureMap() {
    /**
    * Configure Google Maps
    */
    this.locationMarkers = [];

    //di default punta davanti al comune di salerno
    let latLng = new google.maps.LatLng(40.678841, 14.756113);

    let mapOptions = {
      center: latLng,       
      zoom: 18, //Range zoom: 1-20, livelli: 1) mondo, 5) continente, 10) città, 15) strade, 20) edifici  
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      zoomControl: false,
      mapTypeControl: false,
      panControl: false,
      rotateControl: false,
      scaleControl: false,
      streetViewControl: false,
      disableDefaultUI: true
    };
    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

    // Blue current location marker
    this.currentLocationMarker = new google.maps.Marker({
      zIndex: 10,
      map: this.map,
      title: 'Current position',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: this.circlePosColor, //COLORS.blue
        fillOpacity: 1,
        strokeColor: this.circlePosStrokeColor, //COLORS.white
        strokeOpacity: 1,
        strokeWeight: 6
      }
    });

    /*
    // Red Stationary Geofence
    this.stationaryRadiusCircle = new google.maps.Circle({
      zIndex: 0,
      fillColor: this.stationaryColor, //COLORS.red,
      strokeColor: this.stationaryStrokeColor, //COLORS.red,
      strokeWeight: 1,
      fillOpacity: 0.3,
      strokeOpacity: 0.7,
      map: this.map
    });
    */

    // Route polyline
    this.polyline = new google.maps.Polyline({
      map: this.map,
      zIndex: 1,
      geodesic: true,
      strokeColor: '#00B3FD', //polyline_color: "#00B3FD"
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
  }

  /**
  * Update the lat/lng of blue current location marker
  */
  private updateCurrentLocationMarker(location) {
    var latlng = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);
    this.currentLocationMarker.setPosition(latlng);

    setTimeout(() => {
      this.map.setCenter(new google.maps.LatLng(location.coords.latitude, location.coords.longitude));
    });

    if (location.sample === true) {
      return;
    }
    if (this.lastLocation) {
      this.locationMarkers.push(this.buildLocationMarker(location));
    }
    // Add breadcrumb to current Polyline path.
    this.polyline.getPath().push(latlng);
    this.lastLocation = location;
  }

  /**
  * Build a new Google Map location marker with direction icon
  */
  private buildLocationMarker(location, options?) {
    options = options || {};

    return new google.maps.Marker({
      zIndex: 1,
      icon: {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        rotation: location.coords.heading,
        scale: 2,
        anchor: new google.maps.Point(0, 2.6),
        fillColor: '#00B3FD', //polyline_color: "#00B3FD",
        fillOpacity: 1,
        strokeColor: '#000', //COLORS.black,
        strokeWeight: 1,
        strokeOpacity: 1
      },
      map: this.map,
      position: new google.maps.LatLng(location.coords.latitude, location.coords.longitude)
    });
  }

  /**
  * Send a Toast message
  */
  private toast(message, duration?) {
    this.toastCtrl.create({
      message: message,
      cssClass: 'toast',
      duration: duration || 3000
    }).present();
  }



  /**
  * Play a UI sound via BackgroundGeolocation#playSound
  */
  private playSound(name) {
    /*
    let soundId = SOUND_MAP[this.device.platform.toUpperCase()][name.toUpperCase()];
    if (!soundId) {
      console.warn('playSound: Unknown sound: ', name);
    }
    BackgroundGeolocation.playSound(soundId);
    */
  }

  /**
    * @event http
  */
  /*
    onHttpSuccess(response:HttpEvent) {
      console.log('[event] http: ', response);
    }
    onHttpFailure(response:HttpEvent) {
      console.warn('[event] http failure: ', response);
    }
  */


  //----------- REGIONE FAB
  /**
  * Confirm stuff
  */
 /*
  private confirm(message) {
    return new Promise((resolve, reject) => {
      let alert = this.alertCtrl.create({
        title: 'Confirm',
        message: message,
        buttons: [{
          text: 'Cancel',
          role: 'cancel'
        }, {
          text: 'Confirm',
          handler: resolve
        }]
      });
      alert.present();
    });
  }
  */
  /*
  //metodo presente nel fab
  onClickMainMenu(item) {
    this.menuActive = !this.menuActive;
    this.playSound((this.menuActive) ? 'OPEN' : 'CLOSE');
  }
  */

 
  /**
  * Fetch email address from localStorage.  We use this for #emailLog method
  * @return Promise
  */
 /*
  private getEmail() {
    let localStorage = (<any>window).localStorage;
    let email = localStorage.getItem('email');

    return new Promise((resolve, reject) => {
      if (email) { return resolve(email); }
      this.dialogs.prompt('Email address', 'Email Logs').then((response) => {
        if (response.buttonIndex === 1 && response.input1.length > 0) {
          let email = response.input1;
          localStorage.setItem('email', email);
          resolve(email);
        }
      });
    });
  }
  */

  /*
  //metodo presente nel fab
  onClickSync() {
    this.hasRecords().then((count) => {
      this.confirm(`Sync ${count} records to server?`).then(this.doSync.bind(this));
    });
  }*/

  /*
  //metodo presente nel fab
  private doSync() {
    BackgroundGeolocation.sync((records) => {
      this.toast(`Synced ${records.length} records to server.`);
      console.log('- #sync success: ', records.length);
    }, (error) => {
      console.warn('- #sync failure: ', error);
    });
  }*/

  /*
  onClickDestroy() {
    this.hasRecords().then((count) => {
      this.confirm(`Destroy ${count} records?`).then(this.doDestroyLocations.bind(this));
    }).catch(() => {
      this.toast('Database is empty');
    });
  }
  */

 /*
  private doDestroyLocations() {
    BackgroundGeolocation.destroyLocations(() => {
      this.toast('Destroyed all records');
      console.log('- #destroyLocations success');
    }, (error) => {
      console.warn('- #destroyLocations error: ', error);
    });
  }*/

  /*
  private hasRecords() {
    return new Promise((resolve, reject) => {
      BackgroundGeolocation.getCount((count) => {
        if (count > 0) {
          resolve(count);
        } else {
          this.toast('Database is empty');
        }
      });
    });
  }
  */

  /*
  //metodo presente nel fab
  onClickEmailLog() {
    this.getEmail().then((email) => {
      this.confirm(`Email logs to ${email}?`).then(() => {
        this.doEmailLog(email);
      }).catch(() => {
        // Clear email from localStorage and redo this action.
        let localStorage = (<any>window).localStorage;
        localStorage.removeItem('email');
        this.onClickEmailLog();
      });
    });
  }
  */

  /*
  //metodo presente nel fab
  private doEmailLog(email) {
    // Show spinner
    let loader = this.loadingCtrl.create({content: "Creating log file..."});
    loader.present();

    BackgroundGeolocation.emailLog(email, () => {
      loader.dismiss();
    }, (error) => {
      loader.dismiss();
      console.warn('#emailLog error: ', error);
    });
  }
  */

  /*
  //Metodo presente nel fab
  onClickDestroyLog() {
    this.confirm("Destroy logs?").then(this.doDestroyLog.bind(this));
  }

  //Metodo presente nel fab
  private doDestroyLog() {
    let loader = this.loadingCtrl.create({content: "Destroying logs..."});
    loader.present();

    BackgroundGeolocation.destroyLog(() => {
      loader.dismiss();
      this.toast('Destroyed logs');
    }, (error) => {
      loader.dismiss();
      this.toast('Destroy logs failed: ' + error);
    });
  }
  */

  /*
  //Metodo presente nel fab
  onSetConfig(name) {
    if (this.state[name] === this[name]) {
      // No change.  do nothing.
      return;
    }
    // Careful to convert string -> number from <ion-input> fields.
    switch(name) {
      case 'distanceFilter':
      case 'stopTimeout':
        this[name] = parseInt(this[name], 10);
        break;
    }
    // Update state
    this.state[name] = this[name];
    let config = {};
    config[name] = this[name];

    // #setConfig

    BackgroundGeolocation.setConfig(config, (state) => {
      this.toast(`#setConfig ${name}: ${this[name]}`);
    });
  }
  */

  /**
  * [Home] button clicked.  Goo back to home page
  */
 /*
  onClickHome() {
    this.navCtrl.setRoot('HomePage');
  }*/
}