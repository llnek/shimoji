(function(global){
  "use strict";
  let Mojo = global.Mojo, _= Mojo._;
  Mojo.TMX = function(Mo) {
   Mo.assetTypes['tmx'] = 'TMX';
   Mo.loadAssetTMX = function(key,src,cb,ecb) {
     // Piggyback on loadAssetOther's AJAX call
     Mo.loadAssetOther(key,src,function(key,responseText) {
       let parser = new DOMParser();
       let doc = parser.parseFromString(responseText, "application/xml");
       cb(key,doc);
     }, ecb);
   };
   Mo._tmxExtractAssetName = function(result) {
     let source = result.getAttribute("source"),
     sourceParts = source.split("/");
     // only return the last part of the asset string
     return sourceParts[sourceParts.length - 1];
   };

   Mo._tmxExtractSources = function(asset) {
     let results = asset.querySelectorAll("[source]");
     return _.map(results,Mo._tmxExtractAssetName);
   };

   Mo.loadTMX = function(files,callback,options) {
     let additionalAssets = [];
     let tmxFiles = [];

     files=_.seq(files);
     _.doseq(files,(file) => {
       if(Mo._fileExtension(file) === 'tmx')
       tmxFiles.push(file);
     });

     Mo.load(files,function() {
       _.doseq(tmxFiles,(tmxFile) => {
         let sources = Mo._tmxExtractSources(Mo.asset(tmxFile));
         additionalAssets = additionalAssets.concat(sources);
       });

       (additionalAssets.length > 0)
         ? Mo.load(additionalAssets,callback,options) : callback();
     });
   };

   function attr(elem,atr) {
     let value = elem.getAttribute(atr);
     return isNaN(value) ? value : +value;
   }

   function parseProperties(elem) {
     let props={},
         propElems = elem.querySelectorAll("property");

     for(let i = 0; i < propElems.length; ++i) {
       let propElem = propElems[i];
       props[attr(propElem,'name')] = attr(propElem,'value');
     }
     return props;
   }

   Mo._tmxLoadTilesets = function(tilesets, tileProperties) {
     let gidMap = [];
     function parsePoint(pt) {
       let pts = pt.split(",");
       return [ parseFloat(pts[0]), parseFloat(pts[1]) ];
     }
     tilesets.forEach(tileset => {
       let sheetName = attr(tileset,"name"),
           gid = attr(tileset,"firstgid"),
           assetName = Mo._tmxExtractAssetName(tileset.querySelector("image")),
           tilesetTileProps = {},
           tilesetProps = { tileW: attr(tileset,"tilewidth"),
                            tileH: attr(tileset,"tileheight"),
                            spacingX: attr(tileset,"spacing"),
                            spacingY: attr(tileset,"spacing") };
       let tiles = tileset.querySelectorAll("tile");
       for(let i = 0;i < tiles.length;++i) {
         let tile = tiles[i];
         let tileId = attr(tile,"id");
         let tileGid = gid + tileId;
         let properties = parseProperties(tile);
         if(properties.points)
           properties.points = _.map(properties.points.split(" "),parsePoint);

         // save the properties indexed by GID for creating objects
         tileProperties[tileGid] = properties;
         // save the properties indexed by tile number for the frame properties
         tilesetTileProps[tileId] = properties;
       }
       tilesetProps.frameProperties = tilesetTileProps;
       gidMap.push([ gid, sheetName ]);
       Mo.sheet(sheetName, assetName,  tilesetProps);
     });

     return gidMap;
   };

   Mo._tmxProcessImageLayer = function(stage,gidMap,tileProperties,layer) {
     let assetName = Mo._tmxExtractAssetName(layer.querySelector("image"));
     let properties = parseProperties(layer);
     properties.asset = assetName;
     stage.insert(new Mo.Repeater(properties));
   };

   // get the first entry in the gid map that gives
   // a gid offset
   Mo._lookupGid = function(gid,gidMap) {
     let idx = 0;
     while(gidMap[idx+1] &&
           gid >= gidMap[idx+1][0]) { ++idx; }
     return gidMap[idx];
   };

   Mo._tmxProcessTileLayer = function(stage,gidMap,tileProperties,layer) {
     let tiles = layer.querySelectorAll("tile"),
         width = attr(layer,'width'),
         height = attr(layer,'height');
     let gidDetails,gidOffset, sheetName;
     let idx=0, data = [];

     for(let y=0;y<height;++y) {
       data[y] = [];
       for(let x=0;x<width;++x) {
         let gid = attr(tiles[idx],"gid");
         if(gid === 0) {
           data[y].push(null);
         } else {
           // If we don't know what tileset this map is associated with
           // figure it out by looking up the gid of the tile w/
           // and match to the tilesef
           if(!gidOffset) {
             gidDetails = Mo._lookupGid(attr(tiles[idx],"gid"),gidMap);
             gidOffset = gidDetails[0];
             sheetName = gidDetails[1];
           }
           data[y].push(gid - gidOffset);
         }
         ++idx;
       }
     }

     let tileLayerProperties = _.inject({
       tileW: Mo.sheet(sheetName).tileW,
       tileH: Mo.sheet(sheetName).tileH,
       sheet: sheetName,
       tiles: data
       },parseProperties(layer));

     let TileLayerClass = tileLayerProperties.Class || 'TileLayer';

     (tileLayerProperties['collision'])
       ? stage.collisionLayer(new Mo[TileLayerClass](tileLayerProperties))
       : stage.insert(new Mo[TileLayerClass](tileLayerProperties));
   };

   Mo._tmxProcessObjectLayer = function(stage,gidMap,tileProperties,layer) {
     let objects = layer.querySelectorAll("object");
     for(let i=0;i < objects.length;++i) {
       let obj = objects[i],
           gid = attr(obj,"gid"),
           x = attr(obj,"x"),
           y = attr(obj,"y"),
           properties = tileProperties[gid],
           overrideProperties = parseProperties(obj);

       if(!properties)
         throw "Missing TMX Object props for GID:" + gid;
       if(!properties['Class'])
         throw "Missing TMX Object Class for GID:" + gid;

       let className = properties["Class"];
       if(!className)
         throw "Bad TMX Object Class: " + className + " GID:" + gid;

       let p = _.inject(_.inject({ x: x, y: y }, properties), overrideProperties);
       // Offset the sprite
       let sprite = new Mo[className](p);
       sprite.p.x += sprite.p.w/2;
       sprite.p.y -= sprite.p.h/2;
       stage.insert(sprite);
     }
   };

   Mo._tmxProcessors = {"objectgroup": Mo._tmxProcessObjectLayer,
                        "layer": Mo._tmxProcessTileLayer,
                        "imagelayer": Mo._tmxProcessImageLayer };

   Mo.stageTMX = function(dataAsset,stage) {
      let data = _.isString(dataAsset) ? Mo.asset(dataAsset) : dataAsset;
      let tileProperties = {};
      // Load Tilesets
      let tilesets = data.getElementsByTagName("tileset");
      let gidMap = Mo._tmxLoadTilesets(tilesets,tileProperties);
      // Go through each of the layers
      _.doseq(data.documentElement.childNodes,(layer) => {
        let layerType = layer.tagName;
        if(Mo._tmxProcessors[layerType])
          Mo._tmxProcessors[layerType](stage, gidMap, tileProperties, layer);
      });
    };

  };


})(this);

