/*** Map ***/

var styles = {
    "daycycle": "daynight.yaml",

    "highways": "//cdn.rawgit.com/tangrams/highways-demo/a95a428fad9adcf07df1118c859e317c52e1b5c1/scene.yaml",

    // "halftone": "https://cdn.rawgit.com/tangrams/carousel/cc6f7c0a6c0210b234bb8e6444fc3876ea8d6bff/halftone.yaml",
    "halftone": "halftone.yaml",

    "tron": "https://cdn.rawgit.com/tangrams/tangram-sandbox/1be266e772eff5179c11da9f2ce27458934158a5/styles/tron.yaml",

    "traditional": "https://cdn.rawgit.com/tangrams/tangram/ea1229690710291caa4490df19404b483206d86c/demos/scene.yaml"
};

var map = L.map('map',
    {'keyboardZoomOffset': .05}
);

var layer = Tangram.leafletLayer({
    scene: styles['daycycle'],
    preUpdate: preUpdate,
    postUpdate: postUpdate,
    attribution: 'Map data &copy; OSM contributors'
});

window.layer = layer;
window.scene = layer.scene;

layer.addTo(map);

map.setView([40.7076, -74.0094], 15);

var hash = new L.Hash(map);

// Resize map to window
function resizeMap() {
    document.getElementById('map').style.width = window.innerWidth + 'px';
    document.getElementById('map').style.height = window.innerHeight + 'px';
    map.invalidateSize(false);
}

function switchStyles(style) {
    console.log("style:", style);
    currentStyle = style;
    layer.scene.reload(styles[style]);
}


function preUpdate() {
}

function postUpdate() {
    switch(currentStyle) {
        case "daycycle":
            daycycle();
            break;
    }
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

var currentStyle = "daycycle";

switchStyles("daycycle");


window.addEventListener('resize', resizeMap);
resizeMap();


// iFrame integration
    window.addEventListener("DOMContentLoaded", function() {
      if (window.self !== window.top) {
        //sending message that child frame is ready to parent window
        window.parent.postMessage("loaded", "*");
        window.addEventListener("message", function(e) {
          ///** event that happens with parent data
          console.log("got message:");
          console.log("*"+e.data+"*");

          switchStyles(e.data);

          // testEvent(e.data);
        }, false);
      }else{
        console.log("not iframed!");
      }
    }, false);


    //replace this function to real cool one
    function testEvent(message){
      console.log("happening");
      console.log(message);
      document.getElementsByClassName("testdiv")[0].innerHTML = message;
    }

