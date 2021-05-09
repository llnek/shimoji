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

  window["io/czlab/rumble/warzone"]=function(Mojo){
    const MFL=Math.floor;
    const {Sprites:_S,
           Game:_G,
           ute:_,is}=Mojo;

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
    const TANKS=["blue","red","green"];

    let _$;
    window["io/czlab/rumble/warbot"](Mojo, _$={
      bots:[],
      _load(color,cell){
        let t= _G.bot(color);
        t.x=MFL((cell.x1+cell.x2)/2);
        t.y=MFL((cell.y1+cell.y2)/2);
        t.visible=false;
        this.bots.push(_G.WarBot(t,color));
      },
      init:function(){
        let clen=TANKS.length;
        let g= _G.grid;
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
            this._load(TANKS[clen], g[y][x]);
          }
        }
      },
      sendAll:function(msg){
        this.bots.forEach(b=> b.g.send(msg));
        return this;
      },
      run(){
        this.bots.forEach(t=> this.update(t));
        _.delay(Mojo.u.zoneMillis,()=> this.run());
      },
      reconn:function(){
        return this.bots.map(b=>{
          let t= b.children[0];
          //let a=b.angle+t.angle;
          return {id: b.m5.uuid, x:b.x,y:b.y,
                  hp: b.g.hp,
                  body:b.angle, turret:t.angle};
        });
      },
      start:function(){
        let r= this.reconn();
        this.bots.forEach(b=>{
          b.visible=true;
          b.g.send({cmd: C_INIT, data:{
              radius:b.g.radius,
              width:b.width,
              height:b.height
          }});
        });
        this.sendAll({cmd:C_RUN, data:r}) && this.run();
      },
      outOfBound:function(t){
        let r=t.x+t.g.radius;
        let b=t.y+t.g.radius;
        let l=t.x-t.g.radius;
        let u=t.y-t.g.radius;
        return r>_G.arena.x2||l<_G.arena.x1||
               b>_G.arena.y2||u<_G.arena.y1;
      },
      contain:function(t,dir){
        while(this.outOfBound(t)){
          t.x += dir*Math.cos(t.rotation);
          t.y += dir*Math.sin(t.rotation);
        }
      },
      update:function(t){
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
        if(!halt && t.g.events.length===0){
          let r= this.reconn();
          t.g.send({cmd: C_RUN, data:r });
        }
      },
      getEnemies:function(t){
        return this.bots.filter(b=> b !== t)
      }
    });

    return (_G.warZone=_$)
  }

})(this);


