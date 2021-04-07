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

;(function(global){

  "use strict";

  const E_PLAYER=1;
  const E_ENEMY=2;
  const E_BULLET=4;

  function scenes(Mojo){
    const MFL=Math.floor;
    const {Scenes:_Z,
           Game:_G,
           Input:_I,
           ute:_,
           is,
           EventBus,
           Sprites:_S,"2d":_2d}=Mojo;

    const ALIENS=["purple","blue","blue","green","green"];
    const WALK_FRAME=800;
    const UFO_INTV=10;
    const DIMX=11;
    const DIMY=5;

    const UFOSPEED=8;

    function _showUfo(){
      let s= _G.ufo;
      s.x=_G.arena.x1-s.width;
      s.y=0;
      s.visible=true;
    }

    function _ufo(scene){
      let s= _G.ufo= _S.sprite("ufo.png");
      let K=Mojo.getScaleFactor();
      let p=UFOSPEED*K;
      let w= _G.arena.x2-_G.arena.x1;
      _S.scaleXY(s,K*0.5,K*0.5);
      s.m5.vel[0]=w/p;
      s.visible=false;
      s.m5.tick=(dt)=>{
        _S.move(s,dt);
        if(s.x>=_G.arena.x2){
          s.visible=false;
          _.delay(UFO_INTV*1000, _showUfo);
        }
      };
      scene.insert(s);
    }

    function _aliens(scene){
      let K=Mojo.getScaleFactor();
      let out={},
          Y=K*100,
          X=5*K,
          g=_S.gridXY([DIMX,DIMY],0.8,0.4,out);
      let lastX,
          offX=(X*g[0].length)/2;

      _G.aliens=[];
      for(let R,k,s,b,r,y=0;y<g.length;++y){
        _G.aliens.push(R=[]);
        r=g[y];
        b=[`${ALIENS[y]}_bug_0.png`, `${ALIENS[y]}_bug_1.png`];
        lastX=-1;
        for(let c,x=0;x<r.length;++x){
          c=r[x];
          s=_S.sprite(b);
          _S.centerAnchor(s);
          s.x=MFL((c.x1+c.x2)/2);
          s.y=MFL((c.y1+c.y2)/2)-Y;
          k=(0.6*(c.x2-c.x1))/s.width;
          _S.scaleXY(s,k,k);
          R.push(s);
          scene.insert(s);
        }
      }

      let sx=out.x;
      let ex=sx+out.width;
      let margin= MFL(sx* 0.2);
      _G.marchDir=Mojo.RIGHT;
      _G.arena={x1:sx-margin,x2:ex+margin,y1:10,y2:Mojo.height-10};
    }

    function _dropDown(){
      for(let r,y=0;y<_G.aliens.length;++y){
        r=_G.aliens[y];
        for(let x=0;x<r.length;++x){
          r[x].y += MFL(r[x].height*0.8);
        }
      }
    }

    function _checkRight(){
      let sx,ex,flip;
      for(let r,y=0;y<_G.aliens.length;++y){
        r=_G.aliens[y];
        for(let a,x=r.length-1;x>=0;--x){
          if(a=r[x]){
            ex= a.x + MFL(a.width/2);
            if(ex>=_G.arena.x2){
              flip=true;
              break;
            }
          }
        }
      }
      if(flip){
        _G.marchDir=Mojo.LEFT;
        _dropDown();
      }
    }

    function _checkLeft(){
      let sx,ex,flip;
      for(let r,y=0;y<_G.aliens.length;++y){
        r=_G.aliens[y];
        for(let a,x=0;x<r.length;++x){
          if(a=r[x]){
            ex= a.x-MFL(a.width/2);
            if(ex<=_G.arena.x1){
              flip=true;
              break;
            }
          }
        }
      }
      if(flip){
        _G.marchDir=Mojo.RIGHT;
        _dropDown();
      }
    }

    function _walkAliens(){
      if(_G.marchDir===Mojo.RIGHT){
        _checkRight();
      }else{
        _checkLeft();
      }
      for(let r,y=0;y<_G.aliens.length;++y){
        r=_G.aliens[y];
        for(let a,x=0;x<r.length;++x){
          a=r[x];
          if(a){
            a.g.frame=a.g.frame===0?1:0;
            a.m5.showFrame(a.g.frame);
            if(_G.marchDir===Mojo.RIGHT){
              a.x += MFL(a.width/4);
            }else{
              a.x -= MFL(a.width/4);
            }
          }
        }
      }
      _.delay(WALK_FRAME,_walkAliens);
    }

    function _player(scene){
      let s= _G.player= _S.sprite("Laser_Cannon.png");
      let K=Mojo.getScaleFactor();
      let k=_G.aliens[0][0].width/s.width;
      _S.scaleXY(s,k,k);
      s.m5.speed=8*K;
      s.m5.type=E_PLAYER;
      s.m5.uuid="player";
      s.g.frame=0;
      s.m5.tick=()=>{
        _2d.contain(_S.move(s),scene,false);
      };
      _S.pinBottom(scene,s,-s.height*1.2*K);
      scene.insert(s);
    }

    function _controls(scene){
      const K=Mojo.getScaleFactor();
      const s= _G.player;
      const goLeft = _I.keybd(_I.keyLEFT,
        ()=>{ _S.velXY(s,-s.m5.speed,0) },
        ()=>{ !goRight.isDown && _S.velXY(s,0) });

      const goRight =_I.keybd(_I.keyRIGHT,
        ()=>{ _S.velXY(s,s.m5.speed,0) },
        ()=>{ !goLeft.isDown && _S.velXY(s,0) });

      function ctor(){
        let b=_S.sprite("bullet.png",true);
        let K=Mojo.getScaleFactor();
        K *= 0.3;
        _S.scaleXY(b,K,K);
        b.tint=_S.color("yellow");
        b.m5.uuid=`bullet#${_.nextId()}`;
        b.m5.type=E_BULLET;
        b.m5.onHit=()=>{
          //G.boomSound.play();
          b.m5.dead=true;
          _G.score += 1;
          scene.future(()=> _S.remove(b),5);
        }
        b.m5.tick=()=>{
          if(!b.m5.dead){
            if(b.y < -b.height){
              b.m5.dead=true;
              _S.remove(b)
            }else{
              _S.move(b);
            }
          }
        };
        return b;
      }
      const fire = _I.keybd(_I.keySPACE,
          ()=>{
            let b= _S.shoot(_G.player, -Mojo.PI_90,
                            7*K, ctor, MFL(_G.player.width/2), 0);
            scene.insert(b,true);
            //G.shootSound.play();
          });
    }

    _Z.defScene("level1",{
      _initLevel(){
        _aliens(this);
        _ufo(this);
        _player(this);
        _controls(this);
        let x= this.g.gfx=_S.graphics();
        this.insert(x);
      },
      setup(){
        this._initLevel();
        _.delay(WALK_FRAME,_walkAliens);
        _.delay(UFO_INTV*1000,_showUfo);
      },
      postUpdate(dt){
        //_S.drawGridBox(_G.arena,1,"white",this.g.gfx);
      }
    });

  }

  window.addEventListener("load", ()=>
    MojoH5({
      assetFiles: ["pics.png","images/pics.json"],
      arena: { width: 1024, height: 768 },
      scaleToWindow:"max",
      scaleFit:"y",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  );

})(this);


