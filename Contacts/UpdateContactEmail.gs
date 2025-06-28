function updateEmail() {
  const SS = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const UPDATE_DATA_SHEET = SS.getSheetByName('update_data');
  const DATA_SHEET_RANGE = SS.getSheetByName('Enrollments-data-Form-Response');
  const EMAIL_COL = 42; // Email column index (zero-based)
  const TEMP_ID_COL = 5; // Temp ID column index (zero-based)

  const data_values = DATA_SHEET_RANGE.getDataRange().getValues();

  const oldEmail = ui.prompt("Enter Old Email ID:").getResponseText().trim();
  
  // Check if email exists in the sheet
  const emailIndex = data_values.findIndex(row => row[EMAIL_COL] === oldEmail);
  if (emailIndex === -1) {
    ui.alert(`${oldEmail} not found.`);
    return;
  }

  const newEmail = ui.prompt('Enter New Email ID:').getResponseText().trim();
  
  // Update the email in the sheet
  const rowIndex = emailIndex + 1; // Convert to 1-based index
  const emailCell = DATA_SHEET_RANGE.getRange(rowIndex, EMAIL_COL + 1); // Adjust for 1-based index
  const notes = emailCell.getNote() || "";
  
  emailCell.setValue(newEmail);
  emailCell.setNote(`Old Email: ${oldEmail}\n${notes}`);

  // Log the update in the update_data sheet
  const tempId = data_values[emailIndex][TEMP_ID_COL];
  UPDATE_DATA_SHEET.appendRow([tempId, new Date(),'EMAIL', oldEmail, newEmail]);

  // Update the contact using People API
  updateByEmail(oldEmail, newEmail);
}


/**
 * Updates a contact by searching with the old email and replacing it with the new email.
 * @param {string} oldEmail The old email address to search for.
 * @param {string} newEmail The new email address to set.
 */
function updateByEmail(oldEmail, newEmail) {
  let resourceName = searchContactByEmail(oldEmail);

  Utilities.sleep(5000);

  resourceName = searchContactByEmail(oldEmail);
  
  if (!resourceName) {
    Logger.log(`Contact with email ${oldEmail} not found in People API.`);
    return;
  }

  try {
    // Get the existing contact
    const personFields = "emailAddresses,names";
    const contact = People.People.get(resourceName, { personFields: personFields });

    // Update the email address
    contact.emailAddresses = [
      {
        type: "work",
        value: newEmail
      }
    ];

    // Save the updated contact
    const updatedContact = People.People.updateContact(
      contact,
      resourceName,
      { updatePersonFields: "emailAddresses" }
    );

    Logger.log(`Successfully updated contact: ${resourceName} to email: ${newEmail}`);
  } catch (error) {
    Logger.log(`Error updating contact: ${error.message}`);
  }
}

/**
 * Searches for a contact by email address and retrieves its resourceName.
 * @param {string} email The email address to search for.
 * @return {string|null} The resourceName of the contact if found, or null if not.
 */
function searchContactByEmail(email) {
  try {
    const response = People.People.searchContacts({
      query: email,
      pageSize: 1,
      readMask: "emailAddresses,names"
    });

    if (response.results && response.results.length > 0) {
      const contact = response.results[0];
      const resourceName = contact.person.resourceName;
      Logger.log(`Found contact: ${contact.person.names[0].displayName}`);
      Logger.log(`Resource Name: ${resourceName}`);
      return resourceName;
    } else {
      Logger.log(`No contact found with email: ${email}`);
      return null;
    }
  } catch (error) {
    Logger.log(`Error searching for contact: ${error.message}`);
    return null;
  }
}
