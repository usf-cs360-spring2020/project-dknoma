/**
 * Final Steam Data
 */
const svg = d3.select("body").select("svg#sunburst");
const width = parseInt(svg.style("width"));
const height = parseInt(svg.style("height"));

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

console.log('width=%s, height=%s', width, height);

const radius = width / 6;
let format = d3.format(",d");
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

let color;
d3.json('steam_reduced_with_genre_no_reviews.json')
  .then(draw);

// let color = d => d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, d.children.length + 1));

function draw(data) {
  color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1));

  let root = partition(data);
  console.log("root");
  // console.log(root);
  // console.log("end");

  root.each(d => d.current = d);

  const thisSvg = svg.attr("viewBox", [0, 0, width, width])
                     .style("font", "10px sans-serif");

  const g = thisSvg.append("g")
                   .attr("transform", `translate(${width / 2},${width / 2})`);

  const path = g.append("g")
                .selectAll("path")
                .data(root.descendants().slice(1))
                .join("path")
                .attr("fill", d => {
                  while (d.depth > 1) d = d.parent;
                  return color(d.data.name);
                })
                .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
                .attr("d", d => arc(d.current));

  path.filter(d => d.children)
      .style("cursor", "pointer")
      .on("click", clicked);

  console.log("path");
  console.log(path);

  path.append("title")
      .text(d => {
        // console.log(d);
        let joined;
        if (d.parent.parent !== null && d.parent.parent.data.name === 'genre') {
          // console.log(d.children);
          let value = `${format(d.children.find(ele => ele.data.name === 'reviews').data.size)}`;
          let score = d.children
                       .find(ele => ele.data.name !== 'reviews' && ele.data.name !== 'Game Details')
            .data.name;
          joined = `Genre: ${d.parent.data.name}\nTitle: ${d.data.name}\nReview Score: ${score}\nReview count: ${value}`;
        } else {
          joined = `${d.ancestors()
                       .map(d => d.data.name)
                       .reverse()
                       .join("/")}\n${format(d.data.size === undefined ? d.value : d.data.size)}`
        }
        return joined;
      });

  const label = g.append("g")
                 .attr("pointer-events", "none")
                 .attr("text-anchor", "middle")
                 .style("user-select", "none")
                 .selectAll("text")
                 .data(root.descendants().slice(1))
                 .join("text")
                 .attr("dy", "0.35em")
                 .attr("fill-opacity", d => +labelVisible(d.current))
                 .attr("transform", d => labelTransform(d.current))
                 .text(d => d.data.name);

  const parent = g.append("circle")
                  .datum(root)
                  .attr("r", radius)
                  .attr("fill", "none")
                  .attr("pointer-events", "all")
                  .on("click", clicked);

  function clicked(p) {
    parent.datum(p.parent || root);

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
        .tween("data", d => {
          const i = d3.interpolate(d.current, d.target);
          return t => d.current = i(t);
        })
        .filter(function (d) {
          return +this.getAttribute("fill-opacity") || arcVisible(d.target);
        })
        .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
        .attrTween("d", d => () => arc(d.current));

    label.filter(function (d) {
      return +this.getAttribute("fill-opacity") || labelVisible(d.target);
    }).transition(t)
         .attr("fill-opacity", d => +labelVisible(d.target))
         .attrTween("transform", d => () => labelTransform(d.current));
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

const lines_svg = d3.select("body").select("svg#lines");
const l_width = parseInt(lines_svg.style("width"));
const l_height = parseInt(lines_svg.style("height"));

const margin = {top: 10, right: 30, bottom: 30, left: 60},
      lines_width = l_width - margin.left - margin.right,
      lines_height = l_height - margin.top - margin.bottom;

lines_svg.append("g")
         .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

console.log(lines_svg);

const defaultBeginDate = new Date("2018-1-1");
const defaultEndDate = new Date("2018-12-1");

d3.select("#titleSelectButton")
  .selectAll('titleOptions')
  .data(titles)
  .enter()
  .append('option')
  .text(d => { return d; })           // text showed in the menu
  .attr("value", d => { return d; }); // corresponding value returned by the button

d3.select("#yearSelectButton")
  .selectAll('yearOptions')
  .data(years)
  .enter()
  .append('option')
  .text(d => { return d; })           // text showed in the menu
  .property('selected', d => d === defaultBeginDate.getFullYear())
  .attr("value", d => { return d; }); // corresponding value returned by the button

var myColor = d3.scaleOrdinal()
                .domain(titles)
                .range(d3.interpolateRainbow);

d3.csv('steam_combined_final.csv', row => {
    let convert = {};

    let title = row['title'];
    let all_reviews = row['all_reviews'].split(',')[0];
    let genre = row['genre'];
    let date_posted = row['date_posted'];
    let helpful = row['helpful'];
    let hour_played = row['hour_played'];
    let recommendation = row['recommendation'];

    convert['title'] = title;
    convert['all_reviews'] = all_reviews;
    convert['genre'] = genre;
    convert['date_posted'] = new Date(date_posted);
    convert['helpful'] = parseInt(helpful);
    convert['hour_played'] = parseInt(hour_played);
    convert['recommendation'] = recommendation;

    return convert;
  })
  .then(drawLines);


const scales = {
  x: d3.scaleLinear(),
  y: d3.scaleLinear(),
};

// we are going to hardcode the domains, so we can setup our scales now
// that is one benefit of prototyping!
scales.x
      .range([0, lines_width])
      .domain([defaultBeginDate.getMonth(), defaultEndDate.getMonth()]);

scales.y
      .range([lines_height, 0])
      .domain([0, 8000]);

function drawLines(data) {
  console.log(data[0]);

  drawAxis();
  // x axis
  // let x = d3.scaleLinear()
  //           .domain([defaultBeginDate.getMonth(), defaultEndDate.getMonth()])
  //           .range([0, lines_width]);
  //
  // lines_svg.append("g")
  //          .attr("transform", "translate(0," + lines_height + ")")
  //          .call(d3.axisBottom(x));
  //
  // // y axis
  // let y = d3.scaleLinear()
  //           .domain([0,20])
  //           .range([ lines_height, 0 ]);
  //
  // lines_svg.append("g")
  //          .call(d3.axisLeft(y));

  function updateByTitle(title) {
    // Create new data with the selection?
    let dataFilter = data.map(d => {
      return {
        title: d.title
      }
    });

    // Give these new data to update line
    line.datum(dataFilter)
        .transition()
        .duration(1000)
        .attr("d", d3.line()
                     .x(function(d) {
                       console.log(d);
                       return scales.x(+d.time)
                     })
                     .y(function(d) { return scales.y(+d.value) })
        )
        .attr("stroke", myColor(title));
  }

  function updateByYear(title) {

  }

  // When the button is changed, run the updateChart function
  d3.select("#titleSelectButton").on("change", function(d) {
    // recover the option that has been chosen
    let selectedOption = d3.select(this).property("value");
    // run the updateChart function with this selected option
    updateByTitle(selectedOption)
  });

  d3.select("#yearSelectButton").on("change", function(d) {
    // recover the option that has been chosen
    let selectedOption = d3.select(this).property("value");
    // run the updateChart function with this selected option
    updateByYear(selectedOption)
  });
}

function drawAxis() {
  // place the xaxis and yaxis in their own groups
  const xGroup = svg.append('g')
                    .attr('id', 'x-axis')
                    .attr('class', 'axis');
  const yGroup = svg.append('g')
                    .attr('id', 'y-axis')
                    .attr('class', 'axis');

  // create axis generators
  const xAxis = d3.axisBottom(scales.x);
  const yAxis = d3.axisLeft(scales.y);

  // https://github.com/d3/d3-format#locale_formatPrefix
  xAxis.ticks(9, 's')
       .tickSizeOuter(0)
       .tickSizeInner(0);
  yAxis.ticks(5)
       .tickSizeInner(-width + margin.left + margin.right)
       .tickFormat(d => d3.format('.1s')(d))
       .tickSizeOuter(0);

  // shift x axis to correct location
  xGroup.attr('transform', translate(margin.left, height - margin.bottom));
  xGroup.call(xAxis);

  // shift y axis to correct location
  yGroup.attr('transform', translate(margin.left, margin.top))
  yGroup.call(yAxis);
}
