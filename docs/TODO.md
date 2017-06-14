#Chamsocial ToDo list

### 2017 Haraka
* ~Remove **www** Model dependency~
* Update dependencies
* Update Haraka
* Fix markdown to use same on both haraka and website (maybe https://github.com/jgm/commonmark.js)
* If attachment fail should we delete the post or continue and only log locally?

### 2017 WWW
* ~Clean files and folders~
* ~Cache posts list in redis~
* Refactor and clean unused files
* ~Merge all models to one without _ ~
* ~Update dependencies~
* Update PM2
* Update node

--

* ~Digest~
* Click to resend activation email
* ~Send email through smtp~

* Email tracking
* ~~View logs~~
* ~Daily digest~
* Group subscriptions when viewing a group
* Change language need a fix

## 2016
* Set a better heading on the home page
* ~~Display a message about the new Chamsocial~~
* ~Create a group for the new site (bugs, feedback etc)~
* ~~Analytics and Twitter from Tom~~
* Send email to all who has commented on thread not just subscribing to group
* ~~Reply to in Gmail should allow reply to all~~
* ~~Track where a post/comment where created (email vs web)~~
* ~Emoji not working AHHH~

## Dec 23
* ~~FIX: private messages pub/sub to redis (move all to haraka?)~~
* ~~Add username in email comments~~
* ~~Comment email right username~~ **?**
* ~~Post and comment username to link~~
* Figure out uploads dir issue (haraka create folder)
* Post images in outbound post emails **WIP**
* ~Why is not DKIM working?~
* ~~Fix signup user slug~~
* ~~Make user slug unique in DB~~

##UI
* ~Show group list on home page~
* ~~Show latest posts on home page~~
* ~~Don't show email addresses unless logged in (username)~~
* ~Wider layout, smaller text for desktops~
* ~~Sticky footer~~
* ~~Pager is a bit awkward to use - duplicate at top?~~
* ~~Comments display too chunky, looks like you've made an error after posting~~
* ~~Show which group posts are in~~
* ~~Content with long lines can spill out of post box~~
* ~~Posting a comment should show the comment immediately~~
* On login redirect back to correct page **When?**
* ~~Link to Private message on post to creator~~
* Display unread message count

##Back-end
* Convert markdown to HTML for display and email
* Coordinate email message IDs for posts and comments
* Bounce handling https://www.npmjs.com/package/baunsu
* DKIM signing
* Migrate files, images
* Any more migration?
* Image handling for email
* Convert HTML entities in DB
* Trigger post email when all is done. (eg. email when files are added, ui when published)

##Testing
* Unit tests?
* Selenium for UI tests?

##Managing user migration
* Some kind of user guide?

##For version 1.1
* Add next/previous links when viewing a post
* Clicking a group name in a post should show posts in that group, just like selecting from the group menu
