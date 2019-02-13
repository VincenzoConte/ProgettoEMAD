import {ViewController} from 'ionic-angular';
import { SocialSharing } from '@ionic-native/social-sharing/';
import { AngularFireAuth } from '@angular/fire/auth';
import { Storage } from '@ionic/storage';
import {
  Component,
  ViewChild,
  ElementRef,
  NgZone
} from '@angular/core';

import {
  NavController,
  NavParams,
  ToastController,
  AlertController,
  ActionSheetController,
  ModalController,
  Platform,
  App
} from 'ionic-angular';

import BackgroundGeolocation, {
  State,
  Location,
  MotionActivityEvent,
  ProviderChangeEvent,
  MotionChangeEvent,
  HeartbeatEvent,
  ConnectivityChangeEvent
} from 'cordova-background-geolocation-lt';
import firebase from 'firebase';
import { AngularFireDatabase } from '@angular/fire/database';
import { User } from '../../models/user';
import { TrainingListPage } from '../training-list/training-list';
import { Observable } from 'rxjs';

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
  hasStopped: boolean;
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
  isGPSenabled:boolean;
 
  //Elementi dell'UI
  menuActive: boolean;
  isTimeTicking:boolean;
  motionActivity: string;
  odometer: string;
  odometerNumber: number;  
  circlePosColor = '#4285F4';
  circlePosStrokeColor = '#D1DFF5';
  stationaryColor = '#FF0000';
  stationaryStrokeColor = '#FF0000';
  polylineColor = '#00B3FD';
  timer: number;
  timerTime:string;
  intervalRun;
  calories:string;
  caloriesNumber:number;
  weight:number;
  previousTracks = [];

  //Riferimenti a Google Maps
  map: any;
  locationMarkers: any;
  currentLocationMarker: any;
  lastLocation: any;
  polyline: any;

  //vari
  userID:string;
  user = {} as User;
  activityList:Observable<any>;
  localStorage: any;

  constructor(
    private viewCtrl: ViewController,
    public navCtrl: NavController,
    public navParams: NavParams,
    private toastCtrl: ToastController,
    private zone:NgZone,
    private platform:Platform,
    private alertCtrl: AlertController,
    private storage: Storage,
    private aSheetCtrl: ActionSheetController,
    private socialSharing: SocialSharing,
    private modal: ModalController,
    private app: App,
    private afAuth: AngularFireAuth,
    public afDatabase: AngularFireDatabase, 
    ){
      //Inizializzazione delle variabili      
      this.timer = 0;
      this.odometerNumber = 0;    
      this.caloriesNumber = 0;
      this.odometer = "0m";
      this.timerTime = "00:00:00";
      this.calories = "0cal";
      this.isTimeTicking = false;
      this.isRunning = false;  
            
      //Stato iniziale del plugin
      this.state = {
        enabled: false,
        isMoving: false,
        geofenceProximityRadius: 500,
        trackingMode: 1, //1: Monitoring location + geofences, 0: Monitoring geofences only
        isChangingPace: false,
        odometer: 0,
        provider: {
          gps: true,
          network: true,
          enabled: true,
          status: -1  //stato delle autorizzazioni
        }
      }  
  }

   ionViewDidLoad(){
    this.platform.ready().then(() => {
      this.localStorage = (<any>window).localStorage; 
      //this.localStorage.clear(); 
      this.checkWeight();      
      this.configureMap();
      this.configureBackgroundGeolocation().then(() =>{
        this.resetOdometer();
        this.onClickGetCurrentPosition();
      });      
    });

  }

  async checkWeight(){ 
    //recupera il peso dell'utente per calcolare le calorie
    this.storage.get("userLoggedID").then(result=>{
      if(result !== undefined && result !="" && result != null){
        this.userID = result;
        let self = this;

        firebase.database().ref(`/profile/user/${result}/weight`)
          .once('value', function(snapshot){
            if(snapshot.exists()){
              //console.log("peso presente");
              self.weight = snapshot.val();
            } else {
              //console.log("peso assente");
              self.weightAlert();
              }  
          }).then(()=>{            
            console.log("check training for ID: "+this.userID);  
            firebase.database().ref(`/profile/user/${this.userID}`)
              .child(`/training`).once('value', function(snapshot){
                if(!snapshot.exists()){
                self.trainingAlert(); 
              }        
            });
          });
        
      }
    });   
  }
  /**
   * Configura il plugin
   */
  async configureBackgroundGeolocation(){
    //STEP 1/3: Creazione listener degli eventi
    BackgroundGeolocation.onLocation(this.onLocation.bind(this));
    BackgroundGeolocation.onMotionChange(this.onMotionChange.bind(this));
    BackgroundGeolocation.onActivityChange(this.onActivityChange.bind(this));
    BackgroundGeolocation.onProviderChange(this.onProviderChange.bind(this));
    BackgroundGeolocation.onPowerSaveChange(this.onPowerSaveChange.bind(this));
    BackgroundGeolocation.onConnectivityChange(this.onConnectivityChange.bind(this));
    BackgroundGeolocation.onSchedule(this.onSchedule.bind(this));

    //STEP 2/3: Inizializzazione plugin
    BackgroundGeolocation.ready({
      reset: true,                                                  //impostato a true per applicare SEMPRE la configurazione fornita, non solo al primo lancio.
      debug: false,                                                 //Se impostato a true, il plugin emette suoni e mostra la notifica durante lo sviluppo. (se è impostato a true, bisogna pagare per caricarla sullo store)
      activityType: BackgroundGeolocation.ACTIVITY_TYPE_FITNESS,    //opzione per iOS
      activityRecognitionInterval: 1000,                            //Controlla la frequenza di campionamento del sistema di riconoscimento dell'attività di movimento.
      logLevel: BackgroundGeolocation.LOG_LEVEL_DEBUG,
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH, //GPS + Wifi + Rete cellulare
      distanceFilter: 7,                                            //La distanza minima (in metri) che un device deve percorrere orizzontalmente prima che un evento update venga generato
      stopTimeout: 20,                                              //se non si muove entro 20 minuti viene disattivata la corsa in automatico
      //url: 'http://my.server.com/locations',
      //autoSync: true,                                             //sincronizzazione automatica con il server per uppare le coordinate
      stopOnTerminate: true,                                       //Controlla se continuare il tracciamento della posizione dopo che l'applicazione è terminata.
      startOnBoot: false,                                           //Controlla se riprendere il tracking dopo l'avvio del telefono
      foregroundService: true,                                      //Configura il servizio del plugin come un "Foreground Service". True di default da Android 8.0+
      enableHeadless: false,                                         //richiede stopOnTerminate=false. In questa modalità, puoi rispondere a tutti gli eventi del plugin nell'ambiente Android nativo. (https://github.com/transistorsoft/cordova-background-geolocation-lt/wiki/Android-Headless-Mode)
      //params: BackgroundGeolocation.transistorTrackerParams(this.device)
    }, (state) => {
      console.log("[ready] BackgroundGeolocation pronto all'uso"); 
      console.log("stato di state.isMoving: "+state.isMoving);     
      this.zone.run(()=>{
        this.state.enabled = state.enabled;
        this.state.isMoving = state.isMoving;
        this.state.geofenceProximityRadius = state.geofenceProximityRadius;
        this.state.trackingMode = state.trackingMode;
      });
      
      if(!state.schedulerEnabled && (state.schedule.length > 0)){
        BackgroundGeolocation.startSchedule();
      }
     
    });
  }
  
  /**
   * @event location
   */
  onLocation(location:Location){    
    console.log('[event] location ', location);
    this.zone.run(()=>{
      this.odometer = location.odometer > 1000 ? ((location.odometer/1000).toFixed(1)+'km') : location.odometer+'m';
      this.odometerNumber = location.odometer;    
      this.caloriesNumber = 0.7 * location.odometer * this.weight;    //0.5 camminando, 0.9 in corsa = 0.7 di media
      if(this.caloriesNumber == 0 || isNaN(this.caloriesNumber)) this.calories = '0cal';
      else if(this.caloriesNumber < 1000) this.calories = this.caloriesNumber.toFixed(2)+'cal';
      else {
        this.caloriesNumber = this.caloriesNumber / 1000;
        this.calories = this.caloriesNumber.toFixed(2)+'kcal';
      }
    });

    this.updateCurrentLocationMarker(location);
  }


//=====REGIONE LISTENER PER IL TRACKING
  /**
  * @event motionchange
  */
  onMotionChange(event:MotionChangeEvent) {
    this.zone.run(() => {
      this.isMoving = event.isMoving;
    });  
  }

  /**
  * @event activitychange
  */
  onActivityChange(event:MotionActivityEvent) {
    this.zone.run(() => {
      this.motionActivity = `${event.activity}:${event.confidence}%`;
    });
  }

  /**
  * @event heartbeat
  */
  onHeartbeat(event:HeartbeatEvent) {
    let location = event.location;
    // NOTE:  this is merely the last *known* location.  It is not the *current* location.  
    //If you want the current location, fetch it yourself with #getCurrentPosition here.
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
    //this.toast('[event] connectivitychange: Network connected? ', event.connected);
  }

  /**
  * @event providerchange
  */
  onProviderChange(provider:ProviderChangeEvent) {
    this.provider = provider;
    this.isGPSenabled = provider.gps;
    console.log("provider enabled: "+provider.enabled);
    console.log("provider gps: "+provider.gps);
    console.log('[event] providerchange: ', provider);
  }

  onSchedule(state:State){
    this.zone.run(() => {
      this.state.enabled = state.enabled;
    });
    console.log("[schedule] state - ", state);
  }
//==== FINE REGIONE LISTENER  

  /**
   * Inizia la corsa
   */
  onClickRunning(){
    //console.log('onClickRunning isMoving: '+this.isMoving+", is enabled: "+this.state.enabled);
    this.isTimeTicking = true;
    this.zone.run(() => {         
        this.startTimer();
    });

    let zone = this.zone;
    let onComplete = () => {
      zone.run(() => {                 
        this.state.isChangingPace = false; 
        });
    }

    //l'utente sta cliccando per una nuova corsa => resetta
    if(this.hasStopped){
      this.resetWorkout();
    }

    if(!this.isRunning){ //l'utente sta iniziando la corsa        
        BackgroundGeolocation.start(state =>{
          console.log("start success!: ", state);
          this.isRunning = !this.isRunning;
          this.state.isChangingPace = true;
          this.state.isMoving = !this.state.isMoving;        
          BackgroundGeolocation.changePace(this.state.isMoving)
                    .then(onComplete)
                    .catch(onComplete);                
        }, error =>{
          console.log("start error: ", error);
        });
    } else { //l'utente stava correndo e ha messo pausa
      this.isRunning = !this.isRunning;
      this.state.isMoving = false;
      BackgroundGeolocation.stop().then(()=>{
        this.stopTimer();        
      });      
    }   
  }

  /**
   * Resetta i valori per un nuovo allenamento
   */
  resetWorkout(){
    this.resetOdometer();
    this.timer = 0;
    this.timerTime = "00:00:00";
    this.hasStopped = !this.hasStopped;
    this.calories = '0cal';
    this.caloriesNumber = 0;
  }

  /*
  * Mostra un alert per confermare la fine dell'allenamento
  */
  stopTrainingAlert() {    
    let alert = this.alertCtrl.create({
      title: 'Fine allenamento',    
      subTitle: 'Sei sicuro di voler terminare la sessione?',
      buttons: [
        {
          text: 'Si',
          handler: () =>{
            this.onClickStop();
          }
        },
        {
          text: 'No',
          role:'cancel',
          handler: () =>{
            console.log('Cancel clicked');
          }
        }        
      ],
      enableBackdropDismiss: true //se è false, impedisce di chiudere l'alert toccando al di fuori di esso    
    });
    alert.present();     
  }


  /**
   * L'utente ha cliccato per visualizzare la scheda
   */
  onClickCard(){      
    let cardAlert = this.alertCtrl.create({cssClass: 'custom-alert'});
    cardAlert.setCssClass('custom-alert');
    cardAlert.setTitle("Scheda di allenamento");    
    this.loadCardList(cardAlert).then(() => cardAlert.present());        
  }

  /**
   * Carica le informazioni della scheda in un alert
   * @param cardAlert 
   */
  loadCardList(cardAlert){  
    console.log("cardlist caricata");    
    return new Promise(resolve =>{
      this.activityList = this.afDatabase.list(`/profile/user/${this.userID}/card`)
          .snapshotChanges();
      
      var cardListSize;
      var completedActivitiesList = [];
      this.localStorage = (<any>window).localStorage; 

      this.activityList.subscribe(res =>{
          cardListSize = res.length;
          if(cardListSize > 0){
            res.map(action =>{
              cardAlert.addInput({
                type: 'checkbox',
                label: ''+action.payload.val(),
                value: action.key,
                checked: this.localStorage.getItem(action.key),
                handler: data => {
                  /**
                   * Per qualche motivo, una volta impostato a true non può
                   * diventare false, quindi si è risolto cancellando
                   * direttamente il valore dallo storage
                   */
                  if(this.localStorage.getItem(action.key) == null){
                    console.log(action.key+" ha valore nullo");
                    this.localStorage.setItem(action.key, data.checked);
                  } else {
                    console.log('rimosso valore per '+action.key);
                    this.localStorage.removeItem(action.key);
                  } 
                }                       
              });            
              resolve(alert);
            });
            

            cardAlert.addButton({
              text: 'Condividi',
              cssClass: 'custom-alert-btn',
              handler: data =>{
                console.log("hai cliccato braaaav");
              }
            });

            cardAlert.addButton({
              text: 'Chiudi',
              cssClass: 'custom-alert-btn',
              handler: data =>{
                console.log("hai cliccato braaaav");
              }
            });

            cardAlert.addButton({
              text: 'Finito!',
              cssClass: 'custom-alert-btn',
              handler: data =>{
                data.forEach(element => {               
                  completedActivitiesList.push(element);
                });
                //ha selezionato tutti gli elementi della lista
                if(completedActivitiesList.length === cardListSize){
                  var userData;
                  firebase.database().ref(`/profile/user/${this.userID}/`)
                    .once('value', function(snapshot){                    
                      userData = snapshot.val();
                      console.log("valore userData: "+JSON.stringify(userData));
                    }).then(()=>{
                      var day = new Date().toISOString().split('T')[0];
                      //la aggiunge nella cronologia delle attività
                      this.afDatabase.object(`/profile/user/${this.userID}/oldActivity/${day}`).update(userData.card);                    
                      //rimuove la card
                      this.afDatabase.object(`/profile/user/${this.userID}/card`).remove();
                    }).then(()=>{
                      var trainerID = userData.trainer.substr(0, userData.trainer.indexOf('@'));
                      this.afDatabase.object(`/profile/user/${this.userID}/`).update({hasExercise: false});
                      this.afDatabase.object(`/profile/trainer/${trainerID}/users/${this.userID}`).update({hasExercise: false});
                    }).then(() =>{
                      this.localStorage.clear();
                      this.storage.get("showSharingAgain").then(result=>{
                        if(result || result == null){
                          this.showSharingAlert(); 
                        } else {
                          this.toastCtrl.create({
                            message: "Complimenti, hai finito la scheda di allenamento!",
                            duration: 2500
                          }).present();
                        }
                      }).catch(error =>{
                        console.log("errore: ", error);
                        this.showSharingAlert();
                      });                       
                    });                                  
                } else {         
                  this.toastCtrl.create({
                      message: "Completa la scheda per finire l'allenamento",
                      duration: 2500,
                  }).present();
                }                
              }
            });        
          } else {
            cardAlert.setSubTitle("Non hai una scheda di allenamento, per ora.");
            resolve(alert);
          }   
      });         
    });
  }

  /**
   * Mostra l'alert per la condivisione
   */
  showSharingAlert(){
    let alert = this.alertCtrl.create({
            title: "Complimenti!",    
            subTitle: "Hai finito il tuo allenamento! Vuoi condividere il tuo risultato?",
            buttons: [{
                text: 'Si',
                handler: () =>{
                    this.shareResults();                       
                }
              },
              {
                text: 'No',
                role: 'destructive'
              }]
          });
        alert.addInput({
              type: 'checkbox',
              label: 'Non chiederlo più',
              value: 'dontaskagain',
              checked: false,
                  handler: data => {
                  console.log("Risultato check", data.checked);
                    if(data.checked){
                      this.storage.set("showSharingAgain", false);
                    }
                  }
        });
        alert.present(); 
  }

  /**
   * Alert per condividere i propri risultati
   */
  shareResults(){    
    let sharingText = 'Ho appena finito il mio allenamento di oggi con Capperfit!';
    let shareResults = this.aSheetCtrl.create({
      title:"Condividi il tuo risultato",
      buttons: [
        {
          text: "Facebook",
          icon: "logo-facebook",
          handler: () =>{
            let URL = 'https://www.capgemini.com/it-it/';
            this.socialSharing
              .shareViaFacebook(sharingText, null, URL).then(()=>{
                this.showToast("Condivisione completata!");
                console.log("fatto!");
              }).catch(e=>{ //non trova l'app di Facebook
                  this.showToast("Non è stata trovata l'app di Facebook sul tuo telefono");
                  console.log("errore nella condivisione via Facebook: "+e);
                });
          }
        },
        {
          text: "Twitter",
          icon: "logo-twitter",
          handler: () =>{
            
            let URL = 'https://www.capgemini.com/it-it/';
            this.socialSharing
              .shareViaTwitter(sharingText, null, URL).then(()=>{
                this.showToast("Condivisione completata!");
                console.log("fatto!");
              }).catch((e)=>{
                  this.showToast("Non è stata trovata l'app di Twitter sul tuo telefono");
                  console.log("errore nella condivisione via twitter", e);
                });
          }
        },
        {
          text: "Whatsapp",
          icon: "logo-whatsapp",
          handler: () =>{
            let URL = 'https://www.capgemini.com/it-it/';            
            this.socialSharing
                .shareViaWhatsApp(sharingText, null, URL).then(()=>{
                  this.showToast("Condivisione completata!");
                  console.log("fatto!");
              }).catch(e=>{
                  this.showToast("Non è stata trovata l'app di Whatsapp sul tuo telefono");
                  console.log("errore nella condivisione via whatsapp",e);
                });
          }
        },
        {
          text: "e-mail",
          handler: () =>{
            this.socialSharing.canShareViaEmail().then(()=>{
              this.socialSharing.shareViaEmail(sharingText, "CAPPERFIT", ['sabdegregorio@gmail.com'])
              .then(()=>{
                  this.showToast("Condivisione completata!");
              }).catch((e)=>{
                  this.showToast("Errore nella condivisione via mail: nessun'app trovata");
                  console.log("errore nella condivisione via mail",e);
                });
            }).catch((error2) =>{
              this.showToast("Errore nella condivisione via mail: non è possibile condividere");
              console.log("errore nel canShareViaEmail", error2);
            })
          }
        }
      ]
    });
    shareResults.present();
  }

  /**
   * L'utente ha terminato la corsa
   */
  onClickStop(){
    this.hasStopped = true;
    this.isRunning = false;  
    this.state.isMoving = false;   

    //prima salva il tracking nello storage, poi pulisce la mappa 
    var cal = this.caloriesNumber/1000;
    var km = this.odometerNumber/1000;
    var userID = this.afAuth.auth.currentUser.uid.toString(); //ID Utente corrente
    var rootRef = firebase.database().refFromURL("https://capgemini-personal-fitness.firebaseio.com/");
    var date = new Date().toISOString().split('T')[0];
    var urlRefcal =  rootRef.child("/Stats/"+userID+"/cal/"+date+"/Value");
    var urlRefkm =  rootRef.child("/Stats/"+userID+"/KM/"+date+"/Value");
    var check1 = 0;
    var check2 = 0;
    this.afDatabase.list(`/Stats/${this.userID}/KM/${date}/`).valueChanges().subscribe(snapshots =>{
        if(snapshots.length==0){
          check1 = 1;
          urlRefkm.set(km);
        }else{
        snapshots.forEach(snapshot => {
          if(check1==0){
            urlRefkm.set(km+parseFloat(snapshot.toString()));
            check1 = 1;
          }
        });
      }
    });
    this.afDatabase.list(`/Stats/${this.userID}/cal/${date}/`).valueChanges().subscribe(snapshots =>{
        if(snapshots.length==0){
          check2 = 1;
          urlRefcal.set(cal);
        }else{
        snapshots.forEach(snapshot => {
          if(check2==0){
            urlRefcal.set((cal+parseFloat(snapshot.toString())));
            check2 = 1;
          }
        });
      }
    });


    BackgroundGeolocation.stop().then(()=>{
      //let newRoute =  { finished: new Date().getTime(), path: this.locationMarkers };
      var day = new Date().getDay();
      var month = new Date().toLocaleString('it-it', {month:'long'});
      var dateTxt = day+' '+month;
      //this.previousTracks.push(newRoute);
      //this.storage.set('routes', this.previousTracks);
      //aggiorna il nodo della corsa
        this.afDatabase.object(`/oldActivities/${this.userID}/${dateTxt}`).update({
          card: this.activityList,
          date: dateTxt,
          maps: this.locationMarkers
        });
    }).then(()=>{
      this.stopTimer();
      this.clearMarkers();
    });       
  }

  /** 
   * Fa partire il cronometro
   */
  startTimer() {  
    if(!this.isRunning){
        this.intervalRun = setInterval(()=>{ 
          if(!this.isTimeTicking) return;
          else{            
            this.timer++;
            this.timerTime = this.getSecondsAsDigitalClock(this.timer);
            
          }
          },1000);        
    } else {
      clearInterval(this.intervalRun);
      this.intervalRun = null;
      this.isTimeTicking = false;       
    }    
  }

  /**
   * Ferma il cronometro
   */
  stopTimer(){
    clearInterval(this.intervalRun);
    this.intervalRun = null;
    this.isTimeTicking = false;
  }

  /**
   * Converte i secondi per mostrarli a schermo nel cronometro
   * @param inputSeconds 
   */
  getSecondsAsDigitalClock(inputSeconds: number) {
    const secNum = parseInt(inputSeconds.toString(), 10); // don't forget the second param
    const hours = Math.floor(secNum / 3600);
    const minutes = Math.floor((secNum - (hours * 3600)) / 60);
    const seconds = secNum - (hours * 3600) - (minutes * 60);
    let hoursString = '';
    let minutesString = '';
    let secondsString = '';
    hoursString = (hours < 10) ? '0' + hours : hours.toString();
    minutesString = (minutes < 10) ? '0' + minutes : minutes.toString();
    secondsString = (seconds < 10) ? '0' + seconds : seconds.toString();
    return hoursString + ':' + minutesString + ':' + secondsString;
  }

  /**
   * Resetta l'odometro (Il plugin tiene conto di tutti i metri dal primo utilizzo dell'app)
   */
  resetOdometer(){
    let zone = this.zone;
    function onComplete() {
      zone.run(() => { this.isResettingOdometer = false;});
    }
    BackgroundGeolocation.resetOdometer(() => {
      onComplete.call(this);
    }, (error) => {      
      onComplete.call(this);
      console.log('Reset odometer error', error);
    });
  }

  /**
    * Configura Google Maps
    */
  private configureMap() {
    //Setta i marcatori
    this.locationMarkers = [];

    //Punta davanti al comune di Salerno, senza le coordinate di default mostra tutto il mondo
    let latLng = new google.maps.LatLng(40.678841, 14.756113);

    //Per maggiori informazioni: https://developers.google.com/maps/documentation/javascript/reference/map
    let mapOptions = {
      center: latLng,  
      minZoom: 13, //Range dello zoom (1-20): 1) mondo 5) continente 10) città 15) strade 20) edifici
      maxZoom: 20,     
      zoom: 18,   
      zoomControl: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP,      
      mapTypeControl: false,
      panControl: false,
      rotateControl: false,
      scaleControl: false,
      streetViewControl: false,
      disableDefaultUI: true,
      clickableIcons: false, //disabilita tutti i label di Maps eccetto quello dell'utente      
    };
    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

    //Marcatore della posizione dell'utente
    this.currentLocationMarker = new google.maps.Marker({
      zIndex: 10,
      map: this.map,
      title: 'You are here',
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
  
    this.configurePolyline();
  }

  /**
   * Configura la linea del percorso
   */
  configurePolyline(){
    this.polyline = new google.maps.Polyline({
      map: this.map,
      zIndex: 1,
      geodesic: true,
      strokeColor: this.polylineColor, //polyline_color: "#00B3FD"
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
  * Aggiorna le coordinate del marcatore dell'utente
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
      //console.log("location: "+location.coords.latitude+", "+location.coords.longitude);
    }
    
    //Aggiunge un segnale per la posizione della polyline 
    this.polyline.getPath().push(latlng);
    this.lastLocation = location;
    this.map.animateCamera({
      target: latlng
      });
  }

  /**
  * Genera un marcatore di direzione con la freccia direzionale
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
   * Rimuove tutti i marcatori della mappa
   */
  clearMarkers(){
    this.locationMarkers.forEach((marker) => {
      marker.setMap(null);
    });
    this.locationMarkers = [];
    //pulisce la mappa dal tracciamento precedente
    this.polyline.setMap(null);
    this.polyline.setPath([]);
    //riconfigura la linea per renderla nuovamente disponibile
    this.configurePolyline();
  }

  /**
   * Restituisce le coordinate nel momento del click
   */
  onClickGetCurrentPosition() {
    if(this.isGPSenabled){
      BackgroundGeolocation.getCurrentPosition({}, (location) => {
        //console.log('- getCurrentPosition success: ', location);
        var latlng = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);
        this.map.animateCamera({
        target: latlng
        });
      });
    } else {
      this.toastCtrl.create({
            message: "Abilita il GPS!",
            duration: 3500
        }).present();
    }
  }

  /**
   * Mostra un toast del messaggio passato
   * @param message
   * @param time
   */
  showToast(message, time?){
    this.toastCtrl.create({
            message: message,
            duration: time || 3500
        }).present();
  }

  //NB: questi metodi venivano invocati solo in caso di problemi
  //in seguito alla registrazione tramite facebook
  
  /**
   * Manca l'allenamento: mostra un alert e porta ad inserirne uno
   */
  trainingAlert(){
    let alert = this.alertCtrl.create({
      title: "E l'allenamento?",    
      subTitle: 'Seleziona un allenamento per poter proseguire.',
      buttons: [{
        text: 'OK',
        handler: () =>{
          this.navCtrl.push(TrainingListPage);
        }
      }],
      enableBackdropDismiss: false //se si clicca fuori dall'alert non viene chiuso    
    });
    alert.present();  
  }

  /**
   * Manca il peso: mostra un alert per inserirne uno
   */
  weightAlert(){
    this.alertCtrl.create({
      title: "Un'ultima cosa",
      subTitle: 'Non sono state trovate queste informazioni, cortesemente aggiungile',
      inputs: [
        {
          name: 'age',
          placeholder: 'Età',
          type: 'tableNumber'
        },
        {
          name: 'height',
          placeholder: 'Altezza (in centimetri)',
          type: 'tableNumber'
        },
        {
          name: 'weight',
          placeholder: 'Peso',
          type: 'tableNumber'
        },
        {
          name: 'genderM',
          type: 'radio',
          label: 'Maschio',
          value: '1',
          checked: true
        },
        {
          name: 'genderF',
          type: 'radio',
          label: 'Femmina',
          value: '0',
          checked: false
        }
      ],
      buttons: [
        {
          text: 'Conferma',
          handler: data =>{
            this.user.weight = data.weight;
            this.user.age = data.age;
            this.user.height = data.height;
            this.user.BMI = this.user.weight/((this.user.height/100)*(this.user.height/100));
            this.afDatabase.object(`/profile/user/${this.userID}/`).update(this.user);
          }
        }
      ],
      enableBackdropDismiss: false
    }).present().then(()=>{
      this.genderAlert();
    });
  }

   /**
   * Alert per impostare il genere della persona
   * NB: è stato necessario un secondo alert in quanto gli alert di Ionic
   * NON permettono di usare input e radio buttons insieme
   */
  genderAlert(){
    this.alertCtrl.create({
      title: 'Specifica il tuo genere',
      subTitle: 'Necessitiamo sapere del tuo genere per poter calcolare correttamente i tuoi parametri fisici',
      inputs: [    
        {
          name: 'genderM',
          type: 'radio',
          label: 'Maschile',
          value: '1',
          checked: true
        },
        {
          name: 'genderF',
          type: 'radio',
          label: 'Femminile',
          value: '0',
          checked: false
        }
      ],
      buttons: [
         {
          text: 'Conferma',
          handler: data =>{
            this.user.gender = data;
            this.afDatabase.object(`/profile/user/${this.userID}/`).update(this.user);  
          }
        }
      ],
      enableBackdropDismiss: false      
      }).present();
  }
  
}