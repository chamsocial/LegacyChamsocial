So this is the new Chamsocial. You'll find it's much simpler, but the same key ingredients are here:

* The mailing lists, including the main chamshare list
* Posting via the web site or via email
* Posting images
* Replying to posts
* Sending private messages

#The old site

The old site was built using Drupal 6 and *lots* of off-the-shelf components. This meant it was quick to build, but also that there were many features that were unnecessary, excessive, buggy or badly implemented.

Technology stack:

* PHP 5.2
* Drupal 6 CMS and framework
* MySQL 5.1 (with MyISAM, 10 years old!)
* Nginx 1.2 web server
* Postfix mail server

The site itself has a number of issues:

* It's pretty heavy, performing many requests and transferring lots of data for every page request.
* As a result, it's often very slow - sometimes several minutes to load a page.
* There are no concessions to mobile users - they just see everything very small, whole page loads are the norm, large content eats bandwidth allowances unnecessarily.
* Several pages do not work at all, and 504 Gateway Timeout errors are common (these are largely caused by the slow database).
* Advertisers often took advantage of the open nature of the site.
* Security is poor - passwords are not well protected and there is no encryption.
* Media is largely unfiltered - 5M is too much for an avatar image!
* No IPv6 support.
* No SPDY or HTTP/2.

The site was originally hosted at RackSpace in the USA (which would now be illegal), but it was moved to Peer1 in Sweden in 2014.

Email was very badly handled:

* Posts from Yahoo or AOL addresses (and anywhere else that was paying attention) would never reach the lists because it forged from addresses and thus failed SPF checks.
* No inbound verification, so spammers were free to post to lists using forged addresses.
* Bounces were never removed, resulting in terrible deliverability - *every* post caused over 2,000 bounces!
* Unsubscribes were confusing and difficult, a constant source of support requests.
* Activation emails were either never sent, never arrived or didn't work when they did.
* MIME parsing was broken, often showing pages of base64 data.
* Images were broadcast to the list, resulting in massive data consumption (a 1M image would consume over 1.5Gb of data!).
* Messages were often sent multiple times to the list (the most we found is 25 copies - that's 264,000 unwanted emails from a single posting!!).
* Frequent posts of enormous, unfiltered HTML content.
* Replies often sent to the list unintentionally, resulting in some embarrassment.
* Digest emails didn't work.
* No automatic filtering of lost dog or chamexpress-bashing posts.

The database was also massively inefficient:

* 219 tables.
* Over 12Gb on disk.
* Over 100 *million* records!
* Over 99.6% unnecessary data!
* Missing vital indexes.
* Many inappropriate field types.
* Poorly structured, leading to excessive and inefficient queries (sometimes over 200 for a single page view).
* Not resistant to crashes.
* Entire tables could be locked for minutes at a time, blocking access for everyone.
* Only partial Unicode support.

#The new Chamsocial site

* Retains all original user accounts, profile data, posts, comments, private messages and images.
* Developed entirely from scratch - not using a massively overcomplicated CMS or blog.
* Is bilingual (see below).
* Mobile-first, ultra-light-weight and fully responsive.
* Much simpler, less cluttered interface.
* Retains most significant URL patterns.
* Nearly everything is loaded dynamically and rendered client-side, reducing network overhead.
* Email messages are mobile-friendly and contain efficient linked images, not attachments.
* Email and images are filtered for malicious content.
* Email sources are verified, helping to reduce spam and forgery.
* Emails are addressed correctly and DKIM-signed for better deliverability.
* Messages use (GitHub flavoured) [markdown](https://en.wikipedia.org/wiki/Markdown) for formatting - basic styling without the bulk and hassle of HTML.
* Simple unsubscribe links!
* Bounces are handled correctly.
* The database design and small size makes everything faster than before.
* Deliberately feature-light - more features may be added in future!

##What's been removed?

* The wiki
* The company directory
* The map
* Groups with 2 or less members, or with 2 or fewer posts

These areas were hardly used. All data relating to these has been retained, but is not currently visible. These features may return in a later version.

##The new stack

Chamsocial 3.0 is built using a cutting-edge technology stack:

* Nginx 1.9 (HTTP/2)
* NodeJS 4.3 (ECMAScript 6)
* Express and AngularJS back/front-end frameworks
* MySQL 5.7 (Percona Server)
* Redis cache & queueing
* Haraka Javascript mail server

...a far more efficient database:

* A simple, coherent structure with 20 tables and appropriate field types.
* 180,000 records.
* A mere 50Mb on disk (0.4% the size!).
* ACID integrity and crash resistance with InnoDB.
* Full unicode support (yay emoji! ⛷🏂🏔🤓).
* All while retaining the same content as the original!

...and a state-of-the-art deployment:

* Native IPv6 (good for fibre and 4G mobiles).
* HTTP/2 for all modern browsers (low latency, much faster on mobiles).
* Everything (including email where we can) is delivered over [Qualys SSLLabs A+-rated TLS encryption](https://www.ssllabs.com/ssltest/analyze.html?d=chamsocial.com).
* Massive efficiency gains means we can use a cheaper, lower-powered server while retaining performance.
* Hosted in France with [gandi.net](https://gandi.net).

To further enhance security, we use strong bcrypt hashes for passwords with automatic upgrading from the insecure MD5 hashing on the old site. Email messages are now signed with DKIM using 4096-bit keys, and the domain has tight SPF records and DMARC forgery reporting.

##It's yours!
Chamsocial 3.0 was developed entirely from scratch by developers from in and around Chamonix. It's entirely open source and we welcome suggestions, enhancements (graphics, styling, copy & translations as well as code), bug reports and pull requests on [our GitHub repo](https://github.com/spathon/ChamSocial).
Chamsocial is supported by ChamGeeks, an officially registered non-profit association based in Chamonix.

##It's bilingual!
A long-standing criticism of Chamsocial has been that it doesn't cater for French speakers, and this has had a somewhat divisive effect, the opposite of what a community site should do. To remedy that we have built the new site to be fully English/French bilingual, so the user interface is in both languages, and you can post or reply in either language, and your posts will be translated automatically, or you can write the translations yourself if you prefer (automated translation can be a little iffy!). When you subscribe for emails, you can choose which language you prefer, and you can switch any time you like.
Unfortunately we could not translate all the existing content - Google Translate would cost around €1,000 to process it all - but new messages will be translated.

#Who's behind Chamsocial?
The new Chamsocial site was designed, built, deployed and marketed by Patrik Spathon (@spathon), Marcus Bointon (@SynchroM) and Petter Wallberg at the Ski Locker in Chamonix. Hosting for Chamsocial is sponsored by Synchromedia Limited, creators of the [Smartmessages.net](https://info.smartmessages.net) email marketing service and UK partners of the [1CRM CRM system](https://www.syniah.com/).
