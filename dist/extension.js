"use strict";var R=Object.create;var C=Object.defineProperty;var _=Object.getOwnPropertyDescriptor;var I=Object.getOwnPropertyNames;var W=Object.getPrototypeOf,B=Object.prototype.hasOwnProperty;var J=(e,s)=>{for(var i in s)C(e,i,{get:s[i],enumerable:!0})},N=(e,s,i,a)=>{if(s&&typeof s=="object"||typeof s=="function")for(let o of I(s))!B.call(e,o)&&o!==i&&C(e,o,{get:()=>s[o],enumerable:!(a=_(s,o))||a.enumerable});return e};var P=(e,s,i)=>(i=e!=null?R(W(e)):{},N(s||!e||!e.__esModule?C(i,"default",{value:e,enumerable:!0}):i,e)),q=e=>N(C({},"__esModule",{value:!0}),e);var se={};J(se,{activate:()=>G,deactivate:()=>re});module.exports=q(se);var t=P(require("vscode")),S=P(require("os")),d=P(require("path")),E=require("child_process"),c=P(require("fs")),w=P(require("fs/promises"));async function G(e){let s=t.workspace.workspaceFolders;if(S.platform()!=="darwin"){t.window.showErrorMessage("This extension is only supported on Mac OS.");return}if(!s||s.length===0)return;let o=s[0].uri.fsPath,l=require("os").homedir(),r=d.join(l,"Documents","Fortnite Projects"),p=o.replace(r,"").split(d.sep)[1],h=d.join(r,p,"Plugins",p,`${p}.code-workspace`),m=await t.workspace.openTextDocument(h);if(o.startsWith(r)){let u=t.workspace.getConfiguration("verseExtensionFixer").get("bottleName"),f=t.workspace.getConfiguration("verseExtensionFixer").get("fixVerseButtonInUEFN"),g=t.workspace.getConfiguration("verseExtensionFixer").get("revertWorkspacesWindowsPaths");if(f===!0?await z():await Z(),g===!0?await te(m):await ee(),!u||u.trim()===""){t.window.showErrorMessage("Please enter your bottle name in the settings then restart Visual Studio Code.");return}if(p)try{await H(m);let y=S.userInfo().username,D=`${p}.vproject`,b=d.join(`/Users/${y}/Library/Application Support/CrossOver/Bottles/${u}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${p}/vproject/${D}`),$=await w.readFile(b,"utf-8");JSON.parse($).packages.forEach(v=>{if(v.desc&&v.desc.dirPath&&(v.desc.dirPath.startsWith("C:/users/crossover/Documents/")||v.desc.dirPath.startsWith("C:/users/crossover/"))){k(),x(m);return}});let O=d.join(`/Users/${y}/Library/Application Support/CrossOver/Bottles/${u}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/FortniteGame.code-workspace`),L=await w.readFile(O,"utf-8"),A=JSON.parse(L),M="C:/users/";Array.isArray(A.folders)&&A.folders.forEach(v=>{if(v.path&&v.path.startsWith(M)){k(),x(m);return}});let V="C:/users/crossover/AppData/",U="C:/users/crossover/Documents/",T=m.getText(),F;try{F=JSON.parse(T)}catch{t.window.showErrorMessage("Error parsing the workspace file as JSON, make sure it's valid.");return}for(let v of F.folders)if(v.path&&(v.path.startsWith(V)||v.path.startsWith(U))){k(),x(m);return}}catch(y){t.window.showErrorMessage(`Unknown Error: ${y}`)}}}async function H(e){if(t.workspace.getConfiguration("verseExtensionFixer").get("removeVerseDefaultTheme")===!0)if(e){let i=e.getText(),a;try{a=JSON.parse(i)}catch{t.window.showErrorMessage("Error parsing the workspace file as JSON.");return}if(a.settings&&a.settings["workbench.colorTheme"])try{delete a.settings["workbench.colorTheme"];let o=JSON.stringify(a,null,4),l=new t.Range(e.positionAt(0),e.positionAt(i.length)),r=new t.WorkspaceEdit;r.replace(e.uri,l,o),await t.workspace.applyEdit(r),t.window.showInformationMessage("Removed verse default theme."),await t.commands.executeCommand("workbench.action.reloadWindow")}catch(o){t.window.showErrorMessage("Error while removing the color theme: "+o)}}else return t.window.showErrorMessage("No valid workspace found, please try again.");else if(e){let i=e.getText(),a;try{a=JSON.parse(i)}catch{t.window.showErrorMessage("Error parsing the workspace file as JSON.");return}if(!a.settings["workbench.colorTheme"]){a.settings["workbench.colorTheme"]="Verse (Dark)";let o=JSON.stringify(a,null,4),l=new t.Range(e.positionAt(0),e.positionAt(i.length)),r=new t.WorkspaceEdit;r.replace(e.uri,l,o),await t.workspace.applyEdit(r),t.window.showInformationMessage("Set color theme to Verse (Dark)."),await t.commands.executeCommand("workbench.action.reloadWindow")}}else return t.window.showErrorMessage("No valid workspace found, please try again.")}async function x(e){let s=S.userInfo().username,i=t.workspace.getConfiguration("verseExtensionFixer").get("bottleName");if(!i||i.trim()===""){t.window.showErrorMessage("Please enter your bottle name in the settings then restart Visual Studio Code.");return}let a=e.getText(),o;try{o=JSON.parse(a)}catch{t.window.showErrorMessage("Error parsing the workspace file as JSON.");return}if(Array.isArray(o.folders)&&o.folders.length>0){let l=["Verse","UnrealEngine","Fortnite","vproject - DO NOT MODIFY","/Assets"],r;for(let f of o.folders)!l.includes(f.name)&&!f.name.includes("/Assets")&&(r=f.name);if(!r){t.window.showErrorMessage("Please select a valid workspace, one from your ./Fortnite Projects folder.");return}let n={Fortnite:`/Users/${s}/Library/Application Support/CrossOver/Bottles/${i}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${r}/Fortnite`,[`${r}/Assets`]:`/Users/${s}/Library/Application Support/CrossOver/Bottles/${i}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${r}/${r}-Assets`,[`${r}`]:`/Users/${s}/Documents/Fortnite Projects/${r}/Plugins/${r}/Content`,UnrealEngine:`/Users/${s}/Library/Application Support/CrossOver/Bottles/${i}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${r}/UnrealEngine`,Verse:`/Users/${s}/Library/Application Support/CrossOver/Bottles/${i}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${r}/Verse`,"vproject - DO NOT MODIFY":`/Users/${s}/Library/Application Support/CrossOver/Bottles/${i}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${r}/vproject`},p=[];for(let f of o.folders){let g=f.name,y=n[g];y&&(f.path=y)}let h=JSON.stringify(o,null,4),m=new t.Range(e.positionAt(0),e.positionAt(a.length));p.push(t.TextEdit.replace(m,h));let u=new t.WorkspaceEdit;u.set(e.uri,p),await t.workspace.applyEdit(u);try{await X(s,i,r)}catch(f){t.window.showErrorMessage(`Error modifying VProject file: ${f instanceof Error?f.message:String(f)}`)}try{await K(s,i)}catch(f){t.window.showErrorMessage(`Error modifying FortniteGame workspace file: ${f instanceof Error?f.message:String(f)}`)}t.window.showInformationMessage(`Updated paths in ${e.fileName}`),await t.commands.executeCommand("workbench.action.reloadWindow")}}async function X(e,s,i){let a=`${i}.vproject`,o=d.join(`/Users/${e}/Library/Application Support/CrossOver/Bottles/${s}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/${i}/vproject/${a}`);try{let l=await w.readFile(o,"utf-8"),r=JSON.parse(l),n=`/Users/${e}/Library/Application Support/CrossOver/Bottles/${s}/drive_c/users/crossover`;r.packages.forEach(p=>{p.desc&&p.desc.dirPath&&(p.desc.dirPath.startsWith("C:/users/crossover/Documents/")?p.desc.dirPath=p.desc.dirPath.replace("C:/users/crossover/Documents/",`/Users/${e}/Documents/`):p.desc.dirPath.startsWith("C:/users/crossover/")&&(p.desc.dirPath=p.desc.dirPath.replace("C:/users/crossover/",`${n}/`)))}),await w.writeFile(o,JSON.stringify(r,null,4)),t.window.showInformationMessage(`Updated ${a} file at ${o}`)}catch(l){t.window.showErrorMessage(`Error modifying ${a} file: ${l instanceof Error?l.message:String(l)}`)}}async function K(e,s){let a=d.join(`/Users/${e}/Library/Application Support/CrossOver/Bottles/${s}/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/FortniteGame.code-workspace`);try{let o=await w.readFile(a,"utf-8"),l=JSON.parse(o),r="C:/users/";Array.isArray(l.folders)&&l.folders.forEach(n=>{if(n.path&&n.path.startsWith(r)){let p=`/Users/${e}/Library/Application Support/CrossOver/Bottles/${s}/drive_c/users/crossover`,h=n.path.startsWith("C:/users/crossover")?"C:/users/crossover":"C:/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject";n.path=n.path.replace(h,p)}}),await w.writeFile(a,JSON.stringify(l,null,4)),t.window.showInformationMessage(`Updated FortniteGame.code-workspace at ${a}`)}catch(o){t.window.showErrorMessage(`Error modifying FortniteGame.code-workspace: ${o instanceof Error?o.message:String(o)}`)}}async function k(){let e=S.userInfo().username,s=t.workspace.getConfiguration("verseExtensionFixer").get("bottleName");if(!s||s.trim()===""){t.window.showErrorMessage("Please enter your bottle name in the settings then restart Visual Studio Code.");return}let i=d.join(`/Users/${e}/.vscode/extensions/`);try{let a=await w.readdir(i,{withFileTypes:!0}),o=a.filter(n=>n.isDirectory()&&n.name.startsWith("epicgames.urc")).map(n=>d.join(i,n.name)),l=a.filter(n=>n.isDirectory()&&n.name.startsWith("epicgames.verse")).map(n=>d.join(i,n.name)),r=d.join(l[0],"/out/extension.js");try{let n=await w.readFile(r,"utf-8"),p="fs.chmodSync(serverExecutable, '755');",h=`		${p}`,m="fs.copyFileSync(defaultServerExecutable, serverExecutable);";if(!n.includes(p)){let u=n.indexOf(m);if(u!==-1){let f=n.slice(0,u+m.length)+`
${h}
`+n.slice(u+m.length);await w.writeFile(r,f,"utf-8")}}}catch(n){t.window.showErrorMessage(`Error modifying the file: ${n}`)}}catch(a){t.window.showErrorMessage(`Error reading extensions directory: ${a}`)}}async function Y(){let e=S.userInfo().username,s=t.workspace.getConfiguration("verseExtensionFixer").get("bottleName");if(!s||s.trim()===""){t.window.showErrorMessage("Please enter your bottle name in the settings then restart Visual Studio Code.");return}let i=d.join("/Users",e,"Library","Application Support","CrossOver","Bottles",`${s}`,"drive_c","Program Files"),a=d.join("/Users",e,"Library","Application Support","CrossOver","Bottles",`${s}`,"drive_c","users","crossover","AppData","Local"),o=d.join(i,"Microsoft VS Code"),l=d.join(a,"Programs","Microsoft VS Code"),r=d.join(o,"bin"),n=d.join(l,"bin"),p=d.join(r,"code.cmd"),h=d.join(n,"code.cmd");if(!(c.existsSync(l)&&c.existsSync(o))){if(c.existsSync(l)||c.mkdirSync(l,{recursive:!0}),c.existsSync(o)||c.mkdirSync(o,{recursive:!0}),c.existsSync(r)||c.mkdirSync(r,{recursive:!0}),c.existsSync(n)||c.mkdirSync(n,{recursive:!0}),!c.existsSync(p)){let m=`@echo off
rem Create a trigger file
echo "" > /Users/${e}/trigger_open_vscode.txt`;c.writeFileSync(p,m)}if(!c.existsSync(h)){let m=`@echo off
rem Create a trigger file
echo "" > /Users/${e}/trigger_open_vscode.txt`;c.writeFileSync(h,m)}}}async function z(){let e="VerseMonitor.scpt",s="VerseMonitor.app",i="com.iflone.versemonitor.plist",a=process.env.HOME||"",o=S.userInfo().username;await Y();let l=t.workspace.getConfiguration("verseExtensionFixer").get("bottleName"),r=d.join("Applications",e),n=d.join("Applications",s),p=d.join(a,"Library","LaunchAgents",i),h=d.dirname(r);if(c.existsSync(p)&&c.existsSync(n))return;c.existsSync(h)||c.mkdirSync(h,{recursive:!0});let m=`  
on idle
	set triggerFile to "/Users/${o}/trigger_open_vscode.txt"
	if (do shell script "test -e " & quoted form of triggerFile & " && echo true || echo false") is "true" then
		set USERNAME to do shell script "whoami"
		set bottleName to "${l}"
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
    `;c.writeFileSync(r,m,"utf8"),await j("versemonitor",r,n),c.existsSync(r)&&c.unlinkSync(r),Q(p),(0,E.exec)("launchctl enable user/501/~/Library/LaunchAgents/com.iflone.versemonitor.plist",(u,f,g)=>{if(u){console.error(`Error enabling LaunchAgent: ${u.message}`);return}if(g){console.error(`stderr: ${g}`);return}}),(0,E.exec)("launchctl bootstrap gui/501 ~/Library/LaunchAgents/com.iflone.versemonitor.plist",(u,f,g)=>{if(u){console.error(`Error bootout LaunchAgent: ${u.message}`);return}if(g){console.error(`stderr: ${g}`);return}}),(0,E.exec)(`launchctl load -w ${p}`,(u,f,g)=>{if(u){console.error(`Error loading LaunchAgent: ${u.message}`);return}if(g){console.error(`stderr: ${g}`);return}})}async function j(e,s,i){if(e==="versemonitor")return new Promise((a,o)=>{let l=`osacompile -o ${i} -s ${s}`;(0,E.exec)(l,(r,n,p)=>{r?(console.error(`Error compiling script: ${p}`),o(r)):(console.log(`Successfully compiled script to app: ${n}`),a(n))})});if(e==="RWP")return new Promise((a,o)=>{let l=`osacompile -o ${i} ${s}`;(0,E.exec)(l,(r,n,p)=>{r?(console.error(`Error compiling script: ${p}`),o(r)):(console.log(`Successfully compiled script to app: ${n}`),a(n))})})}async function Q(e){let s=`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${d.basename(e)}</string>
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
`;c.writeFileSync(e,s,"utf8"),console.log(`Created LaunchAgent at ${e}`)}async function Z(){let e="com.iflone.versemonitor.plist",s=process.env.HOME||"",i=d.join(s,"Library","LaunchAgents",e),a=t.workspace.getConfiguration("verseExtensionFixer").get("fixVerseButtonInUEFN");try{if(!a&&c.existsSync(i)){c.unlinkSync(i),(0,E.exec)("sudo launchctl bootout gui/501 ~/Library/LaunchAgents/com.iflone.versemonitor.plist",(l,r,n)=>{});let o=d.join("Applications","VerseMonitor.app");c.existsSync(o)&&c.rmSync(o,{recursive:!0,force:!0})}}catch{}}async function ee(){let s=d.join("Applications","RWP.app");c.existsSync(s)&&c.rmSync(s,{recursive:!0,force:!0})}async function te(e){let s="RWP.scpt",i="RWP.app",a=process.env.HOME||"",o=S.userInfo().username,l=t.workspace.getConfiguration("verseExtensionFixer").get("bottleName"),r=d.join("Applications",s),n=d.join("Applications",i),p=d.dirname(r);if(c.existsSync(n))return;c.existsSync(p)||c.mkdirSync(p,{recursive:!0});let h=`
set username to (do shell script "whoami")
set bottleName to "${l}"
set fortniteProjectsDir to "/Users/" & username & "/Documents/Fortnite Projects"
set verseProjectDir to "/Users/" & username & "/Library/Application Support/CrossOver/Bottles/" & bottleName & "/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject"
set fortniteBaseWorkspace to "/Users/" & username & "/Library/Application Support/CrossOver/Bottles/" & bottleName & "/drive_c/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/FortniteGame.code-workspace"
set findCommandProjects to "/usr/bin/find " & quoted form of fortniteProjectsDir & " -type d -mindepth 1 -maxdepth 1 -exec basename {} \\\\;"
set findCommandVerseProject to "/usr/bin/find " & quoted form of verseProjectDir & " -type d -mindepth 1 -maxdepth 1 -not -name \\"FortniteGame\\" -exec basename {} \\\\;"
set folderList to paragraphs of (do shell script findCommandProjects)
set folderListVerse to paragraphs of (do shell script findCommandVerseProject)
set projectsNames to {}
set projectsNamesVerse to {}

on replaceString(theString, searchString, replaceString)
    set oldDelimiters to AppleScript's text item delimiters
    set AppleScript's text item delimiters to searchString
    set textItems to text items of theString
    set AppleScript's text item delimiters to replaceString
    set newString to textItems as string
    set AppleScript's text item delimiters to oldDelimiters
    return newString
end replaceString

repeat with folderName in folderList
    if folderName is not "" then
        set end of projectsNames to folderName
    end if
end repeat

repeat with folderNameVerse in folderListVerse
    if folderNameVerse is not "" then
        set end of projectsNamesVerse to folderNameVerse
    end if
end repeat

repeat with name in projectsNames
    set workspaceFilePath to fortniteProjectsDir & "/" & name & "/Plugins/" & name & "/" & name & ".code-workspace"
    try
        set fileContent to read POSIX file workspaceFilePath
        set updatedContent to replaceString(fileContent, "/Users/" & username & "/Documents/", "C:/users/crossover/Documents/")
        set updatedContent to replaceString(updatedContent, "/Users/" & username & "/Library/Application Support/CrossOver/Bottles/" & bottleName & "/drive_c/", "C:/")
        set fileRef to open for access POSIX file workspaceFilePath with write permission
        set eof of fileRef to 0
        write updatedContent to fileRef starting at eof
        close access fileRef
    on error errMsg
        display dialog "Error processing file " & workspaceFilePath & ": " & errMsg
    end try
end repeat

repeat with name in projectsNamesVerse
    set workspaceFilePathVerse to verseProjectDir & "/" & name & "/vproject/" & name & ".vproject"
    try
        set fileContent to read POSIX file workspaceFilePathVerse
        set updatedContent to replaceString(fileContent, "/Users/" & username & "/Documents/", "C:/users/crossover/Documents/")
        set updatedContent to replaceString(updatedContent, "/Users/" & username & "/Library/Application Support/CrossOver/Bottles/" & bottleName & "/drive_c/", "C:/")
        set fileRef to open for access POSIX file workspaceFilePathVerse with write permission
        set eof of fileRef to 0
        write updatedContent to fileRef starting at eof
        close access fileRef
    on error errMsg
        display dialog "Error processing file " & workspaceFilePathVerse & ": " & errMsg
    end try
end repeat

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
`;c.writeFileSync(r,h,"utf8"),await j("RWP",r,n),c.existsSync(r)&&c.unlinkSync(r)}function re(){}0&&(module.exports={activate,deactivate});
