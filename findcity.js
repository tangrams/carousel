// dependencies: jQuery, select2
var CITY_DATA

$.get('https://gist.githubusercontent.com/randymeech/e9398d4f6fb827e2294a/raw/e24f159af024d402912707c88b26d7361932f906/top-1000-cities.json', function (data) {
    CITY_DATA = JSON.parse(data);
    CITY_DATA.sort(function (a, b) {
        if (a.name < b.name)
            return -1;
        if (a.name > b.name)
            return 1;
        return 0;
    });

    $(document).ready(function () {
        var $select = $('.js-citylocate-select2');
        CITY_DATA.forEach(function (item) {
            $select.append('<option value="' + item.name + '" data-lat="' + item.lat + '" data-lng="' + item.lng + '" data-zoom="' + item.zoom + '">' + item.name + '</option>')
        })

        $select.select2({
            placeholder: 'Find a city...'
        });

        $select.on('select2:select', function (e) {
            /* global map */
            var el = e.params.data.element
            var lat = el.dataset.lat
            var lng = el.dataset.lng
            var zoom = (el.dataset.zoom === 'undefined') ? null : el.dataset.zoom;
            console.log(el, lat, lng, zoom)
            if (zoom) {
                map.setView([lat, lng], zoom);
            } else {
                map.setView([lat, lng]);
            }
        })
    });
})
