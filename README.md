# MissingMaps Microsites

This repo contains the code for MissingMaps Microsites. Each page is a unique view of how MissingMaps contributes in different countries.

## Managing Microsites

### Updating a Microsite Page

Each country's microsite page sits within the `app > _country` folder. For more information on how these pages were generated see the *Development* section of this README. Each page's data are contained within their yml frontmatter. This repo has been set up with [Prose.io](http://prose.io/#MissingMaps/Microsites/) to make pages easier to edit.

**Site Config**

| Field         | Changes  |
| ------------- |-------------|
| permalink      | With the permalink, a page's full link reads `missingmaps.org/microsites/permalinks` |
| name      | The country name is displayed on the microsite under the country flag. |
| flag      | Link to country flag |

**Community**

| Field         | Changes  |
| ------------- |-------------|
| calendar | Id for a public google calendar holding country related events. See the Integrating Google Calendar section for how to generate this id |
| updates | This populates the page's updates section |

```
updates:
  - title: update title
    author: update name
    date: MM/DD/YYYY
    content: Body of the update...
    link: http://externalLink.com
    linktext: text to display on button linking to external site
```

**OSMStats**

| Field         | Changes  |
| ------------- |-------------|
| id      | The country id is used to call osm-stats-api and build the activity and stats section in the header |

**Country Projects**

| Field         | Changes  |
| ------------- |-------------|
| tm-projects         |  HOT OSM tasks for a given country |

```
tm-projects:
  - id: ###1
    desc: "description of project 1"
  - id: ###2
    desc: "description of project 2"
```

| Field         | Changes  |
| ------------- |:-------------:|
| id | The id for the HOT Task. For http://tasks.hotosm.org/project/1805, the id would be **1805**. |
| desc | Description of the project. We recommend using the text from the [Tasking Manager](http://tasks.hotosm.org/). |

### Integrate Google Calendar

#### Create a new calendar

1. login to Google Calendar using a Google account.
2. Click the down arrow in the `My Calendars` section header and select `Create new calendar`.
3. On the next page provide the calendar a name, description, and location.
4. Most importantly check the box next to `Share this calendar with other` as well as the box next to the `Make this calendar public` section.
5. Save the calendar and select `yes` on the popup informing you that the calendar is being made public

#### Get Calendar ID

Once a new public calendar is generated, or an existing calendar is made public follow these steps

1. Hover over the calendar of interest and click the down arrow that appears to its right.
2. In the new dialogue that appears, click `calendar settings`
3. On the `calendar settings` page find the `Calendar ID` in the `Calendar Address` section.
4. Add this id to calendar field of the intended page's yml frontmatter

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
Will also run `bundle install` and auto generates each country's microsite


### Auto microsite build

The auto microsite page build writes microsites to the `app > _country` folder

For country tasks, it uses a fork of [osm-data-parse](https://github.com/maxgrossman/osm-data-parse) to grab the most
recent 'open' tasks from the [HOT tasking manager api](https://github.com/hotosm/osm-tasking-manager2/wiki/API) and reverse geocodes them to designate them to the correct country.

Country names and codes match those used in osm-stats-api and sit in a `countries.json` file.

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

Compile the compass files, javascripts, and builds the jekyll site using `_config-dev.yml`.
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
