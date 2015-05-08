// dependencies: jQuery, select2
var CITY_DATA

$.get('./data/cities.json', function (data) {
    CITY_DATA = data;
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
            $select.append('<option value="' + item.name + '" data-lat="' + item.lat + '" data-lng="' + item.lng + '">' + item.name + '</option>')
        })

        $select.select2({
            placeholder: 'Find a city...'
        });

        $select.on('select2:select', function (e) {
            /* global map */
            var el = e.params.data.element
            var lat = el.dataset.lat
            var lng = el.dataset.lng
            console.log(el, lat, lng)
            map.setView([lat, lng]);
        })
    });
})
