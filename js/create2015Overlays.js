function create2015Overlays(mapObject, ctrl, lyrgrp, featgrp){

	var premapOverlay;

	var xhr = new XMLHttpRequest();
	xhr.open('GET', '2015-imagery.json', true);

/**
 * onload handler for the XHR request.
 */
xhr.onload = function() {
  if (xhr.status == 200) {
	
    premapOverlay = JSON.parse(xhr.responseText);

	premapOverlay.forEach(function(l) {

		if (l.key == "mbtiles"){

			lyr=l.id+"mbtiles";
				
			 lyr= new L.mapbox.tileLayer(l.url,{errorTileUrl: 'images/clear.png'});
					//errorTileUrl: 'http://storms.ngs.noaa.gov/storms/scripts/images/clear.png'}).addTo(mapObject).bringToFront();

		    lyr.addTo(lyrgrp);
		}

		if (l.key == "utfgrd"){

			lyr=l.id+"utfgrd";
				
			lyr= new L.mapbox.gridLayer(l.url);
					
		    lyr.addTo(featgrp);
		}
		
		if (l.key == "xyz"){

			lyr=l.id+"xyz";
				
			lyr= new L.mapbox.tileLayer(l.url,{tileSize:256, minZoom: 0, maxZoom: 18,
					//errorTileUrl: 'http://storms.ngs.noaa.gov/storms/scripts/images/clear.png'}).addTo(mapObject).bringToFront();
					errorTileUrl: 'images/clear.png'});

		    lyr.addTo(lyrgrp); 
		    ctrl.addOverlay(lyr,"&nbsp&nbsp;<i class='fa fa-camera-retro fa-lg'></i>&nbsp&nbsp;<font color='red'>Oct 2015 Post-Storm RGB Imagery</font>");

		}

		if (l.key == "tiles"){

			lyr =l.id+"tiles"
			
			 lyr= new L.geoJson(null,{onEachFeature: onEachFeature, style: polyStyle});
			
			$.getJSON(l.url,function(json_data){
					lyr.addData(json_data);
			});
			//Uncomment to load GeoJson tiles on initial page load
			mapObject.addLayer(lyr);
			ctrl.addOverlay(lyr,"Tiles&nbsp&nbsp;<i class='fa fa-th fa-lg'></i>");
			
		}
	
     }); //end foreach
	
	//Add the Layer group
	ctrl.addOverlay(lyrgrp, "&nbsp&nbsp;<i class='fa fa-camera-retro fa-lg'></i>&nbsp&nbsp;<font color='red'>2015 Oblique Imagery</font>");
  }
};
xhr.send();
}