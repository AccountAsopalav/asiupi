/**
 * Google Apps Script for AsoPalav Income & Expense Tracker
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Sheet (ID: 1aasOjbC_eo7-Amg-6daAsERtj7JM0GSGit3x9Z2IiZo)
 * 2. Click on "Extensions" > "Apps Script"
 * 3. Delete any default code and paste this script
 * 4. Replace the SPREADSHEET_ID below if needed
 * 5. IMPORTANT FOR GOOGLE DRIVE UPLOADS:
 *    To authorize Google Drive permissions:
 *    - In the toolbar at the top of Apps Script, select "triggerAuthorizationRequest" from the dropdown.
 *    - Click "Run" (the Play icon).
 *    - Click "Review Permissions" in the popup.
 *    - Choose your Google Account, click "Advanced", then "Go to Untitled project (unsafe)", and click "Allow".
 * 6. Click "Deploy" (top right) > "New deployment" (or "Manage deployments" > "Edit" if updating)
 * 7. Select Type: "Web app"
 * 8. Set "Execute as": "Me"
 * 9. Set "Who has access": "Anyone"
 * 10. Click "Deploy", authorize the permissions, and COPY the "Web app URL"
 * 11. Paste the Web App URL into the AsoPalav web app setup screen!
 */

const SPREADSHEET_ID = "1aasOjbC_eo7-Amg-6daAsERtj7JM0GSGit3x9Z2IiZo";
const DRIVE_FOLDER_ID = "1PRFLI1Zkxl1_XtM-sqhy21ltOHvjW3bX"; // Google Drive Folder ID provided by user

// DUMMY FUNCTION TO FORCE GOOGLE DRIVE AUTHORIZATION PROMPT
// Select this function from the top dropdown and click Run to authorize Google Drive
function triggerAuthorizationRequest() {
  Logger.log("Triggering Google Drive and Sheets authorization...");
  try {
    const ss = getSpreadsheet();
    if (ss) {
      const fileId = ss.getId();
      const file = DriveApp.getFileById(fileId);
      Logger.log("Authorized access to spreadsheet file: " + file.getName());
      
      const parents = file.getParents();
      if (parents.hasNext()) {
        const parentFolder = parents.next();
        Logger.log("Authorized parent folder: " + parentFolder.getName());
      }
    }
    Logger.log("Authorization successful!");
  } catch (e) {
    Logger.log("Error during authorization: " + e.message);
    throw e;
  }
}

function getSpreadsheet() {
  try {
    if (SPREADSHEET_ID && SPREADSHEET_ID !== "YOUR_SHEET_ID") {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    }
  } catch (e) {
    console.error("Failed to open by ID, falling back to active spreadsheet: " + e.message);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// Handle GET requests (retrieving data, settings, login)
function doGet(e) {
  const action = e.parameter.action;
  let result;
  
  try {
    const ss = getSpreadsheet();
    if (!ss) {
      throw new Error("Could not access Google Spreadsheet. Check permissions and ID.");
    }

    if (action === "getData") {
      result = fetchAllData(ss);
    } else if (action === "getSettings") {
      result = fetchSettings(ss);
    } else if (action === "login") {
      const username = e.parameter.username;
      const password = e.parameter.password;
      result = performLogin(ss, username, password);
    } else if (action === "addRecordGet") {
      // Fallback GET request to write data in case POST runs into CORS redirect issues
      result = handleAddRecord(ss, e.parameter);
    } else if (action === "editRecordGet") {
      result = handleEditRecord(ss, e.parameter);
    } else if (action === "deleteRecordGet") {
      result = handleDeleteRecord(ss, e.parameter);
    } else if (action === "saveUserGet") {
      result = handleSaveUser(ss, e.parameter);
    } else if (action === "deleteUserGet") {
      result = handleDeleteUser(ss, e.parameter);
    } else {
      result = {
        status: "error",
        message: "Unknown GET action: '" + action + "'. Valid actions are: getData, getSettings, login, addRecordGet"
      };
    }
  } catch (err) {
    result = {
      status: "error",
      message: err.toString()
    };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Handle POST requests (adding records with larger payload e.g. base64 images)
function doPost(e) {
  let result;
  
  try {
    const ss = getSpreadsheet();
    if (!ss) {
      throw new Error("Could not access Google Spreadsheet.");
    }

    let payload;
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      payload = e.parameter;
    }

    const action = payload.action;

    if (action === "addRecord" || !action) {
      result = handleAddRecord(ss, payload);
    } else if (action === "editRecord") {
      result = handleEditRecord(ss, payload);
    } else if (action === "deleteRecord") {
      result = handleDeleteRecord(ss, payload);
    } else if (action === "login") {
      result = performLogin(ss, payload.username, payload.password);
    } else if (action === "saveUser") {
      result = handleSaveUser(ss, payload);
    } else if (action === "deleteUser") {
      result = handleDeleteUser(ss, payload);
    } else {
      result = {
        status: "error",
        message: "Unknown POST action: '" + action + "'"
      };
    }
  } catch (err) {
    result = {
      status: "error",
      message: err.toString()
    };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Authenticate user against "USERS" tab
function performLogin(ss, username, password) {
  const sheet = ss.getSheetByName("USERS");
  if (!sheet) {
    return { status: "error", message: "USERS sheet tab not found." };
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { status: "error", message: "USERS sheet is empty." };
  }

  // Column B: username (index 1), Column C: password (index 2)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const sheetUsername = String(row[1]).trim().toLowerCase();
    const sheetPassword = String(row[2]).trim();

    if (sheetUsername === String(username).trim().toLowerCase() && sheetPassword === String(password).trim()) {
      return {
        status: "success",
        user: {
          no: row[0],
          username: row[1],
          name: row[3],
          designation: row[4],
          role: row[5],
          department: row[6],
          pages: row[7] ? String(row[7]).split(",").map(p => p.trim()) : ["Dashboard", "Form", "Voucher"]
        }
      };
    }
  }

  return { status: "error", message: "Invalid username or password." };
}

// Fetch lists from "SETTINGS" tab
function fetchSettings(ss) {
  const sheet = ss.getSheetByName("SETTINGS");
  if (!sheet) {
    return {
      employees: [],
      departments: [],
      categories: [],
      angadias: [],
      gstOptions: [],
      paymentMethods: []
    };
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return {
      employees: [],
      departments: [],
      categories: [],
      angadias: [],
      gstOptions: [],
      paymentMethods: []
    };
  }

  const employees = [];
  const departments = [];
  const categories = [];
  const angadias = [];
  const gstOptions = [];
  const paymentMethods = [];

  // Settings Column mapping:
  // A: EMPLOYEE NAME, B: DEPARTMENT, C: CATEGORY, D: ANGADIA, E: GST, F: PAYMENT METHOD
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (row[0]) employees.push(String(row[0]).trim());
    if (row[1]) departments.push(String(row[1]).trim());
    if (row[2]) categories.push(String(row[2]).trim());
    if (row[3]) angadias.push(String(row[3]).trim());
    if (row[4]) gstOptions.push(String(row[4]).trim());
    if (row[5]) paymentMethods.push(String(row[5]).trim());
  }

  return {
    employees: [...new Set(employees)],
    departments: [...new Set(departments)],
    categories: [...new Set(categories)],
    angadias: [...new Set(angadias)],
    gstOptions: [...new Set(gstOptions)],
    paymentMethods: [...new Set(paymentMethods)]
  };
}

// Fetch both historical records, users list, and dropdown settings
function fetchAllData(ss) {
  const settings = fetchSettings(ss);
  
  // Fetch data records
  const dataSheet = ss.getSheetByName("DATA");
  const records = [];
  let nextVoucherNo = 1001; // Start default

  if (dataSheet) {
    const values = dataSheet.getDataRange().getValues();
    if (values.length > 1) {
      for (let i = 1; i < values.length; i++) {
        const r = values[i];
        
        // Parse voucher number to find max
        const vNoStr = String(r[4] || "").replace(/\D/g, "");
        if (vNoStr) {
          const vNum = parseInt(vNoStr, 10);
          if (!isNaN(vNum) && vNum >= nextVoucherNo) {
            nextVoucherNo = vNum + 1;
          }
        }

        records.push({
          timestamp: r[0] ? String(r[0]) : "",
          utrNumber: r[1] ? String(r[1]) : "",
          operatorName: r[2] ? String(r[2]) : "",
          dateOfExpense: r[3] ? String(r[3]) : "",
          voucherNo: r[4] ? String(r[4]) : "",
          employeeName: r[5] ? String(r[5]) : "",
          department: r[6] ? String(r[6]) : "",
          category: r[7] ? String(r[7]) : "",
          vendorName: r[8] ? String(r[8]) : "",
          gst: r[9] ? String(r[9]) : "",
          paymentMethod: r[10] ? String(r[10]) : "",
          expenseAmount: r[11] ? parseFloat(r[11]) || 0 : 0,
          depositedAmount: r[12] ? parseFloat(r[12]) || 0 : 0,
          voucherRemarks: r[13] ? String(r[13]) : "",
          billImage: r[14] ? String(r[14]) : "",
          receiptImage: r[15] ? String(r[15]) : "",
          itemImage: r[16] ? String(r[16]) : "",
          securityStampImage: r[17] ? String(r[17]) : "",
          authorisedBy: r[18] ? String(r[18]) : ""
        });
      }
    }
  }

  // Fetch users metadata for client listing (excluding password for safety, or return role details)
  const usersSheet = ss.getSheetByName("USERS");
  const users = [];
  if (usersSheet) {
    const values = usersSheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      const r = values[i];
      if (r[1]) {
        users.push({
          no: r[0],
          username: r[1],
          name: r[3],
          designation: r[4],
          role: r[5],
          department: r[6],
          pages: r[7] ? String(r[7]).split(",").map(function(p) { return p.trim(); }) : ["Dashboard", "Form", "Voucher"]
        });
      }
    }
  }

  return {
    status: "success",
    settings: settings,
    records: records,
    users: users,
    nextVoucherNo: nextVoucherNo
  };
}

// Append new record to "DATA" tab
function handleAddRecord(ss, data) {
  const sheet = ss.getSheetByName("DATA");
  if (!sheet) {
    // If DATA tab does not exist, create it with header columns
    return { status: "error", message: "DATA sheet tab not found in spreadsheet." };
  }

  // Determine incremental voucher number if empty
  let voucherNo = data.voucherNo;
  if (!voucherNo || voucherNo === "AUTO") {
    let maxVNo = 1000;
    const values = sheet.getDataRange().getValues();
    if (values.length > 1) {
      for (let i = 1; i < values.length; i++) {
        const vNoStr = String(values[i][4] || "").replace(/\D/g, "");
        if (vNoStr) {
          const vNum = parseInt(vNoStr, 10);
          if (!isNaN(vNum) && vNum > maxVNo) {
            maxVNo = vNum;
          }
        }
      }
    }
    voucherNo = "AP-" + (maxVNo + 1);
  }

  const timestamp = new Date();
  
  // Expense/deposit amount cleanups
  const expenseAmount = parseFloat(data.expenseAmount) || 0;
  const depositedAmount = parseFloat(data.depositedAmount) || 0;

  // Insert columns FROM Column A TO Column S
  // A: TIMESTAMP
  // B: UTR NUMBER
  // C: OPERATOR NAME
  // D: DATE OF EXPENSE
  // E: VOUCHER NO
  // F: EMPLOYEE NAME
  // G: DEPARTMENT
  // H: CATEGORY
  // I: VENDOR NAME
  // J: GST
  // K: PAYMENT METHOD
  // L: EXPENSE AMOUNT
  // M: DEPOSITED AMOUNT
  // N: VOUCHER NUMBER WITH REMARKS IF ANY
  // O: UPLOAD BILL IMAGE
  // P: PAYMENT RECEIPT IMAGE
  // Q: UPLOAD ITEM IMAGE
  // R: SECURITY CLEARANCE WITH STAMP IMAGE
  // S: AUTHORISED BY
  
  // Save uploaded images to Google Drive as files, and replace Base64 with direct Drive URLs
  const billImageLink = saveImageToDrive(data.billImage, voucherNo + "_bill.png", "BILL IMAGE", ss);
  const receiptImageLink = saveImageToDrive(data.receiptImage, voucherNo + "_receipt.png", "RECEIPT IMAGE", ss);
  const itemImageLink = saveImageToDrive(data.itemImage, voucherNo + "_item.png", "ITEM IMAGE", ss);
  const securityStampLink = saveImageToDrive(data.securityStampImage, voucherNo + "_stamp.png", "SECURITY IMAGE", ss);

  const newRow = [
    timestamp,                        // A: TIMESTAMP
    data.utrNumber || "",             // B: UTR NUMBER
    data.operatorName || "",           // C: OPERATOR NAME
    data.dateOfExpense || "",         // D: DATE OF EXPENSE
    voucherNo,                         // E: VOUCHER NO
    data.employeeName || "",           // F: EMPLOYEE NAME
    data.department || "",             // G: DEPARTMENT
    data.category || "",               // H: CATEGORY
    data.vendorName || "",             // I: VENDOR NAME
    data.gst || "",                    // J: GST
    data.paymentMethod || "",         // K: PAYMENT METHOD
    expenseAmount,                     // L: EXPENSE AMOUNT
    depositedAmount,                   // M: DEPOSITED AMOUNT
    data.voucherRemarks || "",         // N: VOUCHER NUMBER WIOTH REMARKS IF ANY
    billImageLink,                     // O: UPLOAD BILL IMAGE
    receiptImageLink,                  // P: PAYMENY RECEIPT IMAGE
    itemImageLink,                     // Q: UPLOAD ITEM IMAGE
    securityStampLink,                 // R: SECURITY CLEARENCE WITH STAMP IMAGE
    data.authorisedBy || ""            // S: AUTHORISED BY
  ];

  sheet.appendRow(newRow);

  return {
    status: "success",
    message: "Record successfully saved to Google Sheets!",
    voucherNo: voucherNo,
    timestamp: timestamp.toISOString()
  };
}

// Create or update a user in the USERS tab
function handleSaveUser(ss, data) {
  const sheet = ss.getSheetByName("USERS");
  if (!sheet) {
    return { status: "error", message: "USERS sheet tab not found. Please create a sheet tab named USERS." };
  }

  const values = sheet.getDataRange().getValues();
  const username = String(data.username || "").trim().toLowerCase();
  if (!username) {
    return { status: "error", message: "Username is required." };
  }

  let foundRowIdx = -1;
  const userNoInput = data.no ? parseInt(data.no, 10) : null;

  for (let i = 1; i < values.length; i++) {
    const rowNo = parseInt(values[i][0], 10);
    const rowUsername = String(values[i][1]).trim().toLowerCase();
    
    if ((userNoInput && rowNo === userNoInput) || rowUsername === username) {
      foundRowIdx = i + 1; // 1-indexed row number
      break;
    }
  }

  const password = data.password ? String(data.password).trim() : "";
  const name = String(data.name || "").trim();
  const designation = String(data.designation || "").trim();
  const role = String(data.role || "Staff").trim();
  const department = String(data.department || "").trim();
  const pages = String(data.pages || "Dashboard, Form, Voucher").trim();

  if (foundRowIdx > 0) {
    // Edit existing user
    const existingPassword = values[foundRowIdx - 1][2];
    const finalPassword = password || existingPassword;

    sheet.getRange(foundRowIdx, 1, 1, 8).setValues([[
      userNoInput || values[foundRowIdx - 1][0],
      username,
      finalPassword,
      name,
      designation,
      role,
      department,
      pages
    ]]);

    return {
      status: "success",
      message: "User " + name + " updated successfully in Google Sheet!"
    };
  } else {
    // Create new user
    let maxId = 0;
    for (let i = 1; i < values.length; i++) {
      const valId = parseInt(values[i][0], 10);
      if (!isNaN(valId) && valId > maxId) {
        maxId = valId;
      }
    }
    const newId = maxId + 1;

    if (!password) {
      return { status: "error", message: "Password is required for new users." };
    }

    const newRow = [
      newId,
      username,
      password,
      name,
      designation,
      role,
      department,
      pages
    ];

    sheet.appendRow(newRow);

    return {
      status: "success",
      message: "User " + name + " created successfully in Google Sheet!"
    };
  }
}

// Delete a user from the USERS tab
function handleDeleteUser(ss, data) {
  const sheet = ss.getSheetByName("USERS");
  if (!sheet) {
    return { status: "error", message: "USERS sheet tab not found." };
  }

  const values = sheet.getDataRange().getValues();
  const userNoInput = data.no ? parseInt(data.no, 10) : null;
  const username = String(data.username || "").trim().toLowerCase();

  if (!userNoInput && !username) {
    return { status: "error", message: "User ID or Username is required to delete." };
  }

  for (let i = 1; i < values.length; i++) {
    const rowNo = parseInt(values[i][0], 10);
    const rowUsername = String(values[i][1]).trim().toLowerCase();

    if ((userNoInput && rowNo === userNoInput) || (username && rowUsername === username)) {
      sheet.deleteRow(i + 1); // 1-indexed
      return {
        status: "success",
        message: "User deleted successfully from Google Sheet!"
      };
    }
  }

  return { status: "error", message: "User not found." };
}

// Helper to save a Base64 image to Google Drive and return its view link
function saveImageToDrive(base64Data, filename, folderName, ss) {
  if (!base64Data || !String(base64Data).startsWith("data:image/")) {
    return base64Data || ""; // If not a Base64 string, return it as-is (e.g. if it's already a URL)
  }

  try {
    const parts = base64Data.split(",");
    const metadata = parts[0];
    const base64Content = parts[1];
    
    // Find mime-type (default to image/png)
    let mimeType = "image/png";
    const mimeMatch = metadata.match(/data:(.*?);/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
    }

    // Convert Base64 payload to safe binary Blob
    const decoded = Utilities.base64Decode(base64Content);
    const blob = Utilities.newBlob(decoded, mimeType, filename);

    let targetFolder = null;

    // First, try to retrieve the folder by explicit DRIVE_FOLDER_ID if defined
    if (typeof DRIVE_FOLDER_ID !== "undefined" && DRIVE_FOLDER_ID && DRIVE_FOLDER_ID !== "YOUR_FOLDER_ID") {
      try {
        const rootCustomFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
        // Organize into subfolders ("BILL IMAGE", "RECEIPT IMAGE", etc.) within the custom folder!
        const subfolderName = folderName || "General";
        const subfolders = rootCustomFolder.getFoldersByName(subfolderName);
        if (subfolders.hasNext()) {
          targetFolder = subfolders.next();
        } else {
          targetFolder = rootCustomFolder.createFolder(subfolderName);
        }
      } catch (e) {
        console.warn("Could not retrieve folder by DRIVE_FOLDER_ID: " + e.message);
      }
    }

    // If DRIVE_FOLDER_ID was not set or failed to retrieve, fall back to creating/traversing folders dynamically
    if (!targetFolder) {
      let parentFolder = null;
      if (ss) {
        try {
          const fileId = ss.getId();
          const file = DriveApp.getFileById(fileId);
          const parents = file.getParents();
          if (parents.hasNext()) {
            parentFolder = parents.next();
          }
        } catch (e) {
          console.warn("Could not get parent folder of spreadsheet: " + e.message);
        }
      }

      // Find/create the main folder "Asopalav_Images" inside the parent folder (or root Drive)
      let baseFolder = parentFolder || DriveApp.getRootFolder();
      let mainImagesFolder = null;

      try {
        const mainFolders = baseFolder.getFoldersByName("Asopalav_Images");
        if (mainFolders.hasNext()) {
          mainImagesFolder = mainFolders.next();
        } else {
          mainImagesFolder = baseFolder.createFolder("Asopalav_Images");
        }
      } catch (e) {
        const rootFolder = DriveApp.getRootFolder();
        if (baseFolder !== rootFolder) {
          console.warn("Could not create/get folder in spreadsheet parent, falling back to root Drive: " + e.message);
          try {
            const mainFolders = rootFolder.getFoldersByName("Asopalav_Images");
            if (mainFolders.hasNext()) {
              mainImagesFolder = mainFolders.next();
            } else {
              mainImagesFolder = rootFolder.createFolder("Asopalav_Images");
            }
          } catch (err2) {
            throw new Error("Failed to access DriveApp root: " + err2.message);
          }
        } else {
          throw e;
        }
      }

      // Inside "Asopalav_Images", find or create the subfolder (e.g., "BILL IMAGE")
      try {
        const subfolders = mainImagesFolder.getFoldersByName(folderName || "General");
        if (subfolders.hasNext()) {
          targetFolder = subfolders.next();
        } else {
          targetFolder = mainImagesFolder.createFolder(folderName || "General");
        }
      } catch (e) {
        console.warn("Could not create/get subfolder: " + e.message);
        targetFolder = mainImagesFolder;
      }
    }

    // Create file
    const file = targetFolder.createFile(blob);
    
    // Attempt to make it viewable by anyone with the link
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      // In some strictly-governed Google Workspace domains, open sharing is blocked.
      // We will skip setting sharing but the file remains created and accessible to the owner.
    }

    // Return the direct image hosting link structure requested in the screenshot
    const fileId = file.getId();
    return "https://lh3.google.com/u/0/d/" + fileId;
  } catch (err) {
    // Return an error string or original data on failure to prevent entire form submission failure
    return "Drive Upload Error: " + err.toString();
  }
}

// Edit existing record in "DATA" tab
function handleEditRecord(ss, data) {
  const sheet = ss.getSheetByName("DATA");
  if (!sheet) {
    return { status: "error", message: "DATA sheet tab not found." };
  }
  const voucherNo = String(data.voucherNo || "").trim();
  if (!voucherNo) {
    return { status: "error", message: "Voucher number is required for edit." };
  }

  const values = sheet.getDataRange().getValues();
  let foundRowIdx = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][4]).trim() === voucherNo) {
      foundRowIdx = i + 1; // 1-indexed
      break;
    }
  }

  if (foundRowIdx <= 0) {
    return { status: "error", message: "Record with Voucher No " + voucherNo + " not found." };
  }

  const expenseAmount = parseFloat(data.expenseAmount) || 0;
  const depositedAmount = parseFloat(data.depositedAmount) || 0;
  const existingRow = values[foundRowIdx - 1];
  
  let billImageLink = existingRow[14] || "";
  if (data.billImage && data.billImage.startsWith("data:")) {
    billImageLink = saveImageToDrive(data.billImage, voucherNo + "_bill.png", "BILL IMAGE", ss);
  } else if (data.billImage === "" || data.billImage === null) {
    billImageLink = "";
  }

  let receiptImageLink = existingRow[15] || "";
  if (data.receiptImage && data.receiptImage.startsWith("data:")) {
    receiptImageLink = saveImageToDrive(data.receiptImage, voucherNo + "_receipt.png", "RECEIPT IMAGE", ss);
  } else if (data.receiptImage === "" || data.receiptImage === null) {
    receiptImageLink = "";
  }

  let itemImageLink = existingRow[16] || "";
  if (data.itemImage && data.itemImage.startsWith("data:")) {
    itemImageLink = saveImageToDrive(data.itemImage, voucherNo + "_item.png", "ITEM IMAGE", ss);
  } else if (data.itemImage === "" || data.itemImage === null) {
    itemImageLink = "";
  }

  let securityStampLink = existingRow[17] || "";
  if (data.securityStampImage && data.securityStampImage.startsWith("data:")) {
    securityStampLink = saveImageToDrive(data.securityStampImage, voucherNo + "_stamp.png", "SECURITY IMAGE", ss);
  } else if (data.securityStampImage === "" || data.securityStampImage === null) {
    securityStampLink = "";
  }

  sheet.getRange(foundRowIdx, 2).setValue(data.utrNumber || "");
  sheet.getRange(foundRowIdx, 3).setValue(data.operatorName || "");
  sheet.getRange(foundRowIdx, 4).setValue(data.dateOfExpense || "");
  sheet.getRange(foundRowIdx, 6).setValue(data.employeeName || "");
  sheet.getRange(foundRowIdx, 7).setValue(data.department || "");
  sheet.getRange(foundRowIdx, 8).setValue(data.category || "");
  sheet.getRange(foundRowIdx, 9).setValue(data.vendorName || "");
  sheet.getRange(foundRowIdx, 10).setValue(data.gst || "");
  sheet.getRange(foundRowIdx, 11).setValue(data.paymentMethod || "");
  sheet.getRange(foundRowIdx, 12).setValue(expenseAmount);
  sheet.getRange(foundRowIdx, 13).setValue(depositedAmount);
  sheet.getRange(foundRowIdx, 14).setValue(data.voucherRemarks || "");
  sheet.getRange(foundRowIdx, 15).setValue(billImageLink);
  sheet.getRange(foundRowIdx, 16).setValue(receiptImageLink);
  sheet.getRange(foundRowIdx, 17).setValue(itemImageLink);
  sheet.getRange(foundRowIdx, 18).setValue(securityStampLink);
  sheet.getRange(foundRowIdx, 19).setValue(data.authorisedBy || "");

  return {
    status: "success",
    message: "Record " + voucherNo + " successfully updated!",
    voucherNo: voucherNo
  };
}

// Delete existing record from "DATA" tab
function handleDeleteRecord(ss, data) {
  const sheet = ss.getSheetByName("DATA");
  if (!sheet) {
    return { status: "error", message: "DATA sheet tab not found." };
  }
  const voucherNo = String(data.voucherNo || "").trim();
  if (!voucherNo) {
    return { status: "error", message: "Voucher number is required for deletion." };
  }

  const values = sheet.getDataRange().getValues();
  let foundRowIdx = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][4]).trim() === voucherNo) {
      foundRowIdx = i + 1; // 1-indexed
      break;
    }
  }

  if (foundRowIdx > 0) {
    sheet.deleteRow(foundRowIdx);
    return {
      status: "success",
      message: "Record " + voucherNo + " successfully deleted!"
    };
  } else {
    return { status: "error", message: "Record with Voucher No " + voucherNo + " not found." };
  }
}


