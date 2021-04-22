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

  const MFL=Math.floor;
  const E_PLAYER=1;
  const E_BLOCK=2;
  const E_TOWER=4;

  function scenes(Mojo){
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           "2d":_2d,
           Game:G,
           v2:_V,
           ute:_,is}=Mojo;

    function Block(x,xoff,y,yoff,width,height,points){
      let K=Mojo.getScaleFactor();
      let inPoints;
      xoff *= K;
      yoff *= K;
      width *= K;
      height *= K;
      x += xoff;
      y += yoff;
      if(points){
        points.forEach(p=> _V.mul$(p,K));
        inPoints=points;
      }else{
        let h2=MFL(height/2);
        let w2=MFL(width/2);
        inPoints=points=[[-w2,-h2],[w2,-h2],[w2,h2],[-w2,h2]];
      }
      function draw(ctx){
        ctx.beginFill("blue");
        ctx.lineStyle(1, 0, 1);
        ctx.moveTo(points[0][0],points[0][1]);
        for(let i=0;i<points.length;++i){
          ctx.lineTo(points[i][0],points[i][1])
        }
        ctx.lineTo(points[0][0],points[0][1]);
        ctx.closePath();
        ctx.endFill();
      }
      let s= _S.drawBody(draw);
      if(inPoints)
        s.m5.getContactPoints=()=> { return inPoints};
      s.m5.type=E_BLOCK;
      s.m5.static=true;
      s.alpha=0.5;
      _S.centerAnchor(s);
      return _V.set(s,x,y);
    }

    function Player(scene){
      let p=_S.frame("sprites.png",32,32,0,0);
      let K=Mojo.getScaleFactor();
      _V.set(p.scale,K,K);
      p.m5.uuid="player";
      p.m5.type=E_PLAYER;
      p.m5.cmask=E_BLOCK|E_TOWER;
      p.x= MFL(Mojo.width/2) - K*200;
      p.y= -180*K;
      _S.centerAnchor(p);
      scene.insert(p,true);
      Mojo.addMixin(p,"2d",[_2d.Platformer]);
      _V.set(p.m5.gravity,0,200 * K);
      p.m5.speed=200 * K;
      p["2d"].Platformer.jumpSpeed *= K;
      p.m5.tick=function(dt){
        if(p.y > scene.b5.y+scene.b5.height*3*K){
          _S.remove(p);
          _Z.runScene("endGame",{msg: "You Fell!"});
        }else{
          p["2d"].onTick(dt);
        }
      };
      return p;
    }

    function Tower(scene,b5){
      let t= _S.frame("sprites.png",32, 32, 0,64);
      let K=Mojo.getScaleFactor();
      _V.set(t.scale,K,K);
      t.m5.uuid="tower";
      t.m5.type=E_TOWER;
      t.m5.sensor=true;
      t.m5.onSensor=()=>{ _Z.runScene("endGame",{ msg: "You Won!" }); };
      Mojo.on(["2d.sensor",t],"onSensor",t.m5);
      _V.copy(t,_V.sub(b5, [MFL(t.width/2),
                            MFL(b5.height/2) + t.height]));
      return scene.insert(t,true);
    }

    _Z.defScene("endGame",{
      dispose(){
        this.btns.forEach(b => _I.undoButton(b))
      },
      setup(options){
        let s1=_S.text("Game Over", {fill:"white",align:"center"});
        let s2=_S.text(options.msg, {fill:"white",align:"center"});
        let s3=_S.text(" ");
        let s4=_I.makeButton(_S.text("Play Again?",{fill:"white",align:"center"}));
        let s5=_S.text("or",{fill:"white",align:"center"});
        let s6=_I.makeButton(_S.text("Quit",{fill:"white",align:"center"}));
        let g=_Z.layoutY([s1,s2,s3,s4,s5,s6],options);
        this.btns= [s4,s6];
        this.insert(g);
        s4.m5.press=function(){
          _Z.removeScenes();
          _.delay(0,()=>{
            _Z.runScene("bg");
            _Z.runScene("level1");
          })
        }
      }
    });

    _Z.defScene("bg",{
      setup(){
        let w= this.wall= _S.tilingSprite("background-wall.png");
        this.insert(_S.sizeXY(w,Mojo.width,Mojo.height));
      }
    });

    _Z.defScene("level1",{
      setup(){
        let K=Mojo.getScaleFactor();
        let Y=MFL(Mojo.height/2);
        let X=MFL(Mojo.width/2);
        let b1,b2,b3,b4,b5;
        let bs=this.blocks=[];
        bs.push(b1=_S.uuid(Block(X,-130, Y,-30, 50,30),"b1"));
        bs.push(b2=_S.uuid(Block(X,-180,Y,0, 150,50),"b2"));
        bs.push(b3=_S.uuid(Block(X,0,Y,0,100,50,[[0,-15],[50,0],[0,15],[-50,0]]),"b3"));
        bs.push(b4=_S.uuid(Block(X,180,Y,0,100,140,[[0,-50],[25,-40],[50,0],[0,50],[-90,0]]),"b4"));
        b4.m5.getContactPoints=()=>{
          let ps=[[70,0],[20,50],[-70,0],[20,-50],[45,-40]];
          ps.forEach(p=> _V.mul$(p,K));
          return ps;
        };
        bs.push(b5=_S.uuid(Block(X,360, Y,40, 50, 50),"b5"));
        bs.forEach(b=> this.insert(b,true));
        let player = this.player = Player(this);
        let t= this.tower= Tower(this,b5);
        this.b5=b5;
      }
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["sprites.png","background-wall.png"],
      arena: {width:960,height:480},
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("bg");
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);

