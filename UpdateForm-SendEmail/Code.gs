function update_and_send_form() {
  const FORM_ID = "GOOGLE FORM ID";
  const SHEET_NAME = "Report-Home";
  const SESSION_CELL = "B3";
  const DATA_RANGE = "G4";

  try {
    const ss = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
    if (!ss) throw new Error("Sheet not found");

    const session = ss.getRange(SESSION_CELL).getValue();
    const [title, headings, ...data] = ss.getRange(DATA_RANGE).getDataRegion().getValues();

    const { batches, ids, emails, names } = processData(data);

    updateForm(FORM_ID, ids, session, batches);
    sendEmails(session, emails, names);

    console.log("Form updated and emails sent successfully");
  } catch (error) {
    console.error("Error:", error.message);
    // You might want to add more robust error handling here, such as sending an error report email
  }
}

function processData(data) {
  const batches = new Set();
  const ids = [];
  const emails = [];
  const names = [];

  data.forEach(([batch, id, name, email]) => {
    batches.add(batch);
    ids.push(id);
    emails.push(email);
    names.push(name);
  });

  return { batches: Array.from(batches), ids, emails, names };
}

function updateForm(formId, ids, session, batches) {
  const form = FormApp.openById(formId);
  const items = form.getItems();

  // Update Student ID validation
  const studentIdQs = form.getItemById(items[2].getId());
  const valid = FormApp.createTextValidation()
    .setHelpText("Enter Correct Student Id or Contact Center for more details.")
    .requireTextMatchesPattern(`^(${ids.join('|')})$`)
    .build();
  studentIdQs.asTextItem().setValidation(valid);

  // Update Session dropdown
  const sessionQs = form.getItemById(items.find(item => item.getType() === FormApp.ItemType.LIST).getId());
  sessionQs.asListItem().setChoiceValues([session]);

  // Update Batch dropdown
  const batchQs = form.getItemById(items.filter(item => item.getType() === FormApp.ItemType.LIST)[1].getId());
  batchQs.asListItem().setChoiceValues(batches);
}

function sendEmails(session, emails, names) {
  const htmlTemplate = HtmlService.createTemplateFromFile('email_security_refund');
  
  emails.forEach((email, index) => {
    htmlTemplate.studentName = names[index];
    htmlTemplate.session = session;

    const htmlBody = htmlTemplate.evaluate().getContent();

    GmailApp.sendEmail(
      email,
      `Online Security Refund ${session} Form`,
      '',
      {
        htmlBody: htmlBody,
        cc: 'abc@gmail.com'
      }
    );
  });
}
