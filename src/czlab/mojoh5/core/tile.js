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
    function _parseProps(el){
      return (el.properties|| _DA).reduce((acc,p) => {
        acc[p.name]=p.value;
        return acc;
      }, {})
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
    /** Calculate position of each individual cells in the grid,
     * so that we can detect when a user clicks on the cell
     */
    _T.mapGridPos=function(dim,glwidth,ratio=0.8,align="center"){
      let sz = ratio * (Mojo.portrait()?Mojo.width:Mojo.height);
      let cx,cy,x0,y0,x1,y1,x2,y2,out= _.jsVec();
      let gap=glwidth*(dim+1);
      //let wb = Mojo.screenCenter();
      //size of cell
      let cz = (sz-gap)/dim;
      //size of grid
      //sz = cz * dim;
      //top,left
      y1=y0=(Mojo.height - sz)/2;
      switch(align){
        case "right": x0=x1=Mojo.width-sz; break;
        case "left": x0=x1=0;break;
        default: x0=x1=(Mojo.width-sz)/2; break;
      }
      for(let arr,r=0; r<dim; ++r){
        arr=[];
        for(let c= 0; c<dim; ++c){
          y2 = y1 + cz;
          x2 = x1 + cz;
          arr.push(_S.bbox4(x1+glwidth,x2,y1+glwidth,y2));
          x1 = x2;
        }
        out.push(arr);
        y1 = y2;
        x1 = x0;
      }
      return out;
    };
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
    /**Scans all tilesets and record all custom properties into
     * one giant map.
     * @private
     * @function
     */
    function _scanTilesets(tilesets, gprops){
      let gidList = [];
      _.doseq(tilesets, ts=>{
        ts.image= _getImage(ts);
        _.conj(gidList,[ts.firstgid, ts]);
        _.doseq(ts.tiles, t=>{
          //grab all custom props for this GID
          gprops[ts.firstgid + t.id] = _.inject(_parseProps(t), {id:t.id})
        });
      });
      //sort gids ascending
      return gidList.sort((a,b) => a[0]>b[0]?1:(a[0]<b[0]?-1:0));
    }
    /**
     * Load in a Tiled map.
     * @public
     * @function
     */
    _T.tiledWorld=function(json){
      function _c(ps){
        return _S.container(c=>{
          _.assertNot(_.has(c,"tiled"));
          c.tiled=_.inject({},ps);
        })
      }
      function _ver(tmap){
        if(!tmap) throw `Error: ${json} not cached`;
        let tver= tmap["tiledversion"] || tmap["version"];
        if(tver && _.cmpVerStrs(tver,"1.4.2") < 0)
          throw `Error: ${json}-${tver} needs an update`;
        return _parseProps(tmap);
      }
      let tmx = Mojo.resources(json,true).data;
      let W = _c(_ver(tmx));
      let gtileProps={};
      _.patch(W.tiled, {tileLayers: {tilelayer:[],imagelayer:[],objectgroup:[]},
                        tileProps: gtileProps,
                        tileH: tmx.tileheight,
                        tileW: tmx.tilewidth,
                        tilesInX:tmx.width,
                        tilesInY: tmx.height,
                        tiledWidth: tmx.width * tmx.tilewidth,
                        tiledHeight: tmx.height * tmx.tileheight,
                        tileGidList: _scanTilesets(tmx.tilesets,gtileProps)});
      W.tiled.getTSInfo=function(gid){
        return _lookupGid(gid,W.tiled.tileGidList)[1];
      };
      W.tiled.getTileLayer=function(name,panic){
        let found= _.some(W.tiled.tileLayers["tilelayer"], o=>{
          if(o.name===name) return o;
        });
        if(!found && panic)
          throw `There is no layer with name: ${name}`;
        return found;
      };
      W.tiled.getScaleFactor=function(){
        let r=1,n;
        if(Mojo.cmdArg.scaleToWindow === "max"){
          if(Mojo.width>Mojo.height){
            n=tmx.height*tmx.tileheight;
            r=Mojo.height/n;
          }else{
            n=tmx.width*tmx.tilewidth;
            r=Mojo.width/n;
          }
        }
        return r;
      };
      W.tiled.getObjectGroup=function(name,panic){
        let found= _.some(W.tiled.tileLayers["objectgroup"], o=>{
          if(o.name===name) return o;
        });
        if(!found && panic)
          throw `There is no layer with name: ${name}`;
        return found;
      };
      let F={
        tilelayer(tl){
          let data=is.vec(tl.data[0])?tl.data.flat():tl.data;
          let gp=_c(tl);
          for(let gid,i=0;i<data.length;++i){
            gid=data[i];
            if(gid===0){
              continue;
            }
            let tsi=_lookupGid(gid,W.tiled.tileGidList)[1];
            let cols=tsi.columns;
            let _id=gid - tsi.firstgid;
            _.assertNot(_id<0, `Bad tile id: ${_id}`);
            if(!is.num(cols))
              cols=_.floor(tsi.imagewidth / (tsi.tilewidth+tsi.spacing));
            let mapcol = i % tl.width;
            let maprow = _.floor(i/tl.width);
            let tscol = _id % cols;
            let tsrow = _.floor(_id/cols);
            let tsX = tscol * tsi.tilewidth;
            let tsY = tsrow * tsi.tileheight;
            if(tsi.spacing>0){
              tsX += tsi.spacing * tscol;
              tsY += tsi.spacing * tsrow;
            }
            let s = _S.sprite(_S.frame(tsi.image,
                                       tsi.tilewidth,
                                       tsi.tileheight,tsX,tsY));
            let K=W.tiled.getScaleFactor();
            let ps=gtileProps[gid];
            //if(ps && _.has(ps,"anchor")){ s.anchor.set(ps["anchor"]); }
            _.assertNot(_.has(s,"tiled"));
            s.tiled={____gid: gid, ____index: i, id: _id, ts: tsi, props: ps};
            s.scale.x=K;
            s.scale.y=K;
            s.x= mapcol * s.width;
            s.y= maprow * s.height;
            s.mojoh5.resize=function(px,py,pw,ph){
              let K=W.tiled.getScaleFactor();
              s.scale.x=K;
              s.scale.y=K;
              s.x= mapcol * s.width;
              s.y= maprow * s.height;
            };
            gp.addChild(s);
          }
          return gp;
        },
        objectgroup(tl){
          let gp=_c(tl);
          _.doseq(tl.objects,o=>{
            let ps= _parseProps(o);
            _.dissoc(o,"properties");
            _.inject(o,ps);
          });
          return gp;
        },
        imagelayer(tl){
          tl.image=_getImage(tl);
          return _c(tl);
        }
      };
      for(let gp,y,i=0;i<tmx.layers.length;++i){
        y=tmx.layers[i];
        gp=F[y.type] && F[y.type](y);
        if(gp){
          _.inject(gp.tiled,_parseProps(y));
          _.dissoc(gp.tiled,"properties");
          gp.tiled.name=y.name;
          gp.name=y.name;
          gp.visible= !!y.visible;
          gp.alpha = y.opacity;
          W.addChild(gp);
          W.tiled.tileLayers[y.type].push(gp);
        }
      }
      return W;
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


