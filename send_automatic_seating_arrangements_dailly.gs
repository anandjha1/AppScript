// ───────────────────────────────
// 🎯 CONSTANTS
// ───────────────────────────────

const SS = SpreadsheetApp.getActiveSpreadsheet();
const LOG_SHEET = SS.getSheetByName("sheet_log");
const SHUFFLE_SHEET = SS.getSheetByName("ShuffleSheet");


// ───────────────────────────────
// 🚀 MAIN FUNCTION
// ───────────────────────────────
function sendSeats() {
  if (isTodayWeekend() || isTodayHoliday()) return;

  const SHUFFLED_SYS = getShuffledSystems();

  logShuffledData(SHUFFLED_SYS);
  sendEmailToStudents(SHUFFLED_SYS);
  sendTelegramNotification(SHUFFLED_SYS);
}


// ───────────────────────────────
// 📊 LOGGING
// ───────────────────────────────
function logShuffledData(SHUFFLED_SYS) {
  LOG_SHEET.appendRow([new Date(), ...SHUFFLED_SYS]);
}


// ───────────────────────────────
// 📧 EMAIL NOTIFICATION
// ───────────────────────────────
/**
 * Send email to students using MailApp to avoid draft quota issues.
 */
function sendEmailToStudents(SHUFFLED_SYS) {
  const emails = SHUFFLE_SHEET.getRange('K2:K200').getValues()
    .flat()
    .filter(email => email && email.toLowerCase().endsWith('gmail.com'));

  if (emails.length < 20) {
    console.warn(`❗ Only ${emails.length} valid emails found — something may be wrong.`);
  }

  const quotaLeft = MailApp.getRemainingDailyQuota();
  if (quotaLeft < Math.ceil(emails.length / 50)) {
    console.error(`❌ Not enough quota left to send emails. Quota remaining: ${quotaLeft}`);
    return;
  }

  const subject = `Seating Arrangement - ${dateFormat(new Date())}`;
  const htmlBody = buildEmailBody(SHUFFLED_SYS);

  const batchSize = 48;
  let batchCount = 0;

  while (emails.length) {
    const batch = emails.splice(0, batchSize).join(',');
    try {

      MailApp.sendEmail({
        to: 'aatmanirbhar.madangir@gmail.com',
        subject: subject,
        bcc: batch,
        htmlBody: htmlBody,
        name: 'Aatmanirbhar Training Centre'
      });

      batchCount++;
      Utilities.sleep(1000); // Respect rate limits
    } catch (err) {
      console.error("Email Error: " + err);
    }
  }

  console.log(`✅ Emails sent in ${batchCount} batch(es).`);

  // Optional: Send a confirmation to admin (comment if not needed)
  // const adminEmail = 'admin@example.com';
  // MailApp.sendEmail({
  //   to: adminEmail,
  //   subject: `[ADMIN COPY] ${subject}`,
  //   htmlBody: htmlBody
  // });
}


function buildEmailBody(SHUFFLED_SYS) {
  let rows = "";

  for (let i = 0; i < 15; i++) {
    const bgColor = i % 2 === 0 ? "#f9f9f9" : "#eaf4ff";
    rows += `
      <tr style="background-color: ${bgColor};">
        <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${i + 1}</td>
        <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${SHUFFLED_SYS[i]}</td>
        <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${i + 16}</td>
        <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${SHUFFLED_SYS[i + 15]}</td>
      </tr>`;
  }

  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #eee; border-radius: 8px;">
    <h2 style="text-align: center; color: #007BFF; margin-bottom: 10px;">Daily Seating Plan</h2>
    <p style="text-align: center; font-size: 14px; color: #333;">Date: <strong>${dateFormat()}</strong></p>
    <p style="text-align: center; font-size: 14px;">
      <a href="https://aatmanirbhar.in/student" style="color: #007BFF; text-decoration: none;" target="_blank">
        Check Attendance Status
      </a>
    </p>

    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
      <thead>
        <tr style="background-color: #007BFF; color: white;">
          <th style="padding: 10px; border: 1px solid #007BFF;">Roll No</th>
          <th style="padding: 10px; border: 1px solid #007BFF;">System</th>
          <th style="padding: 10px; border: 1px solid #007BFF;">Roll No</th>
          <th style="padding: 10px; border: 1px solid #007BFF;">System</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <p style="text-align: center; font-size: 12px; color: #888; margin-top: 20px;">
      This is an auto-generated email from the Aatmanirbhar system.
    </p>
  </div>`;
}



// ───────────────────────────────
// 📲 TELEGRAM NOTIFICATION
// ───────────────────────────────
/**
 * sent telegram notifications with shuffled system.
 * {param} []
 */
function sendTelegramNotification(SHUFFLED_SYS) {
  const properties = PropertiesService.getScriptProperties();
  const TOKEN = properties.getProperty('TELEGRAM_BOT_TOKEN');
  const CHAT_ID = properties.getProperty('TELEGRAM_CHAT_ID');

  let formattedPlan = `RollNo-System | RollNo-System | RollNo-System\n`;

  for (let i = 0; i < 10; i++) {
    formattedPlan += `${String(i + 1).padStart(2, '0')}-${SHUFFLED_SYS[i]} | ` +
      `${i + 11}-${SHUFFLED_SYS[i + 10]} | ` +
      `${i + 21}-${SHUFFLED_SYS[i + 20]}\n`;
  }

  const message = `
<pre>
<b>🪑 Seating Plan - ${dateFormat()}</b>

${formattedPlan}

</pre>
🔗 <a href="https://aatmanirbhar.in/student">Check Attendance Status</a>`;

  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const payload = {
    chat_id: CHAT_ID,
    text: message,
    parse_mode: "HTML"
  };

  try {
    UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("Telegram Error: ", err);
  }
}


// ───────────────────────────────
// 🛠️ HELPER FUNCTIONS
// ───────────────────────────────
/**
 * Format date into desired string format.
 */
function dateFormat(d = new Date(), format = 'dd-MMMM-yyyy') {
  return Utilities.formatDate(d, 'IST', format);
}

/**
 * Checks if today is a holiday.
 */
function isTodayHoliday(today = new Date()) {
  const holidays = SS.getRangeByName('holidays')
    .getDisplayValues()
    .flat()
    .map(date => new Date(date).setHours(0, 0, 0, 0));
  return holidays.includes(today.setHours(0, 0, 0, 0));
}

/**
 * Checks if today is Sunday or 1st/3rd Saturday.
 */
function isTodayWeekend(today = new Date()) {
  const day = today.getDay();
  if (day === 0) return true; // Sunday

  const firstDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstSaturday = new Date(today.getFullYear(), today.getMonth(), 7 - firstDate.getDay());
  const thirdSaturday = new Date(today.getFullYear(), today.getMonth(), firstSaturday.getDate() + 14);

  return compareDates(today, firstSaturday) || compareDates(today, thirdSaturday);
}

/**
 * Compares two dates by day, month, and year.
 */
function compareDates(d1, d2) {
  return d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();
}

/**
 * Get 30 shuffled Systems list
 */
function getShuffledSystems() {
  return Array.from({ length: 30 }, (_, i) => `Lab_${(i + 1).toString().padStart(2, '0')}`)
    .sort(() => Math.random() - 0.5);
}


// ───────────────────────────────
// 🧪 TEST FUNCTION (DEV ONLY)
// ───────────────────────────────
function testEmails() {
  const emails = SHUFFLE_SHEET.getRange('K2:K200').getValues().flat()
    .filter(email => email && email.toLowerCase().endsWith('gmail.com'));
  console.log(emails);
}

function getEmailQuota() {
  console.log(MailApp.getRemainingDailyQuota());
}

