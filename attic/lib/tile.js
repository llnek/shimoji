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
    throw "Fatal: MojoH5 not loaded";

  /**
   * @module
   */
  MojoH5.Tiles = function(Mojo) {

    let _= Mojo.u,
        is=Mojo.is,EBus=Mojo.EventBus;

    let  _genContactObjs= function(self) {
      let cobj,
          props= self.sheet() &&
                 self.sheet().frameInfo,
          _rescale= (pt) => {
            return [pt[0] * self.p.tileW - self.p.tileW/2,
                    pt[1] * self.p.tileH - self.p.tileH/2 ]; };
      if(props)
        for(let k in props)
          if(_.has(props,k)) {
            cobj= self.tileContactObjs[k] = {p: _.clone(self.contactObj.p)};
            _.inject(cobj.p, props[k]);
            if(cobj.p.points)
              cobj.p.points= _.map(cobj.p.points, _rescale);
            self.tileContactObjs[k] = cobj;
          }
    };

    /**
     * @public
     * @class
     */
    Mojo.defType(["TileLayer",Mojo.Sprite], {
      init: function(props) {
        this._super(props,{tileW: 32,
                           tileH: 32,
                           //n# tiles as a chunk
                           block: Mojo.v2(10,10),
                           renderAlways: true,
                           type: Mojo.E_DEFAULT});

        let tiles=this.p.tiles,
            data=this.p.dataAsset,
            ext= is.str(data) ? _.fileExt(data) : "";
        if(ext==="json")
          tiles= Mojo.asset(data);
        else if(ext.length > 0)
          throw "Error: file type `"+ext+"` not supported";

        if(tiles) {
          this.p.rows = tiles.length;
          this.p.cols = tiles[0].length;
          this.p.w = this.p.cols * this.p.tileW;
          this.p.h = this.p.rows * this.p.tileH;
          this.p.tiles=tiles;
        }

        this.p.blockW = this.p.tileW * this.p.block[0];
        this.p.blockH = this.p.tileH * this.p.block[1];

        this.contactNormal = { separate: [] };
        this.tileBlocks = {};
        this.tileProps = {};

        //simulate a tile
        this.contactObj = {p: {w: this.p.tileW,
                               h: this.p.tileH,
                               cx: this.p.tileW/2,
                               cy: this.p.tileH/2}};

        this.tileContactObjs = {};
        _genContactObjs(this);
      },
      tileRow: function(y) {
        return y < 0 ? null : this.p.tiles[y];
      },
      blockRow: function(y,create) {
        let obj=this.tileBlocks[y];
        if(!obj && create)
          obj= this.tileBlocks[y] = {};
        return obj;
      },
      getTile: function(tX,tY) {
        let r= this.tileRow(tY);
        if(r) return r[tX];
      },
      getTileProperties: function(tile) {
        if(tile) return this.tileProps[tile];
      },
      getTilePropertiesAt: function(tX, tY) {
        return this.getTileProperties(this.getTile(tX, tY));
      },
      tileHasProperty: function(tile, prop) {
        return _.has(this.getTileProperties(tile),prop);
      },
      tileHasPropertyAt: function(tX,tY,prop) {
        return _.has(this.getTilePropertiesAt(tX,tY),prop);
      },
      setTile: function(x,y,tile) {
        let row, p = this.p,
            bX = _.floor(x/p.block[0]),
            bY = _.floor(y/p.block[1]);
        if(x >= 0 && x < this.p.cols &&
           y >= 0 && y < this.p.rows) {
          this.tileRow(y)[x] = tile;
          if(row=this.blockRow(bY)) row[bX] = null;
        }
      },
      tilePresent: function(tX,tY) {
        let r= this.tileRow(tY);
        return r && this.collidableTile(r[tX]);
      },
      // Overload this method to draw tiles at frame 0 or not draw
      // tiles at higher number frames
      drawableTile: (tileNum) => { return tileNum > 0; },
      // Overload this method to control which tiles cause a collision
      // (defaults to all tiles > number 0)
      collidableTile: (tileNum) => { return tileNum > 0; },
      getContactObj: function(tX, tY) {
        let p = this.p,
            tile = this.getTile(tX, tY),
            colObj = (tile && this.tileContactObjs[tile])
                     ? this.tileContactObjs[tile] : this.contactObj;

        colObj.p.x = tX * p.tileW + p.x + p.tileW/2;
        colObj.p.y = tY * p.tileH + p.y + p.tileH/2;

        return colObj;
      },
      collide: function(obj) {
        let col, colObj,
            p = this.p,
            objP = obj.c || obj.p,
            normal = this.contactNormal,
            startX = _.floor((objP.x - objP.cx - p.x) / p.tileW),
            startY = _.floor((objP.y - objP.cy - p.y) / p.tileH),
            endX =  _.ceil((objP.x - objP.cx + objP.w - p.x) / p.tileW),
            endY =  _.ceil((objP.y - objP.cy + objP.h - p.y) / p.tileH);

        normal.collided = false;

        for(let tileY = startY; tileY<=endY; ++tileY) {
          for(let tileX = startX; tileX<=endX; ++tileX) {
            if(this.tilePresent(tileX,tileY)) {
              colObj = this.getContactObj(tileX, tileY);
              col = Mojo.collision(obj,colObj);
              if(col && col.magnitude > 0) {
                if(colObj.p.sensor) {
                  colObj.tile = this.getTile(tileX,tileY);
                  EBus.pub("sensor.tile", obj, colObj);
                } else if(!normal.collided ||
                          normal.magnitude < col.magnitude) {
                  normal.collided = true;
                  normal.separate[0] = col.separate[0];
                  normal.separate[1] = col.separate[1];
                  normal.magnitude = col.magnitude;
                  normal.distance = col.distance;
                  normal.normalX = col.normalX;
                  normal.normalY = col.normalY;
                  normal.tileX = tileX;
                  normal.tileY = tileY;
                  normal.tile = this.getTile(tileX,tileY);
                  obj.p.collisions && _.conj(obj.p.collisions,normal);
                }
              }
            }
          }
        }
        return normal.collided ? normal : false;
      },
      prerenderBlock: function(bX,bY) {
        let p = this.p,
            offsetX = bX*p.block[0],
            offsetY = bY*p.block[1];

        if(offsetX < 0 ||
           offsetY < 0 ||
           offsetX >= this.p.cols ||
           offsetY >= this.p.rows) {
        } else {
          let canvas = Mojo.domCtor("canvas");
          let tiles = p.tiles,
              sheet = this.sheet(),
              row, ctx = canvas.getContext("2d");
          canvas.width = p.blockW;
          canvas.height= p.blockH;
          row= this.blockRow(bY,true);
          row[bX] = canvas;
          for(let y=0;y<p.block[1];++y)
            if(row=tiles[y+offsetY])
              for(let x=0;x<p.block[0];++x)
                if(this.drawableTile(row[x+offsetX]))
                  sheet.draw(ctx,
                             x*p.tileW, y*p.tileH, row[x+offsetX]);
        }
      },
      drawBlock: function(ctx, bX, bY) {
        let row=this.blockRow(bY),
            p=this.p,
            startX = _.floor(bX * p.blockW + p.x),
            startY = _.floor(bY * p.blockH + p.y);

        if(!row || !row[bX])
          this.prerenderBlock(bX,bY);

        row=this.blockRow(bY);
        row &&
          row[bX] &&
          ctx.drawImage(row[bX],startX,startY);
      },
      draw: function(ctx) {
        let port = Mojo.getf(this.scene,"camera");
        let scale= [port ? port.scale[0] : 1,
                    port ? port.scale[1] : 1];
        let x = port ? port.x : 0,
            y = port ? port.y : 0,
            viewW = Mojo.width/scale[0],
            viewH = Mojo.height/scale[1],
            p=this.p,
            startX = _.floor((x - p.x) / p.blockW),
            startY = _.floor((y - p.y) / p.blockH),
            endX = _.floor((x + viewW - p.x) / p.blockW),
            endY = _.floor((y + viewH - p.y) / p.blockH);
        for(let iy=startY;iy<=endY;++iy)
          for(let ix=startX;ix<=endX;++ix) this.drawBlock(ctx,ix,iy);
      }

    }, Mojo);

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


