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

;(function(global,undefined){
  "use strict";
  const window=global;
  const MojoH5=window.MojoH5;
  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded";
  /**
   * @public
   * @module
   */
  MojoH5.Tiles=function(Mojo){
    const _S=Mojo.Sprites;
    const _T= {};
    const _=Mojo.u;
    const is=Mojo.is;
    /**
     * @private
     * @function
     */
    function _parseProperties(elem){
      let props={};
      if(elem.properties)
        elem.properties.forEach(p => {props[p.name]=p.value});
      return props;
    }
    /**
     * @private
     * @function
     */
    function _checkVersion(tmap,file){
      //check version of map-editor
      let tver= tmap.tiledversion || tmap.version;
      if(tver && _.cmpVerStrs(tver,"1.4.2") < 0)
        throw `Error: ${file} version out of date`;
      return _parseProperties(tmap);
    }
    /**
     * Converts a sprite's position to a tile index.
     *
     * @public
     * @function
     * @returns the tile position
     */
    _T.getIndex=function(x, y, tileW, tileH, mapWidthInTiles){
      if(x<0 || y<0){
        throw "Wooooo, whats up!";
      }
      return _.floor(x / tileW) + _.floor(y / tileH) * mapWidthInTiles;
    };
    /**
     * @public
     * @function
     */
    _T.getIndex3=function(x, y, world){
      return this.getIndex(x,y,
                           world.tiled.tileW,
                           world.tiled.tileH,world.tiled.tilesInX);
    };
    /**
     * Converts a point's position to a tile index.
     *
     * @public
     * @function
     * @returns the tile position
     */
    _T.getTileIndex=function(pt,world){
      return this.getIndex3(pt.x,pt.y,world);
    };
    /**
     * @private
     * @function
     */
    function _getVector(sprite1,sprite2){
      let v2=_S.centerXY(sprite2);
      let v1= _S.centerXY(sprite1);
      return [v2.x - v1.x, v2.y - v1.y];
    }
    /**
     * Converts a tile's index number into x/y screen
     * coordinates, and capture's the tile's grid index (`gid`) number.
     *
     * @public
     * @function
     * @returns A tile object.
     */
    _T.getTile=function(index, mapArray, world){
      let tiled=world.tiled;
      let tile ={gid: mapArray[index],
                 width: tiled.tileW,
                 height: tiled.tileH,
                 x: ((index % tiled.tilesInX) * tiled.tileW) + world.x,
                 y: ((_.floor(index / tiled.tilesInX)) * tiled.tileH) + world.y};
      _S.extend(tile);
      tile.mojoh5.gpos= _.p2(tile.x, tile.y);
      tile.mojoh5.cpos= _.p2(tile.x + tiled.tileW/2, tile.y + tiled.tileH/2);
      return tile;
    };
    /**
     * @public
     * @function
     * @returns an array containing 9
     * index numbers of map array cells around any given index number.
     * Use it for an efficient broadphase/narrowphase collision test.
     * The 2 arguments are the index number that represents the center cell,
     * and the width of the map array.
     */
    _T.getNeighborCells=function(index, world, ignoreSelf){
      let tiled=world.tiled;
      let a= [index - tiled.tilesInX - 1,
              index - tiled.tilesInX,
              index - tiled.tilesInX + 1,
              index - 1];
      let b= [index + 1,
              index + tiled.tilesInX - 1,
              index + tiled.tilesInX,
              index + tiled.tilesInX + 1];
      if(!ignoreSelf) a.push(index);
      return a.concat(b);
    };
    /**
     * @public
     * @function
     */
    _T.getContactPoints=function(s){
      //internal rectangle defining the collision area of this sprite
      let ca = s.collisionArea;
      let lf=s.x;
      let tp=s.y;
      let rt=lf+s.width-1;
      let bt=tp+s.height-1;
      if(ca){
        lf=s.x+ca.x;
        rt=lf+ca.width-1;
        tp=s.y+ca.y;
        bt=tp+ca.height-1;
      }
      return {
        topLeft: _.p2(lf,tp), topRight: _.p2(rt,tp),
        bottomLeft: _.p2(lf,bt), bottomRight: _.p2(rt,bt)
      };
/*
      return {topLeft: ca ? _.p2(s.x + ca.x, s.y + ca.y) : _.p2(s.x, s.y),
              topRight: ca ? _.p2(s.x + ca.x + ca.width, s.y + ca.y)
                           : _.p2(s.x + s.width-1, s.y),
              bottomLeft: ca ? _.p2(s.x + ca.x, s.y + ca.y + ca.height)
                             : _.p2(s.x, s.y + s.height-1),
              bottomRight: ca ? _.p2(s.x + ca.x + ca.width, s.y + ca.y + ca.height)
                              : _.p2(s.x + s.width-1, s.y + s.height-1)};
                              */
    };
    /**
     * Checks for a collision between a sprite and a tile in any map array.
     *
     * @public
     * @function
     * @returns a `collision` object.
     */
    _T.hitTestTile=function(sprite, mapArray, gidToCheck, world, pointsToCheck){
      pointsToCheck = pointsToCheck || Mojo.SOME;
      let op="some",colPts={}, col= {};
      function _checker(key){
        let pt = colPts[key];
        col.index = _T.getIndex3(pt.x, pt.y, world);
        col.gid = mapArray[col.index];
        return col.gid === gidToCheck;
      }
      if(pointsToCheck !== Mojo.CENTER){
        op= pointsToCheck===Mojo.EVERY ? "every" : "some";
        colPts = this.getContactPoints(sprite);
      }else{
        colPts = { center: _S.centerXY(sprite) };
      }
      col.hit = _.keys(colPts)[op](_checker);
      return col;
    };
    /**
     * Takes a map array and adds a sprite's grid index number (`gid`) to it.
     *
     * @public
     * @function
     *
     */
    _T.updateMap=function(mapArray, spritesToUpdate, world){
      let ret = _.fill(new Array(mapArray.length),0);
      function _mapper(s){
        let pos= _T.getTileIndex(_S.centerXY(s), world);
        _.assert(pos >= 0 && pos < ret.length, "tiled index outofbound");
        s.tiled.____index = pos;
        ret[pos] = s.tiled.____gid;
      }
      if(!is.vec(spritesToUpdate))
        _mapper(spritesToUpdate);
      else
        spritesToUpdate.forEach(_mapper);
      return ret;
    };
    /**
     * @private
     * @function
     */
    function _getImage(obj){
      let s= obj.image;
      let p= s && s.split("/");
      return p && p.length && p[p.length-1];
    }
    function _parsePoint(pt){
      let pts = pt.split(",");
      return [parseFloat(pts[0]), parseFloat(pts[1])];
    }
    function _lookupGid(gid,gidMap){
      let idx = 0;
      while(gidMap[idx+1] &&
            gid >= gidMap[idx+1][0]) ++idx;
      return gidMap[idx];
    }
    function _scanTilesets(tilesets, tileProperties){
      let gidList = [];
      tilesets.forEach(ts => {
        let tsinfo=_.selectKeys(ts,"firstgid,name,spacing,"+
                                   "imageheight,imagewidth,"+
                                   "tileheight,tilewidth");
        tsinfo.image= _getImage(ts);
        ts.tiles.forEach(tile => {
          let gid = tsinfo.firstgid + tile.id;
          let ps = _parseProperties(tile);
          //if(ps.points) ps.points = _.map(ps.points.split(" "),_parsePoint);
          tileProperties[gid] = ps;
        });
        _.conj(gidList,[tsinfo.firstgid, tsinfo]);
      });
      return gidList.sort((a,b) => {
        if(a[0]>b[0]) return 1;
        if(a[0]<b[0]) return -1;
        return 0;
      });
    }
    /**
     * A quick and easy way to display a game world designed in
     * Tiled Editor.
     *
     * @public
     * @function
     *
     */
    _T.makeTiledWorld=function(jsonTiledMap){
      let tiledMap = Mojo.resources(jsonTiledMap);
      if(!tiledMap)
        throw `Error: ${jsonTiledMap} not cached`;
      tiledMap= tiledMap.data;
      //check version of map-editor
      let tprops= _checkVersion(tiledMap,jsonTiledMap);
      let world = _S.extend(new Mojo.p.Container());
      _.assert(!_.has(world,"tiled"));
      let gtileProps={};
      let tiled= world.tiled = _.inject(tprops, {tileObjects: [],
                                                 tileProps: gtileProps,
                                                 tileH: tiledMap.tileheight,
                                                 tileW: tiledMap.tilewidth,
                                                 tilesInX: tiledMap.width,
                                                 tilesInY: tiledMap.height,
                                                 tiledWidth: tiledMap.width * tiledMap.tilewidth,
                                                 tiledHeight: tiledMap.height * tiledMap.tileheight,
                                                 tileGidList: _scanTilesets(tiledMap.tilesets,gtileProps)});
      tiledMap.layers.forEach(layer => {
        let layergp = _S.extend(new Mojo.p.Container());
        _.assert(!_.has(layergp,"tiled"));
        layergp.alpha = layer.opacity;
        layergp.tiled = _.inject({}, layer);
        world.addChild(layergp);
        _.conj(world.tiled.tileObjects,layergp);
        function _doTileLayer(layer){
          for(let gid,index=0;index<layer.data.length;++index){
            gid=layer.data[index];
            if(gid===0) continue;
            let tsinfo=_lookupGid(gid,tiled.tileGidList)[1];
            let tileId=gid - tsinfo.firstgid;
            _.assert(tileId>=0, `Bad tile id: ${tileId}`);
            let cols=_.floor(tsinfo.imagewidth / (tsinfo.tilewidth+tsinfo.spacing));
            let mapColumn = index % layer.width;
            let mapRow = _.floor(index / layer.width);
            let mapX = mapColumn * tsinfo.tilewidth;
            let mapY = mapRow * tsinfo.tileheight;
            let tilesetCol = tileId % cols;
            let tilesetRow = _.floor(tileId / cols);
            let tilesetX = tilesetCol * tsinfo.tilewidth;
            let tilesetY = tilesetRow * tsinfo.tileheight;
            if(tsinfo.spacing > 0){
              tilesetX += tsinfo.spacing + (tsinfo.spacing * tilesetCol);
              tilesetY += tsinfo.spacing + (tsinfo.spacing * tilesetRow);
            }
            let texture = _S.frame(tsinfo.image, tsinfo.tilewidth,tsinfo.tileheight, tilesetX,tilesetY);
            let tileSprite = _S.extend(new Mojo.p.Sprite(texture));
            let tprops=gtileProps[gid];
            _.assert(!_.has(tileSprite,"tiled"));
            tileSprite.tiled={____index: index, ____gid: gid};
            tileSprite.x = mapX;
            tileSprite.y = mapY;
            if(tprops && _.has(tprops,"name")){
              _.inject(tileSprite.tiled, tprops);
              _.conj(tiled.tileObjects, tileSprite);
            }
            layergp.addChild(tileSprite);
          }
        }
        function _doObjGroup(layer){
          layer.objects.forEach(o => {
            _.assert(!_.has(o,"tiled"));
            o.tiled={name: o.name, ____group: layergp};
            _.conj(tiled.tileObjects,o);
          });
        }
        if(layer.type === "tilelayer"){
          _doTileLayer(layer);
        }else if(layer.type === "objectgroup"){
          _doObjGroup(layer);
        }
      });
      world.tiled.getObject =function(name,panic){
        let found= _.some(world.tiled.tileObjects, o => {
          if(o.tiled && o.tiled.name === name)
            return o;
        });
        if(!found && panic)
          throw `There is no object with the property name: ${name}`;
        return found;
      };
      world.tiled.getObjects = function(objectNames,panic){
        let found= [];
        world.tiled.tileObjects.forEach(o => {
          if(_.has(objectNames,o.name) ||
            (o.tiled && _.has(objectNames,o.tiled.name)))
            _.conj(found,o);
        });
        if(found.length ===0 && panic)
          throw "Could not find those objects";
        return found;
      };
      //extend all nested sprites
      function _addProps(obj){
        _S.extend(obj);
        obj.children &&
          obj.children.forEach(c => _addProps(c));
      }
      world.children &&
        world.children.forEach(c => _addProps(c));

      return world;
    };
    //----- Isometric tile utilities -----------------------------------------
    /**
     * And array `sort` function that depth-sorts sprites according to
     * their `z` properties.
     *
     * @public
     * @function
     *
     */
    _T.byDepth=function(a, b){
      let ac= a.tiled.cartXY();
      let bc= b.tiled.cartXY();
      //Calculate the depths of `a` and `b`
      //(add `1` to `a.z` and `b.x` to avoid multiplying by 0)
      a.tiled.depth = (ac.x + ac.y) * (a.z + 1);
      b.tiled.depth = (bc.x + bc.y) * (b.z + 1);
      //Move sprites with a lower depth to a higher position in the array
      if(a.tiled.depth < b.tiled.depth){
        return -1;
      }else if(a.tiled.depth > b.tiled.depth){
        return 1;
      }else{
        return 0;
      }
    };
    /**
     * @public
     * @function
     *
     */
    _T.hitTestIsoTile=function(sprite, mapArray, gidToCheck, world, pointsToCheck){
      pointsToCheck = pointsToCheck || Mojo.SOME;
      let op="some", col={}, colPts={};
      function _checker(key){
        let p= colPts[key];
        col.index = _T.getIndex(p.x, p.y,
                                world.tiled.cartTileW,
                                world.tiled.cartTileH, world.tiled.tilesInX);
        col.gid = mapArray[col.index];
        return col.gid === gidToCheck;
      }
      if(pointsToCheck===Mojo.CENTER){
        let ca= s.collisionArea;
        let c= s.tiled.cartXY();
        colPts = { center: {x: c.x + ca.x + (ca.width/2),
                            y: c.y + ca.y + (ca.height/2) }};
      } else {
        op= pointsToCheck===Mojo.EVERY ? "every" : "some";
        colPts = this.getIsoPoints(sprite);
      }
      col.hit = _.keys(colPts)[op](_checker);
      return col;
    };
    /**
     * @public
     * @function
     */
    _T.getIsoPoints=function(s){
      //sprites internal hitbox
      let ca = s.collisionArea;
      let c= s.tiled.cartXY();
      let lf=c.x;
      let tp=c.y;
      let rt=lf+s.tiled.cartWidth-1;
      let bt=tp+s.tiled.cartHeight-1;
      if(ca){
        lf=c.x+ca.x;
        tp=c.y+ca.y;
        rt=lf+ca.width-1;
        bt=tp+ca.height-1;
      }
      return {topLeft: _.p2(lf,tp),
              topRight: _.p2(rt,tp),
              bottomLeft: _.p2(lf,bt),
              bottomRight: _.p2(rt,bt)};
    };
    /**
     * Used to add a isometric properties to any mouse/touch `pointer` object with
     * `x` and `y` properties. Supply `makeIsoPointer` with the pointer object and
     * the isometric `world` object.
     *
     * @public
     * @function
     *
     */
    _T.makeIsoPointer=function(pointer, world){
      let ptr= _S.extend(pointer);
      if(!ptr.tiled) ptr.tiled={};
      //The isometric's world's Cartesian coordiantes
      ptr.tiled.cartXY=function(){
        return _.p2((((2 * ptr.y + ptr.x) - (2 * world.y + world.x)) / 2) - (world.tiled.cartTileW/2),
                    (((2 * ptr.y - ptr.x) - (2 * world.y - world.x)) / 2) + (world.tiled.cartTileH/2));
      };
      //The tile's column and row in the array
      ptr.tiled.column=function(){ return _.floor(ptr.tiled.cartXY().x / world.tiled.cartTileW) };
      ptr.tiled.row=function(){ return _.floor(ptr.tiled.cartXY().y / world.tiled.cartTileH) };
      //The tile's index number in the array
      ptr.tiled.index=function(){
        //Convert pixel coordinates to map index coordinates
        let ix = _.floor(ptr.tiled.cartXY().x / world.tiled.cartTileW);
        let iy = _.floor(ptr.tiled.cartXY().y / world.tiled.cartTileH);
        return ix + iy * world.tiled.tilesInX;
      };
    };
    /**
     * A function for creating a simple isometric diamond
     * shaped rectangle using Pixi's graphics library.
     *
     * @public
     * @function
     */
    _T.isoRectangle=function(width, height, fillStyle){
      //Draw the flattened and rotated square (diamond shape)
      let r= new this.Graphics();
      let h2= height/2;
      r.beginFill(fillStyle);
      r.moveTo(0, 0);
      r.lineTo(width, h2);
      r.lineTo(0, height);
      r.lineTo(-width, h2);
      r.lineTo(0, 0);
      r.endFill();
      return _S.extend(new Mojo.p.Sprite(Mojo.Sprites.generateTexture(r)));
    };
    /**
     * Add properties to a sprite to help work between Cartesian
     * and isometric properties: `isoX`, `isoY`, `cartX`,
     * `cartWidth` and `cartHeight`.
     *
     * @public
     * @function
     *
     */
    _T.addIsoProperties=function(sprite, width, height,x,y){
      //Cartisian (flat 2D) properties
      sprite.tiled.cartXY=function(){ return _.p2(x,y) };
      sprite.tiled.cartWidth = width;
      sprite.tiled.cartHeight = height;
      sprite.tiled.isoXY=function(){ return _.p2(x-y, (x+y)/2) };
    };
    /**
     * Make an isometric world from TiledEditor map data.
     *
     * @public
     * @function
     *
     */
    _T.makeIsoTiledWorld=function(jsonTiledMap){
      let tiledMap = Mojo.resources(jsonTiledMap);
      if(!tiledMap)
        throw `Error: ${jsonTiledMap} not loaded`;
      tiledMap=tiledMap.data;
      let tprops= _checkVersion(tiledMap, jsonTiledMap);
      //A. You need to add three custom properties to your Tiled Editor
      //map: `cartTileW`,`cartTileH` and `tileDepth`. They define the Cartesian
      //dimesions of the tiles (32x32x64).
      _.assert(_.has(tprops,"cartTileW") &&
               _.has(tprops,"cartTileH") &&
               _.has(tprops,"tileDepth"),
               "Set custom cartTileW, cartTileH and tileDepth map properties");
      let world = _S.extend(new Mojo.p.Container());
      let z=0;
      let gtileProps={};
      let tileH= parseInt(tprops.tileDepth);
      let cartTileH= parseInt(tprops.cartTileH);
      let cartTileW= parseInt(tprops.cartTileW);
      let tiled= world.tiled= _.inject(tprops, {tileObjects: [],
                                                tileProps: gtileProps,
                                                tileH: tileH,
                                                tileW: tiledMap.tilewidth,
                                                tilesInX: tiledMap.width,
                                                tilesInY: tiledMap.height,
                                                cartTileH: cartTileH,
                                                cartTileW: cartTileW,
                                                tiledWidth: tiledMap.width * cartTileW,
                                                tiledHeight: tiledMap.height * cartTileH,
                                                tileGidList: _scanTilesets(tiledMap.tilesets, gtileProps)});
      this.insert(world);
      tiledMap.layers.forEach(layer => {
        let layergp = _S.extend(new Mojo.p.Container());
        let gprops= _.inject({}, layer);
        _.assert(!_.has(layergp,"tiled"));
        layergp.alpha = layer.opacity;
        layergp.tiled = gprops;
        world.addChild(layergp);
        _.conj(tiled.tileObjects,layergp);
        function _doTileLayer(layer){
          for(let gid,index=0;index<layer.data.length;++index){
            gid=layer.data[index];
            if(gid===0) continue;
            let tsinfo=_lookupGid(gid,tiled.tileGidList)[1];
            let tileId=gid - tsinfo.firstgid;
            _.assert(tileId>=0, `Bad tile id: ${tileId}`);
            let cols=_.floor(tsinfo.imagewidth / (tsinfo.tilewidth+tsinfo.spacing));
            let mapColumn = index % layer.width;
            let mapRow = _.floor(index / layer.width);
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
            let tileSprite = _S.extend(new Mojo.p.Sprite(texture));
            let tprops= gtileProps[gid];
            _.assert(!_.has(tileSprite,"tiled"));
            tileSprite.tiled={____index: index, ____gid: gid};
            if(tprops && _.has(tprops,"name")){
              _.inject(tileSprite.tiled, tprops);
              _.conj(tiled.tileObjects,tileSprite);
            }
            _T.addIsoProperties(tileSprite, tiled.cartTileW, tiled.cartTileH, mayX, mapY);
            let iso= tileSprite.tiled.isoXY();
            tileSprite.x = iso.x;
            tileSprite.y = iso.y;
            tileSprite.z = z;
            layergp.addChild(tileSprite);
          }
        }
        function _doObjGroup(layer,container){
          layer.objects.forEach(o => {
            _.assert(!_.has(o,"tiled"));
            o.tiled={name: o.name, ____group: container};
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
        world.tiled.tileObjects.forEach(o => {
          if(o.tiled && _.has(objectNames, o.tiled.name))
            found.push(o);
        });
        if(found.length === 0 && panic) throw "No object found";
        return found;
      };

      //extend all nested sprites
      function _addProps(obj){
        _S.extend(obj);
        obj.children &&
          obj.children.forEach(c => _addProps(c));
      }

      world.children &&
        world.children.forEach(c => _addProps(c));

      return world;
    };
    /**
     * An A-Star search algorithm that returns an array of grid index numbers that
     * represent the shortest path between two points on a map. Use it like this:
     *
     * @public
     * @function
     *
     */
    _T.shortestPath=function(startTile, targetTile, tiles, world,
                             obstacleGids = [],
                             heuristic = "manhattan", useDiagonal=true){
      let openList = [], closedList = [], theShortestPath = [];
      let nodes = tiles.map((_,i) =>
        ({f: 0, g: 0, h: 0, parent: null, index:i,
        col: i % world.tiled.tilesInX,
        row: _.floor(i / world.tiled.tilesInX)}));
      let startNode = nodes[startTile];
      let straightCost = 10;
      let diagonalCost = 14;
      let centerNode = startNode;
      _.conj(openList,centerNode)
      let targetNode = nodes[targetTile];
      function surroundingNodes(i){
        let neighbors= _T.getNeighborCells(i, world, true).map(p => nodes[p]);
        let cross= _T.getCrossCells(i,world).map(p => nodes[p]);
        let nodesToCheck= useDiagonal ? neighbors : cross;
        return nodesToCheck.filter(node => {
          if(node){
            let indexIsOnLeftBorder = (i % world.tiled.tilesInX) === 0;
            let indexIsOnRightBorder = ((i+1) % world.tiled.tilesInX) === 0;
            let nodeIsBeyondLeftBorder = (node.col % (world.tiled.tilesInX-1)) === 0 && node.col !== 0;
            let nodeIsBeyondRightBorder = (node.col % world.tiled.tilesInX) === 0;
            let nodeContainsAnObstacle = obstacleGids.some(o => tiles[node.pos] === o);
            if(indexIsOnLeftBorder){
              return !nodeIsBeyondLeftBorder;
            }else if(indexIsOnRightBorder){
              return !nodeIsBeyondRightBorder;
            }else if(nodeContainsAnObstacle){
              //Return `true` if the node doesn't contain any obstacles
              return false;
            } else {
              return true;
            }
          }
        });
      }
      const algos= {
        manhattan: (testNode, destinationNode) => {
          return _.abs(testNode.row - destinationNode.row) * straightCost +
                 _.abs(testNode.col - destinationNode.col) * straightCost;
        },
        euclidean: (testNode, destinationNode) => {
          let vx = destinationNode.col - testNode.col;
          let vy = destinationNode.row - testNode.row;
          return _.floor(_.sqrt(vx * vx + vy * vy) * straightCost);
        },
        diagonal: (testNode, destinationNode) => {
          let vx = _.abs(destinationNode.col - testNode.col);
          let vy = _.abs(destinationNode.row - testNode.row);
          return (vx > vy)
            ? _.floor(diagonalCost * vy + straightCost * (vx - vy))
            : _.floor(diagonalCost * vx + straightCost * (vy - vx));
        }
      };
      //Loop through all the nodes until the current `centerNode` matches the
      //`destinationNode`. When they they're the same we know we've reached the
      //end of the path
      while(centerNode !== targetNode){
        let testNodes = surroundingNodes(centerNode.index);
        for(let f,g,h,cost,tn,i=0; i < testNodes.length; ++i){
          tn = testNodes[i];
          //Find out whether the node is on a straight axis or
          //a diagonal axis, and assign the appropriate cost
          //A. Declare the cost variable
          cost = diagonalCost;
          //B. Do they occupy the same row or column?
          if(centerNode.row === tn.row || centerNode.col === tn.col){
            cost = straightCost;
          }
          //C. Calculate the costs (g, h and f)
          //The node's current cost
          g = centerNode.g + cost;
          //The cost of travelling from this node to the
          //destination node (the heuristic)
          if(_.has(algos,heuristic))
            h= algos[heuristic](tn,targetNode);
          else
            throw `Bad heuristic: ${heuristic}`;
          f = g + h;
          //Find out if the testNode is in either
          //the openList or closedList array
          let isOnOpenList = openList.some(node => tn === node);
          let isOnClosedList = closedList.some(node => tn === node);
          //If it's on either of these lists, we can check
          //whether this route is a lower-cost alternative
          //to the previous cost calculation. The new G cost
          //will make the difference to the final F cost
          if(isOnOpenList || isOnClosedList){
            if(tn.f > f){
              tn.f = f;
              tn.g = g;
              tn.h = h;
              //Only change the parent if the new cost is lower
              tn.parent = centerNode;
            }
          }else{
            //Otherwise, add the testNode to the open list
            tn.f = f;
            tn.g = g;
            tn.h = h;
            tn.parent = centerNode;
            _.conj(openList,testNode);
          }
        }
        _.conj(closedList,centerNode);
        //Quit the loop if there's nothing on the open list.
        //This means that there is no path to the destination or the
        //destination is invalid, like a wall tile
        if(openList.length === 0){
          return theShortestPath;
        }
        //Sort the open list according to final cost
        openList = openList.sort((a, b) => a.f - b.f);
        //Set the node with the lowest final cost as the new centerNode
        centerNode = openList.shift();
      }
      //Now that we have all the candidates, let's find the shortest path!
      if(openList.length !== 0){
        //Start with the destination node
        let tn = targetNode;
        _.conj(theShortestPath,tn);
        //Work backwards through the node parents
        //until the start node is found
        while(tn !== startNode){
          tn = tn.parent;
          theShortestPath.unshift(tn);
        }
      }
      return theShortestPath;
    };
    /**
     * Find out whether two sprites
     * are visible to each other inside a tile based maze environment.
     *
     * @public
     * @function
     *
     */
    _T.lineOfSight=function(sprite1,
                            sprite2,
                            tiles,
                            world,
                            emptyGid = 0,
                            segment = 32, //distance between collision points
                            angles = []) { //angles to restrict the line of sight
      let v= _getVector(sprite1,sprite2);
      let len = _.sqrt(v[0] * v[0] + v[1] * v[1]);
      let numPts = len / segment;
      let len2,x,y,dx,dy,points = [];
      for(let c,i = 1; i <= numPts; ++i){
        c= _S.centerXY(sprite1);
        len2 = segment * i;
        dx = v[0]/len;
        dy = v[1]/len;
        //Use the unit vector and newMagnitude to figure out the x/y
        //position of the next point in this loop iteration
        x = c.x + dx * len2;
        y = c.y + dy * len2;
        _.conj(points,{x: x, y: y, index: this.getIndex3(x, y, world)});
      };
      //The tile-based collision test.
      //The `noObstacles` function will return `true` if all the tile
      //index numbers along the vector are `0`, which means they contain
      //no walls. If any of them aren't 0, then the function returns
      //`false` which means there's a wall in the way
      let noObstacles = points.every(p => tiles[p.index] === emptyGid);
      //Restrict line of sight to right angles (don't want to use diagonals)
      //Find the angle of the vector between the two sprites
      let angle = Math.atan2(v[1], v[0]) * 180 / Math.PI;
        //If the angle matches one of the valid angles, return
        //`true`, otherwise return `false`
      let validAngle = angles.length === 0 || angles.some(x => x === angle);
      //no obstacles and the line of sight is at a 90 degree angle?
      return noObstacles && validAngle;
    };
    /**
     * @public
     * @function
     * @returns an array of index numbers matching the cells that are orthogonally
     * adjacent to the center `index` cell.
     */
    _T.getCrossCells=function(index, world){
      return [index - world.tiled.tilesInX,
              index - 1,
              index + 1,
              index + world.tiled.tilesInX];
    };
    /**
     * @public
     * @function
     */
    _T.getCrossTiles=function(index, tiles, world){
      return this.getCrossCells(index,world).map(c => tiles[c]);
    };
    /**
     * @public
     * @function
     * @returns an array of index numbers matching the cells that touch the
     * 4 corners of the center the center `index` cell
     */
    _T.getDiagonalCells=function(index, world){
      return [index - world.tiled.tilesInX - 1,
              index - world.tiled.tilesInX + 1,
              index + world.tiled.tilesInX - 1,
              index + world.tiled.tilesInX + 1];
    };
    /**
     * @public
     * @function
     */
    _T.getDiagonalTiles=function(index, tiles, world){
      return this.getDiagonalCells(index,world).map(c => tiles[c]);
    };
    /**
     * @public
     * @function
     * @returns an array with the values "up", "down", "left" or "right"
     * that represent all the valid directions in which a sprite can move
     * The `validGid` is the grid index number for the "walkable" part of the world
     * (such as, possibly, `0`.)
     */
    _T.validDirections=function(sprite, tiles, validGid, world){
      const possibles = [Mojo.UP,Mojo.LEFT,Mojo.RIGHT,Mojo.DOWN];
      const pos = this.getTileIndex(sprite, world);
      return this.getCrossTiles(pos,
                                tiles,
                                world).map((gid, i) => {
        return (gid === validGid) ? possibles[i] : Mojo.NONE;
      }).filter(d => d !== Mojo.NONE);
    };
    /**
     * @public
     * @function
     * @returns whether a sprite is in a map location
     * in which it's able to change its direction
     */
    _T.canChangeDirection=function(directions = []){
      let inCulDeSac = directions.length === 1;
      let trapped = directions.length === 0;
      let up = directions.find(x => x === Mojo.UP),
        down = directions.find(x => x === Mojo.DOWN),
        left = directions.find(x => x === Mojo.LEFT),
        right = directions.find(x => x === Mojo.RIGHT),
        atIntersection = (up || down) && (left || right);
      return trapped || atIntersection || inCulDeSac;
    };
    /**
     * Randomly returns the values "up", "down", "left" or "right" based on
     * valid directions supplied. If the are no valid directions, it returns "trapped"
     *
     * @public
     * @function
     *
     */
    _T.randomDirection=function(directions = []){
      let len=directions.length;
      return len===0 ? Mojo.TRAPPED
                     : (len===1 ? directions[0] : directions[_.randInt2(0, len-1)]);
    };
    /**
     * @public
     * @function
     * @returns the closest direction to `spriteTwo` from `spriteOne`.
     */
    _T.closestDirection=function(sprite1, sprite2){
      let v= _getVector(sprite1,sprite2);
      return (_.abs(v[0]) >= _.abs(v[1])) ? ((v[0] <= 0) ? Mojo.LEFT : Mojo.RIGHT)
                                          : ((v[1] <= 0) ? Mojo.UP : Mojo.DOWN);
    };

    return Mojo.Tiles=_T;
  };

})(this);

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

