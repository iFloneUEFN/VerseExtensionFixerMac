"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));
var os = __toESM(require("os"));
var path = __toESM(require("path"));
var import_child_process = require("child_process");
var rf = __toESM(require("fs"));
var fs = __toESM(require("fs/promises"));
async function activate(context) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const platform2 = os.platform();
  if (platform2 !== "darwin") {
    vscode.window.showErrorMessage("This extension is only supported on Mac OS.");
    return;
  }
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return;
  }
  const folder = workspaceFolders[0];
  const folderUri = folder.uri.fsPath;
  const userHome = require("os").homedir();
  const basePath = path.join(userHome, "Documents", "Fortnite Projects");
  if (folderUri.startsWith(basePath)) {
    const bottleName = vscode.workspace.getConfiguration("versePathFixer").get("bottleName");
    const fixVerseButton = vscode.workspace.getConfiguration("versePathFixer").get("fixVerseButtonInUEFN");
    if (fixVerseButton) {
      await setupFileMonitor();
    }
    if (!bottleName || bottleName.trim() === "") {
      vscode.window.showErrorMessage("Please enter your bottle name in the settings then restart Visual Studio Code.");
      return;
    }
    const relativePath = folderUri.replace(basePath, "");
    const projectName = relativePath.split(path.sep)[1];
    if (projectName) {
      const workspaceFilePath = path.join(basePath, projectName, "Plugins", projectName, `${projectName}.code-workspace`);
      try {
        const document = await vscode.workspace.openTextDocument(workspaceFilePath);
        const username = os.userInfo().username;
        const vprojectFileName = `${projectName}.vproject`;
        const vprojectPath = path.join(`/Users/${username}/Library/Application Support/CrossOver/Bottles/${bottleName}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${projectName}/vproject/${vprojectFileName}`);
        const fileContent = await fs.readFile(vprojectPath, "utf-8");
        let vprojectData = JSON.parse(fileContent);
        vprojectData.packages.forEach((pkg) => {
          if (pkg.desc && pkg.desc.dirPath) {
            if (pkg.desc.dirPath.startsWith("C:/users/crossover/Documents/") || pkg.desc.dirPath.startsWith("C:/users/crossover/")) {
              fixUrcAndVerseExtensions();
              modifyWorkspaceFile(document);
              return;
            }
          }
        });
        const workspacePathName = `FortniteGame.code-workspace`;
        const workspacePath = path.join(`/Users/${username}/Library/Application Support/CrossOver/Bottles/${bottleName}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${workspacePathName}`);
        const fileContentWS = await fs.readFile(workspacePath, "utf-8");
        let workspaceData = JSON.parse(fileContentWS);
        const oldBasePath = `C:/users/`;
        if (Array.isArray(workspaceData.folders)) {
          workspaceData.folders.forEach((folder2) => {
            if (folder2.path && folder2.path.startsWith(oldBasePath)) {
              fixUrcAndVerseExtensions();
              modifyWorkspaceFile(document);
              return;
            }
          });
        }
        const oldBasePathFirst = `C:/users/crossover/AppData/`;
        const oldBasePathSecond = `C:/users/crossover/Documents/`;
        const text = document.getText();
        let jsonData;
        try {
          jsonData = JSON.parse(text);
        } catch (error) {
          vscode.window.showErrorMessage("Error parsing the workspace file as JSON, make sure it's valid.");
          return;
        }
        for (const folder2 of jsonData.folders) {
          if (folder2.path && (folder2.path.startsWith(oldBasePathFirst) || folder2.path.startsWith(oldBasePathSecond))) {
            fixUrcAndVerseExtensions();
            modifyWorkspaceFile(document);
            return;
          }
        }
      } catch (err) {
        vscode.window.showErrorMessage(`Unknown Error: ${err}`);
      }
    }
  }
  return;
}
async function modifyWorkspaceFile(document) {
  const username = os.userInfo().username;
  const bottleName = vscode.workspace.getConfiguration("versePathFixer").get("bottleName");
  const removeColorTheme = vscode.workspace.getConfiguration("versePathFixer").get("removeVerseDefaultTheme");
  if (!bottleName || bottleName.trim() === "") {
    vscode.window.showErrorMessage("Please enter your bottle name in the settings then restart Visual Studio Code.");
    return;
  }
  if (removeColorTheme) {
    if (document) {
      const text2 = document.getText();
      let jsonData2;
      try {
        jsonData2 = JSON.parse(text2);
      } catch (error) {
        vscode.window.showErrorMessage("Error parsing the workspace file as JSON.");
        return;
      }
      if (jsonData2.settings && jsonData2.settings["workbench.colorTheme"]) {
        try {
          delete jsonData2.settings["workbench.colorTheme"];
          const modifiedText = JSON.stringify(jsonData2, null, 4);
          const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(text2.length)
          );
          const edit = new vscode.WorkspaceEdit();
          edit.replace(document.uri, fullRange, modifiedText);
          await vscode.workspace.applyEdit(edit);
          vscode.window.showInformationMessage("Removed verse default theme.");
        } catch (error) {
          vscode.window.showErrorMessage("Error while removing the color theme: " + error);
        }
      }
    } else {
      return vscode.window.showErrorMessage("No valid workspace found, please try again.");
    }
  } else {
    if (document) {
      const text2 = document.getText();
      let jsonData2;
      try {
        jsonData2 = JSON.parse(text2);
      } catch (error) {
        vscode.window.showErrorMessage("Error parsing the workspace file as JSON.");
        return;
      }
      if (!jsonData2.settings) {
        jsonData2.settings = {};
      }
      jsonData2.settings["workbench.colorTheme"] = "Verse (Dark)";
      const modifiedText = JSON.stringify(jsonData2, null, 4);
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(text2.length)
      );
      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, fullRange, modifiedText);
      await vscode.workspace.applyEdit(edit);
      vscode.window.showInformationMessage("Set color theme to Verse (Dark).");
    } else {
      return vscode.window.showErrorMessage("No valid workspace found, please try again.");
    }
  }
  const text = document.getText();
  let jsonData;
  try {
    jsonData = JSON.parse(text);
  } catch (error) {
    vscode.window.showErrorMessage("Error parsing the workspace file as JSON.");
    return;
  }
  if (Array.isArray(jsonData.folders) && jsonData.folders.length > 0) {
    const projectName = jsonData.folders[0].name;
    const excludedNames = ["Verse", "UnrealEngine", "Fortnite", "vproject - DO NOT MODIFY"];
    if (!projectName || excludedNames.includes(projectName)) {
      vscode.window.showErrorMessage("Please select a valid workspace, one from your ./Fortnite Projects folder.");
      return;
    }
    const pathMappings = {
      "Fortnite": `/Users/${username}/Library/Application Support/CrossOver/Bottles/${bottleName}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${projectName}/Fortnite`,
      [`${projectName}/Assets`]: `/Users/${username}/Library/Application Support/CrossOver/Bottles/${bottleName}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${projectName}/${projectName}-Assets`,
      [`${projectName}`]: `/Users/${username}/Documents/Fortnite Projects/${projectName}/Plugins/${projectName}/Content`,
      "UnrealEngine": `/Users/${username}/Library/Application Support/CrossOver/Bottles/${bottleName}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${projectName}/UnrealEngine`,
      "Verse": `/Users/${username}/Library/Application Support/CrossOver/Bottles/${bottleName}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${projectName}/Verse`,
      "vproject - DO NOT MODIFY": `/Users/${username}/Library/Application Support/CrossOver/Bottles/${bottleName}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${projectName}/vproject`
    };
    const edits = [];
    for (const folder of jsonData.folders) {
      const folderName = folder.name;
      console.log(`${folderName}`);
      const newPath = pathMappings[folderName];
      if (newPath) {
        folder.path = newPath;
      } else {
        console.log(`No mapping found for: ${folderName}`);
      }
    }
    const modifiedText = JSON.stringify(jsonData, null, 4);
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(text.length)
    );
    edits.push(vscode.TextEdit.replace(fullRange, modifiedText));
    const edit = new vscode.WorkspaceEdit();
    edit.set(document.uri, edits);
    await vscode.workspace.applyEdit(edit);
    try {
      await modifyProjectVProjectFile(username, bottleName, projectName);
    } catch (error) {
      vscode.window.showErrorMessage(`Error modifying VProject file: ${error instanceof Error ? error.message : String(error)}`);
    }
    try {
      await modifyFortniteGameWorkspaceFile(username, bottleName);
    } catch (error) {
      vscode.window.showErrorMessage(`Error modifying FortniteGame workspace file: ${error instanceof Error ? error.message : String(error)}`);
    }
    vscode.window.showInformationMessage(`Updated paths in ${document.fileName}`);
    console.log("Workspace file paths updated.");
    await vscode.commands.executeCommand("workbench.action.reloadWindow");
  }
}
async function modifyProjectVProjectFile(username, bottleName, projectName) {
  const vprojectFileName = `${projectName}.vproject`;
  const vprojectPath = path.join(
    `/Users/${username}/Library/Application Support/CrossOver/Bottles/${bottleName}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${projectName}/vproject/${vprojectFileName}`
  );
  try {
    const fileContent = await fs.readFile(vprojectPath, "utf-8");
    let vprojectData = JSON.parse(fileContent);
    const normalizedBasePath = `/Users/${username}/Library/Application Support/CrossOver/Bottles/${bottleName}/drive_c/users/crossover`;
    vprojectData.packages.forEach((pkg) => {
      if (pkg.desc && pkg.desc.dirPath) {
        if (pkg.desc.dirPath.startsWith("C:/users/crossover/Documents/")) {
          pkg.desc.dirPath = pkg.desc.dirPath.replace("C:/users/crossover/Documents/", `/Users/${username}/Documents/`);
        } else if (pkg.desc.dirPath.startsWith("C:/users/crossover/")) {
          pkg.desc.dirPath = pkg.desc.dirPath.replace("C:/users/crossover/", `${normalizedBasePath}/`);
        }
      }
    });
    await fs.writeFile(vprojectPath, JSON.stringify(vprojectData, null, 4));
    vscode.window.showInformationMessage(`Updated ${vprojectFileName} file at ${vprojectPath}`);
  } catch (error) {
    vscode.window.showErrorMessage(`Error modifying ${vprojectFileName} file: ${error instanceof Error ? error.message : String(error)}`);
  }
}
async function modifyFortniteGameWorkspaceFile(username, bottleName) {
  const workspacePathName = `FortniteGame.code-workspace`;
  const workspacePath = path.join(
    `/Users/${username}/Library/Application Support/CrossOver/Bottles/${bottleName}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${workspacePathName}`
  );
  try {
    const fileContent = await fs.readFile(workspacePath, "utf-8");
    let workspaceData = JSON.parse(fileContent);
    const oldBasePath = `C:/users/`;
    if (Array.isArray(workspaceData.folders)) {
      workspaceData.folders.forEach((folder) => {
        if (folder.path && folder.path.startsWith(oldBasePath)) {
          const normalizedBasePath = `/Users/${username}/Library/Application Support/CrossOver/Bottles/${bottleName}/drive_c/users/crossover`;
          const pathPrefix = folder.path.startsWith("C:/users/crossover") ? "C:/users/crossover" : "C:/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject";
          folder.path = folder.path.replace(pathPrefix, normalizedBasePath);
        }
      });
    }
    await fs.writeFile(workspacePath, JSON.stringify(workspaceData, null, 4));
    vscode.window.showInformationMessage(`Updated FortniteGame.code-workspace at ${workspacePath}`);
  } catch (error) {
    vscode.window.showErrorMessage(`Error modifying FortniteGame.code-workspace: ${error instanceof Error ? error.message : String(error)}`);
  }
}
async function fixUrcAndVerseExtensions() {
  const username = os.userInfo().username;
  const bottleName = vscode.workspace.getConfiguration("versePathFixer").get("bottleName");
  if (!bottleName || bottleName.trim() === "") {
    vscode.window.showErrorMessage("Please enter your bottle name in the settings then restart Visual Studio Code.");
    return;
  }
  const extensionsPath = path.join(`/Users/${username}/.vscode/extensions/`);
  try {
    const entries = await fs.readdir(extensionsPath, { withFileTypes: true });
    const urcExtensions = entries.filter((entry) => entry.isDirectory() && entry.name.startsWith("epicgames.urc")).map((entry) => path.join(extensionsPath, entry.name));
    const verseExtensions = entries.filter((entry) => entry.isDirectory() && entry.name.startsWith("epicgames.verse")).map((entry) => path.join(extensionsPath, entry.name));
    const verseExtensionJs = path.join(verseExtensions[0], "/out/extension.js");
    try {
      let content = await fs.readFile(verseExtensionJs, "utf-8");
      const lineToCheck = "fs.chmodSync(serverExecutable, '755');";
      const lineToInsert = `		${lineToCheck}`;
      const copyFileLine = "fs.copyFileSync(defaultServerExecutable, serverExecutable);";
      if (!content.includes(lineToCheck)) {
        const insertPosition = content.indexOf(copyFileLine);
        if (insertPosition !== -1) {
          const newContent = content.slice(0, insertPosition + copyFileLine.length) + `
${lineToInsert}
` + content.slice(insertPosition + copyFileLine.length);
          await fs.writeFile(verseExtensionJs, newContent, "utf-8");
        }
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error modifying the file: ${error}`);
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Error reading extensions directory: ${error}`);
  }
}
async function createVSCodeFolder() {
  const username = os.userInfo().username;
  const baseDir = path.join("/Users", username, "Library", "Application Support", "CrossOver", "Bottles", "Unreal Editor Fortnite", "drive_c", "Program Files");
  const vscodeDir = path.join(baseDir, "Microsoft VS Code");
  const binDir = path.join(vscodeDir, "bin");
  const cmdFilePath = path.join(binDir, "code.cmd");
  if (!rf.existsSync(vscodeDir)) {
    rf.mkdirSync(vscodeDir, { recursive: true });
  }
  if (!rf.existsSync(binDir)) {
    rf.mkdirSync(binDir, { recursive: true });
  }
  if (!rf.existsSync(cmdFilePath)) {
    const cmdContent = `@echo off
rem Create a trigger file
echo "" > /Users/${username}/trigger_open_vscode.txt`;
    rf.writeFileSync(cmdFilePath, cmdContent);
  }
}
async function setupFileMonitor() {
  const scriptName = "VerseMonitor.scpt";
  const appName = "VerseMonitor.app";
  const plistName = "com.iflone.versemonitor.plist";
  const userHome = process.env.HOME || "";
  const username = os.userInfo().username;
  const bottleName = vscode.workspace.getConfiguration("versePathFixer").get("bottleName");
  const scriptDestination = path.join("Applications", scriptName);
  const appDestination = path.join("Applications", appName);
  const plistPath = path.join(userHome, "Library", "LaunchAgents", plistName);
  const appSupportDir = path.dirname(scriptDestination);
  if (!rf.existsSync(appSupportDir)) {
    rf.mkdirSync(appSupportDir, { recursive: true });
  }
  if (rf.existsSync(plistPath) && rf.existsSync(appDestination)) {
    return;
  }
  await createVSCodeFolder();
  const appleScriptContent = `  
on idle
	set triggerFile to "/Users/${username}/trigger_open_vscode.txt"
	if (do shell script "test -e " & quoted form of triggerFile & " && echo true || echo false") is "true" then
		set USERNAME to do shell script "whoami"
		set bottleName to "${bottleName}"
		set PROJECTS_DIR to "/Users/" & USERNAME & "/Library/Application Support/CrossOver/Bottles/" & bottleName & "/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/Config/WindowsEditor/VK_Projects"
		set LATEST_INI_FILE to (do shell script "ls -t " & quoted form of PROJECTS_DIR & "/*.ini 2>/dev/null | head -n 1")
		if LATEST_INI_FILE is "" then
			do shell script "echo 'No .ini files found.' >> ~/debug.log"
			return
		end if
		set PROJECT_NAME to do shell script "awk -F'=' '/LastMap=/{print $2}' " & quoted form of LATEST_INI_FILE
		if PROJECT_NAME is "" then
			do shell script "echo 'No LastMap found in INI file.' >> ~/debug.log"
			return
		end if
		set PROJECT_NAME to do shell script "echo " & quoted form of PROJECT_NAME & " | awk -F'/' '{print $NF}'"
		set FORTNITE_PROJECTS_DIR to "/Users/" & USERNAME & "/Documents/Fortnite Projects"
		set WORKSPACE_FILE to FORTNITE_PROJECTS_DIR & "/" & PROJECT_NAME & "/Plugins/" & PROJECT_NAME & "/" & PROJECT_NAME & ".code-workspace"
		try
			set workspaceExists to (do shell script "test -f " & quoted form of WORKSPACE_FILE & " && echo true || echo false")
		on error
			do shell script "echo 'Error checking workspace file.' >> ~/debug.log"
			return
		end try

		if workspaceExists is "false" then
			do shell script "echo 'Workspace file does not exist.' >> ~/debug.log"
			return
		end if
		do shell script "/opt/homebrew/bin/code " & quoted form of WORKSPACE_FILE
        tell application "System Events" to set visible of process "VerseMonitor" to false
		do shell script "rm " & quoted form of triggerFile
	end if
	return 1
end idle
    `;
  rf.writeFileSync(scriptDestination, appleScriptContent, "utf8");
  await compileScript(scriptDestination, appDestination);
  if (rf.existsSync(scriptDestination)) {
    rf.unlinkSync(scriptDestination);
  }
  createLaunchAgent(plistPath);
  (0, import_child_process.exec)(`launchctl enable user/501/~/Library/LaunchAgents/com.iflone.versemonitor.plist`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error enabling LaunchAgent: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
  });
  (0, import_child_process.exec)(`launchctl bootout gui/501 ~/Library/LaunchAgents/com.iflone.versemonitor.plist`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error bootout LaunchAgent: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
  });
  (0, import_child_process.exec)(`launchctl load -w ${plistPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error loading LaunchAgent: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
  });
}
function compileScript(scriptPath, appPath) {
  return new Promise((resolve, reject) => {
    const command = `osacompile -o ${appPath} -s ${scriptPath}`;
    (0, import_child_process.exec)(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error compiling script: ${stderr}`);
        reject(error);
      } else {
        console.log(`Successfully compiled script to app: ${stdout}`);
        resolve(stdout);
      }
    });
  });
}
function createLaunchAgent(plistPath) {
  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${path.basename(plistPath)}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Applications/VerseMonitor.app/Contents/MacOS/applet</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
`;
  rf.writeFileSync(plistPath, plistContent, "utf8");
  console.log(`Created LaunchAgent at ${plistPath}`);
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
