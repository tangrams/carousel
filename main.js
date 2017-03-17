/*** Map ***/

var styles = {
    "daycycle": "styles/daynight.yaml",
    "walkabout": "https://mapzen.com/carto/walkabout-style/4/walkabout-style.yaml",
    "crosshatch": "styles/crosshatch.yaml",
    "tron": "https://mapzen.com/carto/tron-style/2/tron.yaml",
    "terrain": "styles/imhof2.yaml"
};

var locations = {
    "daycycle": [40.7076,-74.0094,15],
    "walkabout": [37.7717,-122.4485,14],
    "crosshatch": [40.7053,-74.0109,16],
    "tron": [40.70553,-74.01398,17.5],
    "terrain": [37.8861,-122.1391,12]
};

var currentStyle = "daycycle";
// http://localhost:8080/?terrain
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

map.attributionControl.setPrefix('<a href="http://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>');

var layer = Tangram.leafletLayer({
    scene: styles[currentStyle],
    preUpdate: preUpdate,
    postUpdate: postUpdate,
    attribution: '<a href="https://mapzen.com/tangram">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/">Mapzen</a>'
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
        layer.scene.load(styles[currentStyle]);
        map.setView(locations[currentStyle].slice(0, 2), locations[currentStyle][2]);
    }
}

var api_key = 'mapzen-PvCT6iP';

// ensure there's an api key
scene.subscribe({
    load(event) {
        // Modify the scene config object here. This mutates the original scene
        // config object directly and will not be returned. Tangram does not expect
        // the object to be passed back, and will render with the mutated object.
        injectAPIKey(event.config, api_key);

    }

});



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

    scene.view.camera.axis = {x: x, y: y};

    // offset blue and red for sunset and moonlight effect
    B = x + Math.abs(Math.sin(t+(3.14159*.5)))/4;
    R = y + Math.abs(Math.sin(t*2))/4;

    scene.lights.sun.diffuse = [R, y, B];
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

function getStyleArray(){
  var stylesArr = [];
  for( name in styles){
    stylesArr.push(name);
  }
  return stylesArr;
}

function getCurrentStyle(){
  return currentStyle;
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

// API key enforcement

// regex to detect a mapzen.com url
var URL_PATTERN = /((https?:)?\/\/(vector|tile).mapzen.com([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|\||:)+(topojson|geojson|mvt|png|tif|gz))/;

// 
function isValidMapzenApiKey(string) {
  return (typeof string === 'string' && string.match(/[-a-z]+-[0-9a-zA-Z_-]{7}/));
}

function injectAPIKey(config, apiKey) {
    var didInjectKey = false;

    Object.keys(config.sources).forEach((key) => {

        var value = config.sources[key];
        var valid = false;

        // Only operate on the URL if it's a Mapzen-hosted vector tile service
        if (!value.url.match(URL_PATTERN)) return;

        // Check for valid API keys in the source.
        // First, check theurl_params.api_key field
        // Tangram.js compatibility note: Tangram >= v0.11.7 fires the `load`
        // event after `global` property substitution, so we don't need to manually
        // check global properties here.
        if (value.url_params && value.url_params.api_key &&
            isValidMapzenApiKey(value.url_params.api_key)) {
            valid = true;
        // Next, check if there is an api_key param in the query string
        } else if (value.url.match(/(\?|&)api_key=[-a-z]+-[0-9a-zA-Z_-]{7}/)) {
            valid = true;
        }

        if (!valid) {
            // Add a default API key as a url_params setting.
            // Preserve existing url_params if present.
            var params = Object.assign({}, config.sources[key].url_params, {
                api_key: apiKey
            });

            // turn off overlays for walkabout
            var params2 = Object.assign({}, config.global, {
                sdk_bike_overlay : false,
                sdk_path_overlay : false
            });

            // Mutate the original on purpose.
            config.sources[key].url_params = params;
            config.global = params2;

            didInjectKey = true;
        }
    });

    return didInjectKey;
}
