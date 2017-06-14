# Changelog

### 2017-06-14
- Clean up files & folders
- Update npm packages
- Update Node.js and haraka
- Release www on github as open source

### 2017-04-16
- Use Mailgun for activation and password reset
- Activate user on password reset
- Update **www** node dependencies
- Cache posts in redis and clear on new post
- [Bug]: User create save password stored randomBytes instead of bcrypt

### 2017-04-13
**Haraka**
- Remove dependency of www models in Haraka

**www**
- Remove old models and rename all without _
- Updated start page text
- Light cleaning
- Implemented eslint and fixed ~600 complaints

### 2017-02-21
- Don't suppress sending to Yahoo temporary bounce codes

### 2016-06-22
- Fix email comment bug [object Object]

### 2016-06-07
- Detect more auto-replies

### 2016-06-04
- Migrate and remove auto translate

### 2016-05-29
- WIP Removing user generated auto translating
- Clean up code, remove unused files and requires etc
- Update npm packages

### 2016-05-18
- Fix digest process running forever and some refactor to make it more standalone
- Rename "New Chamsocial" and remove from top of groups list
- Add group descriptions when viewing a group posts list
- Add news about digest

### 2016-05-17
- Started creating a stats page

### 2016-05-13
- Update haraka email server
- Digests live

### 2016-05-12
- Prepare for haraka update

### 2016-04-30
- Minor email template updates

### 2016-04-28
- Design digest email
- WIP add users back to email lists

### 2016-04-26
- Finished haraka early_talker (Set IPs in config to bypass pause)

### 2016-04-25
- Continued work on digests and starting testing
- Started new feature for haraka (early_talker)

### 2016-04-15
- Continued work on digest emails

### 2016-04-13
- Updated footer and removed 3.0 from header (issue on small screens)
- Make comment dates to anchor links
- Started working on digests (WIP)

### 2016-04-11
- Fix activation links
- Fix an db login error preventing any emails to be send or received
- Fix bug preventing attachments to be saved from emails
- Minor design fixes
- Added a changelog
