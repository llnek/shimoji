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

;(function(global,UNDEF){

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
           Ute2D:_U,
           ute:_,
           is,
           v2:_V,
           math:_M,
           Sprites:_S}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const ALIENS=["purple","blue","blue","green","green"],
      WALK_FRAME=400,
      UFO_INTV=10,
      DIMX=11,
      DIMY=5,
      UFOSPEED=8;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      UI_FONT="Doki Lowercase",
      SplashCfg= {
        title:"Space Invaders",
        clickSnd:"click.mp3",
        action: {name:"PlayGame"}
      };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _showUfo(){
      let s= _G.ufo;
      s.m5.dead=false;
      _S.show(s);
      s.y=s.height;
      s.x=_G.arena.x1-s.width;
      Mojo.on(["hit",s],"onHit",s.g);
      Mojo.sound("ufo.mp3").play();
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function doUfo(scene){
      let s= _G.ufo= _S.sprite("ufo.png");
      let K=Mojo.getScaleFactor();
      let p=UFOSPEED*K;
      let w= _G.frame.x2-_G.frame.x1;
      _S.scaleXY(s,K*0.7,K*0.7);
      s.m5.vel[0]=w/p;
      _S.hide(s);
      s.m5.type=E_ENEMY;
      s.m5.cmask=E_BULLET;
      function doHide(){
        Mojo.off(["hit",s],"onHit",s.g);
        _S.hide(s);
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
        if(col.B.m5.type==E_BULLET) reclaimBullet(col.B);
        _G.score += 100;
        doHide();
      };
      Mojo.on(["hit",s],"onHit",s.g);
      return scene.insert(s,true);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function doAliens(scene){
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
          s.x= _M.ndiv(c.x1+c.x2,2);
          s.y= _M.ndiv(c.y1+c.y2,2)-Y;
          k *= 0.8;
          s.m5.cmask=E_PLAYER|E_BULLET;
          s.m5.type=E_ENEMY;
          s.g.row=y;
          s.g.col=x;
          scene.insert(_S.anchorXY(_S.scaleXY(s,k,k),0.5),true);
          s.g.onHit=(col)=>{
            Mojo.off(["hit",s],"onHit",s.g);
            _G.aliens[s.g.row][s.g.col]=null;
            _S.hide(s);
            s.m5.dead=true;
            scene.queueForRemoval(s);
            if(col.B.m5.type==E_BULLET){
              reclaimBullet(col.B);
              _G.score += 1;
            }
            if(col.B.m5.type==E_PLAYER){
              playerDied();
            }else{
              Mojo.sound("explosion.mp3").play();
            }
            checkEnd();
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
      let d,flip= _G.marchDir==Mojo.RIGHT ? _checkRight() : _checkLeft();
      flip?0:_G.aliens.forEach((r,y)=> r.forEach((a,x)=>{
        if(a){
          a.g.frame=a.g.frame==0?1:0;
          a.m5.showFrame(a.g.frame);
          d= _M.ndiv(a.width,4);
          a.x += _G.marchDir==Mojo.RIGHT ? d : -d;
          _G.gameScene.engrid(a);
        }
      }));

      if(_G.walkCount<0 || ++_G.walkCount>4){
        Mojo.sound("march.mp3").play();
        _G.walkCount=0;
      }

      _G.gameScene.future(_walkAliens, WALK_FRAME);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function dropBombs(){
      let b,r,M=6,
        K=Mojo.getScaleFactor();
      _G.aliens.forEach((r,y)=> r.forEach((a,x)=>{
        r=_.rand();
        if(M>0 && a && ((r>0.4 && r<0.6))){
          b= _U.shoot(a, Mojo.PI_90, 7*K, takeBomb, _M.ndiv(a.width,2), 0);
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
      _S.hide(s);
      s.parent.future(()=>{
        doPlayer()
      },400);
      _G.gameScene.queueForRemoval(s);
      Mojo.sound("explosion.mp3").play();
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function cannon(r){
      let K=Mojo.getScaleFactor();
      return _S.scaleXY( _S.sprite("Laser_Cannon.png"), r*K,r*K);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function doPlayerIcons(score){
      let r=0.3,p=score,
        scene=score.parent,
        s,i,K=Mojo.getScaleFactor();
      for(i=0;i < 4; ++i){
        s=cannon(r);
        if(i==0){
          _S.pinBelow(p,s,20*K,0);
        }else{
          _S.pinRight(p,s,10*K);
        }
        s.g.frame=0;
        s.m5.speed=8*K;
        s.m5.dead=true;
        s.m5.cmask=E_BOMB;
        s.m5.type=E_PLAYER;
        _G.players.push( p=scene.insert(s,true));
      }
      return scene;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function checkEnd(){
      for(let r,y=0; y<_G.aliens.length;++y){
        r=_G.aliens[y];
        for(let c,x=0; x<r.length; ++x){
          if(c=r[x])
            return false;
        }
      }
      _S.die(_G.gameScene);
      _.delay(CLICK_DELAY,()=> _Z.modal("EndGame",{

        fontSize:64*Mojo.getScaleFactor(),
        replay:{name:"PlayGame"},
        quit:{name:"Splash", cfg:SplashCfg},
        msg:"You Win!",
        winner:1
      }));
      return true;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function doPlayer(scene){
      let s= _G.players.pop(),
        Y,K=Mojo.getScaleFactor();
      _G.player=s;
      scene=_G.gameScene;
      if(!s){
        _S.die(scene);
        _.delay(CLICK_DELAY,()=>_Z.modal("EndGame",{

          fontSize:64*Mojo.getScaleFactor(),
          replay:{name:"PlayGame"},
          quit:{name:"Splash", cfg:SplashCfg},
          msg:"You Win!",
          winner:0
        }));
      }else{
        _S.uuid(_S.scaleBy(s,5/3,5/3),"player");
        _S.pinBelow(scene,s,-s.height*2*K);
        Y= s.y = _G.arena.y2 - s.height - 40*K;
        s.m5.tick=()=>{
          _S.clamp(_S.move(s),_G.frame,false);
          s.y=Y;
        };
        s.g.onHit=(col)=>{
          if(col.B.m5==E_BOMB) reclaimBomb(col.B);
          playerDied();
        };
        s.m5.dead=false;
        Mojo.on(["hit",s],"onHit",s.g);
      }
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
      _U.shoot(_G.player, -Mojo.PI_90,
                          7*K, takeBullet, _M.ndiv(_G.player.width,2), 0);
      Mojo.sound("fire.mp3").play();
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function reclaimBullet(b){
      _G.gameScene.degrid(b);
      _S.hide(b);
      b.m5.dead=true;
      _G.bullets.push(b);
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function takeBullet(){
      let s,K=Mojo.getScaleFactor();
      if(_G.bullets.length==0){
        s=_G.gameScene.insert(bulletCtor(),true);
        Mojo.CON.log("new bullet ");
      }else{
        s=_G.bullets.pop();
        Mojo.CON.log("got bullet from cache");
      }
      _S.show(s);
      s.m5.dead=false;
      return s;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function reclaimBomb(b){
      _G.gameScene.degrid(b);
      _S.hide(b);
      b.m5.dead=true;
      _G.bombs.push(b);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function takeBomb(){
      let s,K=Mojo.getScaleFactor();
      if(_G.bombs.length==0){
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
        Mojo.CON.log("new bomb ");
      }else{
        s=_G.bombs.pop();
        Mojo.CON.log("got bomb from cache");
      }
      _S.show(s);
      s.m5.dead=false;
      return s;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      setup(){
        let self=this,
          W=Mojo.width,H=Mojo.height,s,K=Mojo.getScaleFactor();
        _.inject(this.g,{
          initLevel(){
            _G.marchDir=Mojo.RIGHT;
            _G.gameScene=self;
            _G.players=[];
            _G.bullets=[];
            _G.aliens=[];
            _G.bombs=[];
            _G.score=0;
            _G.walkCount= -1;
            return _G;
          },
          initHud(s){
            s=this.scoreText=_S.bmpText("0",UI_FONT,48*K);
            self.insert(s);
            return doPlayerIcons(s);
          }
        });
        _Z.run("StarfieldBg",{static:true});
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel() && this.g.initHud();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doAliens(this);
        doUfo(this);
        doPlayer(this);
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        //this.g.gfx=_S.drawGridBox(_G.frame,4*K,"white");
        //this.g.gfx.alpha=0.3;
        //this.insert(this.g.gfx);
        self.future(_walkAliens, WALK_FRAME);
        self.future(_showUfo, UFO_INTV*1000);
        self.future(dropBombs,1000);
        _controls(this);
        if(true){
          let alpha=0.5,
            color="grey",
            radius= 42*K,
            fontName=UI_FONT,fontSize= 48*K;
          _Z.run("HotKeys",{
            color,alpha,radius,fontName,fontSize,
            extra(ss){
              let b=_S.opacity(_S.circle(radius,color),alpha);
              b.addChild(_S.anchorXY(_S.bmpText("^",fontName,fontSize),0.5));
              b.m5.press=()=> fireBullet();
              _V.set(b,b.width,Mojo.height-b.height);
              ss.insert(_I.mkBtn(b));
            },
            cb(obj){
              _V.set(obj.right,W-obj.right.width,H-obj.right.height);
              _S.pinLeft(obj.right,obj.left,obj.right.width/4);
              _V.set(obj.up,obj.up.width,H-obj.up.height);
              delete obj.down;
              delete obj.up;
              return obj;
            }
          });
        }
        _Z.run("AudioIcon",{
          xScale:1.2*K, yScale:1.2*K,
          xOffset: -10*K, yOffset:0
        });
      },
      postUpdate(dt){
        const K=Mojo.getScaleFactor();
        const s= _G.player;
        const goRight =_I.keyDown(_I.RIGHT);
        const goLeft = _I.keyDown(_I.LEFT);
        if(!s){
          return;
        }

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
            if(!_G.ufo.m5.dead && o.m5.type==E_BULLET) _S.hit(_G.ufo,o)
          });

        if(!_G.player.m5.dead)
          this.searchSGrid(_G.player).forEach(o=>{
            if(!_G.player.m5.dead && o.m5.type==E_BOMB) _S.hit(_G.player,o)
          });

        for(let v,r,y=_G.aliens.length-1;y>=0;--y){
          r=_G.aliens[y];
          for(let c,x=0;x<r.length; ++x){
            if(c=r[x]){
              this.searchSGrid(c).forEach(o=>{
                if(o.m5.type==E_BULLET || o.m5.type==E_PLAYER){
                  _S.hit(c,o);
                }
              });
            }
          }
        }

        this.g.scoreText.text=`Score: ${_G.score}`;
      }
    });

    _Z.run("Splash", SplashCfg);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //boot and go
  window.addEventListener("load", ()=> MojoH5({

    assetFiles: ["pics.png","images/pics.json",
                 "audioOn.png","audioOff.png",
                 "click.mp3", "game_over.mp3","game_win.mp3",
                 "ufo.mp3", "march.mp3","explosion.mp3","fire.mp3"],
    arena:{width:1344, height:840}, //4:3
    scaleToWindow:"max",
    scaleFit:"x",
    start(...args){ scenes(...args) }

  }));

})(this);

//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
//EOF

