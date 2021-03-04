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
 * Copyright © 2020-2021, Kenneth Leung. All rights reserved. */

;(function(gscope){

  "use strict";


  /**Create the module.
   */
  function _module(Mojo){

    const _DIRS = [Mojo.UP,Mojo.LEFT,Mojo.RIGHT,Mojo.DOWN];
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const {ute:_, is}=Mojo;
    const ABS=Math.abs,
          CEIL=Math.ceil,
          MFL=Math.floor;

    /** dummy empty array
     * @private
     * @var {array}
     */
    const _DA=[];

    /**
     * @module mojoh5/Tiles
     */

    /** @ignore */
    function _getIndex3(x, y, world){
      return Mojo.getIndex(x,y,
                           world.tiled.tileW,
                           world.tiled.tileH,world.tiled.tilesInX)
    }

    /** @ignore */
    function _getVector(s1,s2){
      return _V.vecAB(Mojo.Sprites.centerXY(s1),
                      Mojo.Sprites.centerXY(s2))
    }

    /** @ignore */
    function _getContactPoints(s){
      //internal rectangle defining the collision area of this sprite
      let c,a= Mojo.Sprites.getBBox(s);
      if(c=s.m5.collisionArea){
        a={x1: a.x1+c.x1, x2: a.x1+c.x2,
           y1: a.y1+c.y1, y2: a.y1+c.y2 };
      }
      a.x2 -= 1;
      a.y2 -= 1;
      return [_V.vec(a.x1,a.y1),_V.vec(a.x2,a.y1),
              _V.vec(a.x2,a.y2),_V.vec(a.x1,a.y2)]
    }

    /** @ignore */
    function _getImage(obj){
      const s= obj.image;
      const p= s && s.split("/");
      return p && p.length && p[p.length-1];
    }

    /** @ignore */
    function _parsePoint(pt){
      const pts = pt.split(",");
      return [parseFloat(pts[0]), parseFloat(pts[1])];
    }

    /** @ignore */
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
    function _scanTilesets(tilesets, tsi, gprops){
      let p, gid, lprops, gidList = [];
      tilesets.forEach(ts=>{
        lprops={};
        ts.image=_getImage(ts);
        if(ts.spacing===undefined){ts.spacing=0}
        gidList.push([ts.firstgid, ts]);
        ts.tiles.forEach(t=>{
          p=_.inject({},t);
          delete p.properties;
          p=_.inject(p,_parseProps(t));
          p.gid=ts.firstgid + t.id;
          lprops[t.id]=p;
          gprops[p.gid] = p;
        });
        tsi[ts.name]=lprops;
      });
      //sort gids ascending
      return gidList.sort((a,b) => a[0]>b[0]?1:(a[0]<b[0]?-1:0));
    }

    /** @ignore */
    function _checkTiledVersion(json){
      let tmap = Mojo.resource(json,true).data;
      let tver= tmap && (tmap["tiledversion"] || tmap["version"]);
      return (tver && _.cmpVerStrs(tver,"1.4.2") >= 0) ? tmap
                                                       : _.assert(false,`${json} needs update`)
    }

    /** @ignore */
    function _parseProps(el){
      return (el.properties||_DA).reduce((acc,p)=> {
        acc[p.name]=p.value;
        return acc;
      }, {})
    }

    /** @ignore */
    function _loadTMX(scene,json,objFactory){
      let tsProps={},
          gtileProps={},
          tmx= _checkTiledVersion(json);
      _.inject(scene.tiled,{tileW:tmx.tilewidth,
                            tileH:tmx.tileheight,
                            tileInX:tmx.width,
                            tileInY:tmx.height,
                            saved_tileW:tmx.tilewidth,
                            saved_tileH:tmx.tileheight,
                            tiledWidth:tmx.tilewidth*tmx.width,
                            tiledHeight:tmx.tileheight*tmx.height}, _parseProps(tmx));
      let K=scene.getScaleFactor();
      function ctor(gid,mapcol,maprow,opacity){
        let tsi=_lookupGid(gid,scene.tiled.tileGidList)[1],
            ps=gtileProps[gid],
            cz=ps && ps["Class"],
            cFunc=cz && objFactory[cz],
            cols=tsi.columns,
            _id=gid - tsi.firstgid;
        _.assertNot(_id<0, `Bad tile id: ${_id}`);
        if(!is.num(cols))
          cols=MFL(tsi.imagewidth / (tsi.tilewidth+tsi.spacing));
        let tscol = _id % cols,
            tsrow = MFL(_id/cols),
            tsX = tscol * tsi.tilewidth,
            tsY = tsrow * tsi.tileheight;
        if(tsi.spacing>0){
          tsX += tsi.spacing * tscol;
          tsY += tsi.spacing * tsrow;
        }
        let s = Mojo.Sprites.frame(tsi.image,
                                   tsi.tilewidth,
                                   tsi.tileheight,tsX,tsY);
        s.tiled={gid: gid, id: _id};
        if(opacity !== undefined){
          s.alpha=opacity
        }
        s.scale.x=K;
        s.scale.y=K;
        s.x= mapcol * s.width;
        s.y= maprow * s.height;
        return s;
      }
      const F={
        tilelayer(tl){
          if(is.vec(tl.data[0])){
            if(tl.width===undefined)
              tl.width=tl.data[0].length;
            if(tl.height===undefined)
              tl.height=tl.data.length;
            tl.data=tl.data.flat();
          }
          if(tl.visible !== undefined && !tl.visible){ return }
          if(tl.collision !== false){
            _.assertNot(scene.tiled.collision,"too many collision layers");
            scene.tiled.collision=tl;
          }
          for(let s,gid,i=0;i<tl.data.length;++i){
            if((gid=tl.data[i])===0){continue}
            let mapcol = i % tl.width,
                maprow = MFL(i/tl.width),
                s= ctor(gid,mapcol,maprow,tl.opacity);
            let tsi=_lookupGid(gid,scene.tiled.tileGidList)[1],
                ps=gtileProps[gid],
                cz=ps && ps["Class"],
                cFunc=cz && objFactory[cz];
            s.tiled.index=i;
            s.m5.static=true;
            scene.insert(s);
            //special tile
            if(cFunc){ s=cFunc(scene,s,tsi,ps) }
          }
        },
        objectgroup(tl){
          tl.objects.forEach(o=> {
            let ps=gtileProps[o.gid];
            let cz= ps && ps["Class"];
            let createFunc= cz && objFactory[cz];
            let tsi=_lookupGid(o.gid,scene.tiled.tileGidList)[1];
            _.inject(o,_parseProps(o));
            _.assert(is.num(o.x),"wanted xy position");
            o.y -= tsi.tileheight; //jiggle to top-left
            let [tx,ty]=scene.getTileXY(o.x+MFL(scene.tiled.tileW/2),
                                        o.y+MFL(scene.tiled.tileH/2));
            let s= ctor(o.gid,tx,ty);
            if(createFunc){
              s= createFunc(scene,s,tsi,ps,o);
              s && scene.insert(s);
            }
          });
        },
        imagelayer(tl){ tl.image=_getImage(tl) }
      };
      objFactory=_.or(objFactory,{});
      _.inject(scene.tiled, {tileProps: gtileProps,
                             tileSets: tsProps,
                             imagelayer:[],objectgroup:[],tilelayer:[],
                             tileGidList: _scanTilesets(tmx.tilesets,tsProps,gtileProps)});
      ["imagelayer","tilelayer","objectgroup"].forEach(s=>{
        tmx.layers.filter(y=>y.type==s).forEach(y=>{
          F[s](y);
          scene.tiled[s].push(y);
        });
      });
      //reset due to possible scaling
      let nw= K*tmx.tilewidth;
      let nh= K*tmx.tileheight;
      scene.tiled.tileW=nw;
      scene.tiled.tileH=nh;
      scene.tiled.tiledWidth=nw * tmx.width;
      scene.tiled.tiledHeight=nh * tmx.height;
    }

    const _contactObj = {width: 0,
                         height: 0,
                         x:0, y:0,
                         rotation:0,
                         anchor: {x:0,y:0},
                         getGlobalPosition(){ return {x:this.x,y:this.y} } };
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
        Mojo.Sprites.extend(_contactObj);
      }
      runOnce(){
        let t= this.m5.options.tiled;
        _loadTMX(this, t.name, t.factory(this));
        super.runOnce();
      }
      removeTile(s){
        let x= s.x, y=s.y;
        if(s.anchor.x < 0.3){
          x= s.x+MFL(s.width/2);
          y= s.y+MFL(s.height/2);
        }
        let tx= MFL(x/this.tiled.tileW);
        let ty= MFL(y/this.tiled.tileH);
        let pos= ty*this.tiled.tileInX + tx;
        let len = this.tiled.collision.data.length;
        _.assert(pos>=0&&pos<len,"bad index to remove");
        this.tiled.collision.data[pos]=0;
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
      getTile(s){
        let x=s.x,y=s.y;
        if(s.anchor.x<0.3){
          y += MFL(s.height/2);
          x += MFL(s.width/2);
        }
        return this.getTileXY(x,y);
      }
      getTileXY(x,y){
        let tx= MFL(x/this.tiled.tileW);
        let ty= MFL(y/this.tiled.tileH);
        _.assert(tx>=0 && tx<this.tiled.tileInX, `bad tile col:${tx}`);
        _.assert(ty>=0 && ty<this.tiled.tileInY, `bad tile row:${ty}`);
        return [tx,ty];
      }
      /**Get item with this name.
       * @param {string} name
       * @return {any}
       */
      getNamedItem(name){
        let out=[];
        this.tiled.objectgroup.forEach(c=>{
          c.objects.forEach(o=>{
            if(name==_.get(o,"name")) out.push(c)
          });
        });
        return out;
      }
      /**Get scale factor for this world.
       * @return {number}
       */
      getScaleFactor(){
        let r=1;
        if(Mojo.u.scaleToWindow == "max"){
          if(Mojo.width>Mojo.height){
            r=Mojo.height/this.tiled.tiledHeight;
          }else{
            r=Mojo.width/this.tiled.tiledWidth;
          }
        }
        return r;
      }
      /**Cross reference a point's position to a tile index.
       * @param {number} x
       * @param {number} y
       * @return {number} the tile position
       */
      getTileIndex(x,y){
        return _getIndex3(x,y,this)
      }
      /**Get tileset information.
       * @param {number} gid
       * @return {object}
       */
      getTSInfo(gid){
        return _lookupGid(gid,this.tiled.tileGidList)[1]
      }
      getTileProps(gid){
        return this.tiled.tileProps[gid]
      }
      _getContactObj(gid, tX, tY){
        let c= _contactObj;
        c.height=this.tiled.tileH;
        c.width=this.tiled.tileW;
        c.x = tX * c.width;
        c.y = tY * c.height;
        return c;
      }
      collideAB(obj){
        let box,
            tw=this.tiled.tileW,
            th=this.tiled.tileH,
            tiles=this.tiled.collision;
        let _S=Mojo.Sprites;
        if(_.feq0(obj.rotation)){
          box=_S.getBBox(obj)
        }else{
          box=_S.boundingBox(obj)
        }
        let sX = Math.max(0,MFL(box.x1 / tw));
        let sY = Math.max(0,MFL(box.y1 / th));
        let eX =  Math.min(this.tiled.tileInX-1,CEIL(box.x2 / tw));
        let eY =  Math.min(this.tiled.tileInY-1,CEIL(box.y2 / th));
        for(let ps,c,gid,pos,B,tY = sY; tY<=eY; ++tY){
          for(let tX = sX; tX<=eX; ++tX){
            pos=tY*this.tiled.tileInX+tX;
            gid=tiles.data[pos];
            if(!is.num(gid)){
              _.assert(is.num(gid),"bad gid");
            }
            if(gid===0){continue}
            B=this._getContactObj(gid,tX, tY);
            ps=this.getTileProps(gid);
            if(ps && ps["Class"]){
              //special object, do nothing
            }else{
              Mojo["2d"].hit(obj,B);
            }
          }
        }
        return super.collideAB(obj);
      }
    }

    class Grid2D{
      constructor(g){
        let dimX = g[0].length;
        let dimY = g.length;
        let dx1=dimX-1;
        let dy1=dimY-1;
        let s=g[0];
        let s2=g[1];
        let e=g[dy1];
        let gapX=s[1].x1-s[0].x2;
        let gapY=s2[0].y1-s[0].y2;
        _.assert(gapX===gapY);
        this._grid=g;
        this._gap=gapX;
      }
      drawBox(color="white"){
        return Mojo.Sprites.drawBody(ctx => this._draw(ctx,color,true))
      }
      draw(color="white"){
        return Mojo.Sprites.drawBody(ctx => this._draw(ctx,color))
      }
      _draw(ctx,color="white",boxOnly=false){
        let dimX = this._grid[0].length;
        let dimY = this._grid.length;
        let dx1=dimX-1;
        let dy1=dimY-1;
        let s=this._grid[0];
        let e=this._grid[dy1];
        let gf = s[0];
        let gl = e[dx1];
        ctx.lineStyle(this.gap,_S.color(color));
        for(let r,i=0;i<dimY;++i){
          r=this._grid[i];
          if(i===0){
            //draw the top horz line
            ctx.moveTo(r[i].x1,r[i].y1);
            ctx.lineTo(s[dx1].x2,s[dx1].y1);
          }
          if(i===dy1){
            ctx.moveTo(r[0].x1,r[0].y2);
            ctx.lineTo(r[dx1].x2,r[dx1].y2);
          }else if(!boxOnly){
            ctx.moveTo(r[0].x1,r[0].y2);
            ctx.lineTo(r[dx1].x2,r[dx1].y2);
          }
        }
        for(let i=0;i<dimX;++i){
          if(i===0){
            //draw the left vert line
            ctx.moveTo(s[i].x1,s[i].y1);
            ctx.lineTo(e[i].x1,e[i].y2);
          }
          if(i===dx1){
            ctx.moveTo(s[i].x2,s[i].y1);
            ctx.lineTo(e[i].x2,e[i].y2);
          }else if(!boxOnly){
            ctx.moveTo(s[i].x2,s[i].y1);
            ctx.lineTo(e[i].x2,e[i].y2);
          }
        }
      }
      cell(row,col){ return this._grid[row][col] }
      get gap() { return this._gap}
      get data() { return this._grid}
    }

    class AStarAlgos{
      constructor(straightCost,diagonalCost){
        this.straightCost= straightCost;
        this.diagonalCost= diagonalCost;
      }
      manhattan(test, dest){
        return ABS(test.row - dest.row) * this.straightCost +
               ABS(test.col - dest.col) * this.straightCost
      }
      euclidean(test, dest){
        let vx = dest.col - test.col;
        let vy = dest.row - test.row;
        return MFL(_.sqrt(vx * vx + vy * vy) * this.straightCost)
      }
      diagonal(test, dest){
        let vx = ABS(dest.col - test.col);
        let vy = ABS(dest.row - test.row);
        return (vx > vy) ? MFL(this.diagonalCost * vy + this.straightCost * (vx - vy))
                         : MFL(this.diagonalCost * vx + this.straightCost * (vy - vx))
      }
    }

    const _$={
      TiledScene,
      /**Calculate position of each individual cells in the grid,
       * so that we can detect when a user clicks on the cell.
       * @memberof module:mojoh5/Tiles
       * @param {number|number[]} dim
       * @param {number} glwidth
       * @param {number} ratio
       * @param {string} align
       * @return {}
       */
      mapGridPos(dim,glwidth,ratio=0.8,align="center"){
        let cx,cy,x0,y0,x1,y1,x2,y2,out=[];
        let gapX,gapY,dimX,dimY,cz,szX,szY;
        if(is.vec(dim)){
          [dimX,dimY]=dim;
        }else{
          dimX=dimY=dim;
        }
        if(glwidth<0){glwidth=0}
        gapX=glwidth*(dimX+1);
        gapY=glwidth*(dimY+1);
        if(Mojo.portrait()){
          cz=MFL((ratio*Mojo.width-gapX)/dimX);
        }else{
          cz=MFL((ratio*(Mojo.height-gapY))/dimY);
        }
        szX=cz*dimX+gapX;
        szY=cz*dimY+gapY;
        //top,left
        y0=MFL((Mojo.height-szY)/2);
        switch(align){
          case "right": x0=Mojo.width-szX; break;
          case "left": x0=0;break;
          default: x0=MFL((Mojo.width-szX)/2); break;
        }
        x0 +=glwidth;
        x1=x0;
        y0 += glwidth;
        y1=y0;
        for(let arr,r=0; r<dimY; ++r){
          arr=[];
          for(let c= 0; c<dimX; ++c){
            y2 = y1 + cz;
            x2 = x1 + cz;
            arr.push({x1,x2,y1,y2});
            x1 = x2+glwidth;
          }
          out.push(arr);
          y1 = y2+glwidth;
          x1 = x0;
        }
        return new Grid2D(out);
      },
      /**Converts a tile's index number into x/y screen
       * coordinates, and capture's the tile's grid index (`gid`) number.
       * @memberof module:mojoh5/Tiles
       * @param {number} index
       * @param {number[]} gidList
       * @param {object} world
       * @return {Sprite} a tile object
       */
      XXgetTile(index, gidList, world){
        const t=world.tiled;
        return Mojo.Sprites.extend({gid: gidList[index],
                                    width: t.tileW,
                                    height: t.tileH,
                                    anchor: Mojo.makeAnchor(0,0),
                                    x:((index%t.tilesInX)*t.tileW)+world.x,
                                    y:((MFL(index/t.tilesInX))*t.tileH)+world.y,
                                    getGlobalPosition(){ return {x: this.x, y: this.y } } })
      },
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
        let a= [index - w - 1, index - w, index - w + 1, index - 1];
        let b= [index + 1, index + w - 1, index + w, index + w + 1];
        if(!ignoreSelf) a.push(index);
        return a.concat(b);
      },
      /**Checks for a collision between a sprite and a tile.
       * @memberof module:mojoh5/Tiles
       * @param {Sprite} s
       * @param {number[]} gidList
       * @param {number} gidToCheck
       * @param {object} world
       * @param {number} checkHow
       * @return {object} a `collision` object
       */
      hitTestTile(s, gidList, gidToCheck, world, checkHow=Mojo.SOME){
        let col={};
        function _checker(pt){
          col.index = _getIndex3(pt[0], pt[1], world);
          col.gid = gidList[col.index];
          return col.gid === gidToCheck;
        }
        let colPts= checkHow !== Mojo.CENTER ? _getContactPoints(s)
                                             : [Mojo.Sprites.centerXY(s)];
        let op= checkHow===Mojo.EVERY ? "every" : "some";
        col.hit = colPts[op](_checker);
        _V.reclaim(...colPts);
        return col;
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
          let pos= this.getTileIndex(Mojo.Sprites.centerXY(s),world);
          _.assert(pos >= 0 && pos < ret.length, "tiled index outofbound");
          s.tiled.____index = pos;
          ret[pos] = s.tiled.____gid;
        };
        !is.vec(sprites) ? _mapper(sprites)
                         : sprites.forEach(_mapper);
        return ret;
      },
      /**Check to ensure tiled map is valid.
       * @memberof module:mojoh5/Tiles
       * @param {string} json
       * @return {object} exception if error
       */
      collide(world,obj){
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
                                        col:i%W, row:MFL(i/W)}));
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
              let indexOnLeft= (i% W) === 0;
              let indexOnRight= ((i+1) % W) === 0;
              let nodeBeyondLeft= (n.col % (W-1)) === 0 && n.col !== 0;
              let nodeBeyondRight= (n.col % W) === 0;
              let nodeIsObstacle = obstacles.some(o => tiles[n.index] === o);
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
              openList.push(tn);
            }
          }
          closedList.push(centerNode);
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
          theShortestPath.push(tn);
          //Work backwards through the node parents
          //until the start node is found
          while(tn !== startNode){
            tn = tn.parent;
            theShortestPath.unshift(tn);
          }
        }
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
        let numPts = MFL(len/segment);
        let len2,x,y,ux,uy,points = [];
        for(let c,i = 1; i <= numPts; ++i){
          c= Mojo.Sprites.centerXY(s1);
          len2 = segment * i;
          ux = v[0]/len;
          uy = v[1]/len;
          //Use the unit vector and newMagnitude to figure out the x/y
          //position of the next point in this loop iteration
          x = MFL(c[0] + ux * len2);
          y = MFL(c[1] + uy * len2);
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
        return points.every(p=> tiles[p.index] === emptyGid) &&
               (angles.length === 0 || angles.some(x=> x === angle))
      },
      /**Get indices of orthognoal cells.
       * @memberof module:mojoh5/Tiles
       * @param {number} index
       * @param {object} world
       * @return {number[]}
       */
      crossCells(index, world){
        const w= world.tiled.tilesInX;
        return [index - w, index - 1, index + 1, index + w]
      },
      /**Get orthognoal cells.
       * @memberof module:mojoh5/Tiles
       * @param {number} index
       * @param {any[]} tiles
       * @param {object} world
       * @return {any[]}
       */
      getCrossTiles(index, tiles, world){
        return this.crossCells(index,world).map(c => tiles[c])
      },
      /**Get the indices of corner cells.
       * @memberof module:mojoh5/Tiles
       * @param {number} index
       * @param {number|object} world
       * @return {number[]}
       */
      getDiagonalCells(index, world){
        const w= is.num(world)?world:world.tiled.tilesInX;
        return [index - w - 1, index - w + 1, index + w - 1, index + w + 1]
      },
      /**Get the corner cells.
       * @memberof module:mojoh5/Tiles
       * @param {number} index
       * @param {any[]} tiles
       * @param {object} world
       * @return {any[]}
       */
      getDiagonalTiles(index, tiles, world){
        return this.getDiagonalCells(index,world).map(c => tiles[c])
      },
      /**Get all the valid directions to move for this sprite.
       * @memberof module:mojoh5/Tiles
       * @param {Sprite} sprite
       * @param {any[]} tiles
       * @param {number} validGid
       * @param {object} world
       * @return {any[]}
       */
      validDirections(sprite, tiles, validGid, world){
        const pos = this.getTileIndex(sprite, world);
        return this.getCrossTiles(pos, tiles, world).map((gid, i)=>{
          return gid === validGid ? _DIRS[i] : Mojo.NONE
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
        return dirs.length===0 ||
               dirs.length===1 || ((up||down) && (left||right));
      },
      /**Randomly choose the next direction.
       * @memberof module:mojoh5/Tiles
       * @param {number[]} dirs
       * @return {number}
       */
      randomDirection(dirs=[]){
        return dirs.length===0 ? Mojo.TRAPPED
                               : (dirs.length===1 ? dirs[0]
                                                  : dirs[_.randInt2(0, dirs.length-1)])
      },
      /**Find the best direction from s1 to s2.
       * @memberof module:mojoh5/Tiles
       * @param {Sprite} s1
       * @param {Sprite} s2
       * @return {number}
       */
      closestDirection(s1, s2){
        const v= _getVector(s1,s2);
        return ABS(v[0]) < ABS(v[1]) ? ((v[1] <= 0) ? Mojo.UP : Mojo.DOWN)
                                     : ((v[0] <= 0) ? Mojo.LEFT : Mojo.RIGHT)
      }
    };

    return (Mojo.Tiles=_$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module==="object" && module.exports){
    throw "Fatal: browser only"
  }else{
    gscope["io/czlab/mojoh5/Tiles"]=function(M){
      return M.Tiles ? M.Tiles : _module(M)
    }
  }

})(this);


