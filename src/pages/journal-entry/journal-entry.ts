import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, FabContainer, Events } from 'ionic-angular';
import { JournalPage } from '../journal/journal';
import { Camera, CameraOptions } from '@ionic-native/camera';

//Form Validation
//import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';

//import Providers
import { DatabaseProvider } from '../../providers/database/database';
//import { PhotoProvider } from '../../providers/photo/photo';

//MIDATA imports
import { MidataService } from '../../services/MidataService';
import { Observation } from 'Midata';
import { ObsMentalCondition } from '../../resources/subjectiveCondition';


//import journalEntry utility class
import { JournalEntry } from '../../classes/journalEntry';

//import journalDeletePage
import { JournalDeletePage } from '../journal-delete/journal-delete'; //not sure if needed...

/**
 * Generated class for the JournalEntryPage page.
 * @author kochd1
 */
@IonicPage()
@Component({
  selector: 'page-journal-entry',
  templateUrl: 'journal-entry.html',
})
export class JournalEntryPage {

  //Form Validation 
  //formgroup:FormGroup;
  //date:AbstractControl;
  //text:AbstractControl;
  //photo:AbstractControl;
  //smilie:AbstractControl;

  /**
   *  journal Entry
   */
  journalEntry: JournalEntry;

  /**
   * collection of journal entries
   */
  journalEntryCollection: JournalEntry[] = [];

  journalDeletePage : JournalDeletePage;

  /**
   * variable which stores the user input concerning the subj. condition.
   */
  subjectiveCondition: number;

  /**
   * #MIDATA -> array for the weight data 
     store the raw data in this array.
   */
  subjectiveConditionData: Array<{date: Date, value: number }>;

  /**
   * variable to store the image data
   */
  myPhoto:any;

  /**
   * For popup ionViewCanLeave
   */
  showAlertMessage:boolean;

  /**
   * For popup ionViewCanLeave
   */
  backBtnClicked:boolean;


  
  constructor(public navCtrl: NavController, 
    public navParams: NavParams,
    private midataService: MidataService,
    public dbp: DatabaseProvider,
    private camera: Camera,
    private alertCtrl: AlertController,
    //private formBuilder: FormBuilder,
    public events: Events) {

    //Form Validation
    //this.formgroup = formBuilder.group({
      //date:['', Validators.required],
      //text:['', Validators.required],
      //photo:['', Validators.required]
      //smilie:['', Validators.required]
    //});

    //controls
    //this.date = this.formgroup.controls['date'];
    //this.text = this.formgroup.controls['text'];
    //this.photo = this.formgroup.controls['photo'];
    //this.smilie = this.formgroup.controls['smilie'];


    this.journalEntry = new JournalEntry(); //without this, the page will throw a "Uncaught (in promise): TypeError"

    //#MIDATA
    this.subjectiveConditionData = new Array<{ date: Date, value: number }>();

    this.showAlertMessage = true;
    this.backBtnClicked = false;
  
  }

  /**
   * 
   * Runs when the page is about to enter and become the active page.
   */
  ionViewWillEnter(){
    console.log("willEnter journalEntryPage");
    
    //this.journalEntryId = this.navParams.data; //-> fetches data from "journal-deletePage" --> do not delete!, otherwise delete won't work properly
   
    this.journalEntry = this.navParams.data;

    console.log("ionViewWillEnter() -> journalEntry:", this.journalEntry);
    this.myPhoto = this.journalEntry.entryPhoto;

    this.subjectiveCondition = this.journalEntry.entrySubjCondition;
    console.log("ionViewWillEnter() -> subj. Condition:", this.journalEntry.entrySubjCondition);

    this.dbp.getJournalEntryCollection().then((val) => {
      if(val == null) {
        // There's no journalEntry
        console.log("ionViewWillEnter() -> val == null?:", val);
        this.showUserInformation();
      }

      });

    //#MIDATA -> load the elements
    this.loadData();

    
    
  }

  showUserInformation(){
    let alert = this.alertCtrl.create({
      title: 'Infos über die Datenspeicherung',
      subTitle: 'Ihre Text- und Bilddateneinträge werden nur lokal gespeichert und nicht für die Forschung verwendet.' 
      +'<br> Angaben über Ihren Gemütszustand (Smilie) werden auf MIDATA gespeichert. Diese Angaben sind jedoch optional. ',
      buttons: [
        {
          text: 'OK',
          handler: () =>{
          //do nothing
        }
      }
  ]
});

alert.present();
  
  }

  ionViewCanLeave(){

    //only show this alert, when back btn is clicked

    if(this.backBtnClicked){

    if(this.showAlertMessage){
      let alert = this.alertCtrl.create({
        title: 'Achtung!',
        subTitle: 'Eintrag/Änderungen verwerfen?',
        buttons: [
          {
            text: 'Ja',
            handler: () =>{
            alert.dismiss().then(() => {
              this.exitPage();
            })
          }
        },
        {
          text: 'Nein',
          handler: () => {
          }
        }
    ]
  });

  alert.present();
      return false; //return false to avoid the page to be popped up
  }

}

}

  private exitPage(){
    this.showAlertMessage = false;
    this.navCtrl.pop();
  }

  /**
   * Adds subjective condition from user input to the resp. global variable.
   * @param value 
   */
  addSubjConditionInput(value: number){
    this.subjectiveCondition = value;
  }

  //Runs when the page has loaded.
  ionViewDidLoad() {

    this.loadData();
    /*console.log('ionViewDidLoad JournalEntryPage');
    this.dbp.getJournalEntryCollection().then((val) => {
     if(val == null ) {
        //no entry there
     } else {
       this.journalEntryCollection = val;
     }
    });*/

    //this.journalEntry = this.navParams.data; //-> fetches data from "journal-deletePage"
    
    
  }

    //kochd1: This codeline below is necessary to display the today's date.
    myDate: any = new Date().toISOString();

    /**
     * save journal entry to database.
     */
    saveEntry():void{
      console.log("saveJournalEntry button was clicked");
      if(this.journalEntry.entryId==0 || this.journalEntry.entryId==null){
        console.log("saveEntry() -> entryId:", this.journalEntry.entryId);
        this.journalEntry.entryId = Number(new Date()); //.getTime);

        console.log("saveEntry() -> entryPhoto", this.myPhoto);
        this.journalEntry.entryPhoto = this.myPhoto;
      }
      
      this.dbp.saveJournalEntry(this.journalEntry).then(val => {
        if(val)
          this.dbp.getJournalEntryCollection().then((val) =>{
            this.navCtrl.push(JournalPage);
          });
      });
      
      console.log("saveEntry() -> subjectiveCondition:", this.subjectiveCondition);

      if(this.subjectiveCondition==0 || this.subjectiveCondition==1 || this.subjectiveCondition==2){

        let mentalCondition = new ObsMentalCondition(this.subjectiveCondition);
        this.journalEntry.entrySubjCondition = this.subjectiveCondition; //local copy
        this.midataService.save(mentalCondition)
        .then((response) => {
          // we can now access the midata response
          console.log("ObsMentalCondition fired on MIDATA");
        
    
        }).catch((error) => {
            console.error("Error in save request:", error);
        });

        console.log("mental condition: " + mentalCondition);
        }

        this.backBtnClicked = false; //otherwise popup is shown, when user beforhand tried to leave the page.
      
    //this.addMentalCondition();
    //console.log("addMentalCondition is called");
      
    }

    /**
   * #MIDATA: loads the data (FHIR Observations with code "subjective-condition") from the MIDATA server
   */
  private loadData(): void {
    this.midataService.search('Observation/$lastn', { max: 1000, _sort: '-date', code: "subjective-condition", patient: this.midataService.getUser().id })
      .then(response => {
        if( response.length > 0) {
          response.forEach((measure: Observation) => {
            //console.log(measure.getProperty('valueQuantity')['value'], measure.getProperty('effectiveDateTime'));
            this.addSubjectiveCondition(measure.getProperty('valueQuantity')['value'], measure.getProperty('effectiveDateTime'));
          });
          /* TODO:  to test */
          /* TODO: catch error */
        }
      }
      );

      /*this.dbp.saveJournalEntry(this.journalEntry).then(val => {
        if(val) {
          // work around, damit später gepoppet wird
          this.dbp.getJournalEntryCollection().then(val => {
            this.navCtrl.pop();
          })
          
        }
      });*/

      /*
      
      this.dbp.getJournalEntryCollection()
      .then((val) => {
        if(val == null) {
          console.log("getJournalEntryCollection -> null")
          this.journalEntryCollection.push(this.journalEntry);
          this.dbp.saveJournalEntry(this.journalEntryCollection);

          console.log("JEntryId: this.journalEntry.entryId");
          console.log(this.journalEntryCollection)

        } else {
          console.log("get-->" + val);
          this.journalEntryCollection = val;
          this.journalEntryCollection.push(this.journalEntry);
          this.dbp.saveJournalEntry(this.journalEntryCollection);
          
          console.log(this.journalEntry.entryId)
          console.log(this.journalEntryCollection)

        }
      })
      
      this.navCtrl.pop();*/
    
    }

 /**
   * #MIDATA: add the weight values to the weightData array.
   * 
   * @param measure 
   * @param date 
   */
  addSubjectiveCondition(measure: number, date: Date): void {
    /*if (moment().diff(date) >= 0){ 
    }*/

    //push the data to the array
    this.subjectiveConditionData.push({ date: date, value: measure });
  }

  public gotoJournalPage() {
    this.backBtnClicked=true;
    this.navCtrl.push(JournalPage, {});

    for (let entry of this.subjectiveConditionData){
      console.log("All subjCondition values (MIDATA)", entry);
    }
  }


  clickMainFAB(){
    console.log("Clicked open menu")
  }

  /**
   * Gets image from Android photo gallery and fills the image placeholder with the respective image.
   */
  getImage(event, fab1: FabContainer){

    const options: CameraOptions = {
      quality: 70,
      destinationType: this.camera.DestinationType.DATA_URL,//this.camera.DestinationType.FILE_URI,
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
      saveToPhotoAlbum:false
    }
    fab1.close(); //close fab btn in the meantime
    this.camera.getPicture(options).then((imageData) => {
     // imageData is either a base64 encoded string or a file URI
     // If it's base64 (DATA_URL):
     
    //this.navCtrl.push(JournalEntryPage);

    this.myPhoto = 'data:image/jpg;base64,' + imageData; // 'data:image/jpeg;base64,'

    }, (err) => {
     // Handle error
    });

  }

  /**
   * Activates the Android camera funtion and fills the image placeholder with the taken picture.
   */
  takePhoto(event, fab1: FabContainer){
    const options: CameraOptions = {
      quality: 70,
      destinationType: this.camera.DestinationType.DATA_URL,//this.camera.DestinationType.FILE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      saveToPhotoAlbum:true
    }

    fab1.close(); //close fab btn in the meantime
    this.camera.getPicture(options).then((imageData) => {
     // imageData is either a base64 encoded string or a file URI
     // If it's base64 (DATA_URL):
     this.myPhoto = 'data:image/jpg;base64,' + imageData; // 'data:image/jpeg;base64,'
    }, (err) => {
     // Handle error
    });
  }

}
