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
    let _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_2d=Mojo["2d"];
    let {ute:_,is,EventBus}=Mojo;

    function Block(x,y,width,height,points){
      let inPoints=points;
      if(!points){
        let w2=Math.floor(width/2);
        let h2=Math.floor(height/2);
        inPoints=points=[[-w2,-h2],[w2,-h2],[w2,h2],[-w2,h2]];
      }
      function draw(ctx){
        ctx.beginFill("blue");
        ctx.lineStyle(1, 0, 1);
        ctx.moveTo(points[0][0],points[0][1]);
        for(let i=0;i<points.length;++i){
          ctx.lineTo(points[i][0],points[i][1]);
        }
        ctx.lineTo(points[0][0],points[0][1]);
        ctx.closePath();
        ctx.endFill();
      }
      let s= _S.drawBody(draw);
      if(inPoints)
        s.m5.getContactPoints=function(){ return inPoints };
      s.m5.static=true;
      s.anchor.set(0.5);
      s.alpha=0.5;
      s.x=x;
      s.y=y;
      return s;
    }
    function Player(scene){
      let p=_S.frame("sprites.png",30,29,0,0);
      scene.insert(p);
      _S.setXY(p,Mojo.canvas.width/2 - 200,-180);
      p.anchor.set(0.5);
      _S.addMixin(p,"2d","platformer");
      p.m5.gravity[1]=200;
      p.m5.speed=200;
      p.m5.collide=function(){
        if(_2d.hit(p,scene.tower)){
          _S.remove(p);
          _Z.runScene("endGame",{ msg: "You Won!" });
        }else{
          scene.blocks.forEach(b=> _2d.hit(p,b))
        }
      };
      p.m5.step=function(dt){
        if(p.y > scene.b5.y+scene.b5.height*3){
          _S.remove(p);
          _Z.runScene("endGame",{msg: "You Fell!"});
        }else{
          p["2d"].motion(dt);
          p.platformer.motion(dt);
        }
      };
      return p;
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
        //let g=_Z.layoutX([s1,s3,s4,s5,s6],options);
        let g=_Z.layoutY([s1,s2,s3,s4,s5,s6],options);
        this.btns= [s4,s6];
        this.insert(g);
        s4.m5.press=function(){
          _Z.removeScene("level1","endGame");
          _Z.runScene("level1");
        }
      }
    });

    _Z.defScene("bg",{
      setup(){
        let w= this.wall= _S.tilingSprite("background-wall.png");
        this.insert(_S.setSize(w,Mojo.width,Mojo.height));
        //Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(){
        //this.wall.tilePosition.x += 1;
        //this.wall.tilePosition.y += 1;
      }
    });

    _Z.defScene("level1",{
      setup(){
        let t= this.tower= _S.frame("sprites.png",30, 30, 0,54);
        t.m5.CLASS="Tower";
        this.insert(t);
        let player = this.player = Player(this);
        let X=Math.floor(Mojo.width/2);
        let Y=Math.floor(Mojo.height/2);
        let b1,b2,b3,b4,b5;
        let bs=this.blocks=[];
        bs.push(b1=Block(X-130, Y-30, 50,30));
        b1.m5.uuid="b1";
        bs.push(b2=Block(X-180,Y, 150,50));
        b2.m5.uuid="b2";
        bs.push(b3=Block(X, Y, 100,50, [ [ 0, -15], [ 50, 0 ], [ 0, 15 ], [ -50, 0 ] ]));
        b3.m5.uuid="b3";
        bs.push(b4=Block(X+180, Y, 100, 140, [[ 0, -50], [25, -40], [ 50, 0 ], [ 0, 50 ], [ -90, 0 ] ]));
        b4.m5.uuid="b4";
        b4.m5.getContactPoints=function(){
          //need to redefine the shape
          return [[70,0],[20,50],[-70,0],[20,-50],[45,-40]]
        };
        bs.push(b5=Block(X+360, Y+40, 50, 50));
        b5.m5.uuid="b5";
        bs.forEach(b=> this.insert(b));
        this.tower.y= b5.y - Math.floor(b5.height/2) - this.tower.height;
        this.tower.x= b5.x - Math.floor(this.tower.width/2);
        this.b5=b5;

        let stage=Mojo.mockStage();
        let camera= this.camera = _2d.worldCamera(this,stage.width,stage.height);
        this.camera.follow(player);
        //EventBus.sub(["post.update",this],"postUpdate");
      }
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["sprites.png","background-wall.png"],
      arena: {},
      scaleToWindow: true,
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("bg");
        Mojo.Scenes.runScene("level1");
      }
    })
  });
})(this);

