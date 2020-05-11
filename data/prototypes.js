/**
 * Final Steam Data
 */
const svg = d3.select('body').select('svg#sunburst');
const width = parseInt(svg.style('width'));
const height = parseInt(svg.style('height'));

const years = [2015, 2016, 2017, 2018];
const titles = ["PLAYERUNKNOWN'S BATTLEGROUNDS", "Human: Fall Flat", "GOD EATER 3", "Battlefleet Gothic: Armada 2",
  "Foundation", "ACE COMBAT™ 7: SKIES UNKNOWN", "Euro Truck Simulator 2", "My Time At Portia", "Football Manager 2019",
  "ASTRONEER", "Left 4 Dead 2", "Kenshi", "RESIDENT EVIL 2 / BIOHAZARD RE:2", "Subnautica", "Wallpaper Engine",
  "Subnautica: Below Zero", "NBA 2K19", "Slay the Spire", "Insurgency: Sandstorm", "Pathfinder: Kingmaker", "Factorio",
  "Garry's Mod", "Farming Simulator 19", "Don't Starve Together", "Overcooked! 2", "Terraria", "RimWorld",
  "Stardew Valley", "ARK: Survival Evolved", "MONSTER HUNTER: WORLD", "Divinity: Original Sin 2 - Definitive Edition",
  "Beat Saber", "Dead by Daylight", "Sid Meier’s Civilization® VI", "The Elder Scrolls V: Skyrim Special Edition",
  "Rust", "Grand Theft Auto V", "Rocket League®", "Tom Clancy's Rainbow Six® Siege", "Cold Waters", "Moonlighter",
  "Warhammer 40,000: Mechanicus", "Tannenberg", "Wargroove", "Sid Meier's Civilization® VI: Gathering Storm",
  "Sid Meier’s Civilization® VI: Rise and Fall", "Survivor Pass: Vikendi"];
const genres = ["Indie", "Action", "Adventure", "Simulation", "Strategy", "RPG", "Massively Multiplayer", "Casual",
"Sports", "Early Access", "Racing", "Utilities", "Design & Illustration", "Animation & Modeling"];

console.log('width=%s, height=%s', width, height);

let currentGenre = genres[0];

const radius = width / 6;
let format = d3.format(',d');
let arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius(radius * 1.5)
            .innerRadius(d => d.y0 * radius)
            .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

function partition(data) {
  const root = d3.hierarchy(data)
                 .sum(d => d.value)
                 .sort((a, b) => {
                   // Sort games by review count. Sort all others by total children nodes.
                   let value;
                   if (a.parent.parent !== null && a.parent.parent.data.name === 'genre') {
                     value = b.children.find(ele => ele.data.name === 'reviews').data.size -
                       a.children.find(ele => ele.data.name === 'reviews').data.size;
                     // value = `review count = ${format(d.children.find(ele => ele.data.name === 'reviews').data.size)}`;
                   } else {
                     value = b.value - a.value;
                   }
                   return value;
                 });
  return d3.partition()
           .size([2 * Math.PI, root.height + 1])
           (root);
}

d3.json('steam_reduced_with_genre_no_reviews.json')
  .then(draw);

function draw(data) {
  let color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1));

  let root = partition(data);
  console.log('root');

  root.each(d => d.current = d);

  const thisSvg = svg.attr('viewBox', [0, 0, width, width])
                     .style('font', '10px sans-serif');

  const g = thisSvg.append('g')
                   .attr('transform', `translate(${width / 2},${width / 2})`);

  // slice up the sunburst
  const path = g.append('g')
                .selectAll('path')
                .data(root.descendants().slice(1))
                .join('path')
                .attr('fill', d => {
                  while (d.depth > 1) d = d.parent;
                  return color(d.data.name);
                })
                .attr('fill-opacity', d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
                .attr('d', d => arc(d.current));

  path.filter(d => d.children)
      .style('cursor', 'pointer')
      .on('click', clicked);

  // Details on demand
  path.append('title')
      .text(d => {
        let joined;
        // Show formatted text when hovering over game titles
        if (d.parent.parent !== null && d.parent.parent.data.name === 'genre') {
          let value = `${format(d.children.find(ele => ele.data.name === 'reviews').data.size)}`;
          let score = d.children
                       .find(ele => ele.data.name !== 'reviews' && ele.data.name !== 'Game Details')
            .data.name;
          currentGenre = d.parent.data.name;
          joined = `Genre: ${d.parent.data.name}\nTitle: ${d.data.name}\nReview Score: ${score}\nReview count: ${value}`;
        } else {
          joined = `${d.ancestors()
                       .map(d => d.data.name)
                       .reverse()
                       .join('/')}\n${format(d.data.size === undefined ? d.value : d.data.size)}`
        }
        return joined;
      });

  const label = g.append('g')
                 .attr('pointer-events', 'none')
                 .attr('text-anchor', 'middle')
                 .style('user-select', 'none')
                 .selectAll('text')
                 .data(root.descendants().slice(1))
                 .join('text')
                 .attr('dy', '0.35em')
                 .attr('fill-opacity', d => +labelVisible(d.current))
                 .attr('transform', d => labelTransform(d.current))
                 .text(d => d.data.name);

  const parent = g.append('circle')
                  .datum(root)
                  .attr('r', radius)
                  .attr('fill', 'none')
                  .attr('pointer-events', 'all')
                  .on('click', clicked);

  // on click function. zooms in the sunburst to the cell that is clicked on
  function clicked(p) {
    parent.datum(p.parent || root);

    // set the current genre based on what node was clicked
    if(p.depth > 1) {
      let ancestors = p.ancestors();
      for (let i = 0; i < ancestors.length; i++) {
        let n = ancestors[i];
        if (n.depth === 1) {
          currentGenre = n.data.name;
          break;
        }
      }
    } else if(p.depth === 1) {
      currentGenre = p.data.name;
    }

    // Update the connected line graph visualization to the game that was clicked on
    if(p.depth === 2) {
      updateByTitle(p.data.name);
    }

    root.each(d => d.target = {
      x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: Math.max(0, d.y0 - p.depth),
      y1: Math.max(0, d.y1 - p.depth)
    });

    const t = g.transition().duration(750);

    // Transition the data on all arcs, even the ones that aren’t visible,
    // so that if this transition is interrupted, entering arcs will start
    // the next transition from the desired position.
    path.transition(t)
        .tween('data', d => {
          const i = d3.interpolate(d.current, d.target);
          return t => d.current = i(t);
        })
        .filter(function (d) {
          return +this.getAttribute('fill-opacity') || arcVisible(d.target);
        })
        .attr('fill-opacity', d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
        .attrTween('d', d => () => arc(d.current));

    label.filter(function (d) {
      return +this.getAttribute('fill-opacity') || labelVisible(d.target);
    }).transition(t)
         .attr('fill-opacity', d => +labelVisible(d.target))
         .attrTween('transform', d => () => labelTransform(d.current));
  }

  function arcVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
  }

  function labelVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
  }

  function labelTransform(d) {
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2 * radius;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }
}

const lines_svg = d3.select('body').select('svg#lines');
const l_width = parseInt(lines_svg.style('width'));
const l_height = parseInt(lines_svg.style('height'));

const margin = {top: 60, right: 30, bottom: 60, left: 60},
      lines_width = l_width - margin.left - margin.right,
      lines_height = l_height - margin.top - margin.bottom;

lines_svg.append('g')
         .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

console.log(lines_svg);

const defaultBeginDate = new Date('2018-1-1');
const defaultEndDate = new Date('2018-12-31');

let currentTitle = titles[0];
let currentYear = 2018;

// Init drop down buttons
d3.select('#titleSelectButton')
  .selectAll('titleOptions')
  .data(titles)
  .enter()
  .append('option')
  .text(d => { return d; })           // text showed in the menu
  .attr('value', d => { return d; }); // corresponding value returned by the button

d3.select('#yearSelectButton')
  .selectAll('yearOptions')
  .data(years)
  .enter()
  .append('option')
  .text(d => { return d; })           // text showed in the menu
  .property('selected', d => d === defaultBeginDate.getFullYear())
  .attr('value', d => { return d; }); // corresponding value returned by the button

let game_reviews_per_day_map = {};

d3.csv('steam_combined_final.csv', row => {
    // convert data to proper formats
    let convert = {};

    let title = row['title'];
    let all_reviews = row['all_reviews'].split(',')[0];
    let genre = row['genre'];
    let date_posted = new Date(row['date_posted']);
    let helpful = row['helpful'];
    let hour_played = row['hour_played'];
    let recommendation = row['recommendation'];

    convert['title'] = title;
    convert['all_reviews'] = all_reviews;
    convert['genre'] = genre;
    convert['date_posted'] = date_posted;
    convert['helpful'] = parseInt(helpful);
    convert['hour_played'] = parseInt(hour_played);
    convert['recommendation'] = recommendation;

    // keep track of total count of posts per day
    let dRev;
    if(title in game_reviews_per_day_map) {
      dRev = game_reviews_per_day_map[title];
    } else {
      dRev = game_reviews_per_day_map[title] = {};
    }

    if(date_posted in dRev) {
      dRev[date_posted] = dRev[date_posted] + 1;
    } else {
      dRev[date_posted] = 1;
    }

    return convert;
  })
  .then(drawLines);

let myColor = d3.scaleSequential([0, genres.length - 1], d3.interpolateRainbow);

// set up scales
const scales = {
  x: d3.scaleTime(),
  y: d3.scaleLinear(),
};

scales.x
      .range([0, lines_width])
      .domain([defaultBeginDate, defaultEndDate]);

scales.y
      .range([lines_height, 0])
      .domain([0, 8000]);

let arr_by_game = {};

function drawLines(data) {
  console.log(data[0]);
  console.log(game_reviews_per_day_map);

  /*
   * Setup an array:
   * [
   *  {
   *    title: {
   *      year: {
   *        dates: [
   *          {date: review count},
   *          ...
   *        ],
   *        max_count: <upper bound of total reviews in a day of that year>
   *      },
   *      ...
   *    }
   *  },
   *  ...
   * ]
   */
  Object.entries(game_reviews_per_day_map).map(k => {
    let title = k[0];
    let dates = k[1];

    Object.entries(dates).map(d => {
      let date = new Date(d[0]);
      let reviews = d[1];
      let year = date.getFullYear();

      if(!(title in arr_by_game)) {
        arr_by_game[title] = {};
      }

      if(!(year in arr_by_game[title])) {
        arr_by_game[title][year] = {'dates': []};
      }

      arr_by_game[title][year].dates.push({'date_posted': date, 'reviews': reviews});

      if(!('max_count' in arr_by_game[title][year])) {
        arr_by_game[title][year]['max_count'] = 0;
      }
      arr_by_game[title][year]['max_count'] = Math.max(arr_by_game[title][year]['max_count'], reviews);
    });
  });

  function sortByDateAscending(a, b) {
    return a.date_posted - b.date_posted;
  }

  // Sort by time so lines actually work
  Object.values(arr_by_game).forEach(y => Object.values(y).forEach(d => d.dates.sort(sortByDateAscending)));

  drawTitles();
  drawAxis();

  // draw line
  let lines = lines_svg.append('g')
                       .append('path')
                       .attr('id', 'linez')
                       .attr('d', d => line(arr_by_game[currentTitle][currentYear].dates))
                       .attr("stroke", d => myColor(genres.indexOf(currentGenre)))
                       .style("stroke-width", 3)
                       .style("fill", "none");

  // update vis on select title
  d3.select('#titleSelectButton').on('change', function(d) {
    let selectedOption = d3.select(this).property('value');
    updateByTitle(selectedOption)
  });

  // update vis on select year
  d3.select('#yearSelectButton').on('change', function(d) {
    let selectedOption = d3.select(this).property('value');
    updateByYear(selectedOption)
  });
}

/********************
 * Helper Functions *
 ********************/

let line = d3.line()
             .x(d => scales.x(d.date_posted) + margin.left)
             .y(d => scales.y(d.reviews) + margin.top);

/**
 * Do update if there is data for that year
 * @param title
 */
function updateByTitle(title) {
  d3.selectAll('.x-axis-game-title')
    .text(title);
  currentTitle = title;

  drawAxis();

  let dataFilter = arr_by_game[title][currentYear] !== undefined &&
  arr_by_game[title][currentYear].dates !== undefined ?
    arr_by_game[title][currentYear].dates : [];

  let lines = lines_svg.select('#linez');

  lines.attr('d', d => line(dataFilter))
       .attr('stroke', myColor(genres.indexOf(currentGenre)));
}

/**
 * Do update if there is data for that year
 * @param year
 */
function updateByYear(year) {
  d3.selectAll('.x-axis-title')
    .text(year);
  currentYear = year;

  drawAxis();

  let dataFilter = arr_by_game[currentTitle][year] !== undefined &&
  arr_by_game[currentTitle][year].dates !== undefined ?
    arr_by_game[currentTitle][year].dates : [];

  let lines = lines_svg.select('#linez');

  lines.attr('d', d => line(dataFilter))
       .attr('stroke', myColor(genres.indexOf(currentGenre)));
}

/**
 * Draw titles
 */
function drawTitles() {
  const xMiddle = margin.left + midpoint(scales.x.range());
  const yMiddle = margin.top + midpoint(scales.y.range());

  const xGroup = lines_svg.append('g');

  const xTitle = xGroup.append('text')
                       .attr('class', 'x-axis-title')
                       .text(defaultBeginDate.getFullYear());

  xTitle.attr('x', xMiddle)
        .attr('y', lines_height)
        .attr('dy', 100)
        .attr('text-anchor', 'middle');

  const gameTitleX = xGroup.append('text')
                           .attr('class', 'x-axis-game-title')
                           .text(titles[0]);
  gameTitleX.attr('x', xMiddle)
            .attr('y', margin.top)
            .attr('dy', -5)
            .attr('text-anchor', 'middle');

  const yGroup = lines_svg.append('g');

  // set the position by translating the group
  yGroup.attr('transform', translate(4, yMiddle));

  const yTitle = yGroup.append('text')
                       .attr('class', 'y-axis-title')
                       .text('Review Count');

  // keep x, y at 0, 0 for rotation around the origin
  yTitle.attr('x', 0)
        .attr('y', 0)
        .attr('dy', '1.75ex')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)');
}

/**
 * Find appropriate upper bounds
 */
function nearestCap(value) {
  return value >= 1000 ? Math.round(value/1000) * 1000 :
         value >= 100 ? Math.round(value/100) * 100 :
         value >= 10 ? Math.round(value/10) * 10 : 10;
}

function drawAxis() {
  lines_svg.selectAll('#x-axis')
           .remove();

  lines_svg.selectAll('#y-axis')
           .remove();
  // place the xaxis and yaxis in their own groups
  const xGroup = lines_svg.append('g')
                          .attr('id', 'x-axis')
                          .attr('class', 'axis');
  const yGroup = lines_svg.append('g')
                          .attr('id', 'y-axis')
                          .attr('class', 'axis');

  let value = arr_by_game[currentTitle][currentYear] !== undefined ?
    arr_by_game[currentTitle][currentYear].max_count : 8000;
  let newMax = nearestCap(value);

  scales.x.domain([new Date(`${currentYear}-1-1`), new Date(`${currentYear}-12-31`)]);

  scales.y.domain([0, newMax]);

  // create axis generators
  const xAxis = d3.axisBottom(scales.x);
  const yAxis = d3.axisLeft(scales.y);

  xAxis.tickFormat(d3.timeFormat('%b'));

  yAxis.ticks(5)
       .tickSizeInner(-lines_width)
       .tickFormat(d => d3.format('.2s')(d))
       .tickSizeOuter(0);

  // shift x axis to correct location
  xGroup.attr('transform', translate(margin.left, height - margin.bottom));
  xGroup.call(xAxis);

  // shift y axis to correct location
  yGroup.attr('transform', translate(margin.left, margin.top));
  yGroup.call(yAxis);
}

function midpoint(range) {
  return range[0] + (range[1] - range[0]) / 2.0;
}

function translate(x, y) {
  return 'translate(' + String(x) + ',' + String(y) + ')';
}
