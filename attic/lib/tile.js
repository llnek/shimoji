/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright © 2020, Kenneth Leung. All rights reserved. */

(function(global,undefined){
  "use strict";
  let MojoH5 = global.MojoH5;

  /**
   * @module
   */
  MojoH5.Tiles = function(Mojo) {

    let _= Mojo.u,
        is=Mojo.is;

    /**
     * @public
     * @function
     */
    Mojo.loaders.Tile= (key,src,cb,ecb) => {
      Mojo.loaders.Xml(key,src, (k,xml) => { cb(k,xml); }, ecb);
    };

    /**
     * @private
     * @function
     */
    let _extractAssetName = (result) => {
      let s= result.getAttribute("source"),
          p= s.split("/");
      return p[p.length - 1];
    };

    /**
     * @private
     * @function
     */
    let _attr = (elem,atr) => {
      let value = elem.getAttribute(atr);
      return isNaN(value) ? value : +value;
    };

    /**
     * @private
     * @function
     */
    let _parseProperties= (elem) => {
      let props={};
      elem.querySelectorAll("property").forEach(pe => {
        props[_attr(pe,"name")] = _attr(pe,"value");
      });
      return props;
    };

    /**
     * @private
     * @function
     */
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
        _.conj(gidMap,[gid, sheetName]);
        Mojo.sheet(sheetName, assetName,  tilesetProps);
      };
      return gidMap;
    };

    /**
     * @private
     * @function
     */
    let _processImageLayer = (scene,gidMap,tileProperties,layer) => {
      let properties = _parseProperties(layer),
          assetName = _extractAssetName(layer.querySelector("image"));
      properties.asset = assetName;
      scene.insert(new Mojo.Repeater(properties));
    };

    //get the first entry in the gid map that gives
    //a gid offset
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
          gidDetails, gidOffset, sheetName, idx=0, data = [];
      for(let y=0;y<height;++y) {
        data[y] = [];
        for(let gid, x=0;x<width;++x) {
          if((gid = _attr(tiles[idx],"gid"))===0)
            _.conj(data[y], null);
          else {
            // If we don't know what tileset this map is associated with
            // figure it out by looking up the gid of the tile w/
            // and match to the tilesef
            if(!gidOffset) {
              gidDetails = _lookupGid(_attr(tiles[idx],"gid"),gidMap);
              gidOffset = gidDetails[0];
              sheetName = gidDetails[1];
            }
            _.conj(data[y],(gid - gidOffset));
          }
          ++idx;
        }
      }
      let sht= Mojo.sheet(sheetName),
          tileLayerProps =
          _.inject({tileW: sht.tileW,
                    tileH: sht.tileH,
                    tiles: data,
                    sheet: sheetName}, _parseProperties(layer)),
          TCZ = Mojo[tileLayerProps.Class || "TileLayer"];
      !tileLayerProps["collision"]
        ? scene.insert(new TCZ(tileLayerProps))
        : scene.addOverlay(new TCZ(tileLayerProps));
    };

    let _processObjectLayer= (scene,gidMap,tileProperties,layer) => {
      layer.querySelectorAll("object").forEach(obj => {
        let gid = _attr(obj,"gid"),
            x = _attr(obj,"x"),
            y = _attr(obj,"y"),
            props = tileProperties[gid],
            overrideProps = _parseProperties(obj);
        if(!props)
          throw "Missing TMX Object props for GID:" + gid;
        let className = props["Class"];
        if(!className)
          throw "Missing TMX Object Class for GID:" + gid;
        let p = _.inject({ x: x, y: y }, props, overrideProps),
            sprite = new Mojo[className](p);
        // offset the sprite
        sprite.p.x += sprite.p.w/2;
        sprite.p.y -= sprite.p.h/2;
        scene.insert(sprite);
      });
    };

    let _tmxProcessors = {imagelayer: _processImageLayer,
                          layer: _processTileLayer,
                          objectgroup: _processObjectLayer};
    Mojo.parseTMX = function(dataAsset,scene) {
      let data = is.str(dataAsset) ? Mojo.asset(dataAsset) : dataAsset,
          tag,
          tileProperties = {},
          tilesets = data.getElementsByTagName("tileset"),
          gidMap = _loadTilesets(tilesets,tileProperties);
      _.doseq(data.documentElement.childNodes, (layer) => {
        tag = layer.tagName;
        if(_tmxProcessors[tag])
          _tmxProcessors[tag](scene, gidMap, tileProperties, layer);
      });
    };


    return Mojo;
  };

})(this);


