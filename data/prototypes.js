/**
 * Homework 3 Visualization
 * Category: Parking Enforcement
 * Count: 157
 */

d3.json('steam_reduced.json')
  .then(draw);

function draw(data) {
  let json = d3.hierarchy(data);
  console.log(json);

  // const group = plot.append('g')
  //                   .attr('id', 'cells');
  //
  // group.append('g')
  //      .append('text')
  //      .attr('x', 0)
  //      .attr('y', 0)
  //      .attr('font-size', '10px')
  //      .text(json);
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