/*** Map ***/

var styles = {
    "daycycle": "styles/daynight.yaml",
    "walkabout": "https://www.nextzen.org/carto/walkabout-style/8/walkabout-style.zip",
    "crosshatch": "styles/crosshatch.yaml",
    "tron": "https://www.nextzen.org/carto/tron-style/6/tron-style.zip",
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
    attribution: '<a href="https://mapzen.com/tangram">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/">Mapzen</a>'
});

var scene = layer.scene;

layer.on('init', function() {
   // everything's good, carry on
  window.addEventListener('resize', resizeMap);
  resizeMap();
  scene.requestRedraw();
  scene.immediateRedraw();
});

layer.on('error', function(error) {
  // something went wrong
  var errorEL = document.createElement('div');
  errorEL.setAttribute("class", "error-msg");
     // WebGL not supported (or at least didn't initialize properly!)
  if (layer.scene && !layer.scene.gl) {
    var noticeTxt = document.createTextNode("Tangram says WebGL didn't initialize properly! Your browser may not support it.");
    errorEL.appendChild(noticeTxt);
   }
   // Something else went wrong, generic error message
   else {
    var noticeTxt = document.createTextNode("Tangram says something went wrong! Our apologies.");
    errorEL.appendChild(noticeTxt);
   }
   document.body.appendChild(errorEL);
});

layer.addTo(map);

function setLocation(style) {
    map.setView(locations[style].slice(0, 2), locations[style][2]);
}

setLocation(currentStyle);
var hash = new L.Hash(map);

// Resize map to window
function resizeMap() {
    document.getElementById('map').style.width = window.innerWidth + 'px';
    document.getElementById('map').style.height = window.innerHeight + 'px';
    map.invalidateSize(false);
}

function switchStyles(style) {
    if (!styles[style]) return false;
    function loadStyle(style) {
        layer.scene.load(styles[style]).then(() => {
            if (layer.scene.config_source !== styles[style]) {
                scene.updateConfig().then(() => {
                    loadStyle(style);
                    return false;
                });
            }
            setLocation(style);
        });
    };
    loadStyle(style);
    currentStyle = style;
}

var api_key = 'NaqqS33fTUmyQcvbuIUCKA';

// ensure there's an api key
scene.subscribe({
    load(event) {
        // Modify the scene config object here. This mutates the original scene
        // config object directly and will not be returned. Tangram does not expect
        // the object to be passed back, and will render with the mutated object.
        injectAPIKey(event.config, api_key);
        if (currentStyle == "daycycle") {
            if (daycycleTimer == null) {
                daycycleTimer = setInterval(daycycle, 100);
            }
        }
        scene.requestRedraw();
        scene.immediateRedraw();
    }

});

var daycycleTimer = null;

function preUpdate(will_render) {
    if (!will_render) {
        return;
    }

    if (currentStyle == "daycycle") {
        if (daycycleTimer == null) {
            daycycleTimer = setInterval(daycycle, 100);
        }
    } else {
        clearInterval(daycycleTimer);
        daycycleTimer = null;
    }
}

function postUpdate() {
}

function daycycle() {
    if (currentStyle !== "daycycle") return;
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

    scene.requestRedraw();
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
var URL_PATTERN = /((https?:)?\/\/(vector|tile).nextzen.org([a-z]|[A-Z]|[0-9]|\/|\{|\}|\.|\||:)+(topojson|geojson|mvt|png|tif|gz))/;


function isValidMapzenApiKey(string) {
  return (typeof string === 'string' && string.match(/[-a-z]+-[0-9a-zA-Z_-]{7}/));
}

function injectAPIKey(config, apiKey) {

    Object.keys(config.sources).forEach((key) => {

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

    });
}
