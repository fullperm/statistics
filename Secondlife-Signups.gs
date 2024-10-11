/*
 AUTHOR: Fullperm Alpha (ecb4819c-d8d2-4ae9-9473-cd0a85e4779c@lsl.secondlife.com)

 LICENSE:

 To the extent possible under law, the author(s) listed above have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 You should have received a copy of the CC0 Public Domain Dedication along with this software.
 If not, see http://creativecommons.org/publicdomain/zero/1.0

 NAME: Secondlife-Signups.gs

 DESCRIPTION:

 This function fetches data from the Secondlife API to retrieve the current number of signups and appends it to a Google Spreadsheet along with a custom timestamp in the specified timezone format (UTC or SLT). We use default UTC without hours and minutes.

 By starting the script via installed user menu historical data will be imported first (if existing).
 After this new data will be fetched and appended to the sheet via timer.

 Signups seem to be updated 1 time per day at 0.15 SLT (7.15 UTC) - we set the timer default to 7.30 UTC.
 
 Estimated size of the google sheet: after 1 year of continuous daily logging approximately 5 KB.
 
 Google quota usage: 1 URL call / day (20000 calls / day available for private gmail accounts).

 The format processed is described here:
 https://wiki.secondlife.com/wiki/Linden_Lab_Official:Live_Data_Feeds#XML_feed

 This script works with the Secondlife API:
 https://api.secondlife.com/datafeeds/homepage.txt

 Example input:
 
 signups_updated_slt
 2010-02-02 00:55:02
 signups_updated_unix
 1265100902
 signups
 18072841
 exchange_rate_updated_slt
 2010-02-02 01:03:28
 exchange_rate_updated_unix
 1265101408
 exchange_rate
 262.2055
 inworld_updated_unix
 1265101209
 inworld_updated_slt
 2010-02-02 01:00:09
 inworld
 38489

 This script can be appended to an empty Google Spreadsheet: 

 1. Open a Google Spreadsheet and go to Extensions > Apps Script.
 2. Copy and paste this code into the script editor in Extensions > Apps Script.
 3. Save and name your script.
 4. Set a trigger in Extensions > Apps Script to run this function hourly via the triggers menu.
 5. A custom menu named "Actions" will be added to your Google Spreadsheet, providing various options for using the script.

 To display the latest signups number on your google sites page:

 1. Publish your google sheet to the web and retrieve the url
 2. Embed the following code into your google sites page and change <your_google_sheet_url to your retrieved url:

<!DOCTYPE html>
<html>
<head>
    <script>
        window.onload=()=>fetch('<your_google_sheet_url/gviz/tq?tqx=out:csv')
        .then(r=>r.text())
        .then(d=>{const u=(d.split("\n").map(r=>r.split(",")));document.write(`<div id="output">Signups: ${u.length>1?u[u.length-2][0].replace(/['"]+/g,'').trim():'No data found.'}</div>`);})
        .catch(e=>console.error('Error:',e));
    </script>
</head>
</html>

 TODO:
 - import data should support merging into existing data by avoiding duplicates
 - removing TargetDate != "1970-01-01" if possible
 - try-catch block for ImportData() and opening the source sheet for import ; if it fails it shouldnt simply stop
 - lock the sheet for manual alterations and maybe reverse order of the column time
 - generating a backup sheet daily
 - making code more readable by using better code constructs
 - improving log output

 BUGS:

*/

// CONSTANTS

// Second Life API URL
const URL_API = 'https://api.secondlife.com/datafeeds/homepage.txt';
// Data Import URL: https://gwynethllewelyn.net/2022/12/02/real-time-statistics-from-second-life/
const URL_SOURCE = 'https://docs.google.com/spreadsheets/d/1i-CwRNe5KTIl98q5jdF8ftD-Ops8LG80gZZimQ3o_4c/edit?gid=0#gid=0';
const URL_TARGET = SpreadsheetApp.getActiveSpreadsheet().getUrl(); // url of active spreedsheet where the script is attached ; you can use another
const IMPORT=true; // true if we want to import historical data ; false for fetching from scratch without import
const TIMER_HOUR = 7; // Execution hour for daily signups
const TIMER_MINUTE = 30; // Execution minute for daily signups
const TIMEZONE = "Etc/UTC"; // Define constant for the timezone (use "Etc/UTC" or "Etc/GMT+1" for SLT)

// VARIABLES

// FUNCTIONS

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Actions')
      .addItem('Start Script','StartScript')
      .addItem('Stop Script','StopScript')
//    .addItem('Import Data','ImportData')
      .addItem('Delete Data','DeleteData')
      .addToUi();
  Logger.log("User menu installed.");
}

function StartScript() {
    var Target = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    var Response = UrlFetchApp.fetch(URL_API);
    var Data = Response.getContentText();

    if (IMPORT) ImportData();

    Logger.log("Fetching new data ...");

    if (!Data || Data.trim().length === 0) {
        Logger.log("No data fetched or data is empty.");
        return;
    }

    // Split the data into lines
    var Lines = Data.split("\n");
    var SignupsFetched = "";

  //  // Iterate over each line to find the required values
  //  for (var i = 1; i < Lines.length; i++) {
  //      Logger.log(`Processing line ${i} / ${Lines.length} : ${Lines[i]}`);
  //      if (Lines[i].trim() === "signups" && i + 1 < Lines.length) {
  //          SignupsFetched = Lines[i + 1].trim();
  //      }
  //  }

  // the line below is faster than the upper block: api hopefully does not change much ; but let the upper block for debug purposes
  SignupsFetched = Lines[5].trim();

    // Check the last entry in the sheet
    var RowLast = Target.getLastRow();
    if (RowLast > 0) {
        var SignupsLast = Target.getRange(RowLast, 1).getValue();
        Logger.log("Signups Last : " + SignupsLast);
        Logger.log("Signups Fetched: " + SignupsFetched);
        if (parseInt(SignupsLast,10) === parseInt(SignupsFetched, 10)) { // Convert to integer for comparison
            Logger.log("Writing new data skipped - nothing available.");
            return;
        }
    }

    Logger.log(`Writing new data ...`);
    Logger.log(`Signups: ${Signups} ; Time: ${Time} Time`);
    var Today = new Date();
    var Time = Utilities.formatDate(Today, TIMEZONE, "yyyy-MM-dd");
    Target.appendRow([Signups, Time]);

    Logger.log("Removing all triggers ...");

    var Triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < Triggers.length; i++) {
        ScriptApp.deleteTrigger(Triggers[i]);
    }

    ScriptApp.newTrigger('StartSignupsSL')
        .timeBased()
        .atHour(TIMER_HOUR)
        .nearMinute(TIMER_MINUTE)
        .everyDays(1)
        .create();
    Logger.log("Trigger activated.");
}

function StopScript() {
    Logger.log("Removing all triggers ...");

    var Triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < Triggers.length; i++) {
        ScriptApp.deleteTrigger(Triggers[i]);
    }
    Logger.log("Stopping script finished.");
}

function ImportData() {
    var Source = (SpreadsheetApp.openByUrl(URL_SOURCE)).getSheets()[0].getDataRange().getValues();
    var Target = SpreadsheetApp.openByUrl(URL_TARGET).getActiveSheet();

    // Check if the target sheet already has data to prevent duplicate entries
    // At the moment we can not merge data into existing data by skipping duplicates and writing rows where there are no duplicates
    if (Target.getDataRange().getValues().length > 1) {
        Logger.log("Import skipped - target sheet contains data.");
        return;
    }

    Logger.log(`Importing data from: ${URL_SOURCE}...`);

    for (var i = Source.length - 1; i > 0; i--) {
        var SourceDate = Source[i][4]; // Unix timestamp
        var TargetDate = Utilities.formatDate((new Date(SourceDate * 1000)), 'GMT', 'yyyy-MM-dd');
        var Signups = Source[i][6];

        if (Signups != SignupsLast && TargetDate != TargetDateLast && TargetDate != "1970-01-01") {
            Logger.log(`Importing row ${i} / ${Source.length - 1} :`);
            Logger.log(`Signups : ${Signups}`);
            Logger.log(`Date : ${TargetDate}`);

            Target.appendRow([Signups, TargetDate]);

            var SignupsLast = Signups;
            var TargetDateLast = TargetDate;
        }
    }
      Logger.log("Importing data finished.");
}

function DeleteData() {
  var Sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  Sheet.clear();
  Logger.log("Delete data finished.");
}
