# MissingMaps Microsites

This repo contains the code for MissingMaps Microsites. Each page is a unique view of how MissingMaps contributes in different countries.

## Managing Microsites

The below sections describe how to manage microsites, updates, and event calendars. The first tasks can be done using [Prose.io](http://prose.io/#MissingMaps/Microsites/). 

### Updating a Microsite Page

Each country's microsite page sits within the `app > _country` folder. For more information on these pages' initail build, see the Development section. 


**Microsite YAML frontmatter **

| Field         | Changes  |
| ------------- |-------------|
| permalink      | With the permalink, a page's full link reads `missingmaps.org/microsites/permalink` |
| name      | The country name is displayed on the microsite under the country flag. |
| code      | The country code is used to call osm-stats-api. This builds the activity and stats section in a microsite header |
| contact   | email address for microsite manager. This is used so if someone wants to add info to micosite updates section, they have somemone to contact to do so |
| flag      | Link to country flag |
| osmLink   | link to country boundary in OSM |
| calendar | id for a public google calendar holding country related events. See the Integrating Google Calendar section for how to generate this id |
| tm-projects         |  HOT OSM tasks for a given country |

i.e
```
tm-projects:
  - id: ###1
    desc: "description of project 1"
  - id: ###2
    desc: "description of project 2"
```
dasddf
| Field         | Changes  |
]
| ------------- |:-------------:|
| id | The id for the HOT Task. For http://tasks.hotosm.org/project/1805, the id would be **1805**. |
| desc | Description of the project. We recommend using the text from the [Tasking Manager](http://tasks.hotosm.org/). |


### Write Microsite Page updates

Each microsite has an update section. For a given microsite, the updates section is populated with content from .md files in the `app > _updates` that share the pages' `code` tag.

For example, Malawi's update section would include all files with `code: MWI`

To generate a new update one of the following set of steps:

- Prose.io

1. Navigate to the `_updates` folder in prose and create & name a new file.
  - Note: While file name can be customized, ensure that the file path is consistent with `app/_updates/*.md`
2. Write your content in [markdown syntax](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
3. Click the metadata button on the left-hand side and fill out the metadata accordingly
4. Click save and commit the changes with a commit message

- Manually

1. Make a new file in the `app > _country` folder
2. Mimic the YAML front matter in `update-example.md` file found in the project root  
3. Write your update content
4. Save and commit it

**Update Config**

| Field      | Changes      |
| ---------- |------------- |
| code       | country code. In prose, this is specified via a 'country' drop down |
| title      | update title |
| date-published | date update is published |
| link       | external link relevant to post. leave blank if an external link does not exist |

### Integrate Google Calendar

A Microsite's events section is populated with events held within a public google calendar. Below are instructions for managing these events through Google Calendar.

If a you want to house microsite events in an existing google calendar, ignore steps 1-3 in the **Create a new Calendar** section below and instead do the following.

1. Open up Google Calendar and navigate directly to the calendar's settings by clicking the right arrow that appears when hovering over the calendar, then select the `Calendar settings` option in the menu that appears.
2. On the following page select the `Share this Calendar` tab.
3. Proceed to step 4 in the `Create a new Calendar` section.

#### Create a new calendar

1. Login to Google Calendar using a Google account.
2. Once in Google Calendar, click the down arrow in the `My Calendars` section header and select `Create new calendar`.
3. On the next page provide the calendar a name, as well as a description and location (these last two are optional).
4. Most importantly, check the check-box next to `Share this calendar with others` and the check-box next to the `Make this calendar public` section. These presets make the calendar public and available to the microsite. Without them, bridging sites and Google Calendar won't work.
5. Save the calendar and select `yes` on the pop-up informing you that the calendar is being made public.


#### Retrieve a Calendar ID

Once a new public calendar is generated, or an existing calendar is made public follow these steps

1. Navigate to the `Calendar Settings` (see step 1 in the instructions above **Create a new calendar**)
2. On the `calendar settings` page, find the `Calendar ID` in the `Calendar Address` section.
3. Add this id to calendar field of the intended page's YAML frontmatter

After step three the YAML frontmatter should include the following...

```markdown
...
  flag: ng.svg
  calendar: you.calendar.code@group.calendar.google.com
  updates:
    // some updates
```

#### Add Events to a microsite calendar

1. On the main Google Calendar, click the `create` button
2. Provide a name in the input text section where it reads `Untitled Event`
3. Below, add a time and date for the event
4. In the `where` section type the location of the event.
5. Importantly, in the `calendar` section, select your public calendar from the drop-down
6. In the description describe the event as well as a link for people to sign up

...for example, the following would be an appropriate description

```
Join members of OSM Liberia for field mapping in Gbarnga City.
www.link.to.sign.up.com/
```

### Include Facebook Events

Facebook events can be included in calendars by either manually adding them as events within the public calendar, or following one of the following methods for bridging Facebook events with Google Calendar.

#### Make Google Calendar Account a secondary email on Facebook

Share the email address attached to the Google account managing the microsite's google calendar to relevant Facebook users. These users add this email address as a 'secondary email' on Facebook via the following steps:

1. Login to Facebook and click the down arrow at the top right of the page. Then in the drop-down that appears click `settings`
2. Click the `contact` section on the next page followed by selecting `add a new email or mobile number`.
3. In the popup that appears input the email address managing the public google calendar
4. Next, a message will be sent to the google calendar manager and the owner of that account can approve adding the email to the Facebook account

With the Google Calendar account added, Facebook users should follow the following steps to share events to the microsite.

1. On the Facebook event's page, click the button with three dots, like `...`
2. In the drop-down that appears click `Export Event`, followed by selecting the `Send to email` option and correct calendar email address in the popup that appears.
3. Finally, click Export

Step 3 will send an email to the microsite calendar manager who can then add the event to the microsite calendar.

## Development

### Environment
To set up the development environment for this website, you'll need to install the following on your system:

- [Node and npm](http://nodejs.org/)
- Ruby and [Bundler](http://bundler.io/), preferably through something like [rvm](https://rvm.io/)
- Gulp ( $ npm install -g gulp )

After these basic requirements are met, run the following commands in the website's folder:
```
$ npm install
```
Will also run `bundle install`

### Auto microsite build

.build_scripts/buildPages.js writes microsites to the `app > _country` folder. On each run, the script includes the recent tasks for each country. These tasks are gathered using [osm-data-parse](https://github.com/maxgrossman/osm-data-parse/).

To include recent tasks, run osm-data-parse's tasking-mgr-parse/parse.js script and save the geoJSON output as 'tasks.geojson' in the root of the microsites repo.

Once the tasks.geojson is generatedd, run the following command

```
$ npm run build-pages

```

### Getting started

```
$ gulp serve
```
Compiles the compass files, javascripts, and launches the server making the site available at `http://localhost:3000/`
The system will watch files and execute tasks whenever one of them changes.
The site will automatically refresh since it is bundled with live reload.

The `_config-dev.yml` file will be loaded alongside `_config.yml`.

### Other commands
Clean the compiled site. I.e. the `_site` folder
```
$ gulp clean

```
Compile the sass files, javascripts, and builds the jekyll site using `_config-dev.yml`.
Use this instead of ```gulp serve``` if you don't want to watch.
```
$ gulp
```

Compiles the site loading the `_config-stage.yml` alongside `_config.yml`. The javascript files will be minified.
```
$ gulp stage
```

Compiles the site loading the `_config-prod.yml` alongside `_config.yml`. The javascript files will be minified.
```
$ gulp prod
```
