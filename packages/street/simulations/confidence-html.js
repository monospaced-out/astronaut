module.exports = function (graph, maliciousNodes) {
  const edges = graph.edges().map(({ v, w, name }) => {
    if (name === 'trust') {
      return { from: v, to: w }
    }
  }).filter(e => e)
  const nodes = graph.nodes().map(n => {
    const color = maliciousNodes.includes(n) ? 'red' : null
    return { id: n, label: n, color }
  })
  return `
  <html>
  <head>
      <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.js"></script>
      <link href="https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.css" rel="stylesheet" type="text/css" />

      <style type="text/css">
          #mynetwork {
              width: 600px;
              height: 400px;
              border: 1px solid lightgray;
          }
      </style>
  </head>
  <body>
  <div id="mynetwork"></div>

  <script type="text/javascript">
      // create an array with nodes
      var nodes = new vis.DataSet(${JSON.stringify(nodes)});

      // create an array with edges
      var edges = new vis.DataSet(${JSON.stringify(edges)});

      // create a network
      var container = document.getElementById('mynetwork');

      // provide the data in the vis format
      var data = {
          nodes: nodes,
          edges: edges
      };
      var options = {
        edges: {
          arrows: 'to'
        }
      };

      // initialize your network!
      var network = new vis.Network(container, data, options);
  </script>
  </body>
  </html>
  `
}
