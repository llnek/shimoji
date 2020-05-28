/*global Quintus:false, module:false */

var quintusTMX = function(Quintus) {
  "use strict";
  Quintus.TMX = function(Q) {
   Q.assetTypes['tmx'] = 'TMX';
   Q.loadAssetTMX = function(key,src,cb,ecb) {
     // Piggyback on loadAssetOther's AJAX call
     Q.loadAssetOther(key,src,function(key,responseText) {
       let parser = new DOMParser();
       let doc = parser.parseFromString(responseText, "application/xml");
       cb(key,doc);
     }, ecb);
   };
   Q._tmxExtractAssetName = function(result) {
     let source = result.getAttribute("source"),
     sourceParts = source.split("/");
     // only return the last part of the asset string
     return sourceParts[sourceParts.length - 1];
   };

   Q._tmxExtractSources = function(asset) {
     let results = asset.querySelectorAll("[source]");
     return _.map(results,Q._tmxExtractAssetName);
   };

   Q.loadTMX = function(files,callback,options) {
     if(_.isString(files)) {
       files = Q._normalizeArg(files);
     }

     let additionalAssets = [];
     let tmxFiles = [];

     _.doseq(files,(file) => {
       if(Q._fileExtension(file) === 'tmx')
       tmxFiles.push(file);
     });

     Q.load(files,function() {
       _.doseq(tmxFiles,(tmxFile) => {
         let sources = Q._tmxExtractSources(Q.asset(tmxFile));
         additionalAssets = additionalAssets.concat(sources);
       });

       if(additionalAssets.length > 0)
         Q.load(additionalAssets,callback,options);
       else
         callback();
     });
   };

   function attr(elem,atr) {
     let value = elem.getAttribute(atr);
     return isNaN(value) ? value : +value;
   }

   function parseProperties(elem) {
     let propElems = elem.querySelectorAll("property"),
         props = {};

     for(let i = 0; i < propElems.length; ++i) {
       let propElem = propElems[i];
       props[attr(propElem,'name')] = attr(propElem,'value');
     }
     return props;
   }

   Q._tmxLoadTilesets = function(tilesets, tileProperties) {
     let gidMap = [];

     function parsePoint(pt) {
       let pts = pt.split(",");
       return [ parseFloat(pts[0]), parseFloat(pts[1]) ];
     }

     tilesets.forEach(tileset => {
       let sheetName = attr(tileset,"name"),
           gid = attr(tileset,"firstgid"),
           assetName = Q._tmxExtractAssetName(tileset.querySelector("image")),
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
       Q.sheet(sheetName, assetName,  tilesetProps);
     }

     return gidMap;
   };

   Q._tmxProcessImageLayer = function(stage,gidMap,tileProperties,layer) {
     let assetName = Q._tmxExtractAssetName(layer.querySelector("image"));
     let properties = parseProperties(layer);
     properties.asset = assetName;
     stage.insert(new Q.Repeater(properties));
   };

   // get the first entry in the gid map that gives
   // a gid offset
   Q._lookupGid = function(gid,gidMap) {
     let idx = 0;
     while(gidMap[idx+1] &&
           gid >= gidMap[idx+1][0]) { ++idx; }
     return gidMap[idx];
   };

   Q._tmxProcessTileLayer = function(stage,gidMap,tileProperties,layer) {
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
             gidDetails = Q._lookupGid(attr(tiles[idx],"gid"),gidMap);
             gidOffset = gidDetails[0];
             sheetName = gidDetails[1];
           }
           data[y].push(gid - gidOffset);
         }
         ++idx;
       }
     }

     let tileLayerProperties = _.inject({
       tileW: Q.sheet(sheetName).tileW,
       tileH: Q.sheet(sheetName).tileH,
       sheet: sheetName,
       tiles: data
       },parseProperties(layer));

     let TileLayerClass = tileLayerProperties.Class || 'TileLayer';

     if(tileLayerProperties['collision'])
       stage.collisionLayer(new Q[TileLayerClass](tileLayerProperties));
     else
       stage.insert(new Q[TileLayerClass](tileLayerProperties));
   };

   Q._tmxProcessObjectLayer = function(stage,gidMap,tileProperties,layer) {
     let objects = layer.querySelectorAll("object");
     for(let i=0;i < objects.length;++i) {
       let obj = objects[i],
           gid = attr(obj,"gid"),
           x = attr(obj,'x'),
           y = attr(obj,'y'),
           properties = tileProperties[gid],
           overrideProperties = parseProperties(obj);

       if(!properties)
         throw "Missing TMX Object props for GID:" + gid;
       if(!properties['Class'])
         throw "Missing TMX Object Class for GID:" + gid;

       let className = properties['Class'];
       if(!className)
         throw "Bad TMX Object Class: " + className + " GID:" + gid;

       let p = _.inject(_.inject({ x: x, y: y }, properties), overrideProperties);
       // Offset the sprite
       let sprite = new Q[className](p);
       sprite.p.x += sprite.p.w/2;
       sprite.p.y -= sprite.p.h/2;
       stage.insert(sprite);
     }
   };

   Q._tmxProcessors = { 'objectgroup': Q._tmxProcessObjectLayer,
                        'layer': Q._tmxProcessTileLayer,
                        'imagelayer': Q._tmxProcessImageLayer };

   Q.stageTMX = function(dataAsset,stage) {
      let data = _.isString(dataAsset) ? Q.asset(dataAsset) : dataAsset;
      let tileProperties = {};
      // Load Tilesets
      let tilesets = data.getElementsByTagName("tileset");
      let gidMap = Q._tmxLoadTilesets(tilesets,tileProperties);
      // Go through each of the layers
      _.doseq(data.documentElement.childNodes,(layer) => {
        let layerType = layer.tagName;
        if(Q._tmxProcessors[layerType])
          Q._tmxProcessors[layerType](stage, gidMap, tileProperties, layer);
      });
    };

  };

};


if(typeof Quintus === 'undefined') {
  module.exports = quintusTMX;
} else {
  quintusTMX(Quintus);
}
