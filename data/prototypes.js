/**
 * Final Steam Data
 */
const svg = d3.select("body").select("svg#sunburst");
const width = parseInt(svg.style("width"));
const height = parseInt(svg.style("height"));

console.log(svg);
console.log('width=%s, height=%s', width, height);

const pad = 14;
const diameter = 500;
const radius = width / 6;

// let color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1));
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
                 .sort((a, b) => b.value - a.value);
  return d3.partition()
           .size([2 * Math.PI, root.height + 1])
           (root);
}

d3.json('steam_reduced_with_genre_no_reviews.json')
  .then(draw);

function draw(data) {
  let color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1));

  let root = partition(data);
  console.log("root");
  // console.log(root);

  root.each(d => d.current = d);

  const thisSvg = svg.attr("viewBox", [0, 0, width, width])
                     .style("font", "10px sans-serif");

  const g = thisSvg.append("g")
               .attr("transform", `translate(${width / 2},${width / 2})`);

  const path = g.append("g")
                .selectAll("path")
                .data(root.descendants().slice(1))
                .join("path")
                .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
                .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
                .attr("d", d => arc(d.current));

  path.filter(d => d.children)
      .style("cursor", "pointer")
      .on("click", clicked);

  path.append("title")
      .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);

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
        .filter(function(d) {
          return +this.getAttribute("fill-opacity") || arcVisible(d.target);
        })
        .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
        .attrTween("d", d => () => arc(d.current));

    label.filter(function(d) {
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

  console.log("done?");

  return thisSvg.node();
}

//
// function drawLinks(g, links, generator) {
//   let paths = g.selectAll('path')
//                .data(links)
//                .enter()
//                .append('path')
//                .attr('d', generator)
//                .attr('class', 'link');
// }
//
// function drawNodes(g, nodes, raise) {
//   let circles = g.selectAll('circle')
//                  .data(nodes, node => node.data.name)
//                  .enter()
//                  .append('circle')
//                  .attr('r', d => d.r ? d.r : r)
//                  .attr('cx', d => d.x)
//                  .attr('cy', d => d.y)
//                  .attr('id', d => d.data.name)
//                  .attr('class', 'node')
//                  .style('fill', d => color(d.depth));
//
//   setupEvents(g, circles, raise);
// }

function setupEvents(g, selection, raise) {
  // selection.on('mouseover.highlight', function(d) {
  //   // https://github.com/d3/d3-hierarchy#node_path
  //   // returns path from d3.select(this) node to selection.data()[0] root node
  //   let path = d3.select(this).datum().path(selection.data()[0]);
  //
  //   // select all of the nodes on the shortest path
  //   let update = selection.data(path, node => node.data.name);
  //
  //   // highlight the selected nodes
  //   update.classed('selected', true);
  //
  //   if (raise) {
  //     update.raise();
  //   }
  // });
  //
  // selection.on('mouseout.highlight', function(d) {
  //   let path = d3.select(this).datum().path(selection.data()[0]);
  //   let update = selection.data(path, node => node.data.name);
  //   update.classed('selected', false);
  // });
  //
  // // show tooltip text on mouseover (hover)
  // selection.on('mouseover.tooltip', function(d) {
  //   showTooltip(g, d3.select(this));
  // });
  //
  // // remove tooltip text on mouseout
  // selection.on('mouseout.tooltip', function(d) {
  //   g.select("#tooltip").remove();
  // });
}

function straightLine () {
  let line = d3.line()
               .curve(d3.curveLinear)
               .x(d => d.x)
               .y(d => d.y);

  return function (node) {
    return line([node.source, node.target]);
  };
}

function translate(x, y) {
  return 'translate(' + String(x) + ',' + String(y) + ')';
}

// const urls = {
//   basemap: "https://data.sfgov.org/resource/q52f-skbd.geojson",
//   streets: "https://data.sfgov.org/resource/hn5x-7sr8.geojson?$limit=4000",
//   parkingEnforcement: "https://data.sfgov.org/resource/vw6y-z8j6.json"
// };
//
// // calculate date range
// const end = d3.timeDay.floor(d3.timeDay.offset(new Date(2020, 2), -1));
// const start = d3.timeDay.floor(d3.timeDay.offset(end, -28));
// const format = d3.timeFormat("%Y-%m-%dT%H:%M:%S");
// console.log(format(start), format(end));
//
// // add parameters to parkingEnforcement url
// urls.parkingEnforcement += "?$where=starts_with(status_description, 'Open')" +
// " AND starts_with(service_name, 'Parking Enforcement')" +
// " AND requested_datetime between '" + format(start) + "' and '" + format(end) +
// "' AND point IS NOT NULL";
//
// console.log(urls.parkingEnforcement);
//
// // encode special characters
// urls.parkingEnforcement = encodeURI(urls.parkingEnforcement);
// console.log(urls.parkingEnforcement);
//
// const svg = d3.select("body").select("svg#vis");
//
// const g = {
//   basemap: svg.select("g#basemap"),
//   streets: svg.select("g#streets"),
//   outline: svg.select("g#outline"),
//   parkingEnforcement: svg.select("g#parkingEnforcement"),
//   tooltip: svg.select("g#tooltip"),
//   details: svg.select("g#details")
// };
//
// // setup tooltip (shows neighborhood name)
// const tip = g.tooltip.append("text").attr("id", "tooltip");
// tip.attr("text-anchor", "end");
// tip.attr("dx", -5);
// tip.attr("dy", -5);
// tip.style("visibility", "hidden");
//
// // add details widget
// // https://bl.ocks.org/mbostock/1424037
// const details = g.details.append("foreignObject")
//                  .attr("id", "details")
//                  .attr("width", 960)
//                  .attr("height", 600)
//                  .attr("x", 0)
//                  .attr("y", 0);
//
// const body = details.append("xhtml:body")
//                     .style("text-align", "left")
//                     .style("background", "none")
//                     .html("<p>N/A</p>")
//                     .attr('font-size', '9');
//
// details.style("visibility", "hidden");
//
// // setup projection
// // https://github.com/d3/d3-geo#geoConicEqualArea
// const projection = d3.geoConicEqualArea();
// projection.parallels([37.692514, 37.840699]);
// projection.rotate([122, 0]);
//
// // setup path generator (note it is a GEO path, not a normal path)
// const path = d3.geoPath().projection(projection);
//
// d3.json(urls.basemap).then(function(json) {
//   // makes sure to adjust projection to fit all of our regions
//   projection.fitSize([960, 600], json);
//
//   // draw the land and neighborhood outlines
//   drawBasemap(json);
//
//   // now that projection has been set trigger loading the other files
//   // note that the actual order these files are loaded may differ
//   d3.json(urls.streets).then(drawStreets);
//   d3.json(urls.parkingEnforcement).then(drawFeedback);
// });
//
// function drawBasemap(json) {
//   console.log("basemap", json);
//
//   const basemap = g.basemap.selectAll("path.land")
//                    .data(json.features)
//                    .enter()
//                    .append("path")
//                    .attr("d", path)
//                    .attr("class", "land");
//
//   const outline = g.outline.selectAll("path.neighborhood")
//                    .data(json.features)
//                    .enter()
//                    .append("path")
//                    .attr("d", path)
//                    .attr("class", "neighborhood")
//                    .each(function(d) {
//                      // save selection in data for interactivity
//                      // saves search time finding the right outline later
//                      d.properties.outline = this;
//                    });
//
//   // add highlight
//   basemap.on("mouseover.highlight", function(d) {
//            d3.select(d.properties.outline).raise();
//            d3.select(d.properties.outline).classed("active", true);
//          })
//          .on("mouseout.highlight", function(d) {
//            d3.select(d.properties.outline).classed("active", false);
//          });
//
//   // add tooltip
//   basemap.on("mouseover.tooltip", function(d) {
//     tip.text(d.properties.district);
//     tip.style("visibility", "visible");
//   })
//          .on("mousemove.tooltip", function(d) {
//            const coords = d3.mouse(g.basemap.node());
//            tip.attr("x", coords[0]);
//            tip.attr("y", coords[1]);
//          })
//          .on("mouseout.tooltip", function(d) {
//            tip.style("visibility", "hidden");
//          });
// }
//
// function drawStreets(json) {
//   console.log("streets", json);
//   const streets = json.features;
//
//   g.streets.selectAll("path.street")
//    .data(streets)
//    .enter()
//    .append("path")
//    .attr("d", path)
//    .attr("class", "street");
// }
//
// function drawFeedback(json) {
//   console.log("Parking Enforcement", json);
//
//   json.forEach(function(d) {
//     const latitude = parseFloat(d['lat']);
//     const longitude = parseFloat(d['long']);
//     const pixels = projection([longitude, latitude]);
//     d.x = pixels[0];
//     d.y = pixels[1];
//   });
//
//   console.log("Parking Enforcement", json);
//
//   const symbols = g.parkingEnforcement.selectAll("circle")
//                    .data(json)
//                    .enter()
//                    .append("circle")
//                    .attr("cx", d => d.x)
//                    .attr("cy", d => d.y)
//                    .attr("r", 5)
//                    .attr("class", "symbol")
//                    .attr("fill", "blue");
//
//   symbols.on("mouseover", function(d) {
//     d3.select(this).raise();
//     d3.select(this).classed("active", true);
//
//     const html = `
//       <table id="hw3" border="0" cellspacing="0" cellpadding="2">
//       <tbody>
//         <tr>
//           <th>Incident:</th>
//           <td>${d.service_request_id}</td>
//         </tr>
//         <tr>
//           <th>Date:</th>
//           <td>${new Date(d.requested_datetime).toDateString()}</td>
//         </tr>
//         <tr>
//           <th>District:</th>
//           <td>${d.police_district}</td>
//         </tr>
//         <tr>
//           <th>Service Name:</th>
//           <td>${d.service_name}</td>
//         </tr>
//         <tr>
//           <th>Details:</th>
//           <td>${d.service_details}</td>
//         </tr>
//       </tbody>
//       </table>
//     `;
//
//     body.html(html);
//     details.style("visibility", "visible");
//   });
//
//   symbols.on("mouseout", function(d) {
//     d3.select(this).classed("active", false);
//     details.style("visibility", "hidden");
//   });
// }
//
// function translate(x, y) {
//   return "translate(" + String(x) + "," + String(y) + ")";
// }