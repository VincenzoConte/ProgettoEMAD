import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Chart } from 'chart.js';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';
import firebase from 'firebase';

/**
 * Generated class for the StatsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-stats',
  templateUrl: 'stats.html',
})
export class StatsPage {

  @ViewChild('peso') peso;
  @ViewChild('bmi') bmi;
  @ViewChild('km') km;
  @ViewChild('cal') cal;
  datakm: any;
  datacal: any;
  databmi: any;
  datakg: any;
  userID: any;

  constructor(
      public afdatabase: AngularFireDatabase, 
      private angAuth: AngularFireAuth, 
      public navCtrl: NavController, 
      public navParams: NavParams
    ){
  }

  ionViewDidLoad() {
    this.userID = this.angAuth.auth.currentUser.uid.toString(); //ID Utente corrente

    var listkm = new Array;
    var listkm2 = new Array;
    this.datakm = [];
    var j = 0;
    var rootRefkm = firebase.database().refFromURL("https://capgemini-personal-fitness.firebaseio.com/");
    var urlRefkm =  rootRefkm.child("/Stats/"+this.userID+"/KM");
    urlRefkm.once("value", function(snapshot) {
        snapshot.forEach(function(child) {
            listkm2.push(child.key.toString());
  });
});
this.afdatabase.list(`/Stats/${this.userID}/KM`).valueChanges().subscribe(snapshots =>{
    snapshots.forEach(snapshot => {
        listkm.push(snapshot);
    });
    while(j<listkm.length){
        this.datakm[j] = listkm[j].Value;
        j=j+1;
  }

  this.km = new Chart(this.km.nativeElement, {

    type: 'bar',
    data: {
        labels: listkm2,
        datasets: [{
            label: 'Km', 
            data: this.datakm,
            backgroundColor: this.getColour(this.datakm.length, 'rgba(54, 162, 235, 0.2)'),
            borderColor: this.getColour(this.datakm.length, 'rgba(54, 162, 235, 1)'),
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true
                }
            }]
        }
    }

});
  });
  
  var listcal = new Array;
  var listcal2 = new Array;
  this.datacal = [];
  var rootRefcal = firebase.database().refFromURL("https://capgemini-personal-fitness.firebaseio.com/");
  var urlRefcal =  rootRefcal.child("/Stats/"+this.userID+"/cal");
  urlRefcal.once("value", function(snapshot) {
      snapshot.forEach(function(child) {
          listcal2.push(child.key.toString());
  });
});
this.afdatabase.list(`/Stats/${this.userID}/cal`).valueChanges().subscribe(snapshots =>{
    snapshots.forEach(snapshot => {
        listcal.push(snapshot);
    });
    j = 0;
    while(j<listcal.length){
        this.datacal[j] = listcal[j].Value;
        j=j+1;
  }

  this.cal = new Chart(this.cal.nativeElement, {

    type: 'bar',
    data: {
        labels: listcal2,
        datasets: [{
            label: 'KCal',
            data: this.datacal,
            backgroundColor: this.getColour( listcal2.length, 'rgba(255, 99, 132, 0.2)'),
            borderColor: this.getColour(listcal2.length, 'rgba(255,99,132,1)'),
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true
                }
            }]
        }
    }

});
  });

var listkg = new Array;
var listkg2 = new Array;
this.datakg = [];
var i = 0;
var rootRefkg = firebase.database().refFromURL("https://capgemini-personal-fitness.firebaseio.com/");
var urlRefkg =  rootRefkg.child("/Stats/"+this.userID+"/Peso");
urlRefkg.once("value", function(snapshot) {
  snapshot.forEach(function(child) {
    listkg2.push(child.key.toString());
  });
});
this.afdatabase.list(`/Stats/${this.userID}/Peso`).valueChanges().subscribe(snapshots =>{
    snapshots.forEach(snapshot => {
      listkg.push(snapshot);
    });
    while(i<listkg.length){
        this.datakg[i] = listkg[i].Value;
        i=i+1;
  }

  this.peso = new Chart(this.peso.nativeElement, {
    type: 'line',
    data: {
        labels: listkg2,
        datasets: [
            {
                label: "Kg",
                fill: false,
                lineTension: 0.1,
                backgroundColor: "rgba(75,192,192,0.4)",
                borderColor: "rgba(75,192,192,1)",
                borderCapStyle: 'butt',
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter',
                pointBorderColor: "rgba(75,192,192,1)",
                pointBackgroundColor: "#fff",
                pointBorderWidth: 1,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: "rgba(75,192,192,1)",
                pointHoverBorderColor: "rgba(220,220,220,1)",
                pointHoverBorderWidth: 2,
                pointRadius: 1,
                pointHitRadius: 10,
                data: this.datakg,
                spanGaps: false,
            }
        ]
    }

  });
  });

var list = new Array;
var list2 = new Array;
this.databmi = [];
var rootRef = firebase.database().refFromURL("https://capgemini-personal-fitness.firebaseio.com/");
var urlRef =  rootRef.child("/Stats/"+this.userID+"/BMI");
urlRef.once("value", function(snapshot) {
  snapshot.forEach(function(child) {
    list2.push(child.key.toString());
  });
});
this.afdatabase.list(`/Stats/${this.userID}/BMI`).valueChanges().subscribe(snapshots =>{
    snapshots.forEach(snapshot => {
      list.push(snapshot);
    });
    i = 0;
    while(i<list.length){
        this.databmi[i] = list[i].Value;
        i=i+1;
  }
  this.bmi = new Chart(this.bmi.nativeElement, {

    type: 'line',
    data: {
        labels: list2,
        datasets: [
            {
                label: "BMI",
                fill: false,
                lineTension: 0.1,
                backgroundColor: "rgba(75,192,192,0.4)",
                borderColor: "rgba(75,192,192,1)",
                borderCapStyle: 'butt',
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter',
                pointBorderColor: "rgba(75,192,192,1)",
                pointBackgroundColor: "#fff",
                pointBorderWidth: 1,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: "rgba(75,192,192,1)",
                pointHoverBorderColor: "rgba(220,220,220,1)",
                pointHoverBorderWidth: 2,
                pointRadius: 1,
                pointHitRadius: 10,
                data: this.databmi,
                spanGaps: false,
            }
        ]
    }
});

  });

  }

  getColour(y: number, colorString: string){
      var toReturn = new Array;
      var k = 0;
      while(k<y){
          toReturn[k] = colorString;
          k = k+1;
      }
      return toReturn;
  }

}
