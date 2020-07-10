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

  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded.";

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
    let _getImage = (obj) => {
      let s= obj.querySelector("image"),
          p= s && s.getAttribute("source").split("/");
      return p && p.length > 0 && p[p.length-1];
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
    let _parsePoint = (pt) => {
      let pts = pt.split(",");
      return [parseFloat(pts[0]), parseFloat(pts[1])];
    };

    //get the first entry in the gid map that gives
    //a gid offset
    let _lookupGid = (gid,gidMap) => {
      let idx = 0;
      while(gidMap[idx+1] &&
            gid >= gidMap[idx+1][0]) ++idx;
      return gidMap[idx];
    };

    /**
     * @private
     * @function
     */
    let _scanTilesets = function(tilesets, tileProperties) {
      let gidMap = [];
      for(let ts,i=0;i<tilesets.length;++i) {
        ts = tilesets[i];
        let tsProps = {},
            name = _attr(ts,"name"),
            gid = _attr(ts,"firstgid");
        ts.querySelectorAll("tile").forEach(tile => {
          let tileId = _attr(tile,"id"),
              tileGid = gid + tileId,
              properties = _parseProperties(tile);
          if(properties.points)
            properties.points = _.map(properties.points.split(" "),_parsePoint);
          //local
          tsProps[tileId] = properties;
          //global
          tileProperties[tileGid] = properties;
        });
        _.conj(gidMap,[gid, name]);
        Mojo.sheet(name,
                   _getImage(ts),
                   {tileW: _attr(ts,"tilewidth"),
                    tileH: _attr(ts,"tileheight"),
                    frameInfo: tsProps,
                    spacingX: _attr(ts,"spacing"),
                    spacingY: _attr(ts,"spacing")});
      };
      return gidMap;
    };

    let _scanners= {
      imagelayer: (scene,node) => {
        let p = _parseProperties(node),
            assetName = _getImage(node);
        p.asset = assetName;
        scene.insert(new Mojo.Repeater(p));
      },
      layer: (scene,classFactory,gidMap,node) => {
        let tiles = node.querySelectorAll("tile"),
            width = _attr(node,"width"),
            height =_attr(node,"height"),
            gidDetails, gidOffset, sheetName, idx=0, data = [];
        for(let y=0;y<height;++y) {
          data[y] = [];
          for(let gid, x=0;x<width;++x) {
            if((gid = _attr(tiles[idx],"gid"))===0)
              _.conj(data[y], null);
            else {
              if(!gidOffset) {
                gidDetails = _lookupGid(gid,gidMap);//_attr(tiles[idx],"gid"),gidMap);
                gidOffset = gidDetails[0];
                sheetName = gidDetails[1];
              }
              _.conj(data[y],(gid - gidOffset));
            }
            ++idx;
          }
        }
        let C, obj, sht= Mojo.sheet(sheetName),
            tileLayerProps = _.inject({tileW: sht.tileW,
                                       tileH: sht.tileH,
                                       tiles: data,
                                       sheet: sheetName}, _parseProperties(node));
        if(tileLayerProps.Class)
          C=classFactory[tileLayerProps.Class];
        else
          C=Mojo.TileLayer;
        obj= new C(tileLayerProps);
        tileLayerProps["collision"] ? scene.addOverlay(obj) : scene.insert(obj);
      },
      objectgroup: (scene,classFactory,gidMap,gidProps,node) => {
        node.querySelectorAll("object").forEach(obj => {
          let gid = _attr(obj,"gid"),
              props = gidProps[gid],
              clazz= props && props["Class"],
              C = clazz && classFactory[clazz],
              sprite, overrides = _parseProperties(obj);
          if(!props) throw "Error: missing TMX Object props for GID:" + gid;
          if(!clazz) throw "Error: missing TMX Object Class for GID:" + gid;
          if(!C) throw "Error: unknown Class `"+clazz+"` for GID:" + gid;
          sprite = new C(_.inject({x: _attr(obj,"x"),
                                   y: _attr(obj,"y")}, props, overrides));
          sprite.p.x += sprite.p.w/2;
          sprite.p.y -= sprite.p.h/2;
          scene.insert(sprite);
        });
      }
    };

    /**
     * @public
     * @function
     */
    Mojo.parseTMX = function(dataAsset,scene,classFactory) {
      let data = is.str(dataAsset) ? Mojo.asset(dataAsset) : dataAsset,
          tag, gidProps = {},
          gidMap = _scanTilesets(data.getElementsByTagName("tileset"), gidProps);
      _.doseq(data.documentElement.childNodes, (node) => {
        tag=node.tagName;
        if(tag==="layer")
          _scanners[tag](scene,classFactory,gidMap,node);
        else if(tag==="imagelayer")
          _scanners[tag](scene,node);
        else if(tag==="objectgroup")
          _scanners[tag](scene,classFactory,gidMap,gidProps,node);
      });
    };

    return Mojo;
  };

})(this);


