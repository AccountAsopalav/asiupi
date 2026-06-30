import React, { useState } from "react";
import { Copy, Check, ExternalLink, Settings, Info, Play, ChevronDown, ChevronUp } from "lucide-react";
import asopalavLogoUrl from "../assets/images/regenerated_image_1782658387597.png";

interface SetupModalProps {
  currentUrl: string;
  onSave: (url: string) => void;
  isOpen: boolean;
  onClose?: () => void;
  canClose: boolean;
}

export default function SetupModal({ currentUrl, onSave, isOpen, onClose, canClose }: SetupModalProps) {
  const [url, setUrl] = useState(currentUrl);
  const [copied, setCopied] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSave(url.trim());
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const appsScriptCode = `/**
 * Google Apps Script for AsoPalav Income & Expense Tracker
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Sheet (ID: 1aasOjbC_eo7-Amg-6daAsERtj7JM0GSGit3x9Z2IiZo)
 * 2. Click on "Extensions" > "Apps Script"
 * 3. Delete any default code and paste this script
 * 4. IMPORTANT FOR GOOGLE DRIVE UPLOADS:
 *    To authorize Google Drive permissions:
 *    - In the toolbar at the top of Apps Script, select "triggerAuthorizationRequest" from the dropdown next to Debug/Run.
 *    - Click "Run" (the Play icon).
 *    - Click "Review Permissions" in the popup.
 *    - Choose your Google Account, click "Advanced", then "Go to Untitled project (unsafe)", and click "Allow".
 *    - IF YOU ARE STILL GETTING PERMISSION ERRORS: You must DEPLOY A NEW VERSION (Deploy > New deployment) after authorizing!
 * 5. Click "Deploy" (top right) > "New deployment"
 * 6. Select Type: "Web app" (click gear icon next to "Select type" if needed)
 * 7. Set "Execute as": "Me"
 * 8. Set "Who has access": "Anyone"
 * 9. Click "Deploy", authorize if prompted, and COPY the Web app URL
 * 10. Paste the Web App URL into the setup screen!
 */

const SPREADSHEET_ID = "1aasOjbC_eo7-Amg-6daAsERtj7JM0GSGit3x9Z2IiZo";

// DUMMY FUNCTION TO FORCE GOOGLE DRIVE AUTHORIZATION PROMPT WITH FULL SCOPES
// Select this function from the top dropdown and click Run to authorize Google Drive
function triggerAuthorizationRequest() {
  Logger.log("Triggering Google Drive and Sheets authorization...");
  try {
    // FORCE FULL GOOGLE DRIVE PERMISSION SCOPES (https://www.googleapis.com/auth/drive) BY WRITING TO DRIVE
    Logger.log("Testing drive write authorization...");
    const tempFolder = DriveApp.createFolder("AsoPalav_Permission_Trigger_Temp_" + Math.floor(Math.random() * 1000));
    Logger.log("Successfully created temp folder for verification!");
    tempFolder.setTrashed(true); // Delete it immediately to keep Drive clean
    Logger.log("Temp folder cleaned up successfully.");

    // Explicitly call a folder creation check to trigger full Google Drive (https://www.googleapis.com/auth/drive) scope request
    const root = DriveApp.getRootFolder();
    Logger.log("Authorized root folder: " + root.getName());
    
    // Test folder access/creation list
    const testFolders = root.getFoldersByName("Asopalav_Images");
    if (testFolders.hasNext()) {
      Logger.log("Authorized Asopalav_Images access!");
    }
    
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
  } catch (e) {}
  return SpreadsheetApp.getActiveSpreadsheet();
}

function doGet(e) {
  const action = e.parameter.action;
  let result;
  try {
    const ss = getSpreadsheet();
    if (action === "getData") {
      result = fetchAllData(ss);
    } else if (action === "getSettings") {
      result = fetchSettings(ss);
    } else if (action === "login") {
      result = performLogin(ss, e.parameter.username, e.parameter.password);
    } else if (action === "addRecordGet") {
      result = handleAddRecord(ss, e.parameter);
    } else if (action === "saveUserGet") {
      result = handleSaveUser(ss, e.parameter);
    } else if (action === "deleteUserGet") {
      result = handleDeleteUser(ss, e.parameter);
    } else {
      result = { status: "error", message: "Unknown GET action" };
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let result;
  try {
    const ss = getSpreadsheet();
    let payload = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : e.parameter;
    const action = payload.action;
    if (action === "addRecord" || !action) {
      result = handleAddRecord(ss, payload);
    } else if (action === "login") {
      result = performLogin(ss, payload.username, payload.password);
    } else if (action === "saveUser") {
      result = handleSaveUser(ss, payload);
    } else if (action === "deleteUser") {
      result = handleDeleteUser(ss, payload);
    } else {
      result = { status: "error", message: "Unknown POST action" };
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function performLogin(ss, username, password) {
  const sheet = ss.getSheetByName("USERS");
  if (!sheet) return { status: "error", message: "USERS sheet tab not found." };
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[1]).trim().toLowerCase() === String(username).trim().toLowerCase() && String(row[2]).trim() === String(password).trim()) {
      return {
        status: "success",
        user: {
          no: row[0],
          username: row[1],
          name: row[3],
          designation: row[4],
          role: row[5],
          department: row[6],
          pages: row[7] ? String(row[7]).split(",").map(function(p) { return p.trim(); }) : ["Dashboard", "Form", "Voucher"]
        }
      };
    }
  }
  return { status: "error", message: "Invalid username or password." };
}

function fetchSettings(ss) {
  const sheet = ss.getSheetByName("SETTINGS");
  if (!sheet) return { employees: [], departments: [], categories: [], angadias: [], gstOptions: [], paymentMethods: [] };
  const values = sheet.getDataRange().getValues();
  const employees = [], departments = [], categories = [], angadias = [], gstOptions = [], paymentMethods = [];
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
    employees: employees,
    departments: departments,
    categories: categories,
    angadias: angadias,
    gstOptions: gstOptions,
    paymentMethods: paymentMethods
  };
}

function fetchAllData(ss) {
  const settings = fetchSettings(ss);
  const dataSheet = ss.getSheetByName("DATA");
  const records = [];
  let nextVoucherNo = 1001;
  if (dataSheet) {
    const values = dataSheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      const r = values[i];
      const vNoStr = String(r[4] || "").replace(/\\D/g, "");
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

function handleAddRecord(ss, data) {
  const sheet = ss.getSheetByName("DATA");
  if (!sheet) return { status: "error", message: "DATA sheet tab not found." };
  let voucherNo = data.voucherNo;
  if (!voucherNo || voucherNo === "AUTO") {
    let maxVNo = 1000;
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      const vNoStr = String(values[i][4] || "").replace(/\\D/g, "");
      if (vNoStr) {
        const vNum = parseInt(vNoStr, 10);
        if (!isNaN(vNum) && vNum > maxVNo) maxVNo = vNum;
      }
    }
    voucherNo = "AP-" + (maxVNo + 1);
  }
  const timestamp = new Date();
  const expenseAmount = parseFloat(data.expenseAmount) || 0;
  const depositedAmount = parseFloat(data.depositedAmount) || 0;

  const billImageLink = saveImageToDrive(data.billImage, voucherNo + "_bill.png", "BILL IMAGE", ss);
  const receiptImageLink = saveImageToDrive(data.receiptImage, voucherNo + "_receipt.png", "RECEIPT IMAGE", ss);
  const itemImageLink = saveImageToDrive(data.itemImage, voucherNo + "_item.png", "ITEM IMAGE", ss);
  const securityStampLink = saveImageToDrive(data.securityStampImage, voucherNo + "_stamp.png", "SECURITY IMAGE", ss);

  const newRow = [
    timestamp,
    data.utrNumber || "",
    data.operatorName || "",
    data.dateOfExpense || "",
    voucherNo,
    data.employeeName || "",
    data.department || "",
    data.category || "",
    data.vendorName || "",
    data.gst || "",
    data.paymentMethod || "",
    expenseAmount,
    depositedAmount,
    data.voucherRemarks || "",
    billImageLink,
    receiptImageLink,
    itemImageLink,
    securityStampLink,
    data.authorisedBy || ""
  ];
  sheet.appendRow(newRow);
  return {
    status: "success",
    message: "Record successfully saved to Google Sheets!",
    voucherNo: voucherNo,
    timestamp: timestamp.toISOString()
  };
}

function handleSaveUser(ss, data) {
  const sheet = ss.getSheetByName("USERS");
  if (!sheet) return { status: "error", message: "USERS sheet tab not found." };
  const values = sheet.getDataRange().getValues();
  const username = String(data.username || "").trim().toLowerCase();
  if (!username) return { status: "error", message: "Username is required." };
  let foundRowIdx = -1;
  const userNoInput = data.no ? parseInt(data.no, 10) : null;
  for (let i = 1; i < values.length; i++) {
    const rowNo = parseInt(values[i][0], 10);
    const rowUsername = String(values[i][1]).trim().toLowerCase();
    if ((userNoInput && rowNo === userNoInput) || rowUsername === username) {
      foundRowIdx = i + 1;
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
    return { status: "success", message: "User " + name + " updated successfully!" };
  } else {
    let maxId = 0;
    for (let i = 1; i < values.length; i++) {
      const valId = parseInt(values[i][0], 10);
      if (!isNaN(valId) && valId > maxId) maxId = valId;
    }
    const newId = maxId + 1;
    if (!password) return { status: "error", message: "Password is required for new users." };
    sheet.appendRow([newId, username, password, name, designation, role, department, pages]);
    return { status: "success", message: "User " + name + " created successfully!" };
  }
}

function handleDeleteUser(ss, data) {
  const sheet = ss.getSheetByName("USERS");
  if (!sheet) return { status: "error", message: "USERS sheet tab not found." };
  const values = sheet.getDataRange().getValues();
  const userNoInput = data.no ? parseInt(data.no, 10) : null;
  const username = String(data.username || "").trim().toLowerCase();
  for (let i = 1; i < values.length; i++) {
    const rowNo = parseInt(values[i][0], 10);
    const rowUsername = String(values[i][1]).trim().toLowerCase();
    if ((userNoInput && rowNo === userNoInput) || (username && rowUsername === username)) {
      sheet.deleteRow(i + 1);
      return { status: "success", message: "User deleted successfully!" };
    }
  }
  return { status: "error", message: "User not found." };
}

function saveImageToDrive(base64Data, filename, folderName, ss) {
  if (!base64Data || !String(base64Data).startsWith("data:image/")) return base64Data || "";
  try {
    const parts = base64Data.split(",");
    const metadata = parts[0];
    const base64Content = parts[1];
    let mimeType = "image/png";
    const mimeMatch = metadata.match(/data:(.*?);/);
    if (mimeMatch) mimeType = mimeMatch[1];
    const decoded = Utilities.base64Decode(base64Content);
    const blob = Utilities.newBlob(decoded, mimeType, filename);

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
    let targetFolder = null;
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

    const file = targetFolder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {}
    return file.getUrl();
  } catch (err) {
    return "Drive Upload Error: " + err.toString();
  }
}
`;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
      <div className="bg-white rounded border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-indigo-950 px-6 py-4 flex items-center justify-between text-white border-b border-indigo-900">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-indigo-400" id="setup-header-icon" />
            <div>
              <h2 className="text-sm font-black tracking-wider uppercase">Google Sheets Pipeline Setup</h2>
              <p className="text-xs text-indigo-300">Synchronize your transaction logs directly to Google Sheet</p>
            </div>
          </div>
          {canClose && onClose && (
            <button 
              onClick={onClose}
              className="text-indigo-200 hover:text-white transition-colors border border-indigo-800 hover:bg-white/10 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider"
              id="close-setup-btn"
            >
              Close
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Google Apps Script Web App URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  required
                  className="flex-1 px-4 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs placeholder-slate-400 bg-slate-50 focus:bg-white font-mono"
                  id="web-app-url-input"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold text-xs uppercase tracking-wider shadow transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  id="save-url-btn"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Connect
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-semibold leading-normal">
                <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                This URL connects your tracking dashboard to Google Sheet ID: <code className="font-mono bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-[10px]">1aasOjbC_eo7-Amg-6daAsERtj7JM0GSGit3x9Z2IiZo</code>
              </p>
            </div>
          </form>

          {/* Quick instructions toggle */}
          <div className="border border-slate-200 rounded bg-slate-50 overflow-hidden">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex justify-between items-center px-4 py-3 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs uppercase tracking-wider border-b border-slate-200 transition-colors cursor-pointer"
              id="toggle-instructions-btn"
            >
              <span className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 bg-indigo-100 text-indigo-800 rounded font-mono text-xs">?</span>
                How to setup your Google Apps Script (3 Minutes)
              </span>
              {showInstructions ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {showInstructions && (
              <div className="p-5 space-y-4 text-slate-600 text-xs leading-relaxed max-h-[300px] overflow-y-auto">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                    <span>1.</span> Open your Google Sheets Dashboard
                  </h4>
                  <p className="mb-2">
                    Open your browser to the Google Sheet with ID:
                  </p>
                  <div className="flex items-center justify-between bg-white border border-slate-200 px-3 py-1.5 rounded mb-2">
                    <code className="font-mono text-slate-800 text-[10px]">1aasOjbC_eo7-Amg-6daAsERtj7JM0GSGit3x9Z2IiZo</code>
                    <button
                      onClick={() => copyToClipboard("1aasOjbC_eo7-Amg-6daAsERtj7JM0GSGit3x9Z2IiZo", "sheetId")}
                      className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                    >
                      {copied === "sheetId" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="font-bold text-[10px]">{copied === "sheetId" ? "Copied" : "Copy ID"}</span>
                    </button>
                  </div>
                  <a
                    href="https://docs.google.com/spreadsheets/d/1aasOjbC_eo7-Amg-6daAsERtj7JM0GSGit3x9Z2IiZo/edit"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-bold mb-1"
                  >
                    Open Google Sheet in new tab <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <hr className="border-slate-200" />

                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-1.5 uppercase tracking-wide">
                    <span>2.</span> Add the Google Apps Script
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>Go to <b>Extensions &gt; Apps Script</b> in the top sheet menu.</li>
                    <li>Delete any existing boilerplates in the editor.</li>
                    <li>Copy and paste the code from below:</li>
                  </ul>

                  <div className="relative border border-slate-200 rounded overflow-hidden bg-slate-900 text-slate-200">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 text-slate-400 border-b border-slate-700 text-[10px]">
                      <span>CODE.GS (Google Apps Script)</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(appsScriptCode, "code")}
                        className="hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copied === "code" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="font-bold text-[10px]">{copied === "code" ? "Copied" : "Copy Script"}</span>
                      </button>
                    </div>
                    <pre className="p-3 font-mono text-[9px] max-h-[120px] overflow-y-auto select-all leading-normal">
                      {appsScriptCode}
                    </pre>
                  </div>
                </div>

                <hr className="border-slate-200" />

                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-1.5 uppercase tracking-wide">
                    <span>3.</span> Deploy as a Web App
                  </h4>
                  <ol className="list-decimal pl-5 space-y-1 mb-4">
                    <li>Click on <b>Deploy</b> button (top right) and select <b>New deployment</b>.</li>
                    <li>Click the <b>Gear icon</b> next to "Select type" and choose <b>Web app</b>.</li>
                    <li>Set <b>Description</b> to: <code className="bg-white px-1 border border-slate-200 rounded">AsoPalav Tracker</code></li>
                    <li>Set <b>Execute as</b> to: <span className="font-bold text-slate-800">Me (your-email)</span></li>
                    <li>Set <b>Who has access</b> to: <span className="font-bold text-indigo-600">Anyone</span> (Crucial so this web app can save data!)</li>
                    <li>Click <b>Deploy</b>. Google will request you to authorize permissions - click "Authorize Access", select your Google account, click "Advanced", then click "Go to AsoPalav Tracker (unsafe)" and confirm.</li>
                    <li>Copy the generated <b>Web app URL</b> from the confirmation screen, paste it into the form above, and click <b>Connect</b>!</li>
                  </ol>

                  {/* Troubleshooting block */}
                  <div className="bg-amber-50 border border-amber-200 rounded p-4.5 space-y-2 text-amber-900">
                    <h5 className="font-bold text-[11px] text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      ⚠️ Still Getting Drive Permission Errors?
                    </h5>
                    <p className="text-[11px] leading-relaxed font-medium">
                      If you see an error like <code className="bg-white px-1 text-rose-700 border border-rose-100 rounded text-[10px]">You do not have permission to call DriveApp</code>, it means you have updated your code but your deployed Web App is still running with the old permissions.
                    </p>
                    <p className="text-[11px] font-bold">Follow these 2 steps to fix it instantly:</p>
                    <ol className="list-decimal pl-5 text-[11px] space-y-1">
                      <li>
                        <b>Authorize Drive:</b> At the top of your Apps Script editor, look at the dropdown next to "Debug" and select <span className="font-mono bg-white px-1 border rounded text-indigo-700">triggerAuthorizationRequest</span>, then click <b>Run</b> (Play icon). Follow the prompt to sign in and click <b>Allow</b>.
                      </li>
                      <li>
                        <b>Publish the update:</b> Once authorized, click <b>Deploy &gt; New deployment</b>, select <b>Web app</b>, change description to <span className="font-semibold">"Drive Fixed"</span>, make sure access is <b>"Anyone"</b>, and click <b>Deploy</b>. Copy the <b>NEW Web App URL</b> and paste it above!
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wide">
          <div className="flex items-center gap-1.5 h-6">
            <img 
              src={asopalavLogoUrl} 
              alt="AsōPalav Brand Logo" 
              className="h-full object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono select-none">Finance Portal</span>
          </div>
          {!canClose && (
            <span className="text-amber-600 font-bold flex items-center gap-1 bg-amber-50 border border-amber-200/50 px-2.5 py-1 rounded">
              ⚠️ Connection Required to Sync Data
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
