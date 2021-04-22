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
    const {Scenes:Z,
           Sprites:S,
           Input:I,
           "2d":_2d,
           Tiles:_T,
           v2:_V,
           Game:G,
           ute:_,is}=Mojo;
    const MFL=Math.floor;

    const E_PLAYER=1;
    const E_ITEM=2;

    function _cfgWorld(scene){
      let h= scene.tiled.tilesInY,
          w= scene.tiled.tilesInX,
          len=h*w,
          lastY= len-w;
      let bg=scene.getTileLayer("Sky"),
          ts=scene.getTileLayer("Tiles"),
          objs=scene.getObjectGroup("Objects");

      ts.data.length=len;
      bg.data.length=len;
      _.fill(bg.data,0);
      _.fill(ts.data,0);

      //randomly fill the world
      for(let i,y=0;y<h;++y){
        for(let x=0;x<w;++x){
          i=y*w+x;
          if(x===0 || x===w-1){
            ts.data[i]=3;// left&right border
          }else if(i>=lastY ||
                   _.randInt2(0,3)===0){
            ts.data[i]=4;//ground
          }else{
            ts.data[i]=6;//sky
          }
        }
      }

      //edit the tiles,replace surface with grass
      ts.data.forEach((gid,i)=>{
        let top =ts.data[i-w],
            top2 =ts.data[i-2*w];
        if(gid===4 && top===6){
          ts.data[i]=1;//change from rock to grass
          if(top2===4 || top2===1){
            ts.data[i-2*w]=6;//change solid to sky
          }
        }
      });

      let tw=scene.tiled.saved_tileW;
      let th=scene.tiled.saved_tileH;
      let Class,gid,i,m, tx,ty,t,locs=[];
      //find all possible surfaces
      ts.data.forEach((gid,i)=>{
        if(gid===4 || gid===1){
          t=i-w;
          if(t>=0 && ts.data[t]===6){ locs.push(t) }
        }
      });
      m=new Map();
      while(true){
        i=_.randItem(locs);
        if(!m.has(i)){
          m.set(i,null);
          if(m.size===4){ break }
        }
      }
      i=0;
      m.forEach((v,k)=>{
        ty = MFL(k/w);
        tx = k % w;
        if(i===0){
          gid=5;
          Class="Player";
        }else{
          gid=2;
          Class="Treasure";
        }
        objs.objects.push({
          x:tx*tw,
          y:ty*th+th,
          gid,
          Class
        });
        ++i;
      });

      //clean up world
      for(i=0;i<ts.data.length;++i){
        if(ts.data[i]===6){
          bg.data[i]=6;
          ts.data[i]=0;
        }
      }

      scene.reloadMap({factory:_objFactory,
                       name:scene.tiled.tiledMap});
    }

    Z.defScene("hud", {
      setup() {
        let K=Mojo.getScaleFactor();
        this.output = S.bitmapText("score: ",
          {fontName: "unscii", fontSize: 16*K, fill:"white"}, 32, 8);
        this.insert(this.output);
      },
      postUpdate(){
        this.output.text=`score: ${G.score}`;
      }
    });

    const Player={
      s(){},
      c(scene,p,ts,ps,os){
        Mojo.addMixin(p,"2d",[_2d.Platformer]);
        p.m5.static=false;
        p.m5.uuid="player";
        p.m5.type=E_PLAYER;
        p.m5.cmask=E_ITEM;
        p.m5.speed=100 * scene.getScaleFactor();
        _V.set(p.m5.vel,p.m5.speed,
                        p.m5.speed);
        _V.set(p.m5.gravity,0,700);
        p.width -=2;
        p.height -=2;
        p.x++;
        p.y++;
        p["2d"].Platformer.jumpSpeed=-500;
        p.m5.tick=(dt)=>{
          p["2d"].onTick(dt);
        }
        return p;
      }
    };

    const Ground={
      s(){},
      c(scene,g){
        g.m5.uuid="ground";
        return g;
      }
    };

    const Sky={
      s(){},
      c(scene,s){
        s.m5.uuid="sky";
        return s;
      }
    };

    const Border={
      s(){},
      c(scene,c){
        c.m5.uuid="cloud";
        return c;
      }
    };

    const Grass={
      s(){},
      c(scene,g){
        g.m5.uuid="grass";
        return g;
      }
    };

    const Treasure={
      s(){},
      c(scene,t){
        const e=[["2d.sensor",t],"onSensor",t.m5];
        t.m5.uuid="treasure"+_.nextId();
        t.m5.type=E_ITEM;
        t.m5.sensor=true;
        t.m5.dispose=()=>{ Mojo.off(...e) }
        t.m5.onSensor=()=>{
          t.m5.dead=true;
          S.remove(t);
          ++G.score;
        }
        Mojo.on(...e);
        return t;
      }
    };

    const _objFactory={
      Player,Ground,Sky,Border,Grass,Treasure
    }

    Z.defScene("level1", {
      setup(){
        G.score=0;
        _cfgWorld(this);
      }
    },{sgridX:128,sgridY:128,
       centerStage:true,
       tiled:{name:"platforms.json",factory:_objFactory}});
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["platforms.png", "platforms.json", "unscii.fnt" ],
      arena: { width: 512, height: 512 },
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("hud");
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);

