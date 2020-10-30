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
    /** dummy empty array
     * @private
     * @var {array}
     */
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
    /**
     * @private
     * @function
     */
    function _checkVersion(tmap,file){
      //check version of map-editor
      let tver= tmap["tiledversion"] || tmap["version"];
      if(tver && _.cmpVerStrs(tver,"1.4.2") < 0)
        throw `Error: ${file} version out of date`;
      return _parseProperties(tmap);
    }
    /**
     * @private
     * @function
     */
    function _getIndex3(x, y, world){
      return Mojo.getIndex(x,y,
                           world.tiled.tileW,
                           world.tiled.tileH,world.tiled.tilesInX)
    }
    /**
     * Converts a point's position to a tile index.
     *
     * @public
     * @function
     * @returns the tile position
     */
    _T.getTileIndex=function(pt,world){
      return _getIndex3(pt.x,pt.y,world)
    };
    /**
     * @private
     * @function
     */
    function _getVector(sprite1,sprite2,global=false){
      return _V.makeVecAB(_S.centerXY(sprite1,global), _S.centerXY(sprite2,global))
    }
    /**
     * Converts a tile's index number into x/y screen
     * coordinates, and capture's the tile's grid index (`gid`) number.
     * @public
     * @function
     * @returns A tile object.
     */
    _T.getTile=function(index, gidList, world){
      let tiled=world.tiled;
      return _S.extend({gid: gisList[index],
                        width: tiled.tileW,
                        height: tiled.tileH,
                        anchor: Mojo.makeAnchor(0,0),
                        getGlobalPosition(){ return {x: this.x, y: this.y } },
                        x: ((index % tiled.tilesInX) * tiled.tileW) + world.x,
                        y: ((_.floor(index / tiled.tilesInX)) * tiled.tileH) + world.y})
    };
    /**
     * @public
     * @function
     * @returns cells around a tile x x x
     *                              x c x
     *                              x x x
     */
    _T.neighborCells=function(index, world, ignoreSelf){
      let w=world.tiled.tilesInX;
      let a= [index - w - 1, index - w, index - w + 1, index - 1];
      let b= [index + 1, index + w - 1, index + w, index + w + 1];
      if(!ignoreSelf) a.push(index);
      return a.concat(b);
    };
    /**
     * @private
     * @function
     */
    function _getContactPoints(s){
      //internal rectangle defining the collision area of this sprite
      let c,a= _S.getBBox(s);
      if(c=s.collisionArea){
        a={x1: a.x1+c.x1, x2: a.x1+c.x2,
           y1: a.y1+c.y1, y2: a.y1+c.y2 };
      }
      a.x2 -= 1;
      a.y2 -= 1;
      return [_V.V2(a.x1,a.y1),_V.V2(a.x2,a.y1),
              _V.V2(a.x2,a.y2),_V.V2(a.x1,a.y2)]
    };
    /**
     * Checks for a collision between a sprite and a tile.
     * @public
     * @function
     * @returns a `collision` object.
     */
    _T.hitTestTile=function(sprite, gidList, gidToCheck, world, checkHow=Mojo.SOME){
      let col= {};
      function _checker(pt){
        col.index = _getIndex3(pt[0], pt[1], world);
        col.gid = gidList[col.index];
        return col.gid === gidToCheck;
      }
      let colPts= checkHow === Mojo.CENTER ? [_S.centerXY(sprite)]
                                           : _getContactPoints(sprite);
      let op= checkHow===Mojo.EVERY ? "every" : "some";
      col.hit = colPts[op](_checker);
      _V.dropV2(...colPts);
      return col;
    };
    /**
     * Takes a map array and adds a sprite's grid index number (`gid`) to it.
     * @public
     * @function
     */
    _T.updateMap=function(gidList, spritesToUpdate, world){
      let ret = _.fill(new Array(gidList.length),0);
      function _mapper(s){
        let pos= _T.getTileIndex(_S.centerXY(s), world);
        _.assert(pos >= 0 && pos < ret.length, "tiled index outofbound");
        s.tiled.____index = pos;
        ret[pos] = s.tiled.____gid;
      }
      !is.vec(spritesToUpdate) ? _mapper(spritesToUpdate)
                               : spritesToUpdate.forEach(_mapper);
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
    /**
     * @private
     * @function
     */
    function _parsePoint(pt){
      let pts = pt.split(",");
      return [parseFloat(pts[0]), parseFloat(pts[1])];
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
    function _scanTilesets(tilesets, tileProperties){
      let gidList = [];
      _.doseq(tilesets, ts => {
        let tsinfo=_.selectKeys(ts,"firstgid,name,spacing,imageheight,imagewidth,tileheight,tilewidth");
        tsinfo.image= _getImage(ts);
        _.doseq(ts.tiles, t => {
          tileProperties[tsinfo.firstgid + t.id] = _.inject(_parseProperties(t), {id:t.id})
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
     * @private
     * @function
     */
    function _container(ps){
      let c= _S.container();
      _.assert(!_.has(c,"tiled"));
      c.tiled=_.inject({},ps);
      return c;
    }
    /**
     * Load in a Tiled map.
     * @public
     * @function
     */
    _T.makeTiledWorld=function(jsonTiledMap){
      let tmx = Mojo.resources(jsonTiledMap);
      tmx= tmx && tmx.data;
      if(!tmx)
        throw `Error: ${jsonTiledMap} not cached`;
      let tprops= _checkVersion(tmx,jsonTiledMap);
      let world = _container(tprops);
      let tiled= world.tiled;
      let gtileProps={};
      _.patch(tiled, {tileObjects: [],
                      objectGroups: {},
                      tileProps: gtileProps,
                      tileH: tmx.tileheight,
                      tileW: tmx.tilewidth,
                      tilesInX: tmx.width,
                      tilesInY: tmx.height,
                      tiledWidth: tmx.width * tmx.tilewidth,
                      tiledHeight: tmx.height * tmx.tileheight,
                      tileGidList: _scanTilesets(tmx.tilesets,gtileProps)});
      _.doseq(tmx.layers, layer => {
        let gp = _container();
        world.addChild(gp);
        gp.alpha = layer.opacity;
        _.inject(gp.tiled, layer);
        _.conj(world.tiled.tileObjects,gp);
        function _doTileLayer(tl){
          _.assert(tl.name,"Error: tile-layer has no name");
          for(let gid,i=0;i<tl.data.length;++i){
            gid=tl.data[i];
            if(gid===0) continue;
            let tsinfo=_lookupGid(gid,tiled.tileGidList)[1];
            let tileId=gid - tsinfo.firstgid;
            _.assert(tileId>=0, `Bad tile id: ${tileId}`);
            let cols=_.floor(tsinfo.imagewidth / (tsinfo.tilewidth+tsinfo.spacing));
            //let frames= cols * (_.floor(tsinfo.imageheight/(tsinfo.tileheight + tsinfo.spacing)));
            let mapColumn = i % tl.width;
            let mapRow = _.floor(i/ tl.width);
            let mapX = mapColumn * tsinfo.tilewidth;
            let mapY = mapRow * tsinfo.tileheight;
            let tilesetCol = tileId % cols;
            let tilesetRow = _.floor(tileId / cols);
            let tilesetX = tilesetCol * tsinfo.tilewidth;
            let tilesetY = tilesetRow * tsinfo.tileheight;
            if(tsinfo.spacing > 0){
              tilesetX += tsinfo.spacing * tilesetCol;
              tilesetY += tsinfo.spacing * tilesetRow;
            }
            let texture = _S.frame(tsinfo.image, tsinfo.tilewidth,tsinfo.tileheight, tilesetX,tilesetY);
            let s = _S.extend(new Mojo.PXSprite(texture));
            let tprops=gtileProps[gid];
            _.assert(!_.has(s,"tiled"));
            s.tiled={____gid: gid, ____index: i, id: tileId, ts: tsinfo.name};
            s.x = mapX;
            s.y = mapY;
            if(tprops && _.has(tprops,"name")){
              _.inject(s.tiled, tprops);
              _.conj(tiled.tileObjects, s);
            }
            gp.addChild(s);
          }
        }
        function _doObjGroup(tl){
          let props,tsinfo;
          _.assert(tl.name,"Error: group has no name");
          tiled.objectGroups[tl.name]=tl;
          _.doseq(tl.objects,o => {
            _.assert(!_.has(o,"tiled"));
            if(o.name){
              o.tiled={name: o.name};
              _.conj(tiled.tileObjects,o);
            }
          });
        }
        if(layer.type === "tilelayer"){
          _doTileLayer(layer);
        }else if(layer.type === "objectgroup"){
          _doObjGroup(layer);
        }
      });
      world.tiled.parseObjects=function(group,cb){
        let g= world.tiled.objectGroups[group];
        g && g.objects && g.objects.forEach(o=> {
          let ts=world.tiled.getTSInfo(o.gid);
          let ps=world.tiled.tileProps[o.gid];
          cb(world,group,ts,_.inject({},o,ps))
        });
      };
      world.tiled.getTSInfo=function(gid){
        return _lookupGid(gid,world.tiled.tileGidList)[1];
      };
      world.tiled.getOne=function(name,panic){
        let found= _.some(world.tiled.tileObjects, o => {
          if(o.tiled && o.tiled.name === name)
            return o;
        });
        if(!found && panic)
          throw `There is no object with the property name: ${name}`;
        return found;
      };
      world.tiled.getAll = function(objectNames,panic){
        let found= [];
        objectNames=_.seq(objectNames);
        _.doseq(world.tiled.tileObjects,o => {
          if(o.tiled && _.has(objectNames,o.tiled.name))
            _.conj(found,o);
        });
        if(found.length ===0 && panic)
          throw "Could not find those objects";
        return found;
      };
      //extend all nested sprites
      function _addProps(obj){
        _S.extend(obj);
        _.doseq(obj.children,_addProps);
      }
      _.doseq(world.children,_addProps);
      return world;
    };
    /**
     * @private
     * @class
     */
    class AStarAlgos{
      constructor(straightCost,diagonalCost){
        this.straightCost= straightCost;
        this.diagonalCost= diagonalCost;
      }
      manhattan(test, dest){
        return _.abs(test.row - dest.row) * this.straightCost +
               _.abs(test.col - dest.col) * this.straightCost
      }
      euclidean(test, dest){
        let vx = dest.col - test.col;
        let vy = dest.row - test.row;
        return _.floor(_.sqrt(vx * vx + vy * vy) * this.straightCost)
      }
      diagonal(test, dest){
        let vx = _.abs(dest.col - test.col);
        let vy = _.abs(dest.row - test.row);
        return (vx > vy) ? _.floor(this.diagonalCost * vy + this.straightCost * (vx - vy))
                         : _.floor(this.diagonalCost * vx + this.straightCost * (vy - vx))
      }
    }
    /**
     * A-Star search.
     * @public
     * @function
     */
    _T.shortestPath=function(startTile, targetTile, tiles, world,
                             obstacleGids = [],
                             heuristic = "manhattan", useDiagonal=true){
      let W=world.tiled.tilesInX;
      let openList = [];
      let closedList = [];
      let theShortestPath = [];
      let nodes = tiles.map((gid,i) =>
        ({f: 0, g: 0, h: 0,
          parent: null, index:i,
          col: i % W, row: _.floor(i/W)}));
      let targetNode = nodes[targetTile];
      let startNode = nodes[startTile];
      let centerNode = startNode;
      let straightCost=10;
      let diagonalCost=14;
      _.conj(openList,centerNode);
      function _testNodes(i){
        let c= !useDiagonal ? _T.crossCells(i,world)
                            : _T.neighborCells(i, world, true);
        return c.map(p=>nodes[p]).filter(n=>{
          if(n){
            let indexOnLeft= (i% W) === 0;
            let indexOnRight= ((i+1) % W) === 0;
            let nodeBeyondLeft= (n.col % (W-1)) === 0 && n.col !== 0;
            let nodeBeyondRight= (n.col % W) === 0;
            let nodeIsObstacle = obstacleGids.some(o => tiles[n.index] === o);
            return indexOnLeft ? !nodeBeyondLeft
                               : (indexOnRight ? !nodeBeyondRight : !nodeIsObstacle);
          }
        });
      }
      while(centerNode !== targetNode){
        let testNodes = _testNodes(centerNode.index);
        for(let f,g,h,cost,tn,i=0; i < testNodes.length; ++i){
          tn = testNodes[i];
          //Find out whether the node is on a straight axis or
          //a diagonal axis, and assign the appropriate cost
          //A. Declare the cost variable
          cost = diagonalCost;
          //B. Do they occupy the same row or column?
          if(centerNode.row === tn.row ||
             centerNode.col === tn.col){
            cost = straightCost;
          }
          //C. Calculate the costs (g, h and f)
          //The node's current cost
          g = centerNode.g + cost;
          //The cost of travelling from this node to the
          //destination node (the heuristic)
          f = g + new AStarAlgos(straightCost,diagonalCost)[heuristic](tn,targetNode);
          let isOnOpenList = openList.some(n => tn === n);
          let isOnClosedList = closedList.some(n => tn === n);
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
            _.conj(openList,tn);
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
     * Find out whether two sprites are visible to each other.
     * @public
     * @function
     */
    _T.lineOfSight=function(sprite1,
                            sprite2,
                            tiles,
                            world,
                            emptyGid = 0,
                            segment = 32, //distance between collision points
                            angles = []) { //angles to restrict the line of sight
      let v= _getVector(sprite1,sprite2);
      let len = _V.vecLen(v);
      let numPts = len / segment;
      let len2,x,y,ux,uy,points = [];
      for(let c,i = 1; i <= numPts; ++i){
        c= _S.centerXY(sprite1);
        len2 = segment * i;
        ux = v[0]/len;
        uy = v[1]/len;
        //Use the unit vector and newMagnitude to figure out the x/y
        //position of the next point in this loop iteration
        x = c[0] + ux * len2;
        y = c[1] + uy * len2;
        _.conj(points,{x: x, y: y, index: _getIndex3(x, y, world)});
      };
      //Restrict line of sight to right angles (don't want to use diagonals)
      //Find the angle of the vector between the two sprites
      let angle = Math.atan2(v[1], v[0]) * 180 / Math.PI;
      //The tile-based collision test.
      //The `noObstacles` function will return `true` if all the tile
      //index numbers along the vector are `0`, which means they contain
      //no walls. If any of them aren't 0, then the function returns
      //`false` which means there's a wall in the way
      return points.every(p => tiles[p.index] === emptyGid) &&
             (angles.length === 0 || angles.some(x => x === angle))
    };
    /**
     * @public
     * @function
     * @returns an array of index numbers matching the cells that are orthogonally
     * adjacent to the center `index` cell.
     */
    _T.crossCells=function(index, world){
      let w= world.tiled.tilesInX;
      return [index - w, index - 1, index + 1, index + w]
    };
    /**
     * @public
     * @function
     */
    _T.getCrossTiles=function(index, tiles, world){
      return this.crossCells(index,world).map(c => tiles[c])
    };
    /**
     * @public
     * @function
     * @returns an array of index numbers matching the cells that touch the
     * 4 corners of the center the center `index` cell
     */
    _T.getDiagonalCells=function(index, world){
      let w= world.tiled.tilesInX;
      return [index - w - 1, index - w + 1, index + w - 1, index + w + 1]
    };
    /**
     * @public
     * @function
     */
    _T.getDiagonalTiles=function(index, tiles, world){
      return this.getDiagonalCells(index,world).map(c => tiles[c])
    };
    /**
     * @private
     * @var {array}
     */
    const _POSSIBLES = [Mojo.UP,Mojo.LEFT,Mojo.RIGHT,Mojo.DOWN];
    /**
     * @public
     * @function
     * @returns an array with the values "up", "down", "left" or "right"
     * that represent all the valid directions in which a sprite can move
     * The `validGid` is the grid index number for the "walkable" part of the world
     * (such as, possibly, `0`.)
     */
    _T.validDirections=function(sprite, tiles, validGid, world){
      const pos = this.getTileIndex(sprite, world);
      return this.getCrossTiles(pos, tiles, world).map((gid, i) => {
        return gid === validGid ? _POSSIBLES[i] : Mojo.NONE
      }).filter(d => d !== Mojo.NONE)
    };
    /**
     * @public
     * @function
     * @returns whether a sprite is in a map location
     * in which it's able to change its direction
     */
    _T.canChangeDirection=function(directions = []){
      let up = directions.find(x => x === Mojo.UP);
      let down = directions.find(x => x === Mojo.DOWN);
      let left = directions.find(x => x === Mojo.LEFT);
      let right = directions.find(x => x === Mojo.RIGHT);
      return directions.length === 0 ||
             ((up||down) && (left||right)) || directions.length === 1
    };
    /**
     * Randomly returns the values "up", "down", "left" or "right" based on
     * valid directions supplied. If the are no valid directions, it returns "trapped"
     * @public
     * @function
     */
    _T.randomDirection=function(dirs = []){
      return dirs.length===0 ? Mojo.TRAPPED
                             : (dirs.length===1 ? dirs[0]
                                                : dirs[_.randInt2(0, dirs.length-1)])
    };
    /**
     * @public
     * @function
     * @returns the closest direction to `spriteTwo` from `spriteOne`.
     */
    _T.closestDirection=function(sprite1, sprite2){
      let v= _getVector(sprite1,sprite2);
      return _.abs(v[0]) < _.abs(v[1]) ? ((v[1] <= 0) ? Mojo.UP : Mojo.DOWN)
                                       : ((v[0] <= 0) ? Mojo.LEFT : Mojo.RIGHT)
    };

    return (Mojo.Tiles=_T)
  }
  /**
   * @public
   * @module
   */
  global["io.czlab.mojoh5.Tiles"]=function(Mojo){
    return Mojo.Tiles ? Mojo.Tiles : _module(Mojo)
  };

})(this);


