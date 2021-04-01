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

  window["io/czlab/rumble/warbot"]=function(Mojo){
    const {Game:_G,
           Sprites:_S,
           ute:_,is,EventBus}=Mojo;

    function WarBot(t, color){
      let h2=t.height/2;
      let w2=t.width/2;
      t.children[0].angle = _.rand() * 360;
      t.g.radius=Math.sqrt(w2*w2+h2*h2);
      t.angle = _.rand() * 360;
      t.g.hp = _G.BOT_HEALTH;
      t.g.bcastMsg= null;
      t.g.isHit = false;
      t.g.isMsg = false;
      t.g.shells = [];
      t.g.events = [];
      t.g.status = {};
      t.g.msgTS = 0;
      t.g.shellTS= 0;
      t.g.worker = new Worker(`data/${color}.js`);
      t.g.worker.onmessage = (e)=>{ t.g.recv(e.data) }
      t.g.move=(dist)=>{
        let x = t.x + dist*Math.cos(t.rotation);
        let y = t.y + dist*Math.sin(t.rotation);
        let ok=true;
        if(_G.outOfBound(t)){
          _G.contain(t,dist>0?-1:1);
          ok=false
        }else{
          _S.setXY(t,x,y)
        }
        return ok;
      };
      t.g.turn=(deg)=>{
        t.angle = (t.angle+deg) % 360;
        if(t.angle<0) t.angle += 360;
      };
      t.g.turnTurret=(deg)=>{
        let c=t.children[0];
        c.angle = (c.angle+deg)%360;
        if(c.angle<0) c.angle += 360;
      };
      t.g.bcast=(msg)=>{
        t.g.bcastMsg = msg;
        t.g.isMsg = true;
        t.g.msgTS=0;
      };
      t.g.recv=(msg)=>{
        let e= JSON.parse(msg);
        let id=e.id,
            cmd=e.cmd;
        switch(cmd){
          case C_FIRE:
            if(!(t.g.shellTS < _G.SHELL_INTERVAL||
                 t.g.shells.length >= _G.MAX_SHELLS)){
              t.g.shellTS = 0;
              t.g.shells.push({x: t.x, y: t.y,
                               dir:t.angle+t.children[0].angle});
            }
            t.g.resolve(id);
            e=null;
            break;
          case C_TURRET:
            if(t.g.events.some(e=> e.cmd == cmd)){
              t.g.resolve(id);
              e=null;
            }
            break;
          case C_BCAST:
            if(t.g.msgTS===0){t.g.bcast(e.target)}
            t.g.resolve(id);
            e=null;
            break;
        }
        if(e){
          e.progress=0;
          t.g.events.push(e);
        }
      };
      t.g.send=(msg)=>{
        return t.g.worker.postMessage(JSON.stringify(msg))
      };
      t.g.alert=(info)=>{
        t.g.send(_.inject(info,{cmd: C_ALERT,
                                data: _G.zone.reconn() }))
      };
      t.g.resolve=(eid)=>{
        t.g.send({
          cmd: C_RESOLVE,
          id: eid,
          reconn: _G.zone.reconn()
        });
      };
      t.g.updateShells=()=>{
        for(let es,b,i=t.g.shells.length-1; i>=0; --i){
          b = t.g.shells[i];
          b.x += b.m5.speed * Math.cos(Mojo.degToRad(b.g.dir));
          b.y += b.m5.speed * Math.sin(Mojo.degToRad(b.g.dir));
          if(_G.outOfBound(b)){
            _S.remove(b);
            _.disj(t.g.shells,b);
            continue;
          }
          es=_G.getEnemies(t);
          for(let e,j=0;j<es.length;++j){
            e = es[j];
            if(_G.dist(b, e) < 20){
              e.g.hp -= 3;
              e.g.isHit = true;
              _G.explosions.push({x: e.x,y: e.y,progress:1});
              _S.remove(b);
              _.disj(t.g.shells,b);
              break;
            }
          }
        }
      };
      return t;
    };

    _G.WarBot=WarBot;
  }

})(this);


