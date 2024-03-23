// create this function

function generatFile() {
  //get sheet ref
  const SS = SpreadsheetApp.getActiveSpreadsheet();

  // get data sheet ref
  const dataSheet = SS.getSheetByName("data");

  // get lastrow
  const lastRow = dataSheet.getLastRow();

  // loop till lastrow
  for (let i = 2; i <= lastRow; i++) {
    // get data values
    const dataSheetValues = dataSheet.getRange(i, 1, 1, 2).getValues()[0];

    // create file and get url
    const fileUrl = createFile(dataSheetValues);

    // set url to sheet
    dataSheet.getRange(i, 3).setValue(fileUrl);
  }
}

// creat another function

function createFile(rowData) {
  // Global Ids
  const TEMPLATE_FILE_ID = "1tEpN4E426d_6fqNohxgC30230jP-3aoRXUemHWAA90c",
    FOLDER_ID = "1miIdPC4UrHV2qHsnv6HZGBPkDXephwDH";

  //get template file id
  const templateFile = DriveApp.getFileById(TEMPLATE_FILE_ID);

  // get destination folder id
  const folder = DriveApp.getFolderById(FOLDER_ID);

  // make file name 
  const fileName = `Document of ${rowData[0]}`;

  // make copy of template file
  const docUrl = templateFile.makeCopy(fileName, folder).getUrl();

  // open new document and get body of document
  const docBody = DocumentApp.openByUrl(docUrl).getBody();

  // replace templatedText with values
  docBody.replaceText("<<name>>", rowData[0]);
  docBody.replaceText("<<id>>", rowData[1]);


  // return the created document url
  return docUrl;
}

