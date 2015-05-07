/*** Map ***/

var map = L.map('map',
    {'keyboardZoomOffset': .05}
);

var layer = Tangram.leafletLayer({
    scene: 'daycycle.yaml',
    preUpdate: preUpdate,
    postUpdate: postUpdate,
    attribution: 'Map data &copy; OpenStreetMap contributors'
});

window.layer = layer;
window.scene = layer.scene;

layer.addTo(map);

map.setView([40.70531887544228, -74.00976419448853], 15);

var hash = new L.Hash(map);

// Resize map to window
function resizeMap() {
    document.getElementById('map').style.width = window.innerWidth + 'px';
    document.getElementById('map').style.height = window.innerHeight + 'px';
    map.invalidateSize(false);
}

var currentStyle = "daycycle";

function switchStyles(style) {
    console.log("style:", style);
    currentStyle = style;
    switch(style) {
        case "daycycle":
            url = style + ".yaml";
            break;
        case "highways":
            url = "https://cdn.rawgit.com/tangrams/highways-demo/fd756b5f7c789f71d26bf62b18b98a7dcb7eb468/scene.yaml"
            break;
    }
    layer.scene.config_source = url;
    layer.scene.reload();
    // layer.scene.reload(url);
}

switchStyles("daycycle");

function preUpdate() {
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
    scene.styles["roads"].material.emission.amount = [-py, -py, -py, 1];
    scene.styles["water"].material.ambient.amount = [py+1, py+1, py+1, 1];
    scene.styles["water"].material.diffuse.amount = [py+1, py+1, py+1, 1];
    
    ba = -py*.75+.75; // building ambient
    scene.styles["buildings"].material.ambient.amount = [ba, ba, ba, 1];

    scene.animated = true;
}

window.addEventListener('resize', resizeMap);
resizeMap();
