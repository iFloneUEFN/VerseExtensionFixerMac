# Verse Extension Fixer (Mac)

A tool to fix many things related to Epic Games Verse programming language on Mac. Indeed, with a few tweaks it is possible to use the Unreal Editor Fortnite using CrossOver, for more information please check [this tutorial on Reddit](https://www.reddit.com/r/FortniteCreative/comments/1e4qrm5/tutorial_how_to_run_uefn_on_mac_os_m1m2m3/).

## Extension not working, bug or suggestion?

Feel free to contact me on [Reddit](https://www.reddit.com/user/florian_martinez/) or on Discord by pinging @iflone_vivi in the [Fortnite Creative Discord Server](https://discord.gg/fortnitecreative). 

## Important notice before installing

## If the extension does not seem to work or has a problem, please check [the Frequently Asked Questions](https://marketplace.visualstudio.com/items?itemName=iFlone.verse-extension-fixer&ssr=false#qna) before contacting me. Also don't forget to update UEFN and the verse extension after each update.

 You would need Visual Studio Code (Windows version) installed in your UEFN bottle to have the verse button fix to work. Please check https://marketplace.visualstudio.com/items?itemName=iFlone.verse-extension-fixer&ssr=false#qna for instructions as you would need to delete some folders.

You must have `brew` and `code` installed.
 
 **To install brew, open terminal and paste/enter this:**
 `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`

**To install code, open terminal and paste/enter this:**
`brew install --cask visual-studio-code`

You must have installed the `verse` vsix extension from Epic Games, else this won't work. Only works on Mac. Don't bother to use this on Windows, as UEFN automatically does that when you build verse. This extension has been made with specific paths in mind, having different ones could change the behavior of the extension, so please don't mess with any of the workspace files/digests/assets etc. If you don't know what you do. For the best use, please make sure you got similar paths:

**Fortnite projects (automatically generated by UEFN):**\
`/Users/<yourname>/Documents/Fortnite Projects/`

**Fortnite Folder (the one you downloaded using Heroic):**\
`/Users/<yourname>/Library/Application Support/CrossOver/Bottles/<yourbottlename>/drive_c/Programs Files/Fortnite`

**Other (automatically generated by UEFN)**\
`/Users/<yourname>/Library/Application Support/CrossOver/Bottles/<yourbottlename>/drive_c/Programs Files/users/crossover/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/`

## Features

- Automatically make the Verse extension compatible for Mac
- Solves UEFN-generated Windows paths in workspace files.
- Fix the verse button within UEFN so it can run Visual Studio Code with the current opened project.
- Allows you to remove the default Verse dark theme and apply your own.