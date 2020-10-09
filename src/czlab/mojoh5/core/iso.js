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

;(function(global){
  "use strict";
  //export--------------------------------------------------------------------
  if(typeof module === "object" &&
     module && typeof module.exports === "object"){
    global=module.exports;
  }
  else if(typeof exports === "object" && exports){
    global=exports;
  }
  /**
   * @private
   * @function
   */
  function _module(Mojo){
    const _S=global["io.czlab.mojoh5.Sprites"](Mojo);
    const Core=global["io.czlab.mcfud.core"]();
    const _M=global["io.czlab.mcfud.math"]();
    const _V=global["io.czlab.mcfud.vec2"]();
    const is=Core.is;
    const _=Core.u;
    const _T= {};
    const _DA=[];
    /**
     * @private
     * @function
     */
    function _parseProperties(el){
      return (el.properties|| _DA).reduce((acc,p) => {
        acc[p.name]=p.value;
        return acc;
      }, {})
    }
    function _checkVersion(tmap,file){
      //check version of map-editor
      let tver= tmap.tiledversion || tmap.version;
      if(tver && _.cmpVerStrs(tver,"1.4.2") < 0)
        throw `Error: ${file} version out of date`;
      return _parseProperties(tmap);
    }
    /**
     * @private
     * @function
     */
    function _lookupGid(gid,gidMap){
      let idx = 0;
      while(gidMap[idx+1] &&
            gid >= gidMap[idx+1][0]) ++idx;
      return gidMap[idx];
    }
    /**
     * @private
     * @function
     */
    function _getImage(obj){
      let s= obj.image;
      let p= s && s.split("/");
      return p && p.length && p[p.length-1];
    }
    /**
     * @private
     * @function
     */
    function _scanTilesets(tilesets, tileProperties){
      let gidList = [];
      _.doseq(tilesets, ts => {
        let tsinfo=_.selectKeys(ts,"firstgid,name,spacing,imageheight,imagewidth,tileheight,tilewidth");
        tsinfo.image= _getImage(ts);
        _.doseq(ts.tiles, t => tileProperties[tsinfo.firstgid + t.id] = _parseProperties(t));
        _.conj(gidList,[tsinfo.firstgid, tsinfo]);
      });
      return gidList.sort((a,b) => {
        if(a[0]>b[0]) return 1;
        if(a[0]<b[0]) return -1;
        return 0;
      });
    }
    /**
     * sort ascending by depth.
     * @public
     * @function
     */
    _T.byDepth=function(a, b){
      let ac= a.tiled.cartXY();
      let bc= b.tiled.cartXY();
      a.tiled.depth = (ac[0] + ac[1]) * (a.z + 1);
      b.tiled.depth = (bc[0] + bc[1]) * (b.z + 1);
      return a.tiled.depth < b.tiled.depth ? -1
                                           : (a.tiled.depth > b.tiled.depth ? 1 : 0)
    };
    /**
     * @private
     * @function
     */
    function _getIsoPoints(s){
      //sprites internal hitbox
      let ca = s.collisionArea;
      let c= s.tiled.cartXY();
      let lf=c[0];
      let bt=c[1];
      let rt=lf+s.tiled.cartWidth-1;
      let tp=bt+s.tiled.cartHeight-1;
      if(ca){
        lf=c[0]+ca.x1;
        bt=c[1]+ca.y1;
        rt=lf+(ca.x2-ca.x1-1);
        tp=bt+(ca.y2-ca.y1-1);
      }
      return [_V.V2(lf,bt),_V.V2(rt,bt),
              _V.V2(rt,tp),_V.V2(lf,tp)]
    };
    /**
     * @public
     * @function
     */
    _T.hitTestIsoTile=function(sprite, gidList, gidToCheck, world, checkWhat=Mojo.SOME){
      let col={};
      let colPts;
      function _checker(pt){
        col.index = Mojo.getIndex(pt[0], pt[1],
                                  world.tiled.cartTileW,
                                  world.tiled.cartTileH, world.tiled.tilesInX);
        col.gid = gidList[col.index];
        return col.gid === gidToCheck;
      }
      if(checkWhat===Mojo.CENTER){
        let ca= s.collisionArea;
        let c= s.tiled.cartXY();
        colPts = [_V.V2(c[0] + ca.x1 + (ca.x2-ca.x1)/2,
                        c[1] + ca.y1 + (ca.y2-ca.y1)/2)];
      } else {
        colPts = _getIsoPoints(sprite);
      }
      let op= checkWhat===Mojo.EVERY ? "every" : "some";
      col.hit = colPts[op](_checker);
      return col;
    };
    /**
     * Enhance pointer object with iso properties.
     * @public
     * @function
     */
    _T.makeIsoPointer=function(pointer, world){
      let ptr= _S.extend(pointer);
      if(!ptr.tiled) ptr.tiled={};
      //the isometric world's cartesian coordiantes
      ptr.tiled.cartXY=function(){
        return _V.V2((((2 * ptr.y + ptr.x) - (2 * world.y + world.x)) / 2) - (world.tiled.cartTileW/2),
                    (((2 * ptr.y - ptr.x) - (2 * world.y - world.x)) / 2) + (world.tiled.cartTileH/2));
      };
      ptr.tiled.col=function(){
        let p=ptr.tiled.cartXY();
        let r= _.floor(p[0] / world.tiled.cartTileW);
        _V.dropV2(p);
        return r;
      };
      ptr.tiled.row=function(){
        let p=ptr.tiled.cartXY();
        let r= _.floor(p[1] / world.tiled.cartTileH);
        _V.dropV2(p);
        return r;
      };
      ptr.tiled.____index=function(){
        let p=ptr.tiled.cartXY();
        let ix = _.floor(p[0] / world.tiled.cartTileW);
        let iy = _.floor(p[1] / world.tiled.cartTileH);
        _V.dropV2(p);
        return ix + iy * world.tiled.tilesInX;
      };
    };
    /**
     * @public
     * @function
     */
    _T.isoWorld=function(cartTileW, cartTileH, tilesInX,tilesInY){
      let g= _S.group();
      _.assert(!_.has(g, "tiled"));
      g.tiled={ cartTileW: cartTileW,
                cartTileH: cartTileH,
                tilesInX: tilesInX,
                tilesInY: tilesInY };
      return g;
    };
    /**
     * A function for creating a simple isometric diamond
     * shaped rectangle.
     * @public
     * @function
     */
    _T.isoRectangle=function(width, height, fillStyle){
      //draw the flattened and rotated square (diamond shape)
      let r= new Mojo.PXGraphics();
      let h2= height/2;
      r.beginFill(fillStyle);
      r.moveTo(0, 0);
      r.lineTo(width, h2);
      r.lineTo(0, height);
      r.lineTo(-width, h2);
      r.lineTo(0, 0);
      r.endFill();
      let s= _S.extend(new Mojo.PXSprite(_S.generateTexture(r)));
      _.assert(!_.has(s,"tiled"));
      s.tiled={};
      return s;
    };
    /**
     * @private
     * @function
     */
    _T.addIsoProperties=function(sprite, width, height,x,y){
      let cpos= _V.V2(x,y);
      if(!sprite.tiled) sprite.tiled={};
      //cartisian (flat 2D) properties
      sprite.tiled.cartXY=function(cx,cy){
        if(cx !== undefined){
          cpos[0]=cx;
          cpos[1]=cy;
        }
        return cpos;
      };
      sprite.tiled.cartWidth = width;
      sprite.tiled.cartHeight = height;
      sprite.tiled.isoXY= () => _V.V2(cpos[0]-cpos[1], (cpos[0]+cpos[1])/2)
    };
    /**
     * Make an isometric world from TiledEditor map data.
     * @public
     * @function
     */
    _T.makeIsoTiledWorld=function(jsonTiledMap){
      let tmx = Mojo.resources(jsonTiledMap);
      tmx=tmx && tmx.data;
      if(!tmx)
        throw `Error: ${jsonTiledMap} not loaded`;
      let tprops= _checkVersion(tmx, jsonTiledMap);
      //A. add three custom properties to the Tiled Editor
      //   map: `cartTileW`,`cartTileH` and `tileDepth`.
      //   They define the cartesian dimesions of the tiles.
      _.assert(_.has(tprops,"cartTileW") &&
               _.has(tprops,"cartTileH") &&
               _.has(tprops,"tileDepth"),
               "Set custom cartTileW, cartTileH and tileDepth map properties");
      let world = _S.extend(new Mojo.PXContainer());
      _.assert(!_.has(world,"tiled"));
      let cartTileH= parseInt(tprops.cartTileH);
      let cartTileW= parseInt(tprops.cartTileW);
      let tileH= parseInt(tprops.tileDepth);
      let gtileProps={};
      let z=0;
      let tiled= world.tiled= _.inject(tprops, {tileObjects: [],
                                                tileProps: gtileProps,
                                                tileH: tileH,
                                                tileW: tmx.tilewidth,
                                                tilesInX: tmx.width,
                                                tilesInY: tmx.height,
                                                cartTileH: cartTileH,
                                                cartTileW: cartTileW,
                                                tiledWidth: tmx.width * cartTileW,
                                                tiledHeight: tmx.height * cartTileH,
                                                tileGidList: _scanTilesets(tmx.tilesets, gtileProps)});
      this.insert(world);
      _.doseq(tmx.layers,layer => {
        let layergp = _S.extend(new Mojo.PXContainer());
        let gprops= _.inject({}, layer);
        _.assert(!_.has(layergp,"tiled"));
        layergp.alpha = layer.opacity;
        layergp.tiled = gprops;
        world.addChild(layergp);
        _.conj(tiled.tileObjects,layergp);
        function _doTileLayer(layer){
          for(let gid,i=0;i<layer.data.length;++i){
            gid=layer.data[i];
            if(gid===0) continue;
            let tsinfo=_lookupGid(gid,tiled.tileGidList)[1];
            let tileId=gid - tsinfo.firstgid;
            _.assert(tileId>=0, `Bad tile id: ${tileId}`);
            let cols=_.floor(tsinfo.imagewidth / (tsinfo.tilewidth+tsinfo.spacing));
            let mapColumn = i% layer.width;
            let mapRow = _.floor(i/ layer.width);
            let mapX = mapColumn * tiled.cartTileW;
            let mapY = mapRow * tiled.cartTileH;
            let tilesetCol = tileId % cols;
            let tilesetRow = _.floor(tileId / cols);
            let tilesetX = tilesetCol * tsinfo.tilewidth;
            let tilesetY = tilesetRow * tsinfo.tileheight;
            if(tsinfo.spacing > 0){
              tilesetX += tsinfo.spacing + (tsinfo.spacing * tilesetCol);
              tilesetY += tsinfo.spacing + (tsinfo.spacing * tilesetRow);
            }
            let texture = Mojo.Sprites.frame(tsinfo.image, tsinfo.tilewidth,tsinfo.tileheight, tilesetX,tilesetY);
            let s = _S.extend(new Mojo.PXSprite(texture));
            let tprops= gtileProps[gid];
            _.assert(!_.has(s,"tiled"));
            s.tiled={____gid: gid, ____index: i};
            if(tprops && _.has(tprops,"name")){
              _.inject(s.tiled, tprops);
              _.conj(tiled.tileObjects,s);
            }
            _T.addIsoProperties(s, tiled.cartTileW, tiled.cartTileH, mayX, mapY);
            let iso= s.tiled.isoXY();
            s.x = iso[0];
            s.y = iso[1];
            s.z = z;
            _V.dropV2(iso);
            layergp.addChild(s);
          }
        }
        function _doObjGroup(layer,container){
          _.doseq(layer.objects,o => {
            _.assert(!_.has(o,"tiled"));
            o.tiled={name: o.name,
                     ____group: container};
            _.conj(tiled.tileObjects,o);
          });
        }
        if(layer.type === "tilelayer"){
          _doTileLayer(layer);
        }
        else if(layer.type === "objectgroup"){
          _doObjGroup(layer);
        }
        z += 1;
      });
      world.tiled.getObject=function(name,panic){
        let found= _.some(world.tiled.tileObjects, o => {
          if(o.tiled && o.tiled.name === name)
            return o;
        });
        if(!found && panic)
          throw `There is no object with the property name: ${name}`;
        return found;
      };
      world.tiled.getObjects=function(objectNames,panic){
        let found= [];
        objectNames=_.seq(objectNames);
        world.tiled.tileObjects.forEach(o => {
          if(o.tiled && _.has(objectNames, o.tiled.name))
            _.conj(found,o);
        });
        if(found.length === 0 && panic) throw "No object found";
        return found;
      };
      function _addProps(obj){
        _S.extend(obj);
        _.doseq(obj.children,_addProps);
      }
      _.doseq(world.children, _addProps);
      return world;
    };

    return (Mojo.IsoTiles=_T)
  }
  /**
   * @public
   * @module
   */
  global["io.czlab.mojoh5.IsoTiles"]=function(Mojo){
    return Mojo.IsoTiles ? Mojo.IsoTiles : _module(Mojo)
  };

})(this);


