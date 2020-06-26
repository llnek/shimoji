(function(global,undefined){

  "use strict";
  let MojoH5 = global.MojoH5;

  MojoH5.Tiles = function(Mojo) {

    let _= Mojo.u,
        is=Mojo.is;

    Mojo.loaders.Tile= (key,src,cb,ecb) => {
      Mojo.loaders.Xml(key,src,
        (k,xml) => { cb(k,xml); }, ecb);
    };

    let _extractAssetName = (result) => {
      let s= result.getAttribute("source"),
          p= s.split("/");
      return p[p.length - 1];
    };

    let _attr = (elem,atr) => {
      let value = elem.getAttribute(atr);
      return isNaN(value) ? value : +value;
    };

    let _parseProperties= (elem) => {
      let props={},
          elems= elem.querySelectorAll("property");
      elems.forEach(pe => {
        props[_attr(pe,"name")] = _attr(pe,"value");
      });
      return props;
    };

    let _loadTilesets = function(tilesets, tileProperties) {
      let gidMap = [],
          parsePoint = (pt) => {
            let pts = pt.split(",");
            return [parseFloat(pts[0]), parseFloat(pts[1])];
          };
      for(let tileset,i=0;i<tilesets.length;++i) {
        tileset = tilesets[i];
        let sheetName = _attr(tileset,"name"),
            gid = _attr(tileset,"firstgid"),
            tilesetTileProps = {},
            assetName = _extractAssetName(tileset.querySelector("image")),
            tilesetProps = {tileW: _attr(tileset,"tilewidth"),
                            tileH: _attr(tileset,"tileheight"),
                            spacingX: _attr(tileset,"spacing"),
                            spacingY: _attr(tileset,"spacing")};
        tileset.querySelectorAll("tile").forEach(tile => {
          let tileId = _attr(tile,"id"),
              tileGid = gid + tileId,
              properties = _parseProperties(tile);
          if(properties.points)
            properties.points = _.map(properties.points.split(" "),parsePoint);
          // save the properties indexed by GID for creating objects
          tileProperties[tileGid] = properties;
          // save the properties indexed by tile number for the frame properties
          tilesetTileProps[tileId] = properties;
        });
        tilesetProps.frameInfo= tilesetTileProps;
        gidMap.push([gid, sheetName]);
        Mojo.sheet(sheetName, assetName,  tilesetProps);
      };
      return gidMap;
    };

    let _processImageLayer = (scene,gidMap,tileProperties,layer) => {
      let properties = _parseProperties(layer),
          assetName = _extractAssetName(layer.querySelector("image"));
      properties.asset = assetName;
      scene.insert(new Mojo.Repeater(properties));
    };

    // get the first entry in the gid map that gives
    // a gid offset
    let _lookupGid = (gid,gidMap) => {
      let idx = 0;
      while(gidMap[idx+1] &&
            gid >= gidMap[idx+1][0]) ++idx;
      return gidMap[idx];
    };

    let _processTileLayer = (scene,gidMap,tileProperties,layer) => {
      let tiles = layer.querySelectorAll("tile"),
          width = _attr(layer,"width"),
          height =_attr(layer,"height"),
          gidDetails,
          gidOffset,
          sheetName,
          idx=0, data = [];
      for(let y=0;y<height;++y) {
        data[y] = [];
        for(let gid, x=0;x<width;++x) {
          if((gid = _attr(tiles[idx],"gid"))===0)
            data[y].push(null);
          else {
            // If we don't know what tileset this map is associated with
            // figure it out by looking up the gid of the tile w/
            // and match to the tilesef
            if(!gidOffset) {
              gidDetails = _lookupGid(_attr(tiles[idx],"gid"),gidMap);
              gidOffset = gidDetails[0];
              sheetName = gidDetails[1];
            }
            data[y].push(gid - gidOffset);
          }
          ++idx;
        }
      }
      let tileLayerProperties = _.inject({
       tileW: Mojo.sheet(sheetName).tileW,
       tileH: Mojo.sheet(sheetName).tileH,
       sheet: sheetName,
       tiles: data
      }, _parseProperties(layer));
      let TCZ = Mojo[tileLayerProperties.Class || "TileLayer"];
      !tileLayerProperties["collision"]
        ? scene.insert(new TCZ(tileLayerProperties))
        : scene.addOverlay(new TCZ(tileLayerProperties));
    };

    let _processObjectLayer= (scene,gidMap,tileProperties,layer) => {
      let objects = layer.querySelectorAll("object");
      for(let i=0;i < objects.length;++i) {
        let obj = objects[i],
            gid = _attr(obj,"gid"),
            x = _attr(obj,"x"),
            y = _attr(obj,"y"),
            properties = tileProperties[gid],
            overrideProperties = _parseProperties(obj);
        if(!properties)
          throw "Missing TMX Object props for GID:" + gid;
        let className = properties["Class"];
        if(!className)
          throw "Missing TMX Object Class for GID:" + gid;
        let p = _.inject({ x: x, y: y }, properties, overrideProperties);
        let sprite = new Mojo[className](p);
        // offset the sprite
        sprite.p.x += sprite.p.w/2;
        sprite.p.y -= sprite.p.h/2;
        scene.insert(sprite);
      }
    };

    let _tmxProcessors = {objectgroup: _processObjectLayer,
                          layer: _processTileLayer, imagelayer: _processImageLayer };

    Mojo.parseTMX = function(dataAsset,scene) {
      let data = is.str(dataAsset) ? Mojo.asset(dataAsset) : dataAsset;
      let tileProperties = {};
      let tilesets = data.getElementsByTagName("tileset");
      let gidMap = _loadTilesets(tilesets,tileProperties);
      _.doseq(data.documentElement.childNodes,(layer) => {
        let tag = layer.tagName;
        _tmxProcessors[tag] &&
          _tmxProcessors[tag](scene, gidMap, tileProperties, layer);
      });
    };


    return Mojo;
  };

})(this);


