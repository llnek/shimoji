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

  //let level, world, player, output, score;
  function scenes(Mojo){
    const Z=Mojo.Scenes,S=Mojo.Sprites,I=Mojo.Input,_2d=Mojo["2d"],_T=Mojo.Tiles;
    const MFL=Math.floor;
    const G=Mojo.Game;
    const {ute:_,is,EventBus}=Mojo;

    const E_PLAYER=1;
    const E_ITEM=2;

    function _initTiles(scene,tl){
      let h= scene.tiled.tilesInY,
          w= scene.tiled.tilesInX,
          len=h*w,
          lasty= (h-1)*w;
      scene.tiled.collision=_.fill(len,0);
      tl.data.length=len;
      for(let i,y=0;y<h;++y){
        for(let x=0;x<w;++x){
          i=y*w+x;
          if(x===0 || x===w-1){
            tl.data[i]=3;
          }else if(i>=lasty || _.randInt2(0,3)===0){
            tl.data[i]=4;//ground
          }else{
            tl.data[i]=6;//sky
          }
        }
      }
    }

    function _editTiles(scene,tl){
      let w=scene.tiled.tilesInX;
      let locs=[];
      tl.data.forEach((gid,i)=>{
        let top =tl.data[i-w],
            top2 =tl.data[i-2*w];
        if(gid===4 && top===6){
          tl.data[i]=1;//change from rock to grass
          if(top2===4 || top2===1){
            tl.data[i-2*w]=6;//change solid to sky
          }
        }
      });
    }

    function _ctor(K,scene,px,py,tx,ty,Class){
      let s=S.frame("platforms.png",32,32,px,py);
      s.scale.x=K;
      s.scale.y=K;
      //s.width=MFL(s.width);
      //s.height=MFL(s.height);
      s.x=tx*s.width;
      s.y=ty*s.height;
      s=G.objFactory[Class](scene,s);
      return scene.insert(s);
    }

    function _makeTiles(scene,tl){
      let K=scene.getScaleFactor();
      let w = scene.tiled.tilesInX;
      let len = tl.data.length;
      let locs=[];
      let m,ps,gid,tx,ty,px,py,s,t,i;
      for(i=0; i<len; ++i){
        ty = MFL(i/w);
        tx = i % w;
        gid=tl.data[i];
        ps=scene.getTileProps(gid);
        switch(gid){
          case 1://grass
            px=0;py=0;
            break;
          case 2://treasure
            px=32;py=0;
            tl.data[i]=6;
            break;
          case 3://border
            px=64;py=0;
            break;
          case 4://ground
            px=0,py=32;
            break;
          case 5://player
            px=32;py=32;
            tl.data[i]=6;
            break;
          case 6://sky
            px=64,py=32;
            break;
        }
        s=_ctor(K,scene,px,py,tx,ty,ps["Class"]);
        s.tiled={ gid:gid,index:i };
        s.m5.static=true;
        gid=tl.data[i];
        if(gid===3){
          scene.tiled.collision[i]=gid;
        }else if(gid===4 || gid===1){
          t=i-w;
          if(t>=0 && tl.data[t]===6){ locs.push(t) }
          scene.tiled.collision[i]=gid;
        }
      }
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
        i===0? _ctor(K,scene,32,32,tx,ty,"Player")
             : _ctor(K,scene,32,0,tx,ty,"Treasure");
        ++i;
      });
    }

    Z.defScene("hud", {
      setup() {
        this.output = S.text("score: ",
          {fontFamily: "puzzler", fontSize: 16, fill:"white"}, 32, 8);
        this.insert(this.output);
        EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(){
        this.output.text=`score: ${G.score}`;
      }
    });

    function Player(scene,p){
      Mojo.addMixin(p,"platformer");
      Mojo.addMixin(p,"2d");
      p.m5.static=false;
      p.m5.uuid="player";
      p.m5.type=E_PLAYER;
      p.m5.cmask=E_ITEM;
      p.m5.speed=100 * scene.getScaleFactor();
      p.m5.vel[0]=p.m5.speed;
      p.m5.gravity[1] = 700;
      p["platformer"].jumpSpeed=-500;
      p.m5.step=function(dt){
        p["2d"].motion(dt);
        p["platformer"].motion(dt);
      }
      return p;
    }
    function Ground(scene,g){
      g.m5.uuid="ground";
      return g;
    }
    function Sky(scene,s){
      s.m5.uuid="sky";
      return s;
    }
    function Border(scene,c){
      c.m5.uuid="cloud";
      return c;
    }
    function Grass(scene,g){
      g.m5.uuid="grass";
      return g;
    }
    function Treasure(scene,t){
      t.m5.uuid="treasure";
      t.m5.type=E_ITEM;
      t.m5.sensor=true;
      t.m5.onSensor=()=>{
        t.m5.dead=true;
        scene.remove(t);
        ++G.score;
      }
      EventBus.sub(["2d.sensor",t],"onSensor",t.m5);
      return t;
    }
    function _objFactory(scene){
      return {Player,Ground,Sky,Border,Grass,Treasure}
    }

    Z.defScene("level1", {
      setup(){
        let player,tl=this.getTileLayer("Tiles");
        G.objFactory=_objFactory(this);
        G.score=0;
        _initTiles(this,tl);
        _editTiles(this,tl);
        _makeTiles(this,tl);
        player=this.getChildById("player");
        EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(dt){
      }
    },{sgridX:128,sgridY:128,
       centerStage:true,
       tiled:{name:"platforms.json",factory:_objFactory}});
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["platforms.png", "platforms.json", "puzzler.otf" ],
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

