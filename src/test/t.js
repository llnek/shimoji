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
 * Copyright © 2020-2024, Kenneth Leung. All rights reserved. */

;(function(window,UNDEF){

  "use strict";

  function scenes(Mojo){
    const {Scenes:_Z,
           Sprites:_S,
           Ute2D:_U,
           FX:_F,
           Input:_I,
           Game:G,
           v2:_V,
           ute:_,is}=Mojo;

    const E_GEO=1;

    const UI_FONT="Doki Lowercase";

    _Z.scene("level1",{
      update9(){
        let o;
        if(0){
          if(o=_I.keyDown(_I.SPACE)){
            console.log("spaced pressed");
            console.log(o);
          }
        }
      },
      test9(){
        this.g.key= _I.keybd([_I.SPACE,_I.UP],(a,c,s)=>{
          console.log(`pressed= alt=${a}, ctrl=${c}, shift=${s}`);
        },(a,c,s)=>{
          console.log(`release= alt=${a}, ctrl=${c}, shift=${s}`);
        })
      },
      test8(){
        let C= _S.container();
        this.insert(C);
        if(1){
          _F.particles(C,400,40,()=>{ return _S.rect(10,10,"white") },100);
        }else{
          let s= _S.rect(200,200,"white");
          _V.set(s, 400,400);
          _S.anchorXY(s,0.5);
          this.insert(s);
          _F.shake(s,20);
        }
      },
      test7(){
        let s= _S.rect(100,20,"white");
        s.x=400;
        s.y=400;
        this.insert(s);
        if(0){
          _F.bezier(s,[100, 550],[300, 350],[300, 150],120).onComplete=()=>{
            _F.tweenXY(s,_F.SMOOTH, 800,500, 120)
          }
        }else{
          _S.anchorXY(s,0.5);
          _F.jiggle(s,{});
          _F.strobe(s);
          _F.pulse(s);
        }
      },
      test6(){
        let s= _S.rect(200,200,"blue");
        _S.centerObj(s);
        this.insert(s);
        let b= _F.SeqTweens(
          _F.tweenScale(s,_F.SMOOTH,3,3),
          _F.tweenAlpha(s,_F.SMOOTH,[0,1]),
          _F.tweenAngle(s,_F.SMOOTH,1.8*Math.PI));
        b.onComplete=()=>{ console.log("yo") }
      },
      test5(){
        let s= _S.rect(200,200,"green");
        _S.centerObj(s);
        this.insert(s);
        let b= _F.BatchTweens(
          _F.tweenScale(s,_F.SMOOTH,3,3),
          _F.tweenAlpha(s,_F.SMOOTH,[0,1],60),
          _F.tweenAngle(s,_F.SMOOTH,1.8*Math.PI));
        b.onComplete=()=>{ console.log("yo") }
      },
      update4(dt){
        this.g.warp.update(dt)
      },
      test4(){
        let s= _F.StarWarp(this,{color: "yellow"});
        this.g.warp=s;
      },
      update3(dt){
        this.g.obj.angle -= 1;
        let b= _S.boundingBox(this.g.obj);
        this.g.gfx.clear();
        this.g.gfx.lineStyle(1,_S.SomeColors.yellow);
        this.g.gfx.drawRect(b.x1,b.y1,b.x2-b.x1,b.y2-b.y1);
      },
      test3(){
        let s= _S.rect(300,150,"blue");
        _S.anchorXY(s,0.5);
        _S.centerObj(s);
        this.g.obj=s;
        this.insert(s);
        let g= _S.graphics();
        this.insert(g);
        this.g.gfx=g;
      },
      test1(){
        let
         s1=_S.bmpText("item-000000000",UI_FONT, 36),
         s2=_S.bmpText("item-1111111111111111", UI_FONT,36),//42),
         //s3=_S.bmpText("item-2222", UI_FONT, 36),//24);
         //s4=_S.bmpText("item-444444",UI_FONT, 36),
         s5=_S.bmpText("item-55", UI_FONT,36),//42),
         s6=_S.bmpText("item-66666666666", UI_FONT, 36);//24);
        let C=_Z.layoutY([s1,s2,s5,s6],{});
        //let C=_Z.layoutX([s1,s2,s5,s6],{});
        this.insert(C);
      },
      test2(){
        let
         s1=_S.bmpText("item-000000000",UI_FONT, 36),
         s2=_S.bmpText("item-1111111111111111", UI_FONT,36),//42),
         s5=_S.bmpText("item-55", UI_FONT,36),//42),
         s6=_S.bmpText("item-66666666666", UI_FONT, 36);//24);

        _I.mkBtn(_S.uuid(s1,"s1"));
        _I.mkBtn(_S.uuid(s2,"s2"));
        _I.mkBtn(_S.uuid(s5,"s5"));
        _I.mkBtn(_S.uuid(s6,"s6"));

        let C=_Z.choiceMenuY([s1,s2,s5,s6],{
          defaultChoice:"s6"
        });
        this.insert(C);
      },
      setup(){
        this.test2();
      },
      postUpdate(dt){
        //this.update4(dt);
      }
    });

    Mojo.Scenes.run("level1");
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["click.mp3"],
      arena: {width:1344, height:840},
      scaleToWindow:"max",
      scaleFit:"x",
      start(Mojo){ scenes(Mojo) }

    })
  });

})(this);


