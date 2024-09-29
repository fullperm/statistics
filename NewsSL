/*
 Author: Fullperm Alpha (ecb4819c-d8d2-4ae9-9473-cd0a85e4779c@lsl.secondlife.com)

 License:
 To the extent possible under law, the author(s) listed above have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 You should have received a copy of the CC0 Public Domain Dedication along with this software.
 If not, see http://creativecommons.org/publicdomain/zero/1.0

 Name: NewsSL

 Description:
 This function fetches data from the Secondlife RSS news feed to retrieve the latest official news and appends it to a Google Spreadsheet along with title, link and the official timestamp in the specified timezone format (UTC or SLT). Already fetched news are only written once to the sheet, avoiding duplicates.

 This script works with the Secondlife RSS news feed:
 https://community.secondlife.com/blogs/blog/rss/4-featured-news

 This script should work also with other RSS feeds (for example: https://modemworld.me/feed by Inara Pey).

 Google quota usage: 288 URL calls / day with 5 minute intervals (20000 available for private gmail accounts).

 Example output:
 <rss version="2.0">
  <channel>
    <title>Featured News</title>
    <link>https://community.secondlife.com/blogs/blog/4-featured-news/</link>
    <description/>
    <language>en</language>
    <item>
      <title>Test</title>
      <link>https://community.secondlife.com/blogs/entry/test/</link>
      <description>Hello Avatar !</description>
      <guid isPermaLink="false">15929</guid>
      <pubDate>Wed, 25 Sep 2024 16:52:46 +0000</pubDate>
    </item>
  </channel>
 </rss>

 This script can be appended to an empty Google Spreadsheet: 
 1. Open a Google Spreadsheet and go to Extensions > Apps Script.
 2. Copy and paste this code into the script editor in Extensions > Apps Script.
 3. Save and name your script.
 4. Set a trigger in Extensions > Apps Script to run this function hourly via the triggers menu.
 5. A custom menu named "Actions" will be added to your Google Spreadsheet, providing various options for using the script.

 Todo:
 - trying to use google apps inbuilt functions for automatic date conversion ; the first try was less promising unfortunately
 - providing example html code for showing the latest news on google sites
 - support of multiple RSS sources

 Bugs:

*/

// CONSTANTS
const URL = 'https://community.secondlife.com/blogs/blog/rss/4-featured-news'; // Second Life RSS Feed
// const URL = 'https://modemworld.me/feed'; // Inara Pey RSS Feed for testing
const TIMER = 5; // Constant for trigger interval in minutes
const TIMEZONE = "UTC"; // Define constant for the timezone (use "UTC" or "SLT", "UTC" is recommended)

// FUNCTIONS

function fetchAndWriteRSSFeed() {
  // Fetch the RSS feed data
  var response = UrlFetchApp.fetch(URL);
  
  // Check if response is valid
  if (!response || response.getResponseCode() !== 200) {
    Logger.log("Error fetching data: Invalid response");
    return; // Exit the function if the response is not valid
  }
  
  var xml = response.getContentText();

  // Parse the XML data
  var xmlDoc = XmlService.parse(xml);
  var root = xmlDoc.getRootElement();
  var channel = root.getChild('channel');
  var items = channel.getChildren('item');

  // Prepare the data to write to the sheet
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var title = item.getChild('title').getText();
    var link = item.getChild('link').getText();
    var pubDate = item.getChild('pubDate').getText();

    // Convert the date format
    var time = convertDateFormat(pubDate);

    // Log the values for debugging
    Logger.log("Time: " + time);
    Logger.log("Title: " + title);
    Logger.log("Link: " + link);

    // Check for existing entry using link
    var sheet = SpreadsheetApp.getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var exists = data.some(function(row) {
      return row[1] === link; // Assuming the link is in the second column
    });

    if (exists) {
      Logger.log("News already exist.");
    } else {
      // If the entry doesn't exist, append it to the spreadsheet
      sheet.appendRow([title, link, time]);
    }
  }

  // Check if the data is empty
  if (!data || data.trim().length === 0) {
    Logger.log("No data fetched or data is empty.");
    return;
  }
}

function convertDateFormat(dateString) {
  var customTime;

  // Check the timezone and set the customTime accordingly
  if (TIMEZONE === "UTC") {
    customTime = Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd HH:mm:ss");
  } else {
    // Assuming SLT timezone, adjust to the correct region if needed
    customTime = Utilities.formatDate(new Date(), "America/Los_Angeles", "yyyy-MM-dd HH:mm:ss");
  }

  // Regular expression to match the date and time components
  var regex = /(\w+), (\d+) (\w+) (\d{4}) (\d{2}):(\d{2}):(\d{2}) \+0000/;

  // Extract the components from the date string using the regex
  var match = regex.exec(dateString);

  if (match) {
    var day = parseInt(match[2]);
    var month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(match[3]) + 1;
    var year = parseInt(match[4]);
    var hour = parseInt(match[5]);
    var minute = parseInt(match[6]);
    var second = parseInt(match[7]);

    // Pad single digits with leading zeros
    day = day < 10 ? "0" + day : day;
    month = month < 10 ? "0" + month : month;
    hour = hour < 10 ? "0" + hour : hour;
    minute = minute < 10 ? "0" + minute : minute;
    second = second < 10 ? "0" + second : second;

    // Return the formatted date and time string in the desired format
    return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
  } else {
    Logger.log("Invalid date format: " + dateString);
    return null;
  }
}

function createTrigger() {
    // Delete existing triggers to avoid duplicates
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
        ScriptApp.deleteTrigger(triggers[i]);
    }

    // Create a new trigger that runs every TIMER minutes
    ScriptApp.newTrigger('fetchAndWriteRSSFeed')
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
        .addItem('Start Fetching News', 'fetchAndWriteRSSFeed')
        .addItem('Start Fetching News every ' + TIMER + ' minutes', 'createTrigger')
        .addItem('Stop Fetching News Timer', 'stopTrigger')
        .addToUi();
}
