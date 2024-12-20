
function sendWhatsAppMessages() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  const YOUR_ACCOUNT_SID = ''; //add your accound_sid
  const YOUR_AUTH_TOKEN = ''; // add your auth_token

  for (let i = 1; i < data.length; i++) {
    const phoneNumber = data[i][0]; // Assumes phone number is in the first column
    const message = data[i][1]; // Assumes message text is in the second column
    
    if (!phoneNumber || !message) {
      Logger.log(`Row ${i + 1}: Missing phone number or message.`);
      continue;
    }
    
    const url = `https://api.twilio.com/2010-04-01/Accounts/${YOUR_ACCOUNT_SID}/Messages.json`;
    const options = {
      'method': 'post',
      'payload': {
        'To': `whatsapp:+91${phoneNumber}`,
        'From': 'whatsapp:+141552*****', // Replace with your Twilio WhatsApp number
        'Body': message
      },
      'headers': {
        'Authorization': 'Basic ' + Utilities.base64Encode(`${YOUR_ACCOUNT_SID}:${YOUR_AUTH_TOKEN}`)
      }
    };

    try {
      const response = UrlFetchApp.fetch(url, options);
      Logger.log(`Message sent to ${phoneNumber}: ${response.getContentText()}`);
    } catch (error) {
      Logger.log(`Failed to send message to ${phoneNumber}: ${error}`);
    }
  }
}
