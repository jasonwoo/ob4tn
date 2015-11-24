function setImageName(name){
    imgname = name;
   //setname = name.split('/')[1].split('.')[0];
   return imgname;
}

function loadGEOJSON(imgname){
	
    imgpx=[],imgpy=[],glon=[],glat=[];

    try{
        $.getJSON(imgname, function(data) {
            //alert("loading geojson now [length="+data.features.length+"]");
            for (var i=0;i<data.features.length;i++){
                imgpx.push(data.features[i].properties.px);
                imgpy.push(data.features[i].properties.py);
                glon.push(data.features[i].properties.ddx);
                glat.push(data.features[i].properties.ddy);
            }
            var pyoff=imgpy[0];
            spacingpx=imgpx[1]-imgpx[0];
            var i=1;
            while (imgpy[i]==pyoff){
                i=i+1;
            }
            cols =i;
            rows = imgpx.length / cols;
            
            spacingpy = imgpy[i] - imgpy[i-1];

            pxmin=imgpx[0];
            pxmax=imgpx[cols-1];
            //pymin=imgpy[0];
            //pymax=imgpy[rows*cols-1];
            pymin=imgpy[rows*cols-1];//changed for mbtiles workflow
            pymax=imgpy[0];//changed for mbtiles workflow
            jsonloaded=true;
            nojson=false;
            //TODO: comment me
           // OpenLayers.Util.getElement("geojsonatt").innerHTML = "GEOJSON attributes: cols=" + cols + " rows=" + rows+" spacingx="+spacingpx+" spacingy="+spacingpy + " pxmin="+pxmin+" pymin="+pymin+" pxmax="+pxmax+" pymax="+pymax;
		
        });
    }catch(e){
        alert("Unable to load GEOJSON ["+imgname+"]");
        nojson = true;
    }
}

function inside(px,py){

    return (px>=pxmin && px<=pxmax && py>=pymin && py<=pymax);

}

function getGeographicCoors(px,py){	
    if (nojson){
       
        return {
            'path':imgname,
            'px':px,
            'py':py,
            'ddx':coornull,
            'ddy':coornull
        };
    }
    var geoCoors = ibilinear(px,py);
    return {
        'path':imgname,
        'px':px,
        'py':py,
        'ddx':geoCoors.longitude,
        'ddy':geoCoors.latitude
       
    };
}

function ibilinear(px,py){
    var lat=0,lon=0,ipx=0,ipy=0;
    var gpy=new Array(),gpx=new Array();
    //var message ="";
    for (var i=0;i<cols;i++){
        gpx.push(imgpx[i]);
    }
    if (px==gpx[cols-1]){
        ipx=cols-2;
    }else{
        for (var i=0;i<cols-1;i++){
            if (gpx[i]<=px && px<gpx[i+1]){
                ipx=i;
                break;
            }
        }
    }
    //message = "[ipx="+ipx;
    for (var i=0;i<rows;i++){
        gpy.push(imgpy[i*cols]);
    }
    if (py==gpy[rows-1]){
        ipy=rows-2;
    }else{
        //for (var i=0;i<rows-1;i++){
          //  if (gpy[i]<=py && py<gpy[i+1]){
            //    ipy=i;
              //  break;
            //}
        //}
        for (var i=0;i<rows-1;i++){
                if (gpy[i]>=py && py>gpy[i+1]){   //change LT GT / mbtiles oblique workflow
                    ipy=i;
                    break;
                }
        }
    }
    
    if (ipx>=0 && ipx>=0){
        //2 3
        //0 1
        var zx =[];
        zx[0]=glon[ipy*cols+ipx];
        zx[1]=glon[ipy*cols+ipx+1];
        zx[2]=glon[(ipy+1)*cols+ipx];
        zx[3]=glon[(ipy+1)*cols+ipx+1];
        var zy=[];
        zy[0]=glat[ipy*cols+ipx];
        zy[1]=glat[ipy*cols+ipx+1];
        zy[2]=glat[(ipy+1)*cols+ipx];
        zy[3]=glat[(ipy+1)*cols+ipx+1];
        var x = (px-imgpx[ipy*cols+ipx])/spacingpx;
        var y = (py-imgpy[ipy*cols+ipx])/spacingpy;

        
        lon = zx[0] * (1.0 - x) * (1.0 - y);
        lon = lon + zx[1] * x * (1.0 - y);
        lon = lon + zx[2] * (1.0 - x) * y;
        lon = lon + zx[3] * x * y;
        lat = zy[0] * (1.0 - x) * (1.0 - y);
        lat = lat + zy[1] * x * (1.0 - y);
        lat = lat + zy[2] * (1.0 - x) * y;
        lat = lat + zy[3] * x * y;
        return {
            'longitude':lon,
            'latitude':lat
        };
    }else{
        return {
            'longitude':coornull,
            'latitude':coornull
        };
    }
}