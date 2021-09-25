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
  const E_BOMB=4;
  const E_BULLET=8;

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){
    const int=Math.floor;
    const {Scenes:_Z,
           FX:_F,
           Game:_G,
           Input:_I,
           ute:_,
           is,
           v2:_V,
           Sprites:_S}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const ALIENS=["purple","blue","blue","green","green"];
    const WALK_FRAME=400;
    const UFO_INTV=10;
    const DIMX=11;
    const DIMY=5;
    const UFOSPEED=8;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TITLE_FONT="Big Shout Bob";
    const UI_FONT="Doki Lowercase";
    const C_TITLE=_S.color("#fff20f");
    const C_BG=_S.color("#169706");
    const C_TEXT=_S.color("#fff20f");
    const C_GREEN=_S.color("#7da633");
    const C_ORANGE=_S.color("#f4d52b");
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function playClick(){
      Mojo.sound("click.mp3").play();
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _showUfo(){
      let s= _G.ufo;
      s.m5.dead=false;
      s.visible=true;
      s.y=s.height;
      s.x=_G.arena.x1-s.width;
      Mojo.on(["hit",s],"onHit",s.g);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _ufo(scene){
      let s= _G.ufo= _S.sprite("ufo.png");
      let K=Mojo.getScaleFactor();
      let p=UFOSPEED*K;
      let w= _G.frame.x2-_G.frame.x1;
      _S.scaleXY(s,K*0.7,K*0.7);
      s.m5.vel[0]=w/p;
      s.visible=false;
      s.m5.type=E_ENEMY;
      s.m5.cmask=E_BULLET;
      function doHide(){
        Mojo.off(["hit",s],"onHit",s.g);
        s.visible=false;
        s.m5.dead=true;
        scene.future(_showUfo, UFO_INTV*1000);
      }
      s.m5.tick=(dt)=>{
        _S.move(s,dt);
        if(s.x+s.width/2>=_G.arena.x2){
          doHide();
        }
      };
      s.g.onHit=(col)=>{
        if(col.B.m5.type===E_BULLET) reclaimBullet(col.B);
        _G.score += 100;
        doHide();
      };
      Mojo.on(["hit",s],"onHit",s.g);
      return scene.insert(s,true);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _aliens(scene){
      let K=Mojo.getScaleFactor(),
          Y=K*200,
          X=5*K,
          out={},
          g=_S.gridXY([DIMX,DIMY],0.8,0.4,out);
      for(let R,k,b,r,y=0;y<g.length;++y){
        _G.aliens.push(R=[]);
        r=g[y];
        b=[`${ALIENS[y]}_bug_0.png`,
           `${ALIENS[y]}_bug_1.png`];
        for(let c,x=0;x<r.length;++x){
          let s=_S.sprite(b);
          c=r[x];
          R.push(s);
          k=(c.x2-c.x1)/s.width;
          s.x=int((c.x1+c.x2)/2);
          s.y=int((c.y1+c.y2)/2)-Y;
          k *= 0.8;
          s.m5.cmask=E_PLAYER|E_BULLET;
          s.m5.type=E_ENEMY;
          s.g.row=y;
          s.g.col=x;
          scene.insert(_S.centerAnchor(_S.scaleXY(s,k,k)),true);
          s.g.onHit=(col)=>{
            Mojo.off(["hit",s],"onHit",s.g);
            _G.aliens[s.g.row][s.g.col]=null;
            s.visible=false;
            s.m5.dead=true;
            scene.queueForRemoval(s);
            if(col.B.m5.type===E_BULLET){
              reclaimBullet(col.B);
              _G.score += 1;
            }
            if(col.B.m5.type===E_PLAYER){
              playerDied();
            }
          };
          Mojo.on(["hit",s],"onHit",s.g);
        }
      }
      let sx=out.x;
      let ex=sx+out.width;
      let margin= int(sx* 0.4*K);
      _G.arena={x1:sx-margin,x2:ex+margin,y1:20*K,y2:Mojo.height-20*K};
      _G.frame={x1:sx-margin*1.5,x2:ex+margin*1.5,y1:20*K,y2:Mojo.height-20*K};
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _dropDown(){
      for(let r,y=0;y<_G.aliens.length;++y){
        r=_G.aliens[y];
        for(let x=0;x<r.length;++x){
          if(r[x])
            r[x].y += int(r[x].height*0.8);
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _checkRight(){
      let sx,ex,flip;
      for(let r,y=0;y<_G.aliens.length;++y){
        r=_G.aliens[y];
        for(let a,x=r.length-1;x>=0;--x){
          if(a=r[x]){
            ex= a.x + a.width/2;
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
      return flip;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _checkLeft(){
      let sx,ex,flip;
      for(let r,y=0;y<_G.aliens.length;++y){
        r=_G.aliens[y];
        for(let a,x=0;x<r.length;++x){
          if(a=r[x]){
            ex= a.x- a.width/2;
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
      return flip;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _walkAliens(){
      let d,flip= _G.marchDir===Mojo.RIGHT ? _checkRight() : _checkLeft();
      flip?0:_G.aliens.forEach((r,y)=> r.forEach((a,x)=>{
        if(a){
          a.g.frame=a.g.frame===0?1:0;
          a.m5.showFrame(a.g.frame);
          d= int(a.width/4);
          a.x += _G.marchDir===Mojo.RIGHT ? d : -d;
          _G.gameScene.engrid(a);
        }
      }));

      _G.gameScene.future(_walkAliens, WALK_FRAME);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function dropBombs(){
      let b,r,M=6,
          K=Mojo.getScaleFactor();
      _G.aliens.forEach((r,y)=> r.forEach((a,x)=>{
        r=_.rand();
        if(M>0 && a && ((r>0.4 && r<0.6))){
          b= _S.shoot(a, Mojo.PI_90, 7*K, takeBomb, int(a.width/2), 0);
          _G.gameScene.insert(b,true);
          --M;
        }
      }));
      _G.gameScene.future(dropBombs, 3000);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function playerDied(){
      let s= _G.player;
      Mojo.off(["hit",s],"onHit",s.g);
      s.m5.dead=true;
      s.visible=false;
      _G.gameScene.queueForRemoval(s);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _player(scene){
      let s= _G.player= _S.sprite("Laser_Cannon.png");
      let K=Mojo.getScaleFactor();
      let Y;
      let k=0.5*K;
      _S.scaleXY(s,k,k);
      s.m5.speed=8*K;
      s.m5.type=E_PLAYER;
      s.m5.cmask=E_BOMB;
      s.m5.uuid="player";
      s.g.frame=0;
      _S.pinBottom(scene,s,-s.height*2*K);
      Y= s.y = _G.arena.y2 - s.height - 40*K;
      s.m5.tick=()=>{
        _S.clamp(_S.move(s),_G.frame,false);
        s.y=Y;
      };
      s.g.onHit=(col)=>{
        if(col.B.m5===E_BOMB) reclaimBomb(col.B);
        playerDied();
      };
      Mojo.on(["hit",s],"onHit",s.g);
      return scene.insert(s,true);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function bulletCtor(){
      let b=_S.sprite("bullet.png",true);
      let K=Mojo.getScaleFactor();
      _S.scaleBy(b,0.3*K,0.8*K);
      b.tint=_S.color("yellow");
      b.m5.uuid=`bullet#${_.nextId()}`;
      b.m5.type=E_BULLET;
      b.m5.tick=()=>{
        if(!b.m5.dead){
          if(b.y < -b.height){
            reclaimBullet(b)
          }else{
            _S.move(b);
          }
        }
      };
      return b;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _controls(scene){
      const K=Mojo.getScaleFactor();
      const s= _G.player;
      const fire = _I.keybd(_I.SPACE, fireBullet);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function fireBullet(){
      let K=Mojo.getScaleFactor();
      _S.shoot(_G.player, -Mojo.PI_90,
                          7*K, takeBullet, int(_G.player.width/2), 0);
      //G.shootSound.play();
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _touches(scene){
      let K=Mojo.getScaleFactor();
      let cfg={fontName:UI_FONT,fontSize:64*K};
      let alpha=0.2,grey=_S.color("#cccccc");
      let L,R,F,offX, offY;
      R= _S.rect(120,72,grey,grey,4);
      _S.centerAnchor(R);
      R.addChild(_S.centerAnchor(_S.bmpText("->",cfg)));
      offY=K*R.height/2;
      offX=offY;
      _V.set(R, Mojo.width-offX-R.width/2, Mojo.height-offY-R.height/2);
      scene.insert(_S.opacity(_I.makeHotspot(R),alpha));
      //////
      //////
      L= _S.rect(120,72,grey,grey,4);
      _S.centerAnchor(L);
      L.addChild(_S.centerAnchor(_S.bmpText("<-",cfg)));
      _S.pinLeft(R,L,offX/2);
      scene.insert(_S.opacity(_I.makeHotspot(L),alpha));
      //////
      F= _S.rect(120,72,grey,grey,4);
      _S.centerAnchor(F);
      F.addChild(_S.centerAnchor(_S.bmpText("^^",cfg)));
      _V.set(F, offX+F.width/2, Mojo.height-offY-F.height/2);
      scene.insert(_S.opacity(_I.mkBtn(F),alpha));
      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
      R.m5.touch=(o,t)=>{ t?_I.setKeyOn(_I.RIGHT):_I.setKeyOff(_I.RIGHT) }
      L.m5.touch=(o,t)=>{ t?_I.setKeyOn(_I.LEFT):_I.setKeyOff(_I.LEFT) }
      F.m5.press=(o)=>{ fireBullet() };
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        let self=this,
            K=Mojo.getScaleFactor(),
            verb=Mojo.touchDevice?"Tap":"Click";
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doTitle=(s)=>{
          s=_S.bmpText("Space Invaders", {fontName:TITLE_FONT,fontSize:160*K});
          _S.tint(s,C_TITLE);
          _V.set(s, Mojo.width/2, Mojo.height*0.3);
          return self.insert(_S.centerAnchor(s));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doNext=(s,t)=>{
          s=_S.bmpText(`${verb} to PLAY!`,{fontName:UI_FONT,fontSize:72*K});
          _V.set(s,Mojo.width/2,Mojo.height*0.7);
          t=_F.throb(s,0.8,0.8);
          function cb(){
            Mojo.off(["single.tap"],cb);
            _F.remove(t);
            _S.tint(s,C_ORANGE);
            playClick();
            _.delay(CLICK_DELAY, ()=>{
              _Z.replaceScene(self,"PlayGame");
            });
          }
          Mojo.on(["single.tap"],cb);
          return self.insert(_S.centerAnchor(s));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doTitle() && this.g.doNext();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function reclaimBullet(b){return;
      _G.gameScene.degrid(b);
      b.visible=false;
      b.m5.dead=true;
      _G.bullets.push(b);
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function takeBullet(){
      let s,K=Mojo.getScaleFactor();
      if(_G.bullets.length===0){
        s=_G.gameScene.insert(bulletCtor(),true);
        console.log("new bullet ");
      }else{
        s=_G.bullets.pop();
        console.log("got bullet from cache");
      }
      s.visible=true;
      s.m5.dead=false;
      return s;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function reclaimBomb(b){
      _G.gameScene.degrid(b);
      b.visible=false;
      b.m5.dead=true;
      _G.bombs.push(b);
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function takeBomb(){
      let s,K=Mojo.getScaleFactor();
      if(_G.bombs.length===0){
        let b=_S.sprite("bullet.png",true);
        _S.scaleBy(b,0.5*K,0.5*K);
        _S.tint(b,_S.color("red"));
        _S.uuid(b,`bomb#${_.nextId()}`);
        b.m5.type=E_BOMB;
        b.m5.onHit=()=>{ reclaimBomb(b) };
        b.m5.tick=()=>{
          _S.move(b);
          if(b.y>Mojo.height) reclaimBomb(b);
        };
        s=b;
        console.log("new bomb ");
      }else{
        s=_G.bombs.pop();
        console.log("got bomb from cache");
      }
      s.visible=true;
      s.m5.dead=false;
      return s;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PlayGame",{
      setup(){
        let self=this,
            s,K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel=()=>{
          _G.marchDir=Mojo.RIGHT;
          _G.gameScene=self;
          _G.bullets=[];
          _G.aliens=[];
          _G.bombs=[];
          _G.score=0;
          _aliens(this);
          _ufo(this);
          _player(this);
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        s=this.g.scoreText=_S.bmpText("0",{fontName:UI_FONT,fontSize:48*K});
        self.insert(s);
        //this.g.gfx=_S.drawGridBox(_G.frame,4*K,"white");
        //this.g.gfx.alpha=0.3;
        //this.insert(this.g.gfx);
        self.future(_walkAliens, WALK_FRAME);
        self.future(_showUfo, UFO_INTV*1000);
        self.future(dropBombs,1000);
        if(Mojo.touchDevice) _touches(this); else  _controls(this);
      },
      postUpdate(dt){
        const K=Mojo.getScaleFactor();
        const s= _G.player;
        const goRight =_I.keyDown(_I.RIGHT);
        const goLeft = _I.keyDown(_I.LEFT);

        if(goLeft){
          _V.set(s.m5.vel,-s.m5.speed,0)
        }else{
          !goRight && _V.setX(s.m5.vel,0)
        }

        if(goRight){
          _V.set(s.m5.vel,s.m5.speed,0)
        }else{
          !goLeft && _V.setX(s.m5.vel,0)
        }

        if(!_G.ufo.m5.dead)
          this.searchSGrid(_G.ufo).forEach(o=>{
            if(!_G.ufo.m5.dead && o.m5.type===E_BULLET) _S.hit(_G.ufo,o)
          });

        if(!_G.player.m5.dead)
          this.searchSGrid(_G.player).forEach(o=>{
            if(!_G.player.m5.dead && o.m5.type===E_BOMB) _S.hit(_G.player,o)
          });

        for(let v,r,y=_G.aliens.length-1;y>=0;--y){
          r=_G.aliens[y];
          for(let c,x=0;x<r.length; ++x){
            if(c=r[x]){
              this.searchSGrid(c).forEach(o=>{
                if(o.m5.type===E_BULLET || o.m5.type===E_PLAYER){
                  _S.hit(c,o);
                }
              });
            }
          }
        }

        this.g.scoreText.text=`Score: ${_G.score}`;
      }
    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["pics.png","images/pics.json",
                 "march.mp3",
                 "click.mp3", "game_over.mp3","game_win.mp3"],
    //arena: { width: 1024, height: 768 },
    arena:{width:1680, height:1260}, //4:3
    scaleToWindow:"max",
    scaleFit:"y",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("StarfieldBg",{static:true});
      Mojo.Scenes.runScene("Splash");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //boot and go
  window.addEventListener("load", ()=> MojoH5(_$));

})(this);

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

