
const puppeteer = require('puppeteer');
const cred = require('./cred.js');
const escapeXpathString = str => {
  const splitedQuotes = str.replace(/'/g, `', "'", '`);
  return `concat('${splitedQuotes}', '')`;
};


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
  const url = 'https://vodafone-global.condecosoftware.com/core27/BookingForm/BookingForm.aspx?bookingID=0' +
  '&roomID=' + roomBooking.roomID + 
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

  await page.goto('https://vodafone-global.condecosoftware.com/Core27/RoomBooking/MyRequests.aspx?uid=1fa35d93-d588-4e77-86d2-1c7b57d3ab47');

  await page.waitFor('#bookingFormTitle');
};

//helper function to delete a room
const deleteRoom = async (page, browser, index) => {
  browser.on('targetcreated', async (target) => { //This block intercepts all new events
    if (target.type() === 'page') {               // if new page is opened
          const popupPage = await target.page();      
          const PopupElementWithDelete = await popupPage.$('#tblMainTable > tbody > tr:nth-child(2) > td > input:nth-child(1)');
          await PopupElementWithDelete.click()
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
  await clickByText(page, `Go to app`);
  await page.waitFor('#divNotificationBar');

}



const condeco = async(page, browser) => {

  await loginAndNavigateToApp(page, browser);



  var weeklyScheduleArr = [ 
    {
      startDate: {weeks: 2}, //absolute: "2019-09-02"},
      endDate: {weeks: 10}, //absolute: "2019-09-10"},
      schedule: [ 
        {
          day:1,  //Monday=1; tuesday=2 etc
          startTime: '10:00',
          endTime: '11:00',
          roomID: '129',
          name: 'Team weekly'
        },       
        {
          day:1,  //Monday=1; tuesday=2 etc
          startTime: '14:00',
          endTime: '16:00',
          roomID: '130',
          name: 'Innovation project'
        },
        {
          day:2,  //Monday=1; tuesday=2 etc
          startTime: '10:30',
          endTime: '12:00',
          roomID: '137',
          name: 'Catalyst project'
        },       
        {
          day:2,  //Monday=1; tuesday=2 etc
          startTime: '15:00',
          endTime: '16:00',
          roomID: '137',
          name: 'weekly'
        },
        {
          day:3,  //Monday=1; tuesday=2 etc
          startTime: '11:00',
          endTime: '12:30',
          roomID: '129',
          name: 'API'
        },       
        {
          day:3,  //Monday=1; tuesday=2 etc
          startTime: '13:00',
          endTime: '16:00',
          roomID: '144',
          name: 'Innovation project'
        },
        {
          day:4,  //Monday=1; tuesday=2 etc
          startTime: '10:30',
          endTime: '12:00',
          roomID: '137',
          name: 'Catalyst project'
        },       
        {
          day:4,  //Monday=1; tuesday=2 etc
          startTime: '14:00',
          endTime: '15:30',
          roomID: '138',
          name: 'weekly'
        }    
      ]
      }
    ];

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
      console.log('Week commencing ' + dt);
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

        console.log('Event: ' + eventDateString);
        eventArray.push({
          startTime: weeklySchedule.schedule[item].startTime,
          endTime: weeklySchedule.schedule[item].endTime,
          startDate: eventDateString,
          roomID: weeklySchedule.schedule[item].roomID,
          name: weeklySchedule.schedule[item].name
        })
      }
      dt.setDate(dt.getDate() + 7);
      console.log(' ');
    }
  }

  var rooms = [
    {
      room: 1,
      size: 6,
      id: 129
    },
    {
      room: 2,
      size: 8,
      id: 130
    },      
    {
      room: 3,
      size: 8,
      id: 131
    }, 
    {
      room: 4,
      size: 5,
      id: 132
    },  
    {
      room: 5,
      size: 8,
      id: 133
    },  
    {
      room: 6,
      size: 5,
      id: 134
    },  
    {
      room: 7,
      size: 5,
      id: 135
    },  
    {
      room: 8,
      size: 8,
      id: 136
    },  
    {
      room: 9,
      size: 10,
      id: 137
    },    
    {
      room: 10,
      size: 16,
      id: 138
    },    
    {
      room: 11,
      size: 16,
      id: 139
    },    
    {
      room: 12,
      size: 4,
      id: 140
    },    
        {
      room: 13,
      size: 5,
      id: 141
    },    
    {
      room: 14,
      size: 4,
      id: 142
    },    
    {
      room: 15,
      size: 3,
      id: 143
    },    
    {
      room: 16,
      size: 4,
      id: 144
    }    
  ];

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
          eventArray.splice(eventIndex,1);
          found=true;
        }  
      }
      if (!found){
        //current booking not found in eventArray, so delete
        console.log('delete index ' + index + " : " + currentStartDate + " " + currentStartTime + '-' + currentEndTime);
        await deleteRoom(page, browser, index);
        await delay(5000);
        await delay(5000);

      }
    }
  }

  for (var eventIndex in eventArray){
    await bookRoom(page, eventArray[eventIndex]);
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
  
  await delay(5000);
  await browser.close();
})();