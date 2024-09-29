/*
 Author: Fullperm Alpha (ecb4819c-d8d2-4ae9-9473-cd0a85e4779c@lsl.secondlife.com)

 License:
 To the extent possible under law, the author(s) listed above have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 You should have received a copy of the CC0 Public Domain Dedication along with this software.
 If not, see http://creativecommons.org/publicdomain/zero/1.0

 Name: OnlineSL

 Description:
 This function fetches data from the Secondlife API to retrieve the current number of avatars online
 and appends it to a Google Spreadsheet along with a timestamp in the specified timezone format (UTC or SLT)

 The format processed is described here:
 https://wiki.secondlife.com/wiki/Linden_Lab_Official:Live_Data_Feeds#XML_feed

 This script works with the Secondlife API:
 https://api.secondlife.com/datafeeds/homepage.txt

 This script also works with the BonnieBots API:
 https://www.bonniebots.com/homepage.txt

 A custom timestamp is written to the Google Sheet, which is not retrieved from the API because we use a variable timer.

 Example output:
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

 Estimatated size of the google sheet: after 1 year of continuous logging with 5 minute intervals approximately 1 MB.
 Google quota usage: 288 URL calls / day with 5 minute intervals (20000 available for private gmail accounts).

 To display the latest online number on your google sites page:

 1. Publish your google sheet to the web and retrieve the url
 2. Embed the following code into your google sites page and change <your_google_sheet_url to your retrieved url:

<!DOCTYPE html>
<html>
<head>
    <script>
        window.onload=()=>fetch('<your_google_sheet_url/gviz/tq?tqx=out:csv')
        .then(r=>r.text())
        .then(d=>{const u=(d.split("\n").map(r=>r.split(",")));document.write(`<div id="output">Online: ${u.length>1?u[u.length-2][0].replace(/['"]+/g,'').trim():'No data found.'}</div>`);})
        .catch(e=>console.error('Error:',e));
    </script>
</head>
</html>

 Todo:

 Bugs:
*/

// CONSTANTS

const URL = 'https://api.secondlife.com/datafeeds/homepage.txt'; // Second Life API URL
// const URL = 'https://www.bonniebots.com/homepage.txt'; // BonnieBots API URL
const TIMER = 5; // Constant for trigger interval in minutes
const TIMEZONE = "UTC"; // Define constant for the timezone (use "UTC" or "SLT", "UTC" is recommended as it is worldwide known)

// VARIABLES

// FUNCTIONS

function OnlineSL() {
    // Fetch the data from the URL with error handling
    var response, data;

    try {
        response = UrlFetchApp.fetch(URL);
        data = response.getContentText();
    } catch (error) {
        Logger.log("Error fetching data: " + error.message);
        return; // Exit the function if there was an error
    }

    // Check if the data is empty
    if (!data || data.trim().length === 0) {
        Logger.log("No data fetched or data is empty.");
        return;
    }

    // Split the data into lines
    var lines = data.split("\n");
    var time = "", online = "";

    // Iterate over each line to find the required values
    for (var i = 0; i < lines.length; i++) {
        Logger.log("Processing line: " + lines[i]);
        if (lines[i].trim() === "inworld_updated_slt" && i + 1 < lines.length) {
            time = lines[i + 1].trim();
        } else if (lines[i].trim() === "inworld" && i + 1 < lines.length) {
            online = lines[i + 1].trim();
        }
    }

    // Log the values for debugging
    Logger.log("Time: " + time);
    Logger.log("Online: " + online);

    // Create and format a custom timestamp based on the specified timezone
    var customTime = (TIMEZONE === "UTC") 
        ? Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd HH:mm:ss") 
        : Utilities.formatDate(new Date(), "America/Los_Angeles", "yyyy-MM-dd HH:mm:ss"); // Adjust SLT timezone if needed

    // Open the Spreadsheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Append the data to the spreadsheet
    sheet.appendRow([online, customTime]);
}

// All code below this line can be removed if no custom menu is required and the script editor is used instead.

function createTrigger() {
    // Delete existing triggers to avoid duplicates
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
        ScriptApp.deleteTrigger(triggers[i]);
    }

    // Create a new trigger that runs every 5 minutes based on the constant
    ScriptApp.newTrigger('OnlineSL')
        .timeBased()
        .everyMinutes(TIMER)
        .create();
}

function stopTrigger() {
    // Delete all triggers to stop the timer
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
        ScriptApp.deleteTrigger(triggers[i]);
    }
}

function onOpen() {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('Actions')
        .addItem('Start OnlineSL', 'OnlineSL')
        .addItem('Start OnlineSL every ' + TIMER + ' minutes', 'createTrigger')
        .addItem('Stop OnlineSL Timer', 'stopTrigger')
        .addToUi();
}
