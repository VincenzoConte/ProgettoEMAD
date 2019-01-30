import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Chart } from 'chart.js';

/**
 * Generated class for the StatsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-stats',
  templateUrl: 'stats.html',
})
export class StatsPage {

  @ViewChild('peso') peso;
  @ViewChild('bmi') bmi;
  @ViewChild('km') km;
  @ViewChild('cal') cal;
  barChart: any;
  doughnutChart: any;
  lineChart: any;
  labelkm: any;
  datakm: any;
  labelcal: any;
  datacal: any;
  labelbmi: any;
  databmi: any;
  labelkg: any;
  datakg: any;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad StatsPage');

    this.labelkm = ["25/01/2019", "26/01/2019", "27/01/2019", "28/01/2019", "29/01/2019", "30/01/2019"];
    this.datakm = [10, 11, 12, 12, 12, 13];
    this.km = new Chart(this.km.nativeElement, {

      type: 'bar',
      data: {
          labels: this.labelkm,
          datasets: [{
              label: 'KM Percorsi',
              data: this.datakm,
              backgroundColor: [
                  'rgba(255, 99, 132, 0.2)',
                  'rgba(54, 162, 235, 0.2)',
                  'rgba(255, 206, 86, 0.2)',
                  'rgba(75, 192, 192, 0.2)',
                  'rgba(153, 102, 255, 0.2)',
                  'rgba(255, 159, 64, 0.2)'
              ],
              borderColor: [
                  'rgba(255,99,132,1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(75, 192, 192, 1)',
                  'rgba(153, 102, 255, 1)',
                  'rgba(255, 159, 64, 1)'
              ],
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

  this.labelcal = ["25/01/2019", "26/01/2019", "27/01/2019", "28/01/2019", "29/01/2019", "30/01/2019"];
  this.datacal = [990, 1089, 1118, 1118, 1118, 1287];
  this.cal = new Chart(this.cal.nativeElement, {

    type: 'bar',
    data: {
        labels: this.labelcal,
        datasets: [{
            label: 'Calorie bruciate',
            data: this.datacal,
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
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

this.labelkg = ["24/01/2019", "25/01/2019", "26/01/2019", "27/01/2019", "28/01/2019", "29/01/2019", "30/01/2019"];
this.datakg = [110, 110, 109, 109, 109, 105, 100];
this.peso = new Chart(this.peso.nativeElement, {

    type: 'line',
    data: {
        labels: this.labelkg,
        datasets: [
            {
                label: "Peso",
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

this.labelbmi = ["24/01/2019", "25/01/2019", "26/01/2019", "27/01/2019", "28/01/2019", "29/01/2019", "30/01/2019"];
this.databmi = [65, 59, 80, 81, 56, 55, 40];
this.bmi = new Chart(this.bmi.nativeElement, {

    type: 'line',
    data: {
        labels: this.labelbmi,
        datasets: [
            {
                label: "Body Mass index (BMI)",
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

  }

}
