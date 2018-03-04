# node-sync-gitignore
Script which keeps your directories sync and takes .gitignore into account.
I created it because Google Drive doesn't allow to exclude subitems from synchronized folders explicitly.
With this, I'm excluding node_modules from being sync with my cloud by copying only 'important stuff' to my google drive folder.

# Usage
node sync.js source-absolute-path dest-absolute-path optional-file-with-gitignore-syntax

3th param is optional and by default script is looking for '.gitignore' file in source directory. You can overwrite that by providing custom path.

# Sync
This work is kinda extension of https://www.npmjs.com/package/sync which doesn't let user to exclude subfiles from sync.
