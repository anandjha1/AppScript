function saveDataToContacts() {
  const SS = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = SS.getSheetByName('Save Contact');
  const data = sheet.getRange('A6:I35').getDisplayValues();
  const groupName = sheet.getRange('C2').getValue();
  const resourceNames = [];

  for(let i=0; i<data.length; i++){
    const [stdId, session, batch, stdName, gender, dob, email, mobile, status] = data[i];

    if(status === 'Done') continue;

    if (!stdName || !email || !mobile) {
      console.warn('Missing essential data for:', data[i]);
      continue; // Skip this row if essential data is missing
    }

    const [day, month, year] = dob.split('/');
    const contact = {
      "names": [
        {
          "givenName": stdName,
          "familyName": `${groupName} ${stdId}`
        }
      ],
      "phoneNumbers": [
        {
          "type": "mobile",
          "value": ""+mobile
        }
      ],
      "genders": [
        {
          "value": gender
        }
      ],
      "emailAddresses": [
        {
          "type": "work",
          "value": email
        }
      ],
      "birthdays": [
        {
          "date": {
            "year": year,
            "month": month,
            "day": day
          }
        }
      ],
      "organizations": [
        {
          "name": "AVG",
          "department": "Training",
          "title": `${groupName} Student`
        }
      ],
      "externalIds": [
        {
          "type": "Student Id",
          "value": ""+stdId
        }
      ],
      "userDefined": [
        {
          "key": "Batch",
          "value": batch
        },
        {
          "key": "Session",
          "value": session
        }
      ]
    };

    try {
      const newContact = People.People.createContact(contact);
      resourceNames.push(newContact.resourceName);
    } catch (e) {
      console.error(`Error creating contact for ${stdName}:`, e);
    }
  }

  if (resourceNames.length > 0) {
    try {
      const group = createContactGroupIfNotExists(groupName);
      People.ContactGroups.Members.modify({
        resourceNamesToAdd: resourceNames
      }, group.resourceName);
      console.log('All contacts added:', resourceNames);
      SS.toast('All contacts added.');
    } catch (e) {
      console.error('Error adding contacts to group:', e);
      SS.toast(`Error adding contacts to group: ${e.message}`);
    }
  } else {
    console.log('No contacts created.');
    SS.toast("No contacts have been created.");
  }
}

function createContactGroupIfNotExists(groupName) {
  try {
    const contactGroups = People.ContactGroups.list().contactGroups;
    const existingGroup = contactGroups.find(grp => grp.name === groupName);
    if (existingGroup) {
      return existingGroup;
    }
    const newGroup = People.ContactGroups.create({
      contactGroup: {
        name: groupName
      }
    });
    return newGroup;
  } catch (e) {
    console.error('Error creating or retrieving contact group:', e);
  }
}
