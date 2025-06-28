function updateMobile() {
  const SS = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const UPDATE_DATA_SHEET = SS.getSheetByName('update_data');
  const DATA_SHEET_RANGE = SS.getSheetByName('Enrollments-data-Form-Response');
  const EMAIL_COL = 43-1;
  const TEMP_ID_COL = 6-1;
  const MOBILE_COL = 44-1;
  const NAME_COL = 9; //zero based index

  const data_values = DATA_SHEET_RANGE.getDataRange().getValues();

  const oldMobile = ui.prompt("Enter Mobile:").getResponseText().trim();

  const mobileIndex = data_values.findIndex(row => String(row[MOBILE_COL]) === oldMobile);
  if (mobileIndex === -1) {
    ui.alert(`${oldMobile} not found.`);
    return;
  }

  const studentName = DATA_SHEET_RANGE.getRange(mobileIndex+1, NAME_COL+1).getValue();

  const newMobile = ui.prompt(`Enter New Mobile No of ${studentName}:`).getResponseText().trim();

  if (!/^\d{10}$/.test(newMobile)) {
    ui.alert('Invalid mobile number. Please enter a 10-digit mobile number.');
    return;
  }

  const rowIndex = mobileIndex + 1;
  const mobileCell = DATA_SHEET_RANGE.getRange(rowIndex, MOBILE_COL + 1);
  const oldMobileValue = mobileCell.getValue();
  const notes = mobileCell.getNote() || "";

  // get email value

  const email = DATA_SHEET_RANGE.getRange(rowIndex, EMAIL_COL+1).getValue();

  mobileCell.setValue(newMobile);
  mobileCell.setNote(`Old Mobile: ${oldMobileValue}\n${notes}`);

  const tempId = data_values[mobileIndex][TEMP_ID_COL];
  UPDATE_DATA_SHEET.appendRow([tempId, new Date(), 'MOBILE', oldMobileValue, newMobile]);
  // ui.alert([tempId, new Date(), 'MOBILE', oldMobileValue, newMobile]);

  updateByMobile(email, newMobile);
}

function updateByMobile(email, newMobile) {
  let resourceName = searchContactByEmail(email);
  if (!resourceName) {
    Logger.log(`Contact with email ${email} not found in People API.`);
    return;
  }

  try {
    const contact = People.People.get(resourceName, {
      personFields: "phoneNumbers,names"
    });

    contact.phoneNumbers = [
      {
        type: "mobile",
        value: newMobile
      }
    ];

    const updatedContact = People.People.updateContact(
      contact,
      resourceName,
      { updatePersonFields: "phoneNumbers" }
    );

    Logger.log(`Successfully updated contact: ${resourceName} to mobile: ${newMobile}`);
  } catch (error) {
    Logger.log(`Error updating contact: ${error.message}`);
  }
}
