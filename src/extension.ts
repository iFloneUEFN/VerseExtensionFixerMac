import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import {exec, execSync} from "child_process";
import * as rf from 'fs';
import * as fs from 'fs/promises';
interface PackageSettings {
    versePath: string;
    verseScope: string;
    role: string;
    verseVersion: number;
    dependencyPackages: string[];
    treatModulesAsImplicit?: boolean;
    allowExperimental: boolean;
}
interface PackageDesc {
    name: string;
    dirPath: string;
    settings: PackageSettings;
}
interface VProjectPackage {
    desc: PackageDesc;
    readOnly: boolean;
}
interface VProjectData {
    packages: VProjectPackage[];
}
interface WorkspaceFolder {
    name: string;
    path: string;
}
interface WorkspaceData {
    folders: WorkspaceFolder[];
    settings?: any;
}
// Global bottle name instead of the manual one
let bottleNameGlobal: string | undefined;

// Auto detect the bottle name
async function detectBottleName(context: vscode.ExtensionContext): Promise<string | undefined> {
    const stored = context.globalState.get<string>('detectedBottle');
    const baseDir = path.join(os.homedir(), 'Library', 'Application Support', 'CrossOver', 'Bottles');
    const isValidBottle = (name: string): boolean => {
        const driveC = path.join(baseDir, name, 'drive_c');
        const possiblePaths = [
            path.join(driveC, 'Program Files', 'Epic Games', 'Fortnite'),
            path.join(driveC, 'Program Files (x86)', 'Epic Games', 'Fortnite'),
        ];
        return possiblePaths.some(p => rf.existsSync(p));
    };

    if (stored && isValidBottle(stored)) {
        return stored;
    }
    try {
        const entries = await fs.readdir(baseDir, { withFileTypes: true });
        const candidates = entries
            .filter(e => e.isDirectory() && isValidBottle(e.name))
            .map(e => e.name);
        if (candidates.length === 1) {
            await context.globalState.update('detectedBottle', candidates[0]);
            return candidates[0];
        }
        if (candidates.length > 1) {
            const picked = await vscode.window.showQuickPick(candidates, { placeHolder: 'Select your Fortnite bottle' });
            if (picked) {
                await context.globalState.update('detectedBottle', picked);
                return picked;
            }
        } else {
            vscode.window.showErrorMessage('Could not detect your Fortnite bottle.');
        }
    } catch (err) {
        vscode.window.showErrorMessage(`Error detecting bottle: ${err instanceof Error ? err.message : String(err)}`);
    }
    return undefined;
}
// On start
export async function activate(context: vscode.ExtensionContext) {
    // Enable reload after changing settings
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('verse-macos')) {
                vscode.window
                    .showInformationMessage('Settings changed. Reload window to apply updates?', 'Reload')
                    .then(selection => {
                        if (selection === 'Reload') {
                            vscode.commands.executeCommand('workbench.action.reloadWindow');
                        }
                    });
            }
        })
    );

    // Workspace / username + platform
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const platform = os.platform();
    const userHome = require('os').homedir();

    // Check if the platform isn't MacOS
    if (platform !== 'darwin') {
        const choice = await vscode.window.showWarningMessage(
        'Sorry, this extension is only supported (necessary???) on macOS. Do you want to disable or uninstall it?',
        'Disable', 'Uninstall', 'Ignore'
        );
        // Prompt them to uninstall or disable the extension
        if (choice === 'Disable') {
            vscode.commands.executeCommand('workbench.extensions.action.disableExtension', 'iflone.verse-macos');
        } else if (choice === 'Uninstall') {
            vscode.commands.executeCommand('workbench.extensions.uninstallExtension', 'iflone.verse-macos');
        }
        return;
    }
    // If the file isn't a workspace return.
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
    }

    // Paths related stuff
    const basePath = path.join(userHome, 'Documents', 'Fortnite Projects');
    const folder = workspaceFolders[0];
    const folderUri = folder.uri.fsPath;
    const relativePath = folderUri.replace(basePath, '');
    const projectName = relativePath.split(path.sep)[1];
    const workspaceFilePath = path.join(basePath, projectName, 'Plugins', projectName, `${projectName}.code-workspace`);
    const document = await vscode.workspace.openTextDocument(workspaceFilePath);
  

    // Get boxes values
    const verseTheme = vscode.workspace.getConfiguration('verse-macos').get<boolean>('removeVerseDefaultTheme');
    const verseButton = vscode.workspace.getConfiguration('verse-macos').get<boolean>('fixVerseButton');
    const rwp = vscode.workspace.getConfiguration('verse-macos').get<boolean>('revertWindowsPathApp');
    const fakePath = vscode.workspace.getConfiguration('verse-macos').get<boolean>('createFakePath');

    // Checking if the Fortnite Projects folder is available
    if (folderUri.startsWith(basePath)) {
        bottleNameGlobal = await detectBottleName(context);
        // Can't get bottle name
        if (!bottleNameGlobal) {
            vscode.window.showErrorMessage('Could not determine your Fortnite installation. Make sure you installed Fortnite in any CrossOver bottle via the Epic Games Launcher for Windows.');
            return;
        }
        // Adding or deleting Verse Monitor if applicable
        if (verseButton === true) {
            await fixVerseButton();
        } else {
            await unfixVerseButton();
        }
        // Adding or deleting RWP if applicable
        if (rwp === true){
            await createRWPApp(document);
        }
        else{
            await deleteRWPApp();
        }
        // Try fixing the verse theme if applicable
        if (verseTheme === true){
            addVerseTheme(document);
        }
        else {
            removeVerseTheme(document);
        }
        // Apply fake path if applicable
        if (fakePath === true){
            
        }
        else {
            // Check if the project name exist
            if (projectName) {
                try {
                    const username = os.userInfo().username;
                    const baseDir = `/Users/${username}/Library/Application Support/CrossOver/Bottles/${bottleNameGlobal}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject`;
                    // URI checkers
                    const shouldPatchPath = (dirPath: string) =>
                        dirPath?.startsWith('C:/users/crossover/') || dirPath?.startsWith('C:/users/');
                    // Trigger fix
                    const triggerFix = async () => {
                        // Fix verse/urc extensions
                        await fixUrcAndVerseExtensions();
                        // Try editing the workspace file!
                        await modifyWorkspaceFile(document, projectName);
                        //Try editing the VProject file paths now!
                        await modifyProjectVProjectFile(username, projectName);
                        //Try editing the FortniteGame workspace file paths now!
                        await modifyFortniteGameWorkspaceFile(username);
                        // Reload once it's done!
                        await vscode.commands.executeCommand('workbench.action.reloadWindow');
                    };
                    // Check .vproject file
                    const vprojectFile = path.join(baseDir, projectName, 'vproject', `${projectName}.vproject`);
                    const vprojectContent = await fs.readFile(vprojectFile, 'utf-8');
                    const vprojectData: VProjectData = JSON.parse(vprojectContent);

                    if (vprojectData.packages.some(pkg => shouldPatchPath(pkg.desc?.dirPath))) {
                        return triggerFix();
                    }
                    // Check workspace file
                    const workspaceFile = path.join(baseDir, 'FortniteGame.code-workspace');
                    const workspaceContent = await fs.readFile(workspaceFile, 'utf-8');
                    const workspaceData: WorkspaceData = JSON.parse(workspaceContent);

                    if (workspaceData.folders?.some(folder => shouldPatchPath(folder.path))) {
                        return triggerFix();
                    }
                    // Check currently open document
                    const text = document.getText();
                    let jsonData;
                    try {
                        jsonData = JSON.parse(text);
                    } catch {
                        return vscode.window.showErrorMessage('Error parsing the workspace file as JSON, make sure it\'s valid.');
                    }

                    if (jsonData.folders?.some((folder: any) => shouldPatchPath(folder.path))) {
                        return triggerFix();
                    }
                } catch (err) {
                    vscode.window.showErrorMessage(`Unknown Error: ${err}`);
                }
            }
            // Project isn't completely loaded
            else {
                vscode.window
                    .showInformationMessage('Project not initialized. It looks like your project hasn’t been set up yet. Please ensure that Fortnite is installed and that you’ve opened your project at least once in UEFN before using this extension.', 'Reload')
                    .then(selection => {
                        if (selection === 'Reload') {
                            vscode.commands.executeCommand('workbench.action.reloadWindow');
                        }
                });
            }
        }
    }
    // Unable to find the Fortnite Projects folder
    else {
        vscode.window
            .showInformationMessage('Unable to Locate Fortnite Projects. Please ensure that Fortnite is installed and that you’ve opened your project at least once in UEFN before using this extension.', 'Reload')
            .then(selection => {
                if (selection === 'Reload') {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            });
        }
    return;
}
async function removeVerseTheme(document: vscode.TextDocument) {
    if (document) {
        const text = document.getText();
        let jsonData;
        try {
            jsonData = JSON.parse(text);
        } catch (error) {
            vscode.window.showErrorMessage('Error parsing the workspace file as JSON.');
            return;
        }
        if (!jsonData.settings || !jsonData.settings['workbench.colorTheme']){
            if (!jsonData.settings) {
                jsonData.settings = {};
            }
            jsonData.settings['workbench.colorTheme'] = 'Verse (Dark)';
            const modifiedText = JSON.stringify(jsonData, null, 4);
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            );
            const edit = new vscode.WorkspaceEdit();
            edit.replace(document.uri, fullRange, modifiedText);
            await vscode.workspace.applyEdit(edit);
            vscode.window.showInformationMessage('Set color theme to Verse (Dark).');
            await vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
        } else {
            return vscode.window.showErrorMessage('No valid workspace found, please try again.');
        }
}
async function addVerseTheme(document: vscode.TextDocument) {
    if (document) {
        const text = document.getText();
        let jsonData;
        try {
            jsonData = JSON.parse(text);
        } catch (error) {
            vscode.window.showErrorMessage('Error parsing the workspace file as JSON.');
            return;
        }
        if (jsonData.settings && jsonData.settings['workbench.colorTheme']) {
            try {
                delete jsonData.settings['workbench.colorTheme'];
                const modifiedText = JSON.stringify(jsonData, null, 4);
                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(text.length)
                );
                const edit = new vscode.WorkspaceEdit();
                edit.replace(document.uri, fullRange, modifiedText);
                await vscode.workspace.applyEdit(edit);
                vscode.window.showInformationMessage('Removed verse default theme.');
                await vscode.commands.executeCommand('workbench.action.reloadWindow');
            } catch (error) {
                vscode.window.showErrorMessage('Error while removing the color theme: ' + error);
            }
        }
    } else {
        return vscode.window.showErrorMessage('No valid workspace found, please try again.');
    }
}
async function findVProjectPath(username: string, bottleName: string, projectName: string): Promise<string | undefined> {
    const baseDir = path.join('/Users', username, 'Library', 'Application Support', 'CrossOver', 'Bottles', bottleName,
        'drive_c', 'users', 'crossover', 'AppData', 'Local', 'UnrealEditorFortnite', 'Saved', 'VerseProject');
    const direct = path.join(baseDir, projectName, 'vproject', `${projectName}.vproject`);
    try {
        await fs.access(direct);
        return direct;
    } catch {
        try {
            const entries = await fs.readdir(baseDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const candidate = path.join(baseDir, entry.name, 'vproject', `${entry.name}.vproject`);
                    try {
                        await fs.access(candidate);
                        if (entry.name.toLowerCase() === projectName.toLowerCase()) {
                            return candidate;
                        }
                    } catch {}
                }
            }
        } catch {}
    }
    return undefined;
}
async function modifyWorkspaceFile(document: vscode.TextDocument, projectName: string) {
    const username = os.userInfo().username;
    const bottleName = bottleNameGlobal;
    if (!bottleName) {
        vscode.window.showErrorMessage('Could not determine your Fortnite bottle.');
        return;
    }
    // Log the bottle name (for report)
    console.info("Found bottle name:" + bottleName);
    const text = document.getText();
    let jsonData;
    try {
        jsonData = JSON.parse(text);
    } catch (error) {
        vscode.window.showErrorMessage('Error parsing the workspace file as JSON.');
        console.error("JSON parsing failed:", error);
        return;
    }
    // Check user
    const userEmail = extractUser(jsonData.folders);
    if (!userEmail) {
        vscode.window.showErrorMessage('Could not determine your Verse user from workspace folder names.');
        return;
    }
    if (Array.isArray(jsonData.folders) && jsonData.folders.length > 0) {
        // Filter prohibited names
        const excludedNames = ['/Verse.org', '/UnrealEngine.com', '/Fortnite.com', 'vproject - DO NOT MODIFY'];
        let projectName;
        for (const folder of jsonData.folders) {
            if (!excludedNames.includes(folder.name) && !folder.name.includes('(Assets)')) {
                // Set the project name
                projectName = path.posix.basename(folder.name);
            }
        }
        // Log the project name (for report)
        console.info("Found project:" + projectName);
        if (!projectName) {
            vscode.window.showErrorMessage('Please select a valid workspace, one from your ./Fortnite Projects folder.');
            return;
        }
        // Log the user name (for report)
        console.info("Found username: " + userEmail);
        const pathMappings: { [key: string]: string } = {
            [`/${userEmail}/${projectName} (Assets)`]: `/Users/${username}/Library/Application Support/CrossOver/Bottles/${bottleName}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${projectName}/${projectName}-Assets`,
            [`/${userEmail}/${projectName}`] : `/Users/${username}/Documents/Fortnite Projects/${projectName}/Plugins/${projectName}/Content`,
            "/UnrealEngine.com": `/Users/${username}/Library/Application Support/CrossOver/Bottles/${bottleName}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${projectName}/UnrealEngine`,
            "/Verse.org": `/Users/${username}/Library/Application Support/CrossOver/Bottles/${bottleName}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${projectName}/Verse`,
            "/Fortnite.com": `/Users/${username}/Library/Application Support/CrossOver/Bottles/${bottleName}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${projectName}/Fortnite`,
            "vproject - DO NOT MODIFY": `/Users/${username}/Library/Application Support/CrossOver/Bottles/${bottleName}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${projectName}/vproject`,
        };
        // Change the workspace Windows paths to Unix
        const edits: vscode.TextEdit[] = [];
        for (const folder of jsonData.folders) {
            const folderName = folder.name;
            const newPath = pathMappings[folderName];
            if (newPath) {
                folder.path = newPath; 
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
    } else {
        vscode.window
            .showInformationMessage('Invalid Workspace file.', 'Reload')
            .then(selection => {
                if (selection === 'Reload') {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            });
    }
}
async function modifyProjectVProjectFile(username: string, projectName: string) {
    const bottleName = bottleNameGlobal;
    if (!bottleName) {
        vscode.window.showErrorMessage('Could not determine your Fortnite bottle.');
        return;
    }
    const vprojectPath = await findVProjectPath(username, bottleName, projectName);
    if (!vprojectPath) {
        vscode.window.showErrorMessage(`Could not locate ${projectName}.vproject in the VerseProject directory.`);
        return;
    }
    try {
        const fileContent = await fs.readFile(vprojectPath, 'utf-8');
        let vprojectData: VProjectData = JSON.parse(fileContent);
        const normalizedBasePath = `/Users/${username}/Library/Application Support/CrossOver/Bottles/${bottleNameGlobal}/drive_c/users/crossover`;
        vprojectData.packages.forEach(pkg => {
            if (pkg.desc && pkg.desc.dirPath) {
                if (pkg.desc.dirPath.startsWith('C:/users/crossover/Documents/')) {
                    pkg.desc.dirPath = pkg.desc.dirPath.replace('C:/users/crossover/Documents/', `/Users/${username}/Documents/`);
                } else if (pkg.desc.dirPath.startsWith('C:/users/crossover/')) {
                    pkg.desc.dirPath = pkg.desc.dirPath.replace('C:/users/crossover/', `${normalizedBasePath}/`);
                }
            }
        });
        await fs.writeFile(vprojectPath, JSON.stringify(vprojectData, null, 4));
    } catch (error) {
        console.error(`Error modifying vproject file:`, error);
    }
}
async function modifyFortniteGameWorkspaceFile(username: string) {
    const bottleName = bottleNameGlobal;
    if (!bottleName) {
        vscode.window.showErrorMessage('Could not determine your Fortnite bottle.');
        return;
    }
    const workspacePathName = `FortniteGame.code-workspace`;
    const workspacePath = path.join(
        `/Users/${username}/Library/Application Support/CrossOver/Bottles/${bottleName}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${workspacePathName}`
    );
    try {
        const fileContent = await fs.readFile(workspacePath, 'utf-8');
        let workspaceData: WorkspaceData = JSON.parse(fileContent);
        const oldBasePath = `C:/users/`;
        if (Array.isArray(workspaceData.folders)) {
            workspaceData.folders.forEach(folder => {
                if (folder.path && folder.path.startsWith(oldBasePath)) {
                    const normalizedBasePath = `/Users/${username}/Library/Application Support/CrossOver/Bottles/${bottleName}/drive_c/users/crossover`;
                    const pathPrefix = folder.path.startsWith('C:/users/crossover')
                        ? 'C:/users/crossover'
                        : 'C:/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject';

                    folder.path = folder.path.replace(pathPrefix, normalizedBasePath);
                }
            });
        }
        await fs.writeFile(workspacePath, JSON.stringify(workspaceData, null, 4));
        vscode.window.showInformationMessage(`Updated FortniteGame.code-workspace at ${workspacePath}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Error modifying FortniteGame.code-workspace: ${error instanceof Error ? error.message : String(error)}`);
        console.error("Error updating FortniteGame workspace file:", error);
    }
}
async function fixUrcAndVerseExtensions() {
    const username = os.userInfo().username;
    const bottleName = bottleNameGlobal;
    if (!bottleName) {
        vscode.window.showErrorMessage('Could not determine your Fortnite bottle.');
        return;
    }
    const extensionsPath = path.join(`/Users/${username}/.vscode/extensions/`);
    try {
        const entries = await fs.readdir(extensionsPath, { withFileTypes: true });
        const urcExtensions = entries
            .filter(entry => entry.isDirectory() && entry.name.startsWith('epicgames.urc'))
            .map(entry => path.join(extensionsPath, entry.name));
        const verseExtensions = entries
            .filter(entry => entry.isDirectory() && entry.name.startsWith('epicgames.verse'))
            .map(entry => path.join(extensionsPath, entry.name));
       const verseExtensionJs = path.join(verseExtensions[0], 'out', 'extension.js');
        try {
            let content = await fs.readFile(verseExtensionJs, 'utf-8');
            const lineToCheck = "fs.chmodSync(serverExecutable, '755');";
            const lineToInsert = `\t\t${lineToCheck}`;
            const copyFileLine = "fs.copyFileSync(defaultServerExecutable, serverExecutable);";
            if (!content.includes(lineToCheck)) {
                const insertPosition = content.indexOf(copyFileLine);
                if (insertPosition !== -1) {
                    const newContent = content.slice(0, insertPosition + copyFileLine.length) +
                                       `\n${lineToInsert}\n` +
                                       content.slice(insertPosition + copyFileLine.length);
                    await fs.writeFile(verseExtensionJs, newContent, 'utf-8');
                } else {
                }
            } else {
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error modifying the file: ${error}`);
            console.error("Error modifying verse extension.js:", error);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Error reading extensions directory: ${error}`);
        console.error("Error reading .vscode/extensions directory:", error);
    }
}
async function createVSCodeFolder() {
    const username = os.userInfo().username;
    const bottleName = bottleNameGlobal;
    if (!bottleName) {
        vscode.window.showErrorMessage('Could not determine your Fortnite bottle.');
        return;
    }
    const baseDir = path.join('/Users', username, 'Library', 'Application Support', 'CrossOver', 'Bottles', `${bottleName}`, 'drive_c', 'Program Files');
    const baseDirAnother = path.join('/Users', username, 'Library', 'Application Support', 'CrossOver', 'Bottles', `${bottleName}`, 'drive_c', 'users', 'crossover', 'AppData', 'Local');
    const vscodeDir = path.join(baseDir, 'Microsoft VS Code');
    const vscodeDirA = path.join(baseDirAnother, 'Programs', 'Microsoft VS Code');
    const binDir = path.join(vscodeDir, 'bin');
    const bindira = path.join(vscodeDirA, 'bin');
    const cmdFilePath = path.join(binDir, 'code.cmd');
    const cmdFilePatha = path.join(bindira, 'code.cmd');
    if (rf.existsSync(vscodeDirA) && rf.existsSync(vscodeDir)) {
        return;
    }
    if (!rf.existsSync(vscodeDirA)) {
        rf.mkdirSync(vscodeDirA, { recursive: true });
    }
    if (!rf.existsSync(vscodeDir)) {
        rf.mkdirSync(vscodeDir, { recursive: true });
    }
    if (!rf.existsSync(binDir)) {
        rf.mkdirSync(binDir, { recursive: true });
    }
    if (!rf.existsSync(bindira)) {
        rf.mkdirSync(bindira, { recursive: true });
    }
    if (!rf.existsSync(cmdFilePath)) {
        const cmdContent = '@echo off\n' +
            'rem Create a trigger file\n' +
            `echo "" > /Users/${username}/trigger_open_vscode.txt`;
        rf.writeFileSync(cmdFilePath, cmdContent);
    }
    if (!rf.existsSync(cmdFilePatha)) {
        const cmdContent = '@echo off\n' +
            'rem Create a trigger file\n' +
            `echo "" > /Users/${username}/trigger_open_vscode.txt`;
        rf.writeFileSync(cmdFilePatha, cmdContent);
    }
}
async function fixVerseButton() {
    const scriptName = 'VerseMonitor.scpt';
    const appName = 'VerseMonitor.app';
    const plistName = 'com.iflone.versemonitor.plist';
    const userHome = process.env.HOME || '';
    const username = os.userInfo().username;
    await createVSCodeFolder();
    const bottleName = bottleNameGlobal;
    if (!bottleName) {
        vscode.window.showErrorMessage('Could not determine your Fortnite bottle.');
        return;
    }
    const scriptDestination = path.join('/', 'Applications', scriptName);
    const appDestination = path.join('/', 'Applications', appName);
    const plistPath = path.join(userHome, 'Library', 'LaunchAgents', plistName);
    const appSupportDir = path.dirname(scriptDestination);
    if (rf.existsSync(plistPath) && rf.existsSync(appDestination)) {
        return;
    }
    if (!rf.existsSync(appSupportDir)) {
        rf.mkdirSync(appSupportDir, { recursive: true });
    }
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
    rf.writeFileSync(scriptDestination, appleScriptContent, 'utf8');
    await compileScript("versemonitor", scriptDestination, appDestination);
    if (rf.existsSync(scriptDestination)) {
        rf.unlinkSync(scriptDestination); 
    }
    createVerseMonitorPlist(plistPath);
    const uid = process.getuid ? process.getuid() : 501;
    const label = path.basename(plistPath, '.plist');
    exec(`launchctl bootstrap gui/${uid} ${plistPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error bootstrapping LaunchAgent: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        exec(`launchctl enable gui/${uid}/${label}`);
        exec(`launchctl kickstart -k gui/${uid}/${label}`);
    });
    exec(`launchctl bootstrap gui/501 ~/Library/LaunchAgents/com.iflone.versemonitor.plist`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error bootout LaunchAgent: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
    });
    exec(`launchctl load -w ${plistPath}`, (error, stdout, stderr) => {
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
async function compileScript(datatype: string, scriptPath: string, appPath: string) {
    if (datatype === 'versemonitor') {
        return new Promise((resolve, reject) => {
            const command = `osacompile -o ${appPath} -s ${scriptPath}`;
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error compiling script: ${stderr}`);
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
        });
    }
    if (datatype === 'RWP') {
        return new Promise((resolve, reject) => {
            const command = `osacompile -o ${appPath} ${scriptPath}`;
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error compiling script: ${stderr}`);
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
        });
    }
}
async function createVerseMonitorPlist(plistPath: string) {
    const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${path.basename(plistPath, '.plist')}</string>
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
    rf.writeFileSync(plistPath, plistContent, 'utf8');
}
function extractUser(folders: any[]): string | null {
    for (const folder of folders) {
        const match = folder.name?.match(/^\/([^\/]+)\/[^\/]+$/);
        if (match) {
            return match[1];
        }
    }
    return null;
}
async function unfixVerseButton() {
    const plistName = 'com.iflone.versemonitor.plist';
    const userHome = process.env.HOME || '';
    const plistPath = path.join(userHome, 'Library', 'LaunchAgents', plistName);
    const verseButton = vscode.workspace.getConfiguration('verse-macos').get<boolean>('fixVerseButton');
    try {
        if (!verseButton) {
            if (rf.existsSync(plistPath)) {
                const uid = process.getuid ? process.getuid() : 501;
                const label = path.basename(plistPath, '.plist');
                exec(`launchctl bootout gui/${uid} ${plistPath}`, () => {
                    exec(`launchctl disable gui/${uid}/${label}`);
                });
                rf.unlinkSync(plistPath);
            }
            exec(`pkill -f VerseMonitor`, (err) => {
            if (err) {
                console.error('Failed to kill VerseMonitor:', err);
            }
            });
            const appDestination = path.join('/', 'Applications', 'VerseMonitor.app');
            if (rf.existsSync(appDestination)) {
                rf.rmSync(appDestination, { recursive: true, force: true });
            }
        }
    }
    catch (error) {}
}
async function deleteRWPApp() {
    const appName = 'RWP.app';
    const appDestination = path.join('/', 'Applications', appName);
    if (rf.existsSync(appDestination)) {
        rf.rmSync(appDestination, { recursive: true, force: true });
    }
}
async function createRWPApp(document: vscode.TextDocument) {
    const scriptName = 'RWP.scpt';
    const appName = 'RWP.app';
    const userHome = process.env.HOME || '';
    const username = os.userInfo().username;
    const bottleName = bottleNameGlobal;
    if (!bottleName) {
        vscode.window.showErrorMessage('Could not determine your Fortnite bottle.');
        return;
    }
    const scriptDestination = path.join('Applications', scriptName);
    const appDestination = path.join('Applications', appName);
    const appSupportDir = path.dirname(scriptDestination);

    if (rf.existsSync(appDestination)) {
        return;
    }
    if (!rf.existsSync(appSupportDir)) {
        rf.mkdirSync(appSupportDir, { recursive: true });
    }

    const appleScriptContent = `
set username to (do shell script "whoami")
set bottleName to "${bottleName}"
set fortniteProjectsDir to "/Users/" & username & "/Documents/Fortnite Projects"
set verseProjectDir to "/Users/" & username & "/Library/Application Support/CrossOver/Bottles/" & bottleName & "/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject"
set fortniteBaseWorkspace to "/Users/" & username & "/Library/Application Support/CrossOver/Bottles/" & bottleName & "/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/FortniteGame.code-workspace"
set findCommandProjects to "/usr/bin/find " & quoted form of fortniteProjectsDir & " -type d -mindepth 1 -maxdepth 1 -exec basename {} \\\\;"
set findCommandVerseProject to "/usr/bin/find " & quoted form of verseProjectDir & " -type d -mindepth 1 -maxdepth 1 -not -name \\"FortniteGame\\" -exec basename {} \\\\;"
try
    set fileContent to read POSIX file fortniteBaseWorkspace
    set updatedContent to replaceString(fileContent, "/Users/" & username & "/Documents/", "C:/users/crossover/Documents/")
    set updatedContent to replaceString(updatedContent, "/Users/" & username & "/Library/Application Support/CrossOver/Bottles/" & bottleName & "/drive_c/", "C:/")
    set fileRef to open for access POSIX file fortniteBaseWorkspace with write permission
    set eof of fileRef to 0
    write updatedContent to fileRef starting at eof
    close access fileRef
on error errMsg
    display dialog "Error processing file " & fortniteBaseWorkspace & ": " & errMsg
end try
`;
    rf.writeFileSync(scriptDestination, appleScriptContent, 'utf8');
    await compileScript("RWP", scriptDestination, appDestination);
    if (rf.existsSync(scriptDestination)) {
        rf.unlinkSync(scriptDestination);
    }
}
export function deactivate() {}
