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

;(function(window){

  "use strict";

  function scenes(Mojo){
    const MFL=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Tiles:_T,
           Input:_I,
           "2d":_2d,
           Game:_G,
           ute:_,is,EventBus}=Mojo;

    window["io/czlab/rumble/warbot"](Mojo);

    const C_RUN="run",
        C_INIT="init",
        C_RESOLVE="resolve",
        C_ALERT="alert",
        C_BCAST="bcast",
        C_TURRET="turret",
        C_FIRE="fire",
        C_TURN="turn",
        C_FORWARD="forward",
        C_BACKWARD="backward";
    const BLOCKING_CMDS = [C_TURN, C_FORWARD, C_BACKWARD];
    const TANKS=["blue"];//,"red","green";

    _G.SHELL_INTERVAL=100;
    _G.BOT_HEALTH=20;
    _G.MAX_SHELLS=10;

    _G.explosions=[];
    _G.bots=[];

    _G.contain=(t,dir)=>{
      let ox=t.x;
      let oy=t.y;
      while(_G.outOfBound(t)){
        t.x += dir*Math.cos(t.rotation);
        t.y += dir*Math.sin(t.rotation);
      }
    };

    _G.update=(t)=>{
      let halt=0,
          trash=[],
          blocking=0,
          turreting=0;
      t.g.shellTS=(t.g.shellTS === Number.MAX_VALUE)?0:t.g.shellTS+1;
      t.g.status = {};
      if(t.g.shells.length > 0){ t.g.updateShells() }
      if(t.g.isHit){
        t.g.alert({isHit:true});
        t.g.events.length=0;
        t.g.isHit = false;
        ++halt;
      }
      for(let e,i=0;!halt && i<t.g.events.length;++i){
        e= t.g.events[i];
        if(BLOCKING_CMDS.includes(e.cmd)){
          if(blocking>0){continue}
          blocking+=1;
        }
        if(e.amount <= e.progress){
          t.g.resolve(e.id);
          trash.push(e);
          continue;
        }
        switch(e.cmd){
          case C_FORWARD:
            e.progress +=1;
            if(!t.g.move(1)){
              t.g.events.length=0;
              t.g.alert({isOOB:true,dir:1});
              ++halt;
            }
            break;
          case C_BACKWARD:
            e.progress +=1;
            if(!t.g.move(-1)){
              t.g.events.length=0;
              t.g.alert({isOOB:true,dir:-1});
              ++halt;
            }
            break;
          case C_TURN:
            e.progress +=1;
            t.g.turn(e.side); //-1 or1
            break;
          case C_TURRET:
            if(turreting>0){continue}
            e.progress +=1;
            t.g.turnTurret(e.side);//-1 or 1
            ++turreting;
            break;
        }
      }
      trash.forEach(e=>_.disj(t.g.events,e));
    };

    _G.dist=(a,b)=>{
      let dx=a.x-b.x;
      let dy=a.y-b.y;
      return Math.sqrt(dx*dx+dy*dy);
    };

    _G.outOfBound=(t)=>{
      let r=t.x+t.g.radius;
      let b=t.y+t.g.radius;
      let l=t.x-t.g.radius;
      let u=t.y-t.g.radius;
      return r>_G.arena.x2||l<_G.arena.x1||
             b>_G.arena.y2||u<_G.arena.y1;
    };

    _G.getEnemies=(t)=>{
      return _G.bots.filter(b=> b !== t)
    };

    _G.loadTank=function(color,init){
      let s= _S.sprite(`tank_${color}.png`);
      let b= _S.sprite(`turret_${color}.png`);
      let K=Mojo.getScaleFactor();
      _S.centerAnchor(b);
      _S.centerAnchor(s);
      s.addChild(b);
      _S.scaleXY(s,K,K);
      s.height=MFL(s.height);
      s.width=MFL(s.width);
      if(!_.isEven(s.width))--s.width;
      if(!_.isEven(s.height))--s.height;
      if(init){
        _G.tileH=s.height;
        _G.tileW=s.width;
      }
      return s;
    };

    _Z.defScene("level1",{
      _loadTank(color,cell){
        let t= _G.loadTank(color);
        t.x=MFL((cell.x1+cell.x2)/2);
        t.y=MFL((cell.y1+cell.y2)/2);
        t.visible=false;
        this.insert(t);
        _G.bots.push(_G.WarBot(t,color));
      },
      _initZone(){
        const z={
          reconn(){
            return _G.bots.map(b=>{
              let t= b.children[0];
              let a=b.angle+t.angle;
              return {id: b.m5.uuid, x:b.x,y:b.y,
                      hp: b.g.hp,
                      body:b.angle, turret:t.angle};
            });
          },
          sendAll(msg){
            _G.bots.forEach(b=> b.g.send(msg))
          },
          run(){
            _G.bots.forEach(t=> _G.update(t))
            _.delay(Mojo.u.zoneMillis,()=> z.run())
          }
        };
        _G.zone=z;
      },
      _initLevel(){
        _G.loadTank("red",true);
        let a=_S.gridBox(0.95,0.95);
        let g= _S.makeCells(a.x1,a.y1,
                            a.x2,a.y2,
                            _G.tileW,_G.tileH);
        let clen=TANKS.length;
        let x,X=g[0].length-1;
        let y,Y=g.length-1;
        let s,m=new Map();
        while(clen>0){
          x=_.randInt2(1,X);
          y=_.randInt2(1,Y);
          s=`${x},${y}`;
          if(!m.has(s)){
            --clen;
            m.set(s,1);
            this._loadTank(TANKS[clen], g[y][x]);
          }
        }
        _G.arena=a;
      },
      setup(){
        this._initLevel();
        this._initZone();
        this.insert(_S.drawGridBox(_G.arena));
      },
      postUpdate(){
        if(!_G.go){
          let reconn= _G.zone.reconn();
          _G.go=true;
          _G.bots.forEach(b=>{
            b.visible=true;
            b.g.send({cmd: C_INIT, data:{
              radius:b.g.radius,
              width:b.width,
              height:b.height
            }});
          });
          _G.zone.sendAll({cmd:C_RUN, data:reconn});
          _G.zone.run();
        }
      }
    });

  }

  const _$={
    assetFiles: ["tank_blue.png","tank_green.png","tank_red.png",
                 "turret_blue.png","turret_green.png","turret_red.png"],
    arena: {width:8000,height:5600},
    zoneMillis:10,
    scaleToWindow:"max",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("level1");
    }
  };

  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


