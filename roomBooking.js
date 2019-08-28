
const puppeteer = require('puppeteer');
const escapeXpathString = str => {
  const splitedQuotes = str.replace(/'/g, `', "'", '`);
  return `concat('${splitedQuotes}', '')`;
};
const rooms = {
  '3': [{room: 15, id:143}],
  '4': [{room: 12, id:140}, {room: 14, id:142}, {room: 16, id:144}],
  '5': [{room: 4, id:132}, {room: 6, id:134}, {room: 7, id:135}, {room: 13, id:141}],
  '6': [{room: 1, id:129}],
  '8': [ {room: 8, id:136}, {room: 5, id:133}, {room: 2, id:130}, {room: 3, id:131}],
  '10': [{room: 9, id:137}],
  '16': [{room: 10, id:138}, {room: 11, id:139}]
}

const clickByText = async (page, text) => {
  const escapedText = escapeXpathString(text);
  const linkHandlers = await page.$x(`//a[contains(text(), ${escapedText})]`);
  
  if (linkHandlers.length > 0) {
    await linkHandlers[0].click();
  } else {
    throw new Error(`Link not found: ${text}`);
  }
};


// helper funtion to get current bookings
const getCurrentBookings = async (page) => {

await page.goto('https://vodafone-global.condecosoftware.com/Core27/RoomBooking/MyRequests.aspx?uid=1fa35d93-d588-4e77-86d2-1c7b57d3ab47');
await page.waitFor('#bookingFormTitle');

// load table into a 2 dimentional array
const selector = '#tblRoomBookingGrid > tbody > tr';
const tableArray = await page.$$eval(selector, trs => trs.map(tr => {
  const tds = [...tr.getElementsByTagName('td')];
  return tds.map(td => td.textContent);
}));

tableArray.shift(); //remove first row that is a headder
return tableArray;
};


// helper funtion to book a room
const bookRoom = async (page, roomBooking) => {
    try {
    var roomsArray = rooms[roomBooking.size];
    var complete=false;

    for (var i in roomsArray) {
      const url = 'https://vodafone-global.condecosoftware.com/core27/BookingForm/BookingForm.aspx?bookingID=0' +
      '&roomID=' + roomsArray[i].id + 
      '&startTime=' + roomBooking.startTime + 
      '&endTime=' + roomBooking.endTime + 
      '&startDate=' + roomBooking.startDate +  
      '&managed=0&selfSelect=0&int_popup=1&bookDate=' + roomBooking.startDate + '&IsPrRoom=0&IsVcRoom=0&deliveryPoint=0&countryID=1&userDefinedLocation=14&businessUnitID=37&userDefinedFloor=';

      await page.goto(url);

      await page.waitFor('#acceptMessagesButtonID');
      await page.click('input[id="acceptMessagesButtonID"]'); // press accept button

      //update the name of the meeting
      var eventName = ' mtg';
      if (roomBooking.name) {
        var eventName = roomBooking.name + eventName;
      }
      await page.focus('#gen_meetingTitle');
      await page.keyboard.type(eventName);



      await page.waitFor('#saveAndClose');
      await page.click('input[id="saveAndClose"]'); // press book button

      const selector = '#div_EditTimeError';
    
      var errorMsg = await page.$eval(selector, (element) => {
        return element.innerHTML
      })
      if (errorMsg=='One or more rooms are either alternatives to your selection or not available.'){
        await page.click('input[id="bookTimeBtn"]'); // press book button
        await page.click('body > div.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.ui-front.cstmGrayDialog.orangeTitleDialog.cstmAlert.no_closebtn.ui-dialog-buttons > div.ui-dialog-buttonpane.ui-widget-content.ui-helper-clearfix > div > button.blueHlgtBtns.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only'); // press accept button
        await page.click('input[id="saveAndClose"]'); // press book button
        
        return true;
      } else if (errorMsg=='No rooms available at your specified time. Please change the time or press ‘Undo changes’ to keep the original booking.') {
        //console.log("Failed to book room for  " +  roomBooking.startDate + " " + roomBooking.startTime + "-" + roomBooking.endTime);
        return false;
      }
      return true;
    }
  } catch (error){
    console.log(error);
    return false;
  }

};

//helper function to delete a room
const deleteRoom = async (page, browser, index) => {
  browser.on('targetcreated', async (target) => { //This block intercepts all new events
    if (target.type() === 'page') {               // if new page is opened
          const popupPage = await target.page(); 
          await delay(1000);
          const PopupElementWithDelete = await popupPage.$('#tblMainTable > tbody > tr:nth-child(2) > td > input:nth-child(1)');
          if (PopupElementWithDelete) {
            await PopupElementWithDelete.click();
          }
      }
  });

//const inputElementsWithDelete = await page.$x("//input[contains(., 'Delete')]");
const inputElementsWithDelete = await page.$('#tblRoomBookingGrid > tbody > tr:nth-child(' + (2+index) + ') > td.editdelgrp > input:nth-child(2)');
await inputElementsWithDelete.click()
};


//helper function to login and navigate to the condeco app
const loginAndNavigateToApp = async (page, browser) => {
  await page.goto('https://vodafone-global.condecosoftware.com/Master.aspx');
  await page.waitFor('#divWebcontent');
  const innerText = await page.evaluate(() => document.querySelector('#divWebcontent').innerText);
  if (innerText=='Your session has timed out. Please log in again.') {
    //const button = await page.$('#btnRedirectID');

    //await button.evaluate( button => button.click() );
    await page.click('input[type="submit"]'); // With type
    await page.waitFor('#bs-example-navbar-collapse-1 > ul > li > a');
  }
  await delay(1000);
  await clickByText(page, `Go to app`);
  await page.waitFor('#divNotificationBar');

}



const condeco = async(page, browser) => {

  await loginAndNavigateToApp(page, browser);



  var weeklyScheduleArr = [ 
    {
      startDate: {weeks: 1}, //absolute: "2019-09-02"},
      endDate: {weeks: 7}, //absolute: "2019-09-10"},
      schedule: [ 
        {
          day:1,  //Monday=1; tuesday=2 etc
          startTime: '10:00',
          endTime: '11:00',
          size: 4,
          name: 'Team weekly'
        },       
        {
          day:1,  //Monday=1; tuesday=2 etc
          startTime: '14:00',
          endTime: '16:00',
          size: 8,
          name: 'Innovation project'
        },     
        {
          day:2,  //Monday=1; tuesday=2 etc
          startTime: '15:00',
          endTime: '16:00',
          size: 4,
          name: 'weekly'
        },
        {
          day:3,  //Monday=1; tuesday=2 etc
          startTime: '11:00',
          endTime: '12:30',
          size: 10,
          name: 'API'
        },       
        {
          day:3,  //Monday=1; tuesday=2 etc
          startTime: '13:00',
          endTime: '16:00',
          size: 16,
          name: 'Innovation project'
        },
        {
          day:4,  //Monday=1; tuesday=2 etc
          startTime: '10:30',
          endTime: '12:00',
          size: 8,
          name: 'Catalyst project'
        },       
        {
          day:4,  //Monday=1; tuesday=2 etc
          startTime: '14:00',
          endTime: '15:30',
          size: 8,
          name: 'weekly'
        }    
      ]
      }
    ];

  var holidayArr = [{
    startDate: new Date("2019-08-20"),  //start date is last working day before holiday
    endDate: new Date("2019-08-22")
  },{
    startDate: new Date("2019-08-28"),
    endDate: new Date("2019-08-30")
  }];

  var eventArray = [];

  for (var i in weeklyScheduleArr) {
    var weeklySchedule = weeklyScheduleArr[i];
    // pre-process schedule to add absolute dates if not already available
    if (!weeklySchedule.startDate.absolute) {
      var relativeDate = new Date();
      relativeDate.setDate(relativeDate.getDate() + weeklySchedule.startDate.weeks * 7);
      weeklySchedule.startDate.absolute = relativeDate.toLocaleDateString();
    }  
    if (!weeklySchedule.endDate.absolute) {
      var relativeDate = new Date();
      relativeDate.setDate(relativeDate.getDate() + weeklySchedule.endDate.weeks * 7);
      weeklySchedule.endDate.absolute = relativeDate.toLocaleDateString();
    }

    //check start date is a Monday
    var startDateCheck = new Date(weeklySchedule.startDate.absolute);
    var startDay = startDateCheck.getDay();


    //convert weekly schedule to an array of individual events


    var dt = new Date(weeklySchedule.startDate.absolute);
    var endDate = new Date(weeklySchedule.endDate.absolute);
    while (dt<endDate) {
      //go through schedule
      var day = dt.getDay();
      //console.log('Week commencing ' + dt);
      for(var item in weeklySchedule.schedule){
        var eventDate = new Date(dt.getTime());
        var eventDay = weeklySchedule.schedule[item].day - startDay;
        if (eventDay<0) {
          eventDay=eventDay+7;
        }
        eventDate.setDate(dt.getDate() + eventDay);
        var dateStr = eventDate.getDate().toString();
        if (dateStr.length==1) {
          dateStr = '0' + dateStr;
        }
        var monthStr = (eventDate.getMonth()+1).toString();
        if (monthStr.length==1) {
          monthStr = '0' + monthStr;
        }
        var eventDateString = dateStr + "/" + monthStr + "/" + eventDate.getFullYear();

        // only add if this is not during one of the holiday windows
        var inHoliday = false;
        for(var holidayItem in holidayArr){
          if ((eventDate >= holidayArr[holidayItem].startDate) && (eventDate <= holidayArr[holidayItem].endDate)) {
            inHoliday = true;
          }
        }


        if (!(inHoliday)) {
          eventArray.push({
            startTime: weeklySchedule.schedule[item].startTime,
            endTime: weeklySchedule.schedule[item].endTime,
            startDate: eventDateString,
            size: weeklySchedule.schedule[item].size,
            name: weeklySchedule.schedule[item].name
          })
        }
      }
      dt.setDate(dt.getDate() + 7);
    }
  }



  var currentBookings =  await getCurrentBookings(page);

  //remove current bookings from eventArray and note any current bookings that need to be deleted
  var eventsToDeleteArray = [];
  for (var index = currentBookings.length-1; index>-1; index--){
    var row = currentBookings[index];
    if (row[5] && (row[5].substr(row[5].length-3) == 'mtg')) {  //this was auto created booking
      var currentStartDate = row[6].split(' ')[0]; 
      var currentStartTime = row[6].split(' ')[1]; 
      var currentEndTime = row[7]; 
      var found = false;
      for (var eventIndex in eventArray){
        var eventItem = eventArray[eventIndex];
        if ((eventItem.startDate==currentStartDate) && (eventItem.startTime==currentStartTime) && (eventItem.endTime==currentEndTime)) {
          // already exists, so remove from eventArray
          eventArray[eventIndex].succeeded = true;
          //eventArray.splice(eventIndex,1);
          found=true;
        }  
      }
      if (!found){
        //current booking not found in eventArray, so delete
        //console.log('delete index ' + index + " : " + currentStartDate + " " + currentStartTime + '-' + currentEndTime);
        await deleteRoom(page, browser, index);
        await delay(15000);
        await delay(5000);

      }
    }
  }

  for (var eventIndex in eventArray){
    if (!(eventArray[eventIndex].succeeded)) {
      //console.log('book index ' + eventIndex + " : " + eventArray[eventIndex].startDate + " " + eventArray[eventIndex].startTime + '-' + eventArray[eventIndex].endTime);
      eventArray[eventIndex].succeeded = await bookRoom(page, eventArray[eventIndex]);
    }
  }

  for (var eventIndex in eventArray){
    var dt = new Date(eventArray[eventIndex].startDate.split('/')[2],eventArray[eventIndex].startDate.split('/')[1]-1,eventArray[eventIndex].startDate.split('/')[0]);
    var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var day = days[ dt.getDay() ];
    var succeededText = 'booked';
    if (!(eventArray[eventIndex].succeeded)) {
      succeededText = 'failed';
    }
    console.log(eventIndex + " : " + day + ' ' + eventArray[eventIndex].startDate + " " + eventArray[eventIndex].startTime + '-' + eventArray[eventIndex].endTime + ' = ' + succeededText);
  }  

    //await page.click('input[type="submit"]'); // press delete button
    //const element = await select(page).getElement('button:contains("Delete")');
    //await element.click()
 
    

     
    //await deleteRoom(page, browser);
    
 
  

}


const delay = ms => new Promise(res => setTimeout(res, ms));



(async () => {





  const browser = await puppeteer.launch({headless: false,  slowMo: 1}); //devtools: true,
  const page = await browser.newPage();
  //page.on('console', (log) => console[log._type](log._text));
  
  await condeco(page, browser);
  await page.goto('https://vodafone-global.condecosoftware.com/Core27/RoomBooking/MyRequests.aspx?uid=1fa35d93-d588-4e77-86d2-1c7b57d3ab47');
  await page.waitFor('#bookingFormTitle');  
  await delay(5000);
  await page.screenshot({path: 'bookings.png'});

  await browser.close();
})();