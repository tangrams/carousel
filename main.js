/*** Map ***/

var styles = {
    "daycycle": "daynight.yaml",

    "highways": "//cdn.rawgit.com/tangrams/highways-demo/a95a428fad9adcf07df1118c859e317c52e1b5c1/scene.yaml",

    "halftone": "halftone.yaml",

    "tron": "//cdn.rawgit.com/tangrams/tangram-sandbox/dac373596f80065d6e77ec4f6fc7c5541fcb3775/styles/tron.yaml",

    "crosshatch": "//cdn.rawgit.com/tangrams/tangram-sandbox/dac373596f80065d6e77ec4f6fc7c5541fcb3775/styles/crosshatch.yaml",

    "glitter": "//cdn.rawgit.com/tangrams/tangram-sandbox/dac373596f80065d6e77ec4f6fc7c5541fcb3775/styles/specular-dust.yaml",

    "traditional": "traditional.yaml"
};

var currentStyle = "daycycle";
var qs = window.location.search;
if (qs) {
    qs = qs.slice(1);
    if (qs[qs.length-1] === '/') {
        qs = qs.slice(0, qs.length-1);
    }
    if (styles[qs]) {
        currentStyle = qs;
    }
}

var map = L.map('map',
    {'keyboardZoomOffset': .05}
);

var layer = Tangram.leafletLayer({
    scene: styles[currentStyle],
    preUpdate: preUpdate,
    postUpdate: postUpdate,
    attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>'
});

var scene = layer.scene;

layer.on('init', function() {
   // everything's good, carry on
  window.addEventListener('resize', resizeMap);
  resizeMap();
});

layer.on('error', function(error) {
  // something went wrong
  var errorEL = document.createElement('div');
  errorEL.setAttribute("class", "error-msg");
     // WebGL not supported (or at least didn't initialize properly!)
  if (layer.scene && !layer.scene.gl) {
    var noticeTxt = document.createTextNode("Your browser doesn't support WebGL. Please try with recent Firefox or Chrome, Tangram is totally worth it.");
    errorEL.appendChild(noticeTxt);
   }
   // Something else went wrong, generic error message
   else {
    var noticeTxt = document.createTextNode("We are sorry, but something went wrong, please try later.");
    errorEL.appendChild(noticeTxt);
   }
   document.body.appendChild(errorEL);
});

layer.addTo(map);

// leaflet-style URL hash pattern:
// ?style.yaml#[zoom],[lat],[lng]
var map_start_location = [40.7076, -74.0094, 15];
var url_hash = window.location.hash.slice(1).split('/');
if (url_hash.length === 3) {
    map_start_location = [url_hash[1],url_hash[2], url_hash[0]];
    // convert from strings
    map_start_location = map_start_location.map(Number);
}

map.setView(map_start_location.slice(0, 2), map_start_location[2]);

var hash = new L.Hash(map);

// Resize map to window
function resizeMap() {
    document.getElementById('map').style.width = window.innerWidth + 'px';
    document.getElementById('map').style.height = window.innerHeight + 'px';
    map.invalidateSize(false);
}

function switchStyles(style) {
    if (styles[style]) {
        currentStyle = style;
        layer.scene.reload(styles[currentStyle]);
    }
}


function preUpdate(will_render) {
    if (!will_render) {
        return;
    }

    switch(currentStyle) {
        case "daycycle":
            daycycle();
            break;
    }
}

function postUpdate() {
}

function daycycle() {
    d = new Date();
    t = d.getTime()/10000;

    x = Math.sin(t);
    y = Math.sin(t+(3.14159/2)); // 1/4 offset
    z = Math.sin(t+(3.14159)); // 1/2 offset

    scene.camera.axis = {x: x, y: y};

    // offset blue and red for sunset and moonlight effect
    B = x + Math.abs(Math.sin(t+(3.14159*.5)))/4;
    R = y + Math.abs(Math.sin(t*2))/4;

    scene.lights.sun.diffuse = [R, y, B, 1];
    scene.lights.sun.direction = [x, 1, -.5];

    px = Math.min(x, 0); // positive x
    py = Math.min(y, 0); // positive y
    // light up the roads at night
    scene.styles["roads"].material.emission.amount = [-py, -py, -py, 1];
    // turn water black at night
    scene.styles["water"].material.ambient.amount = [py+1, py+1, py+1, 1];
    scene.styles["water"].material.diffuse.amount = [py+1, py+1, py+1, 1];

    // turn up buildings' ambient response at night
    ba = -py*.75+.75;
    scene.styles["buildings"].material.ambient.amount = [ba, ba, ba, 1];

    scene.animated = true;
}

// iFrame integration
window.addEventListener("DOMContentLoaded", function() {

  if (window.self !== window.top) {
    //disable scroll zoom if it is iframed
    map.scrollWheelZoom.disable();
    //sending message that child frame is ready to parent window
    window.parent.postMessage("loaded", "*");
    window.addEventListener("message", function (e) {
      // Ignore the message if origin is self (this fixes a Safari bug where iframed documents posts messages at itself)
      if (e.origin === window.location.origin) return;
      switchStyles(e.data);
    }, false);
  }
}, false);
