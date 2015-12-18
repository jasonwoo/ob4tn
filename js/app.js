L.mapbox.accessToken = 'pk.eyJ1IjoiamFzb253b29sIiwiYSI6IlotSzdMTFEifQ.yOU5vTGHsURWuyQT-JmmIw';
//path to tiles
var obliquepth = 'https://coast.noaa.gov/htdata/NGS_oblique/NGSOblique_';

//Mapbox baselayers
var mbStreet2015 = new L.mapbox.tileLayer('jasonwool.h72ph4nm');
var mbSat2015 = new L.mapbox.tileLayer('jasonwool.h73000ad');

//change to Mapquest baselayer
//var mapquestUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', subDomains = ['otile1','otile2','otile3','otile4'],
//mapquestAttrib = 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">&nbspMap data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA.';
//var mbStreet = new L.tileLayer(mapquestUrl, {attribution: mapquestAttrib, subdomains: subDomains});
//end (also fix layer switcher!)

//map for each tab
var map2015;

var center = L.latLng(39.50, -98.35);
var marker, polygonOutline;
var initZoom = 4;
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

//base layers
var baseLayers2015 = {
	"MapBox Satellite": mbSat2015,
	"MapBox Streets": mbStreet2015
	//"MapQuest": mbStreet
};

//overlays
var overlayLayers2015 = {};

//geopixel vars
var imgname, jsonloaded, nojson, rows, cols, spacingpx, spacingpy, imgpx, imgpy, glat, glon;
var coornull = -999999,
	pxmin = 360,
	pxmax = -360,
	pymin = 90,
	pymax = 90;

//oblique vars
var obliquemap, obliquelayer, obliquemapBounds, grid_geojson;
var obliquemapMinZoom = 15;
var obliquemapMaxZoom = 20;
var obliquemapInitZoom = 18;

//styles for debugging
var grid_geojsonMarkerOptions = {
	radius: 8,
	fillColor: "#ff7800",
	color: "#000",
	weight: 1,
	opacity: 0,
	fillOpacity: 0.8
};

function pointToLayer(feature, latlng) {

	//only need this function for debugging//	
	//popup for debugging				
	var popupContent = "<b>id:</b> " + feature.id +
		"<br><b>px:</b> " + feature.properties.px +
		"<br><b>py: </b>" + feature.properties.py +
		"<br><b>ddx: </b>" + feature.properties.ddx +
		"<br><b>ddy: </b>" + feature.properties.ddy;

	return L.circleMarker(latlng, grid_geojsonMarkerOptions).bindPopup(popupContent);
}

function loadGridView(imgname) {

	//only need this function for debugging//

	try {
		$.getJSON(imgname, function(json_data_fps) {
			grid_geojson = L.geoJson(json_data_fps, {

				pointToLayer: function(feature, latlng) {

					//popup for debugging				
					var popupContent = "<b>id:</b> " + feature.id +
						"<br><b>px:</b> " + feature.properties.px +
						"<br><b>py: </b>" + feature.properties.py +
						"<br><b>ddx: </b>" + feature.properties.ddx +
						"<br><b>ddy: </b>" + feature.properties.ddy;

					return L.circleMarker(latlng, grid_geojsonMarkerOptions).bindPopup(popupContent);
				}

			});

			grid_geojson.addTo(obliquemap);
		});

	} catch (e) {
		alert("Unable to load GEOJSON [" + imgname + "]");
		nojson = true;
	}

}

function getDateFromDayNum(dayNum, year) {

	var date = new Date();
	if (year) {
		date.setFullYear(year);
	}
	date.setMonth(0);
	date.setDate(0);
	var timeOfFirst = date.getTime(); // this is the time in milliseconds of 1/1/YYYY
	var dayMilli = 1000 * 60 * 60 * 24;
	var dayNumMilli = dayNum * dayMilli;
	date.setTime(timeOfFirst + dayNumMilli);

	var fmtdate = (months[date.getMonth()]) + ' ' + date.getDate() + ' ' + date.getFullYear();
	return fmtdate;
}


function showSideMap(fname, group, date) {

	$("#eastPane").html('<div id="side"></div>'); //remove the howto and show the obliques

	obliquelayer = null;
	imgname = null;
	acqYear = date.substring(0, 6);

	var $tooltip = $('#tooltip'), // store tooltip in reusable variable
		offset = { // tooltip offset from cursor
			x: 10,
			y: 10
		};

	imgname = 'web/' + acqYear + fname + '.geojson';
	setImageName(imgname);

	obliquemap = L.mapbox.map('side', null, {
		minZoom: obliquemapMinZoom,
		maxZoom: obliquemapMaxZoom,
		maxBounds: null
	}).setView([0, 0], obliquemapInitZoom);

	//set map bounds 
	xmin = [], ymin = [], xmax = [], ymax = [];

	try {

		$.getJSON(imgname, function(data) {

			xmin.push(data.bbox[0]);
			ymin.push(data.bbox[1]);
			xmax.push(data.bbox[2]);
			ymax.push(data.bbox[3]);

			var southWest = L.latLng(ymin[0], xmin[0]),
				northEast = L.latLng(ymax[0], xmax[0]),
				obliquemapBounds = L.latLngBounds(southWest, northEast);

			obliquelayer = L.tileLayer(obliquepth + acqYear.substring(0, 4) + '/' + acqYear + fname + '/{z}/{x}/{y}.jpg', {
				minZoom: obliquemapMinZoom,
				maxZoom: obliquemapMaxZoom,
				bounds: obliquemapBounds,
				errorTileUrl: 'images/clear.png',
				attribution: '<a href="http://www.leafletjs.com/">Leaflet</a>  | <a href="http://www.noaa.gov/">NOAA</a> Imagery',
				//noWrap: true,
				continuousWorld: true
			}).addTo(obliquemap);

			obliquemap.setMaxBounds(obliquemapBounds);
			//obliquemap.setZoom(obliquemapInitZoom);

		});
	} catch (e) {
		alert("Unable to load GEOJSON [" + imgname + "]");
		nojson = true;
	}

	//only needed for grid debugging //these are broken in 0.8-dev
	//loadGridView(imgname);
	loadGEOJSON(imgname);

	obliquemap.on("mouseout", function(e) {
		$tooltip.hide();
	});

	obliquemap.on("mousemove", function(e) {

		var mousex = e.originalEvent.pageX + 10; //Get X coordinates
		var mousey = e.originalEvent.pageY + 10; //Get Y coordinates

		var position = L.latLng(e.latlng.lat, e.latlng.lng);

		if (position != null) {
			//debug
			//var text = "Map X: " + position.lon + "<br/>Map Y: " + position.lat;
			var text = 'Out of Computed Bounds';

			if (inside(position.lng, position.lat)) {

				var latlon = getGeographicCoors(position.lng, position.lat);
				var usng = LLtoUSNG(latlon.ddy, latlon.ddx, 5);

				if (latlon.ddx != coornull && latlon.ddy != coornull) {
					text = "Lon: " + latlon.ddx.toFixed(6) + "<br/>Lat: " + latlon.ddy.toFixed(6) + "<br/>USNG: " + usng;
				}
			}

			//move the tooltip if mousing out of window 
			if ((mousex) > $(window).width()) {
				mousex = e.originalEvent.pageX - 190; //Get X coordinates
			}
			if ((mousey) > $(window).height()) {
				mousey = e.originalEvent.pageY - 70; //Get Y coordinates

			}
			if ((mousex) > $(window).width() && (mousey) > $(window).height()) {
				mousex = e.originalEvent.pageX - 190; //Get X coordinates
				mousey = e.originalEvent.pageY - 70; //Get Y coordinates
			}

			$('#tooltip').css('left', mousex).css('top', mousey).css('display', 'block').html(text);
		}
	});
}

//JQ layout plugin stuff 
$(document).ready(function() {
	$('body').layout({
		applyDefaultStyles: true, //To do. Remove default styles and come up with a css layout
		east: {
			size: 0.45,
			maskObjects: true,
			resizable: false,
			showOverflowOnHover: false
		},
		north: {
			size: 52,
			maskObjects: false,
			resizable: false,
			showOverflowOnHover: true
		},
		//south: {size: 20}, //placeholder for footer
		center: {
			size: 0.55,
			maskObjects: true,
			resizable: false,
			slidable: true,
			showOverflowOnHover: false
		},
		onresize: function() {
			if (map2015) {
				map2015.invalidateSize();
			}
		}
	});

	var southWestNA = L.latLng(17.82, -130.77),
		northEastNA = L.latLng(50.91, -51.34),
		mapBoundsNA = L.latLngBounds(southWestNA, northEastNA);

	map2015 = L.mapbox.map('map2015', undefined, {
		maxZoom: 14,
		maxBounds: mapBoundsNA
	}).addLayer(mbStreet2015).setView(center, initZoom);


	$('#tabs').tab();
	$('a[href$="data2015"]').on('shown.bs.tab', function(e) {
		//$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) 	
		map2015.invalidateSize(false);
	});

	//empty layer and feature groups
	var layers2015 = L.layerGroup().addTo(map2015);
	var grids2015 = L.featureGroup().addTo(map2015);

	var layersControl2015 = new L.Control.Layers(baseLayers2015, overlayLayers2015).addTo(map2015);

	create2015Overlays(map2015, layersControl2015, layers2015, grids2015);


	$('#loading').hide();

	//debugging zoom levels
	function onZoomend() {
		var currentZoom = map2015.getZoom();
		console.log('Zoom level is: ' + currentZoom);
	};
	//map2015.on('zoomend', onZoomend);

	//2015 data utfgrid interactivity
	grids2015.on('click', function(e) {

		if (map2015.hasLayer(polygonOutline)) {
			map2015.removeLayer(polygonOutline);
		}

		if (!e.data) return;
		if (e.data) {
			namefield = e.data.name;
			flightfield = e.data.flight;
			coordarray = JSON.parse(e.data.coords);

			polygonPoints = [];
			for (var i = 0; i < coordarray.length; i++) {
				pts = new L.LatLng(coordarray[i][1], coordarray[i][0]);
				polygonPoints.push(pts);
			}

			polygonOutline = new L.Polygon(polygonPoints, {
				color: "#043e9a",
				weight: 4
			});
			map2015.addLayer(polygonOutline);

			imgDate = getDateFromDayNum(namefield.slice(1, 4), flightfield.slice(0, 4));

			var popup = L.popup()
				.setLatLng(e.latLng)
				.setContent('<div><b>Acquired:</b> ' + imgDate + '<br><b>Image ID:</b> ' + namefield + '<br><a href="' + obliquepth + flightfield.slice(0, 4) + '/' + flightfield.slice(0, 6) + namefield + '.tif" target="_blank">Link</a> to full resolution image<br><a href="' + obliquepth + flightfield.slice(0, 4) + '/' + flightfield.slice(0, 6) + namefield + '.vrt" target="_blank">Link</a> to .vrt for image</div>')
				.openOn(map2015);
		}
		showSideMap(e.data.name, e.data.group, e.data.flight);

	});

	//geocoder	
	$('#searchbox').typeahead({
		name: 'MapBoxGeocoder',
		remote: {
			url: 'https://api.tiles.mapbox.com/v3/jasonwool.h72ph4nm/geocode/%QUERY.json',
			filter: function(parsedResponse) {
				var dataset = [];
				for (i = 0; i < parsedResponse.results.length; i++) {
					dataset.push({
						value: parsedResponse.results[i][0].name,
						layer: 'MapBoxGeocoder',
						lat: parsedResponse.results[i][0].lat,
						lon: parsedResponse.results[i][0].lon
					})
				}
				return dataset;
			}
		},
		minLength: 2,
		limit: 5
	}).on('typeahead:selected', function(obj, datum) {
		if (datum.layer === 'MapBoxGeocoder') {

			if (map2015.hasLayer(marker)) {

				map2015.removeLayer(marker)
			}
			marker = L.marker([datum.lat, datum.lon]).addTo(map2015);
			map2015.setView([datum.lat, datum.lon], 12);

		};
	}).on('typeahead:initialized ', function() {
		$('.tt-dropdown-menu').css('max-height', $('#container').height() - $('.navbar').height() - 20);
		// $('.tt-dropdown-menu').css('min-width', $('.tt-dropdown-menu').width()+50);
	});

	// Placeholder hack for IE
	if (navigator.appName == "Microsoft Internet Explorer") {
		$("input").each(function() {
			if ($(this).val() == "" && $(this).attr("placeholder") != "") {
				$(this).val($(this).attr("placeholder"));
				$(this).focus(function() {
					if ($(this).val() == $(this).attr("placeholder")) $(this).val("");
				});
				$(this).blur(function() {
					if ($(this).val() == "") $(this).val($(this).attr("placeholder"));
				});
			}
		});
	}

}); //end document.ready