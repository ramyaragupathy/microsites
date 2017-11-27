/* jshint esversion: 6 */

/* -------------------------------------------------------
------------------- Add Primary Stats -------------------
-------------------------------------------------------*/

function getPrimaryStats (countryId) {
  const url = `https://osm-stats-api.azurewebsites.net/countries/${countryId}`;
  $.getJSON(url, function (countryData) {
    if (countryData.all_edits !== null) {
      // round value for select stats, then add them to page
      const usersCount = Math.round(countryData.contributors);
      const editsCount = Math.round(countryData.all_edits);
      const buildingCount = Math.round(countryData.building_count_add);
      const roadCount = Math.round(countryData.road_count_add);

      $('#stats-roadCount').html(roadCount.toLocaleString());
      $('#stats-buildingCount').html(buildingCount.toLocaleString());
      $('#stats-usersCount').html(usersCount.toLocaleString());
      $('#stats-editsCount').html(editsCount.toLocaleString());
    } else {
      $('.emphasizedNumber').css('display', 'none');
    }
  });
}

/* -------------------------------------------------------
 --------------- Add HOT Project Carousel ----------------
 -------------------------------------------------------*/

// Fetch Project data from Tasking Manager API
function getProjects (projects) {
  // Add Flexslider to Projects Section
  $('.Projects-slider').flexslider({
    animation: 'slide',
    directionNav: true,
    slideshowSpeed: 6000000,
    prevText: '',
    nextText: ''
  });
  $('.flex-next').prependTo('.HOT-Nav-Projects');
  $('.flex-control-nav').prependTo('.HOT-Nav-Projects');
  $('.flex-prev').prependTo('.HOT-Nav-Projects');

  if (projects.length === 1) {
    $('.flex-next').css('display', 'none');
  }

  projects.forEach(function (project, i) {
    const url = `https://tasks.hotosm.org/api/v1/project/${project}/summary`;
    $.getJSON(url, function (projectData) {
      makeProject(projectData, i + 2);
    })
    .fail(function (err) {
      // console.log(`WARNING >> Project #${project} could not be accessed at ${url}.\n` +
      //              `The server returned the following message object:`, err);
      makePlaceholderProject(project, i + 2);
    });
  });
}

// Update cards with necessary project details
function makeProject (project, projectOrder) {
  const projDone = Math.round(project.percentMapped);

  // Updates Progress Bar
  $(`ul li:nth-child(${projectOrder}) .HOT-Progress`).addClass('projWidth' + projectOrder);
  $('.HOT-Progress').append(`<style>.projWidth${projectOrder}:before{ width: ${projDone}%;}</style>`);

  // Adds Project variables to the cards
  $(`ul li:nth-child(${projectOrder}) .HOT-Title p`).html(`<b>${project.projectId} - ${project.name}</b>`);
  $(`ul li:nth-child(${projectOrder}) .title`).html(`${project.name} (#${project.projectId})`);
  $(`ul li:nth-child(${projectOrder}) .HOT-Progress`).html(`<p>${projDone}%</p>`);
  $(`ul li:nth-child(${projectOrder}) .HOT-Progress`).attr('title', `${projDone}% complete`);
  $(`ul li:nth-child(${projectOrder}) .HOT-Details .completeness`).html(`<strong>${projDone}%</strong> complete`);
  $(`ul li:nth-child(${projectOrder}) .HOT-Map`).attr('id', 'Map-' + project.projectId);

  // Drop a map into the HOT-Map div
  addMap(project.projectId);
}

// Adds placeholder/ warning formatting to project carousel entry in the event
// that a project cannot be retrieved from the HOT Tasking Manager API
function makePlaceholderProject (projectId, projectOrder) {
  // Adds error title
  $(`ul li:nth-child(${projectOrder}) .HOT-Title p`)
    .html(`<i class="ico icon collecticon-sign-danger"></i>
<b>HOT Project #${projectId} Not Active/Not Found in HOT Tasking Manager</b>`);

  // Hides Tasking Manager Contribute button
  $('#TM-Contribute-Btn-' + projectId).css('display', 'none');
  $(`#HOT-Title-${projectId} p`).css('width', '100%');

  // Generate issue information for Github tracker
  const ghIssueTitle = `HOT Tasking Manager endpoint failure in ${PT.mainHashtag} partner page`;
  const ghIssueBody = `Project ${projectId} is no longer indexed in the HOT
 Tasking Manager, so it should be removed from the ${PT.mainHashtag} partner
 page variable settings.`;

  // Add explanatory error text
  const errorHtml = `Uh oh, it looks like <a href="https://tasks.hotosm.org/api/v1/project/${project};${projectId}"
 target="_blank">Project #${projectId}</a> has been removed from the HOT Tasking Manager.
 <a href="https://github.com/MissingMaps/partners/issues/new?title=${ghIssueTitle}
 &body=${ghIssueBody}" target="_blank">Click here</a> to report an issue or
 <a href="https://tasks.hotosm.org/" target="_blank">here</a>
 to search for more projects.`;

  $(`ul li:nth-child(${projectOrder}) .HOT-Description p`).html(errorHtml);

  // Remove loading spinners and add placeholder background
  $(`ul li:nth-child(${projectOrder}) .HOT-Map`).empty().addClass('placeholder');
  $(`ul li:nth-child(${projectOrder}) .HOT-Progress `).css('display', 'none');
}

/* -------------------------------------------------------
 ----------- Add Map to HOT Project Carousel -------------
 -------------------------------------------------------*/

function onEachFeature (feature, layer) {
  // Set symbology to match HOTOSM Tasking Manager completion states
  let symbology = {
    color: 'black',
    weight: 0.25,
    opacity: 0.7,
    fillOpacity: 0.4,
    fillColor: 'black'
  };

  const taskStatus = feature.properties.taskStatus;
  if (taskStatus === "READY") {
    symbology.fillColor = '#ffffff'; //white
    symbology.fillOpacity = 0.0;  //transparent
  } else if (taskStatus === "INVALIDATED") {
    symbology.fillColor = '#e90b43'; //red
  } else if (taskStatus === "VALIDATED") {
    symbology.fillColor = '#008000'; //green
  } else if (taskStatus === "LOCKED_FOR_MAPPING") {
    symbology.fillColor = '#1259F0'; //blue
  } else if (taskStatus === "MAPPED") {
    symbology.fillColor = '#ffcc00'; //yellow
  }

  layer.setStyle(symbology);
}

function addMap (projectId) {
    // Connect HOT-OSM endpoint for tasking squares data
    const endpoint = `https://tasks.hotosm.org/api/v1/project/${projectId}`;
    $.getJSON(endpoint, function (taskData) {
      // Remove loading spinners before placing map
      $('#Map-' + projectId).empty();

      // Initialize map
      const map = L.map('Map-' + projectId,
      {zoomControl: false}).setView([38.889931, -77.009003], 13);

      // Add tile layer
      L.tileLayer(mbBasemapUrl + '?access_token=' + mbToken, {
        attribution: '<a href="http://mapbox.com">Mapbox</a>'
      }).addTo(map);

      // Remove 'Leaflet' attribution
      map.attributionControl.setPrefix('');

      // Add feature layer
      const featureLayer = L.geoJson(taskData.tasks, {
        onEachFeature: onEachFeature
      }).addTo(map);

      // Fit to feature layer bounds
      map.fitBounds(featureLayer.getBounds());

      // Disable drag and zoom handlers
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.keyboard.disable();
      if (map.tap) map.tap.disable();
    });
  }

  /* -------------------------------------------------------
  ----------- Add Functionality to Events List  -----------
  -------------------------------------------------------*/

  // Adds hide/ show functionality to events list (pre-generated by Jekyll)
  function eventsFunctionality () {
    const eventsCount = $('.event-sub-container').length;
    var firstTwoOpen = false;
    var allOpen = false;

    if (eventsCount <= 3) {
      $('.events-btn').css('display', 'none');
    }

    $('.events-btn').bind('click').click(function (event) {
      if (firstTwoOpen === false && allOpen === false) {
        firstTwoOpen = true;
        $('.hidden').slice(0, 2)
        .css('display', 'block').animate({
          opacity: 1,
          height: '190px'
        }, 500);
        if (eventsCount >= 5) {
          $('.events-btn').html('SEE ALL');
        } else {
          firstTwoOpen = false;
          allOpen = true;
          $('.events-btn').html('SEE FEWER');
        }
      } else if (firstTwoOpen === true && allOpen === false && eventsCount > 2) {
        firstTwoOpen = false;
        allOpen = true;
        $('.events-btn').html('SEE ALL');
        $('.hidden').css('display', 'block').animate({
          opacity: 1,
          height: '190px'
        }, 500);
        $('.events-btn').html('SEE FEWER');
      } else if (firstTwoOpen === false && allOpen === true) {
        firstTwoOpen = false;
        allOpen = false;
        $('.hidden')
        .animate({
          opacity: 0,
          height: '0px'
        }, 300, function () {
          $('.hidden').css('display', 'none');
        });
        $('.events-btn').html('SEE MORE');
      }
    });
  }

  /* -------------------------------------------------------
  -------------------- Add Events Cards -------------------
  -------------------------------------------------------*/

  function generateEvents (calendarId) {
    if (calendarId.match(/google/)) {
      $('#events-spinner').css('display','block');
      const url = 'https://osm-stats-api.azurewebsites.net/calendar/' + calendarId + "/events";
      const currentDate = new Date();
      $.getJSON(url, (eventData) => {
        if (eventData.length === 0) {
          $('.events-null').css('display', 'block');
          $('.events-panel').css('display', 'none');
        } else {
          let linkMatch =  /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
          // console.log(eventData);
          Object.keys(eventData).reverse().map((key, val) => {
            const eventTime = eventData[key].time[0];
            if (moment(currentDate).isBefore(eventTime)) {
              const title = eventData[key].name;
              const singupLink = eventData[key].description.match(linkMatch);
              const desc = eventData[key].description.replace(linkMatch, '');
              const location = eventData[key].location;
              const date = moment(eventData[key].time[0]).format("MMMM Do");
              const time = eventData[key].time.map((d) => {
                const date = new Date(d);
                return moment(date).format('h:mma');
              }).join(' - ');
              const eventTopSection = [
                '<div class="card-divider event-top-section">',
                '<div class="sub-head">',
                '<img class="event-images" src="/assets/graphics/flags/4x3/' + PT.flag + '" width="24"/>',
                '<h3 class="event-header">' + title + '</h3>',
                '<a class="btn btn-grn" href=' + singupLink + ' target="">SIGN UP</a>',
                '</div>',
                '</div>'
              ].join('');
              const eventMainDetails = [
                '<div class="textbox" style="padding-top:8px">',
                '<p>' + '<b>Date:</b> ' + date + '</p>',
                '<p>' + '<b>Time:</b> ' + time + '</p>',
                '<p>' + '<b>Location:</b> ' + location + '</p>',
                '<p>' + '<b>About:</b> ' + desc + '</p>',
                '</div>'
              ].join('');
              const eventsHTML = [
                '<div class="column">',
                '<div class="card">',
                eventTopSection,
                '<div class="card-section">',
                eventMainDetails,
                '</div>',
                '</div>',
                '</div>'
              ].join('');
              $('#event-cards').append(eventsHTML);
              $('#events-spinner').css('display', 'none');
            }
          });
        }
      });
    } else {
      $('.events-null').css('display', 'block');
      $('.events-panel').css('display', 'none');
    }
    eventsFunctionality();
  }

  /* -------------------------------------------------------
  ------------------ Add Activity Graphs ------------------
  -------------------------------------------------------*/

  function setupGraphs () {
    function removeExistingGraphs () {
      const totalGraph = document.querySelector('#Team-User-Total-Graph svg');
      const bldngGraph = document.querySelector('#Team-User-Bldng-Graph svg');
      const roadsGraph = document.querySelector('#Team-User-Roads-Graph svg');
      totalGraph.parentNode.removeChild(totalGraph);
      bldngGraph.parentNode.removeChild(bldngGraph);
      roadsGraph.parentNode.removeChild(roadsGraph);
    }
    const moreBtn = $('.btn.invert-btn-grn.teams-btn');
    const teamLabel = $('.Team-Graph-Title .left');
    const teamUserLabel = $('.Team-User-Graph-Title .left');

    // Sets Users button to Selected, loads Users graphs, hides
    // "Show More Teams" button
    $('#Select-Users-Graph').click(function () {
      $('#Select-Teams-Graph').removeClass('Selected');
      $('#Select-Users-Graph').addClass('Selected');
      teamLabel.text('Users');
      teamUserLabel.text('Users');
      // Remove existing graphs
      removeExistingGraphs();
      // Gets main hashtag on each partner page via team.html
      getUserActivityStats(PT.iso3);
    });

    // Sets Teams button to Selected, loads Teams graphs, reveals
    // "Show More Teams" button if applicable
    $('#Select-Teams-Graph').click(function () {
      $('#Select-Users-Graph').removeClass('Selected');
      $('#Select-Teams-Graph').addClass('Selected');
      teamLabel.text('Teams');
      teamUserLabel.text('Teams');
      // if (PT.subHashtags.length > 10) {
      //   moreBtn.css('display', 'inline').animate({opacity: 1}, 500);
      // }
      // Remove existing graphs
      removeExistingGraphs();
      // Gets hashtag array on each partner page via team.html
      getGroupActivityStats(PT.iso3);

      showMoreContributions();
    });
  }

  // Returns svg link to Missing Maps user endpoint
  function generateUserUrl (userName) {
    const userUrl = 'http://www.missingmaps.org/users/#/' + userName.replace(/\s+/g, '-').toLowerCase();
    return `<a xlink:href="${userUrl}" target="_blank" style="text-decoration:none">${userName}</a>`;
  }

  function getUserActivityStats (countryId) {

    const url = `https://osm-stats-api.azurewebsites.net/countries/${countryId}/users`;
    $.getJSON(url, function (userData) {
      if (userData.length !== 0) {
        const totalSum = Object.keys(userData).map(function (user) {
          const totalEdits = Math.round(Number(userData[user].all_edits));
          return {name: generateUserUrl(userData[user].name), value: totalEdits};
        }).sort((a, b) => b.value - a.value);

        // For each user, sum the total building edits
        const bldngSum = Object.keys(userData).map(function (user) {
          const bldngEdits = Math.round(Number(userData[user].building_count_add));
          return {name: generateUserUrl(userData[user].name), value: bldngEdits};
        }).sort((a, b) => b.value - a.value);

        // For each user, sum the total road kilometers edited
        const roadsSum = Object.keys(userData).map(function (user) {
          const roadsEdits = Math.round(Number(userData[user].road_km_add));
          return {name: generateUserUrl(userData[user].name), value: roadsEdits};
        }).sort((a, b) => b.value - a.value);

        // Spawn a chart function with listening events for each of the metrics
        var c1 = new Barchart(totalSum, '#Team-User-Total-Graph');
        var c2 = new Barchart(bldngSum, '#Team-User-Bldng-Graph');
        var c3 = new Barchart(roadsSum, '#Team-User-Roads-Graph');

        const moreBtn = $('.btn.invert-btn-grn.teams-btn');
        if (totalSum.length > 10) {
          moreBtn.css('display', 'inline').animate({opacity: 1}, 500);
        } else {
          moreBtn.css('display', 'inline').animate({opacity: 0}, 500);
        }

        // On window resize, run window resize function on each chart
        d3.select(window).on('resize', function () {
          c1.resize();
          c2.resize();
          c3.resize();
        });
      }
    });
  }

  // Returns svg link to Missing Maps leaderboard endpoint
  function generateHashtagUrl (hashtag) {
    const hashtagUrl = 'http://www.missingmaps.org/leaderboards/#/' + hashtag;
    return `<a xlink:href="${hashtagUrl}" target="_blank" style="text-decoration: none">#${hashtag}</a>`;
  }

  // populate 'teams' graphs, which show activity per hashtag
  function getGroupActivityStats (countryId) {

    const url = `https://osm-stats-api.azurewebsites.net/countries/${countryId}/hashtags`;
    $.getJSON(url, function (hashtagData) {
      /*
      For each hashtag, generate obj with link to hashtag's mm-leaderboards
      page and the statistic of interest
      ---
      this is done in a reduce function w/the following steps
      1) check to see if object has contents
      2) get the statistic of interest, 'sum', rounded & as a Number
      3) add to an acc list a) a link to hashtag on leaderboards and b) sum
      4) sort the hashtags from largest to smallest 'sum' value
      */
      if (hashtagData.length !== 0) {
        const totalSum = hashtagData.reduce(function (acc, ht) {
          if (!$.isEmptyObject(ht)) {
            const sum = Math.round(Number(ht.all_edits));
            acc.push({name: generateHashtagUrl(ht.hashtag), value: sum});
          }
          return acc;
        }, []).sort((a, b) => b.value - a.value);

        const bldngSum = hashtagData.reduce(function (acc, ht) {
          if (!$.isEmptyObject(ht)) {
            const sum = Math.round(Number(ht.building_count_add)) +
            Math.round(Number(ht.building_count_mod));
            acc.push({name: generateHashtagUrl(ht.hashtag), value: sum});
          }
          return acc;
        }, []).sort((a, b) => b.value - a.value);

        const roadsSum = hashtagData.reduce(function (acc, ht) {
          if (!$.isEmptyObject(ht)) {
            const sum = Math.round(Number(ht.road_km_add)) +
            Math.round(Number(ht.road_km_add));
            acc.push({name: generateHashtagUrl(ht.hashtag), value: sum});
          }
          return acc;
        }, []).sort((a, b) => b.value - a.value);

        // Spawn a chart function with listening events for each of the metrics
        var c1 = new Barchart(totalSum, '#Team-User-Total-Graph');
        var c2 = new Barchart(bldngSum, '#Team-User-Bldng-Graph');
        var c3 = new Barchart(roadsSum, '#Team-User-Roads-Graph');

        const moreBtn = $('.btn.invert-btn-grn.teams-btn');
        if (totalSum.length > 10) {
          moreBtn.css('display', 'inline').animate({opacity: 1}, 500);
        } else {
          moreBtn.css('display', 'inline').animate({opacity: 0}, 500);
        }
        // On window resize, run window resize function on each chart
        d3.select(window).on('resize', function () {
          c1.resize();
          c2.resize();
          c3.resize();
        });
      } else {
        $('.Team-User-Nav').css('display','none');
        $('.Team-User-Stats').css('display','none');
        $('.teams-more').css('display','none');
        $('.teams-none').css('display', 'block');
        $('.Team-User-Container h1').css('text-align', 'center');
      }
    });
  }

  function Barchart (data, targetElement) {
    // Setting margins and size using Bostock conventions for future
    // ease of use, although currently leaving margins at 0
    let margin = {top: 0, right: 0, bottom: 0, left: 0};
    var width = parseInt(d3.select(targetElement).style('width'), 10);
    width = width - margin.left - margin.right;
    let height = 220;
    let barPadding = 60 / data.length;
    let barHeight = (height - margin.top - margin.bottom) / data.length - barPadding;

    // If more than 10 records...
    if (data.length > 10) {
      // ...freeze dynamic sizing of bars and begin expanding the svg height instead
      barPadding = 60 / 10;
      barHeight = (height - margin.top - margin.bottom) / 10 - barPadding;
      height = height + ((barPadding + barHeight) * (data.length - 10));
      // ...enable "Show More" functionality; button appears which allows
      // for panning up and down the length of svg bar graph
      const offset = -((data.length - 10) * (barPadding + barHeight)) - 12;
      let expanded = false;
      $('.teams-btn')
      .css('display', 'initial')
      .click(function () {
        const graphs = $('.Team-User-Graph > svg');
        if (expanded === false) {
          $('.teams-btn').html('SHOW INITIAL TEAMS');
          graphs.animate({marginTop: offset}, 300);
          expanded = true;
        } else if (expanded === true) {
          $('.teams-btn').html('SHOW MORE TEAMS');
          graphs.animate({marginTop: 0}, 300);
          expanded = false;
        }
      });
    }

    // Define scales
    const x = d3.scale.linear()
    .range([0, width])
    .domain([0, d3.max(data, (d) => d.value)]);

    // Create the chart
    var chart = d3.select(targetElement).append('svg')
    .style('width', (width + margin.left + margin.right) + 'px')
    .style('height', height + 'px')
    .append('g')
    .attr('transform', 'translate(' + [margin.left, margin.top] + ')');

    d3.select(chart.node().parentNode)
    .style('height', height + 'px');

    // Render the chart, add the set the bar groups
    var bars = chart.selectAll('.bar')
    .data(data)
    .enter().append('g')
    .attr('class', 'bar')
    .attr('transform', (d, i) => {
      return `translate(0,${i * (barHeight + barPadding)})`;
    });

    // Add the bar rectangles
    bars.append('rect')
    .attr('class', 'bars')
    .attr('height', barHeight)
    .attr('width', (d) => x(d.value));

    // Add the name labels
    bars.append('text')
    .attr('class', 'Graph-Label-Name')
    .attr('x', 5)
    .attr('y', barHeight / 2)
    .attr('dy', '.35em')
    .html((d) => d.name)
    .style('fill', '#606161');

    // Add the value labels
    bars.append('text')
    .attr('class', 'Graph-Label-Value')
    .attr('x', width - 20)
    .attr('y', barHeight / 2)
    .attr('dy', '.35em')
    .text((d) => d.value.toLocaleString())
    .attr('text-anchor', 'end')
    .style('fill', '#606161');

    this.resize = function () {
      // Recalculate width of chart
      width = parseInt(d3.select(targetElement).style('width'), 10);
      width = width - margin.left - margin.right;

      // Update svg size
      d3.select(targetElement).select('svg')
      .style('width', (width + margin.left + margin.right) + 'px');

      // Update the scale of chart
      x.range([0, width]);

      // Update the bar width
      chart.selectAll('rect.bars')
      .attr('width', (d) => x(d.value));

      // Update the value text position
      chart.selectAll('text.Graph-Label-Value')
      .attr('x', width - 20);
    };
  }

  function showUpdatesPlaceholder() {
    if ($(".Updates-Content").length === 0) {
      $(".updates-null").css('display', 'block');
      $("#updates-h1").css('text-align', 'center');
    }
  }

  /* -------------------------------------------------------
  --------------------- OSMCha ---------------------
  -------------------------------------------------------*/


  // function setUserPic(userId) {
  //   // var component = this;
  //   $.get('http://api.openstreetmap.org/api/0.6/user/' + userId, function (data) {
  //     var localGenericUrl = 'http://www.missingmaps.org/users/assets/graphics/osm-user-blank.jpg';
  //     var url = '';
  //     var urls = [];
  //     // Check for img href in user profile
  //     var xml = $.parseXML(data),
  //     $xml = $( xml ),
  //     $img = $xml.find('img');
  //     $imgsrc = $img.find()
  //     var urlBegin = xmlString.split('<img href="')[1];
  //     // If no img href, set state to the local generic image
  //     // (user's profile pic is generic)
  //     if (!urlBegin) {
  //       url = localGenericUrl;
  //       return url;
  //     } else {
  //       url = urlBegin.substring(0, urlBegin.indexOf('"/>'));
  //       urls = url.split('&amp;d=');
  //       if (urls.length < 2) {
  //         // If one img href, use the 'large' version to set
  //         // state (it is the user's custom OSM profile pic)
  //         url = url.replace('/original/', '/large/');
  //         return url;
  //       } else {
  //         // If >one img href, pic is from Gravatar, so check if
  //         // user has custom or generic pic and set state to local
  //         // generic or 128px version of their pic accordingly.
  //         url = urls[0].replace('?s=256', '?s=128');
  //         return url;
  //       }
  //     }
  //
  //     $(`#mapper-${userId}`).attr("src", url);
  //   });
  // }

  // function addeditsMap (edits) {
  //    const blah = edits;
  //     // Remove loading spinners before placing map
  //     // $(`#Map-Box-${blah.id}`).empty();
  //
  //     // Initialize map
  //     console.log(`#Map-Box-${blah.id}`);
  //     const map = L.map(`#Map-Box-${blah.id}`,
  //     {zoomControl: false}).setView([38.889931, -77.009003], 13);
  //
  //     // Add tile layer
  //     L.tileLayer(mbBasemapUrl + '?access_token=' + mbToken, {
  //       attribution: '<a href="http://mapbox.com">Mapbox</a>'
  //     }).addTo(map);
  //
  //     // Remove 'Leaflet' attribution
  //     map.attributionControl.setPrefix('');
  //
  //     // Add feature layer
  //     const featureLayer = L.geoJson(blah.geom, {
  //       onEachFeature: onEachFeature
  //     }).addTo(map);
  //
  //     // Fit to feature layer bounds
  //     map.fitBounds(featureLayer.getBounds());
  //
  //     // Disable drag and zoom handlers
  //     map.dragging.disable();
  //     map.touchZoom.disable();
  //     map.doubleClickZoom.disable();
  //     map.scrollWheelZoom.disable();
  //     map.keyboard.disable();
  //     if (map.tap) map.tap.disable();
  //   }

  function makeValidation(userList){

    const users = _.uniqBy(userList.features, 'properties.uid');
    const mappercount = users.length;

    $('#Mapper-Count').html(mappercount);

    users.forEach(function (features) {
      const output =

    `<div class="column">
        <div class="card">
                 <div class="center" style="">
                    <img class="user-circle mapper-${features.properties.uid}" style="width:50px;margin-top:5px;" src="http://www.missingmaps.org/users/assets/graphics/osm-user-blank.jpg" />
                    <h6><a href="http://www.missingmaps.org/users/#/${features.properties.user}">${features.properties.user}</a></h4>
                  </div>
                  <!--<div id="Map-Box-${features.id}" class="column small-2">
                  </div>-->
            <div class="">
                <h6>Last Edit: ${features.properties.date.slice(0,10)}</h6>
                <h6>Edits: <span class="badge success edits">${features.properties.create}</span><span class="badge warning edits">${features.properties.modify}</span><span class="badge alert edits">${features.properties.delete}</span></h6>

                <!--<div class="map-box">

                </div>-->
                <br>
                <a class="btn btn-blue" href="https://osmcha.mapbox.com/changesets/${features.id}">Review Edit<a>
                <a class="btn btn-blue" href="http://www.openstreetmap.org/message/new/${features.properties.user}">Say Hello<a>
            </div>
        </div>
    </div>`;

      $('#Validation-Data').append(output);
      // setUserPic(`${features.properties.uid}`);
      // addeditsMap(features);

    });
  }

  function getDate(){
    let today = new Date();
    let dd = today.getDate()-7; //get new mappers from the past week
    let mm = today.getMonth()+1; //January is 0!
    let yyyy = today.getFullYear();

    if(dd<10) {
      dd = '0'+dd;
    }

    if(mm<10) {
      mm = '0'+mm;
    }

    return today = yyyy + '-' + mm + '-' + dd;

  }

  function getValidation (bbox) {

    const bbx = bbox.split(',');
    let valDate = getDate();
    let url = `https://osmcha.mapbox.com/api/v1/changesets/?page=1&page_size=15&order_by=-date&reasons=40&date__gte=${valDate}&in_bbox=${bbx[0]},${bbx[1]},${bbx[2]},${bbx[3]}`;

    $.getJSON(url, function (data) {
      makeValidation(data);
    })
    .fail(function (err) {
      console.warn('No New Mappers', err);
    });
  }

  /* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  ---------------------------------------------------------
  --------------------- Setup Project ---------------------
  -------------------------------------------------------*/
  // Global Mapbox variables
  const mbToken = 'pk.eyJ1IjoiZGV2c2VlZCIsImEiOiJnUi1mbkVvIn0.018aLhX0Mb0tdtaT2QNe2Q';
  const mbBasemapUrl = 'https://api.mapbox.com/v4/mapbox.light/{z}/{x}/{y}.png';

  if (PT.name !== 'Microsites') {
    showUpdatesPlaceholder();
    // Populate the primary stats in hero via Missing Maps API
    getPrimaryStats(PT.iso3);
    // Populate initial groups graph via Missing Maps API
    getGroupActivityStats(PT.iso3);
    // Populate project carousel via HOTOSM Tasking Manager API
    getProjects(PT.hotProjects);
    // Populate events section with upcoming events
    generateEvents(PT.calendar);
    // Populate OSMCha section with feed
    getValidation(PT.bbox);
    // setupGraphs
    setupGraphs();
  }
