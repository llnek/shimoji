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
 * Copyright © 2020-2022, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  /**Create the module. */
  function _module(Mojo){

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _DIRS = [Mojo.UP,Mojo.LEFT,Mojo.RIGHT,Mojo.DOWN];
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const _M=gscope["io/czlab/mcfud/math"]();
    const {ute:_, is}=Mojo;
    const abs=Math.abs,
          ceil=Math.ceil,
          int = Math.floor;

    /**
     * @module mojoh5/Tiles
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** from xy position to array index */
    function _getIndex3(px, py, world){
      return Mojo.getIndex(px,py,
                           world.tiled.tileW,
                           world.tiled.tileH,world.tiled.tilesInX) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** get vector from s1->s2 */
    function _getVector(s1,s2){
      return _V.vecAB(Mojo.Sprites.centerXY(s1),
                      Mojo.Sprites.centerXY(s2)) }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** get image file name */
    function _image(obj){
      const s= obj.image;
      const p= s && s.split("/");
      obj.image= p && p.length && p[p.length-1] }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** get attributes for this gid */
    function _findGid(gid,gidMap){
      let idx = -1;
      if(gid>0){
        idx=0;
        while(gidMap[idx+1] &&
              gid >= gidMap[idx+1][0]) ++idx }

      return idx>=0?gidMap[idx]:[];
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Scans all tilesets and record all custom properties into one giant map */
    function _tilesets(tsets, tsi, gprops){
      let gidList = [];
      tsets.forEach(ts=>{
        gidList.push([ts.firstgid, ts]);
        if(!ts.spacing) ts.spacing=0;
        _image(ts);
        let lprops={};
        (ts.tiles||[]).forEach(t=>{
          let p=_.selectNotKeys(t,"properties");
          p=_.inject(p, _parseProps(t));
          p.gid=ts.firstgid + t.id;
          lprops[t.id]=p;
          gprops[p.gid]= p;
        });
        tsi[ts.name]=lprops;
      });
      //sort gids ascending
      return gidList.sort((a,b) => a[0]>b[0]?1:(a[0]<b[0]?-1:0));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** make sure we support this map */
    function _checkVer(json){
      let tmap = Mojo.resource(json,true).data;
      let tver= tmap && (tmap["tiledversion"] || tmap["version"]);
      return (tver &&
              _.cmpVerStrs(tver,"1.4.2") >= 0) ? tmap
                                               : _.assert(false,`${json} needs update`)
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** process properties group */
    function _parseProps(el){
      return (el.properties||[]).reduce((acc,p)=>{
        acc[p.name]=p.value;
        return acc;
      }, {})
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** process the tiled map */
    function _loadTMX(scene,arg,objFactory,scale){
      let tmx= is.str(arg)?_checkVer(arg):arg;
      let tsProps={}, gtileProps={};
      _.assert(is.obj(tmx),"bad tiled map");
      //important to clone it
      tmx=JSON.parse(JSON.stringify(tmx));
      _.inject(scene.tiled,{tileW:tmx.tilewidth,
                            tileH:tmx.tileheight,
                            tilesInX:tmx.width,
                            tilesInY:tmx.height,
                            tiledMap:tmx,
                            saved_tileW:tmx.tilewidth,
                            saved_tileH:tmx.tileheight,
                            tiledWidth:tmx.tilewidth*tmx.width,
                            tiledHeight:tmx.tileheight*tmx.height}, _parseProps(tmx));
      let K= scale? scale: scene.getScaleFactor();
      let NH= _.evenN(K*tmx.tileheight);
      let NW= _.evenN(K*tmx.tilewidth);
      scene.tiled.new_tileW=NW;
      scene.tiled.new_tileH=NH;
      if(scale)
        scene.tiled.scale = scale;
      //workers
      const F={
        imagelayer(tl){ _image(tl) },
        tilelayer(tl){
          if(is.vec(tl.data[0])){
            //from hand-crafted map creation
            tl.width=tl.data[0].length;
            tl.height=tl.data.length;
            tl.data=tl.data.flat();
          }
          if(!tl.width)
            tl.width=scene.tiled.tilesInX;
          if(!tl.height)
            tl.height=scene.tiled.tilesInY;
          //maybe get layer's properties
          let cz,tps=_parseProps(tl);
          if(tl.visible === false){
            //the layer is invisible but maybe user wants to handle it
            if(cz=tps["Class"])
              objFactory[cz](scene,tl);
            return;
          }
          //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
          //process the tiles
          for(let s,gid,i=0;i<tl.data.length;++i){
            if((gid=tl.data[i])==0){ continue }
            if(tl.collision===false || tps.collision === false){
            }else if(tl.collision===true || tps.collision===true){
              if(gid>0) scene.tiled.collision[i]=gid;
              tl.collision=true;
            }
            let mapX = i % tl.width,
                mapY = _M.ndiv(i,tl.width),
                ps=gtileProps[gid],
                cz=ps && ps["Class"],
                cFunc=cz && objFactory[cz],
                tsi=_findGid(gid,scene.tiled.tileGidList)[1],
                s=_ctorTile(scene,gid,mapX,mapY,tps.width,tps.height);
            //assume all these are static (collision) tiles
            if(s){
              s.tiled.layer=tl;
              s.tiled.index=i;
              s.m5.static=true;
            }
            if(cFunc)
              s=cFunc.c(scene,s,tsi,ps);
            if(s){
              if(ps && ps.sensor)
                s.m5.sensor=true
              scene.insert(s,!!cFunc);
            }
          }
        },
        objectgroup(tl){
          tl.sprites=[];
          tl.objects.forEach(o=>{
            _.assert(is.num(o.x),"wanted xy position");
            let s,ps,
                os=_parseProps(o),
                gid=_.nor(o.gid, -1);
            _.inject(o,os);
            if(gid>0)
              ps=gtileProps[gid];
            let cz= _.nor(ps && ps["Class"], o["Class"]);
            let createFunc= cz && objFactory[cz];
            let w=scene.tiled.saved_tileW;
            let h=scene.tiled.saved_tileH;
            let tx=_M.ndiv(o.x+w/2,w);
            let ty=_M.ndiv(o.y-h/2,h);
            let tsi=_findGid(gid,scene.tiled.tileGidList)[1];
            o.column=tx;
            o.row=ty;
            s=gid<=0?{width:NW,height:NH}
                    :_ctorTile(scene,gid,tx,ty,o.width,o.height,cz);
            if(createFunc)
              s= createFunc.c(scene,s,tsi,ps,o);
            if(s){
              if(o.visible===false) s.visible=false;
              o.uuid=s.m5.uuid;
              tl.sprites.push(s);
              scene.insert(s,true);
              if(ps && ps.sensor){s.m5.sensor=true}
            }
          });
        }
      };
      objFactory=_.nor(objFactory,{});
      _.inject(scene.tiled, {objFactory,
                             tileSets: tsProps,
                             tileProps: gtileProps,
                             collision: _.fill(tmx.width*tmx.height,0),
                             imagelayer:[], objectgroup:[], tilelayer:[],
                             tileGidList: _tilesets(tmx.tilesets,tsProps,gtileProps)});
      ["imagelayer","tilelayer","objectgroup"].forEach(s=>{
        tmx.layers.filter(y=>y.type==s).forEach(y=>{
          F[s](y);
          scene.tiled[s].push(y);
        });
      });
      //reset due to possible scaling
      scene.tiled.tileW=NW;
      scene.tiled.tileH=NH;
      scene.tiled.tiledWidth=NW * tmx.width;
      scene.tiled.tiledHeight=NH * tmx.height;
      //
      if(scene.parent instanceof Mojo.Scenes.SceneWrapper){
        if(scene.tiled.tiledHeight<Mojo.height){
          scene.parent.y = _M.ndiv(Mojo.height-scene.tiled.tiledHeight,2) }
        if(scene.tiled.tiledWidth<Mojo.width){
          scene.parent.x = _M.ndiv(Mojo.width-scene.tiled.tiledWidth,2) }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** create a sprite */
    function _ctorTile(scene,gid,mapX,mapY,tw,th,cz){
      let tsi=_findGid(gid,scene.tiled.tileGidList)[1],
          XXX=_.assert(tsi,"Bad GID, no tileset"),
          cols=tsi.columns,
          id=gid - tsi.firstgid,
          ps=scene.tiled.tileProps[gid],
          cFunc, K=scene.tiled.scale || scene.getScaleFactor();
      cz= _.nor(cz, (ps && ps["Class"]));
      cFunc=cz && scene.tiled.objFactory[cz];
      _.assertNot(id<0, `Bad tile id: ${id}`);
      if(!is.num(cols))
        cols=_M.ndiv(tsi.imagewidth , tsi.tilewidth+tsi.spacing);
      let tscol = id % cols,
          tsrow = _M.ndiv(id,cols),
          tsX = tscol * tsi.tilewidth,
          tsY = tsrow * tsi.tileheight;
      if(tsi.spacing>0){
        tsX += tsi.spacing * tscol;
        tsY += tsi.spacing * tsrow;
      }
      //call user func to create sprite or not
      let s= cFunc&&cFunc.s(scene) ||
             Mojo.Sprites.frame(tsi.image,
                                tw||tsi.tilewidth,
                                th||tsi.tileheight,tsX,tsY);
      if(s){
        s.tiled={id, gid};
        if(tw==scene.tiled.saved_tileW){
          s.width= scene.tiled.new_tileW
        }else{
          s.scale.x=K;
          s.width = _.evenN(s.width);
        }
        if(th==scene.tiled.saved_tileH){
          s.height= scene.tiled.new_tileH
        }else{
          s.scale.y=K;
          s.height = _.evenN(s.height);
        }
        s.x=mapX* scene.tiled.new_tileW;
        s.y=mapY* scene.tiled.new_tileH;
      }
      return s;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** use it for collision */
    const _contactObj = Mojo.Sprites.lift({width: 0,
                                           height: 0,
                                           parent:null,
                                           x:0, y:0,
                                           rotation:0,
                                           tiled:{},
                                           anchor: {x:0,y:0},
                                           getGlobalPosition(){
                                             return{
                                               x:this.x+this.parent.x,
                                               y:this.y+this.parent.y} }});

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**
     * @memberof module:mojoh5/Tiles
     * @class
     */
    class TiledScene extends Mojo.Scenes.Scene{
      /**
       * @param {any} id
       * @param {function|object} func
       * @param {object} [options]
       */
      constructor(id,func,options){
        super(id,func,options);
        this.tiled={};
      }
      /**
      */
      reloadMap(o){
        this.tiled={};
        this.m5.options.tiled = o;
        _loadTMX(this, o.name, o.factory, o.scale);
      }
      /**
      */
      runOnce(){
        const t= this.m5.options.tiled;
        _loadTMX(this, t.name, t.factory, t.scale);
        super.runOnce();
      }
      /**
      */
      removeTile(layer, s){
        let {x,y}= s;
        if(s.anchor.x < 0.3){
          y= s.y+_M.ndiv(s.height,2);
          x= s.x+_M.ndiv(s.width,2);
        }
        let tx= _M.ndiv(x,this.tiled.tileW),
            ty= _M.ndiv(y,this.tiled.tileH),
            yy= this.getTileLayer(layer),
            pos= tx + ty*this.tiled.tilesInX;
        yy.data[pos]=0;
        if(yy.collision)
          this.tiled.collision[pos]=0;
        Mojo.Sprites.remove(s);
      }
      /**Get a tile layer.
       * @param {object} world
       * @param {string} name
       * @param {boolean} [panic] if none found, throws error
       * @return {Container}
       */
      getTileLayer(name,panic){
        let found= _.some(this.tiled.tilelayer, o=>{
          if(o.name==name) return o;
        });
        if(!found && panic)
          throw `There is no layer with name: ${name}`;
        return found;
      }
      /**Get a object group.
       * @param {object} world
       * @param {string} name
       * @param {boolean} [panic] if none found, throws error
       * @return {Container}
       */
      getObjectGroup(name,panic){
        let found= _.some(this.tiled.objectgroup, o=>{
          if(o.name==name) return o;
        });
        if(!found && panic)
          throw `There is no group with name: ${name}`;
        return found;
      }
      /**Set a tile to this position.
       * @param {string} layer
       * @param {number} row
       * @param {number} col
       * @param {number} gid
       * @return {Sprite}
       */
      setTile(layer,row,col,gid){
        let ts=this.getTSInfo(gid),
            id= gid-ts.firstgid,
            yy=this.getTileLayer(layer),
            pos=col + this.tiled.tilesInX * row;
        if(yy.collision)
          this.tiled.collision[pos]=gid;
        let s=_ctorTile(this,gid,col,row,ts.tilewidth,ts.tileheight);
        if(s){
          s.tiled.index=pos;
          s.tiled.layer=yy;
        }
        return s;
      }
      /**Get the tile position for this sprite.
       * @param {Sprite} s
       * @return {array}
       */
      getTile(s){
        let {x,y}=s;
        if(s.anchor.x<0.3){
          y += _M.ndiv(s.height,2);
          x += _M.ndiv(s.width,2);
        }
        return this.getTileXY(x,y);
      }
      /**Get the tile position for this xy position
       * @param {number} px
       * @param {number} py
       * @return {array}
       */
      getTileXY(px,py){
        let tx= _M.ndiv(px,this.tiled.tileW),
            ty= _M.ndiv(py,this.tiled.tileH);
        _.assert(tx>=0 && tx<this.tiled.tilesInX, `bad tile col:${tx}`);
        _.assert(ty>=0 && ty<this.tiled.tilesInY, `bad tile row:${ty}`);
        return [tx,ty];
      }
      /**Get item with this name.
       * @param {string} name
       * @return {array}
       */
      getNamedItem(name){
        let out=[];
        this.tiled.objectgroup.forEach(c=>{
          c.objects.forEach(o=>{
            if(name==_.get(o,"name")) out.push(o)
          });
        });
        return out;
      }
      /**Get scale factor for this world.
       * @return {number}
       */
      getScaleFactor(){
        let x,y,r=1;
        if(Mojo.u.scaleToWindow == "max"){
          if(Mojo.width>Mojo.height){
            y=Mojo.height/(this.tiled.saved_tileH*this.tiled.tilesInY);
            r=y;
          }else{
            x=Mojo.width/(this.tiled.saved_tileW*this.tiled.tilesInX)
            r=x;
          }
        }
        return r;
      }
      /**Cross reference a point's position to a tile index.
       * @param {Sprite} s
       * @return {number} the tile position
       */
      getTileIndex(s){
        let [x,y]= Mojo.Sprites.centerXY(s);
        return _getIndex3(x,y,this);
      }
      /**Get tileset information.
       * @param {number} gid
       * @return {object}
       */
      getTSInfo(gid){
        return _findGid(gid,this.tiled.tileGidList)[1] }
      /**Get tile information.
       * @param {number} gid
       * @return {object}
       */
      getTileProps(gid){
        return this.tiled.tileProps[gid] }
      /** @ignore */
      _getContactObj(gid, tX, tY){
        let c= _contactObj;
        c.height=this.tiled.tileH;
        c.width=this.tiled.tileW;
        c.x = tX * c.width;
        c.y = tY * c.height;
        c.tiled.gid=gid;
        c.tiled.row=tY;
        c.tiled.col=tX;
        c.m5.sensor=false;
        return c;
      }
      /**Check tile collision.
       * @param {Sprite} obj
       * @return {boolean}
       */
      collideXY(obj){
        let _S=Mojo.Sprites,
            tw=this.tiled.tileW,
            th=this.tiled.tileH,
            tiles=this.tiled.collision,
            box=_.feq0(obj.angle)?_S.getAABB(obj):_S.boundingBox(obj);
        let sX = Math.max(0,_M.ndiv(box.x1 , tw));
        let sY = Math.max(0,_M.ndiv(box.y1 , th));
        let eX =  Math.min(this.tiled.tilesInX-1,ceil(box.x2 / tw));
        let eY =  Math.min(this.tiled.tilesInY-1,ceil(box.y2 / th));
        for(let ps,c,gid,pos,B,tY = sY; tY<=eY; ++tY){
          for(let tX = sX; tX<=eX; ++tX){
            pos=tY*this.tiled.tilesInX+tX;
            gid=tiles[pos];
            if(!is.num(gid))
              _.assert(is.num(gid),"bad gid");
            if(gid===0){continue}
            B=this._getContactObj(gid,tX, tY);
            ps=this.getTileProps(gid);
            if(ps)
              B.m5.sensor= !!ps.sensor;
            B.parent=this;
            if(_S.hit(obj,B)){
              if(B.m5.sensor){
                Mojo.emit(["2d.sensor",obj],B); } }
          }
        }
        return super.collideXY(obj);
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    class AStarAlgos{
      constructor(straightCost,diagonalCost){
        this.straightCost= straightCost;
        this.diagonalCost= diagonalCost;
      }
      manhattan(test, dest){
        return abs(test.row - dest.row) * this.straightCost +
               abs(test.col - dest.col) * this.straightCost
      }
      euclidean(test, dest){
        let vx = dest.col - test.col;
        let vy = dest.row - test.row;
        return int(_.sqrt(vx * vx + vy * vy) * this.straightCost)
      }
      diagonal(test, dest){
        let vx = abs(dest.col - test.col);
        let vy = abs(dest.row - test.row);
        return (vx > vy) ? int(this.diagonalCost * vy + this.straightCost * (vx - vy))
                         : int(this.diagonalCost * vx + this.straightCost * (vy - vx))
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      TiledScene,
      /**Get the indices of the neighbor cells.
       * @memberof module:mojoh5/Tiles
       * @param {number} index
       * @param {object} world
       * @param {boolean} ignoreSelf
       * @return {number[]} cells around a tile x x x
       *                                        x c x
       *                                        x x x
       */
      neighborCells(index, world, ignoreSelf){
        let w=world.tiled.tilesInX;
        let a= [index-w-1, index-w, index-w+1, index-1];
        let b= [index+1, index+w-1, index+w, index+w+1];
        if(!ignoreSelf) a.push(index);
        return a.concat(b);
      },
      /**Takes a map array and adds a sprite's grid index number (`gid`) to it.
       * @memberof module:mojoh5/Tiles
       * @param {number[]} gidList
       * @param {Sprite[]} sprites
       * @param {object} world
       * @return {number[]}
       */
      updateMap(gidList, sprites, world){
        let ret = _.fill(gidList.length,0);
        let _mapper=(s)=>{
          let pos= this.getTileIndex(s,world);
          _.assert(pos >= 0 && pos < ret.length, "tiled index outofbound");
          s.tiled.index = pos;
          ret[pos] = s.tiled.gid;
        };
        !is.vec(sprites) ? _mapper(sprites) : sprites.forEach(_mapper);
        return ret;
      },
      /**A-Star search.
       * @memberof module:mojoh5/Tiles
       * @param {number} startTile
       * @param {number} targetTile
       * @param {object[]} tiles
       * @param {object} world
       * @param {number[]} obstacles
       * @param {string} heuristic
       * @param {boolean} useDiagonal
       * @return {any[]}
       */
      shortestPath(startTile, targetTile, tiles, world,
                   obstacles=[],
                   heuristic="manhattan", useDiagonal=true){
        let W=world.tiled.tilesInX;
        let nodes=tiles.map((gid,i)=> ({f:0, g:0, h:0,
                                        parent:null, index:i,
                                        col:i%W, row:_M.ndiv(i,W)}));
        let targetNode = nodes[targetTile];
        let startNode = nodes[startTile];
        let centerNode = startNode;
        let openList = [centerNode];
        let closedList = [];
        let theShortestPath = [];
        let straightCost=10;
        let diagonalCost=14;
        let _testNodes=(i)=>{
          let c= !useDiagonal ? this.crossCells(i,world)
                              : this.neighborCells(i, world, true);
          return c.map(p=>nodes[p]).filter(n=>{
            if(n){
              let indexOnLeft= (i% W) == 0;
              let indexOnRight= ((i+1) % W) == 0;
              let nodeBeyondLeft= (n.col % (W-1)) == 0 && n.col != 0;
              let nodeBeyondRight= (n.col % W) == 0;
              let nodeIsObstacle = obstacles.some(o => tiles[n.index] == o);
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
            if(centerNode.row == tn.row ||
               centerNode.col == tn.col){
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
              openList.push(tn);
            }
          }
          closedList.push(centerNode);
          //Quit the loop if there's nothing on the open list.
          //This means that there is no path to the destination or the
          //destination is invalid, like a wall tile
          if(openList.length == 0){
            return theShortestPath;
          }
          //Sort the open list according to final cost
          openList = openList.sort((a, b) => a.f - b.f);
          //Set the node with the lowest final cost as the new centerNode
          centerNode = openList.shift();
        }
        //Now that we have all the candidates, let's find the shortest path!
        if(openList.length != 0){
          //Start with the destination node
          let tn = targetNode;
          theShortestPath.push(tn);
          //Work backwards through the node parents
          //until the start node is found
          while(tn !== startNode){
            tn = tn.parent;
            theShortestPath.unshift(tn); } }
        return theShortestPath;
      },
      /**Check if sprites are visible to each other.
       * @param {Sprite} s1
       * @param {Sprite} s2
       * @param {any[]} tiles
       * @param {object} world
       * @param {number} segment
       * @param {number[]} angles
       * @return {boolean}
       */
      lineOfSight(s1, s2, tiles, world,
                  emptyGid = 0,
                  segment = 32, //distance between collision points
                  angles = []) { //angles to restrict the line of sight
        let v= _getVector(s1,s2);
        let len = _V.len(v);
        let numPts = _M.ndiv(len,segment);
        let len2,x,y,ux,uy,points = [];
        for(let c,i = 1; i <= numPts; ++i){
          c= Mojo.Sprites.centerXY(s1);
          len2 = segment * i;
          ux = v[0]/len;
          uy = v[1]/len;
          //Use the unit vector and newMagnitude to figure out the x/y
          //position of the next point in this loop iteration
          x = int(c[0] + ux * len2);
          y = int(c[1] + uy * len2);
          points.push({x,y, index: _getIndex3(x,y,world)});
        }
        //Restrict line of sight to right angles (don't want to use diagonals)
        //Find the angle of the vector between the two sprites
        let angle = Math.atan2(v[1], v[0]) * 180 / Math.PI;
        //The tile-based collision test.
        //The `noObstacles` function will return `true` if all the tile
        //index numbers along the vector are `0`, which means they contain
        //no walls. If any of them aren't 0, then the function returns
        //`false` which means there's a wall in the way
        return points.every(p=> tiles[p.index] == emptyGid) &&
               (angles.length == 0 || angles.some(x=> x == angle)) },
      /**Get indices of orthognoal cells.
       * @memberof module:mojoh5/Tiles
       * @param {number} index
       * @param {object} world
       * @return {number[]}
       */
      crossCells(index, world){
        const w= world.tiled.tilesInX;
        return [index - w, index - 1, index + 1, index + w] },
      /**Get orthognoal cells.
       * @memberof module:mojoh5/Tiles
       * @param {number} index
       * @param {any[]} tiles
       * @param {object} world
       * @return {any[]}
       */
      getCrossTiles(index, tiles, world){
        return this.crossCells(index,world).map(c=> tiles[c]) },
      /**Get the indices of corner cells.
       * @memberof module:mojoh5/Tiles
       * @param {number} index
       * @param {number|object} world
       * @return {number[]}
       */
      getDiagonalCells(index, world){
        const w= is.num(world)?world:world.tiled.tilesInX;
        return [index-w-1, index-w+1, index+w-1, index+w+1] },
      /**Get the corner cells.
       * @memberof module:mojoh5/Tiles
       * @param {number} index
       * @param {any[]} tiles
       * @param {object} world
       * @return {any[]}
       */
      getDiagonalTiles(index, tiles, world){
        return this.getDiagonalCells(index,world).map(c=> tiles[c]) },
      /**Get all the valid directions to move for this sprite.
       * @memberof module:mojoh5/Tiles
       * @param {Sprite} sprite
       * @param {any[]} tiles
       * @param {number} validGid
       * @param {object} world
       * @return {any[]}
       */
      validDirections(sprite, tiles, validGid, world){
        const pos= this.getTileIndex(sprite, world);
        return this.getCrossTiles(pos, tiles, world).map((gid, i)=>{
          return gid == validGid ? _DIRS[i] : Mojo.NONE
        }).filter(d => d !== Mojo.NONE)
      },
      /**Check if these directions are valid.
       * @memberof module:mojoh5/Tiles
       * @param {number[]} directions
       * @return {boolean}
       */
      canChangeDirection(dirs=[]){
        let up = dirs.find(x => x === Mojo.UP);
        let down = dirs.find(x => x === Mojo.DOWN);
        let left = dirs.find(x => x === Mojo.LEFT);
        let right = dirs.find(x => x === Mojo.RIGHT);
        return dirs.length==0 ||
               dirs.length==1 || ((up||down) && (left||right)); },
      /**Randomly choose the next direction.
       * @memberof module:mojoh5/Tiles
       * @param {number[]} dirs
       * @return {number}
       */
      randomDirection(dirs=[]){
        return dirs.length==0 ? Mojo.NONE
                               : (dirs.length==1 ? dirs[0]
                                                  : dirs[_.randInt2(0, dirs.length-1)]) },
      /**Find the best direction from s1 to s2.
       * @memberof module:mojoh5/Tiles
       * @param {Sprite} s1
       * @param {Sprite} s2
       * @return {number}
       */
      closestDirection(s1, s2){
        const v= _getVector(s1,s2);
        return abs(v[0]) < abs(v[1]) ? ((v[1] <= 0) ? Mojo.UP : Mojo.DOWN)
                                     : ((v[0] <= 0) ? Mojo.LEFT : Mojo.RIGHT) }
    };

    return (Mojo.Tiles=_$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/mojoh5/Tiles"]=function(M){
      return M.Tiles ? M.Tiles : _module(M)
    }
  }

})(this);


