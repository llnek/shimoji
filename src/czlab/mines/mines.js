(function(window){

  "use strict";

  function scenes(Mojo){

    const {Sprites:_S,
           Scenes:_Z,
           FX:T,
           Input:_I,
           Game:_G,
           "2d":_2d,
           v2:_V,
           ute:_,is}=Mojo;

    const C_WHITE=_S.color("#ffffff");
    const C_BG= _S.color("#25A65B");
    const C_TITLE=_S.color("#fff20f");
      //"#ff9f0f"
      //"#f75539"
      //"#eef838"
    const LINE_COLOR=_S.color("#2abb67");//("#bb8044");
    const TEXT_COLOR=_S.color("#2abb67");
    const C_NUM=_S.color("#24a159");
    //const C_BOX=_S.color("#f8fc7e");
    const C_BOX=_S.color("#e1fc7e"); //"#fcf97e"
    const int=Math.floor;

    function gameOver(){
      _I.reset();
      Mojo.mouse.reset();
      _Z.runScene("EndGame");
    }

    function boom(scene,c){
      let x,y,s= _S.sprite("mine.png");
      [x,y]=_S.centerXY(c.sprite);
      _S.centerAnchor(s);
      s.x=x;
      s.y=y;
      s.width=c.sprite.width;
      s.height=c.sprite.height;
      s.scale.x *=0.8;
      s.scale.y *=0.8;
      c.sprite.visible=false;
      scene.insert(s);
      s= _S.spriteFrom("boom0.png","boom1.png","boom2.png","boom3.png","boom4.png","boom5.png","boom6.png");
      _S.centerAnchor(s);
      s.x=x;
      s.y=y;
      s.loop=false;
      scene.insert(s);
      s.onComplete=()=>{
        _.delay(100,()=>{
          _S.remove(s);
          _.delay(100,gameOver);
        });
      };
      s.m5.playFrames();
      _G.gameOver=true;
      Mojo.sound("boom.ogg").play();
    }

    function onDropped(scene,B){
      let found;
      for(let r,y=0;y<_G.grid.length;++y){
        r=_G.grid[y];
        for(let s,c,x=0;x<_G.grid[0].length;++x){
          c=r[x];
          if(Mojo.mouse.hitTest(c.sprite)){
            if(!c.opened){
              if(B.g.value===99){
                if(c.marker){
                  _S.remove(c.marker);
                  c.marker=null;
                }else{
                  let m,n;
                  [m,n]= _S.centerXY(c.sprite);
                  s=_S.sprite("rflag.png");
                  _S.centerAnchor(s);
                  s.width=c.sprite.width;
                  s.height=c.sprite.height;
                  s.scale.x *= 0.5;
                  s.scale.y *= 0.5;
                  //s.alpha=0.7;
                  s.x=m;
                  s.y=n;
                  c.marker=s;
                  scene.insert(s);
                }
                found=true;
                Mojo.sound("drop.ogg").play();
              }
            }
            break;
          }
        }
      }
      B.x=B.g.oldx;
      B.y=B.g.oldy;
    }

    function initLevel(scene,cols,rows,target){
      let sx=_G.arena.x,
          sy=_G.arena.y;
      placeBombs(rows,cols,target);
      calcBombs();
      for(let r,y=0; y<_G.grid.length; ++y){
        r=_G.grid[y];
        for(let g,s,c,x=0;x<r.length;++x){
          g=_.randInt2(1,4);
          c=r[x];
          c.sprite= s=_S.sprite(`ground${g}.png`);
          s.x=sx+c.x1;
          s.y=sy+c.y1;
          s.width=c.x2-c.x1;
          s.height=c.y2-c.y1;
          c.row=y;
          c.col=x;
          s.m5.press=()=>{
            if(!_G.timerStarted) _.delay(0,()=>updateTimer());
            if(c.marker){return}
            _I.undoButton(s);
            if(c.value===9){
              boom(scene,c);
            }else{
              if(expand(scene,c.row,c.col)>3){
                Mojo.sound("expand.ogg").play();
              }
              checkEnd(scene);
            }
          };
          scene.insert(_I.makeButton(s));
        }
      }
    }

    function showAllMines(scene){
      for(let r,y=0;y<_G.grid.length;++y){
        r=_G.grid[y];
        for(let m,n,s,c,x=0;x<_G.grid[0].length;++x){
          c=r[x];
          if(c.value===9 && !c.opened){
            [m,n]=_S.centerXY(c.sprite);
            s=_S.sprite("mine.png");
            _S.centerAnchor(s);
            s.width=c.sprite.width;
            s.height=c.sprite.height;
            s.x=m;
            s.y=n;
            s.scale.x *= 0.8;
            s.scale.y *= 0.8;
            if(c.marker)_S.remove(c.marker);
            c.marker=null;
            c.sprite.visible=false;
            scene.insert(s);
          }
        }
      }
    }

    function checkEnd(scene){
      let opened=0,found=0;
      let pending=[];
      for(let r,y=0;y<_G.grid.length;++y){
        r=_G.grid[y];
        for(let c,x=0;x<_G.grid[0].length;++x){
          c=r[x];
          if(c.opened) ++opened;
          else if(c.marker && c.value===9) ++found;
          else pending.push(c);
        }
      }
      if(found===Mojo.u.dimXY[2] ||
         pending.filter(c=> c.value===9).length===pending.length){
        _G.gameOver=true;
        _G.lastWin=1;
        showAllMines(scene);
        _.delay(100, gameOver);
      }
    }

    //10,40,99
    function placeBombs(rows,cols,target){
      let n=rows*cols,
          x,y,p,t=0;
      while(t<target){
        p=_.randInt2(0,n-1);
        y=int(p/cols);
        x=p%cols;
        if(_G.grid[y][x].value !==9){
          ++t;
          _G.grid[y][x].value=9;
        }
      }
    }

    function calcBombs(){
      function calc(row,col){
        return row>=0 && row < _G.grid.length &&
               col>=0 && col < _G.grid[0].length && _G.grid[row][col].value==9?1:0 }
      for(let r,y=0;y<_G.grid.length;++y){
        r=_G.grid[y];
        for(let t,c,x=0;x <r.length;++x){
          t=0;
          if(r[x].value !== 9){
            //neighbours
            _G.grid[y][x].value = calc(y+1,x) +
                                  calc(y,x+1) +
                                  calc(y-1,x) +
                                  calc(y,x-1) +
                                  calc(y+1,x+1) +
                                  calc(y-1,x-1) +
                                  calc(y-1,x+1) +
                                  calc(y+1,x-1);
          }
        }
      }
    }

    function expand(scene,row,col){
      if(row>=0&&row<_G.grid.length && col>=0 && col < _G.grid[0].length){}else{return 0}
      let sum=0,x,y,s,c= _G.grid[row][col];
      if(!c.opened && c.value!==9 && c.value !== 99){
        c.sprite.visible=false;
        if(c.value===0){
        }else{
          [x,y]=_S.centerXY(c.sprite);
          s=_S.sprite(`${c.value}.png`);
          _S.centerAnchor(s);
          s.x=x;
          s.y=y;
          s.tint=_S.color("#e2e55c");
          //s.tint=C_NUM;
          s.width=c.sprite.width;
          s.height=c.sprite.height;
          s.scale.x *=0.5;
          s.scale.y *=0.5;
          //s.alpha=0.5;
          scene.insert(s);
        }
        c.opened=true;
        sum=1;
        if(c.value===0){
          sum += expand(scene,row-1,col-1);
          sum += expand(scene,row-1,col);
          sum += expand(scene,row-1,col+1);
          sum += expand(scene,row,col-1);
          sum += expand(scene,row,col+1);
          sum += expand(scene,row+1,col-1);
          sum += expand(scene,row+1,col);
          sum += expand(scene,row+1,col+1);
        }
      }
      return sum;
    }

    function initBg(scene){
      let K=Mojo.getScaleFactor(),
          N=int(72 * K),
          N2=int(N/3);
      _S.repeatSprite("grass.png",true,true,Mojo.width,Mojo.height).forEach(s=>scene.insert(s));
    }

    function initHud(scene){
      let K=Mojo.getScaleFactor(),
          s1,s2,m,n,c,s= _G.flag=_S.sprite("box.png");
      s.addChild(c=_S.sprite("rflag.png"));
      _S.centerAnchor(c);
      [m,n]=_S.centerXY(s);
      s.width=_G.CELLW;
      s.height=_G.CELLH;
      c.scale.x *= 0.5;
      c.scale.y *= 0.5;
      c.x=m;
      c.y=n;
      //c.alpha=0.7;
      _I.makeDrag(s);
      s.m5.onDragDropped=()=>{
        onDropped(scene, _G.flag)
        if(!_G.timerStarted) _.delay(1000,()=>updateTimer());
      };
      _S.pinTop(_G.bg,s);
      s.g.oldx=s.x;
      s.g.oldy=s.y;
      s.g.value=99;
      scene.insert(_G.flag);
      //
      s=_S.bitmapText(`${Mojo.u.dimXY[2]}`,{fontSize:36*K});
      s.tint=C_TITLE;
      _S.pinTop(_G.bg,s,10,0);
      scene.insert(s);
      s1=_S.sprite("mine.png");
      s1.width=_G.CELLW;
      s1.height=_G.CELLH;
      s1.scale.x *= 0.6;
      s1.scale.y *= 0.6;
      s.x += s1.width+10;
      _S.pinLeft(s,s1,10,0.5);
      scene.insert(s1);

      //
      s=_S.bitmapText(`000`,{fontSize:36*K});
      s.tint=C_TITLE;
      _S.pinTop(_G.bg,s,10,1);
      scene.insert(s);
      s1=_S.sprite("clock.png");
      s1.width=_G.CELLW;
      s1.height=_G.CELLH;
      s1.scale.x *= 0.6;
      s1.scale.y *= 0.6;
      _S.pinLeft(s,s1,10,0.5);
      scene.insert(s1);

      _G.timerText=s;
      _G.timerSecs=0;
    }

    function updateTimer(){
      let msg= _.prettyNumber(++_G.timerSecs,3);
      _G.timerText.text=`${msg}`;
      _G.timerStarted=true;
      if(!_G.gameOver)
        _.delay(1000, updateTimer);
    }

    function addBg(scene){
      let K=Mojo.getScaleFactor(),
          N=int(72 * K),
          N2=int(N/3);
      _S.repeatSprite("grass.png",true,true,Mojo.width,Mojo.height).forEach(s=>scene.insert(s));
    }

    _Z.defScene("Splash",function(){
      let verb = Mojo.touchDevice ? "Tap": "Click";
      let b,msg,K= Mojo.getScaleFactor();


      addBg(this);

      msg=_S.bitmapText(`Minesweeper`,
                        {fontName:"Big Shout Bob",
                         align:"center",
                         fontSize:120*K,fill:"white"});
      msg.tint=C_TITLE;

      _S.centerAnchor(msg);
      msg.x=Mojo.width/2;
      msg.y=Mojo.height*0.3;
      this.insert(msg);

      msg=_S.bitmapText(`${verb} to play!`,
                        {fontName:"NineteenOhFive",
                         align:"center",
                         fontSize:48*K,fill:"white"});
      msg.tint=_S.color("#ffffff");
      //in pixi, no fontSize, defaults to 26, left-align
      b=_I.makeButton(msg);
      b.m5.press= ()=> _Z.replaceScene(this,"MainMenu");
      _S.centerAnchor(b);
      b.x=Mojo.width/2;
      b.y=Mojo.height * 0.7;
      this.insert(b);
    });

    _Z.defScene("MainMenu", {
      setup(){
        let fz=64, fn="NineteenOhFive";
        let b1,b2,b3,gap,s,K=Mojo.getScaleFactor();
        //fn="unscii";
        s=_S.bitmapText("Easy",{fill:"#ffffff",
                                fontName:fn,
                                fontSize:fz*K,align:"center"});
        b1=_I.makeButton(_S.uuid(s,"#easy"));
        s=_S.bitmapText("Medium",{fill:"#ffffff",
                                  fontName:fn,
                                  fontSize:fz*K,align:"center"});
        b2=_I.makeButton(_S.uuid(s,"#medium"));
        s=_S.bitmapText("Hard",{fill:"#ffffff",
                                fontName:fn,
                                fontSize:fz*K,align:"center"});
        b3=_I.makeButton(_S.uuid(s,"#hard"));

        let pad,cb=(btn)=>{
          let mode, id = btn.m5.uuid;
          if(id == "#easy") mode=1;
          else if(id == "#medium") mode=2;
          else if(id == "#hard") mode=3;
          Mojo.u.dimXY= Mojo.u.levels[mode];
          _Z.replaceScene(this,"GamePlay", {});
        };

        b1.m5.press=cb;
        b2.m5.press=cb;
        b3.m5.press=cb;

        pad=int(b3.height);

        addBg(this);
        this.insert(_Z.layoutY([b1,b2,b3],{bg:"#cccccc",opacity:0.3,padding:pad}));
      }
    });

    _Z.defScene("EndGame",{
      setup(){
        let K=Mojo.getScaleFactor();
        let fz=36*K,fn="NineteenOhFive";
        let msg= (_G.lastWin > 0) ? "You win !":"You lose !";
        let space=()=>{
          let s=_S.bitmapText("I",{fontName:fn,fontSize:fz});
          s.alpha=0;
          return s;
        };
        let b1=_I.makeButton(_S.bitmapText("Play Again?",
                                           {fill:C_WHITE,
                                            fontName:fn,
                                            align:"center",fontSize:fz}));
        let b2=_I.makeButton(_S.bitmapText("Quit",
                                           {fill:C_WHITE,
                                            fontName:fn,
                                            align:"center",fontSize:fz}));

        let m1=_S.bitmapText("Game Over",{fill: C_WHITE,
                                          fontName:fn,
                                          align:"center",fontSize:fz});
        let m2=_S.bitmapText(msg,{fill: C_WHITE,
                                  fontName:fn,
                                  align:"center",fontSize:fz});
        let gap=_S.bitmapText("or",{fill:C_WHITE,
                                    fontName:fn,
                                    align:"center",fontSize:fz});
        b1.m5.press=()=>{ _Z.runSceneEx("MainMenu") };
        b2.m5.press=()=>{ _Z.runSceneEx("Splash") };
        Mojo.sound("game_over.wav").play();
        this.insert( _Z.layoutY([m1, m2, space(), space(), space(),b1, gap, b2],{bg:C_BG,opacity:1}));
      }
    });

    _Z.defScene("GamePlay",{
      setup(options){
        let s,w,h,bb,dim=Mojo.u.dimXY;
        addBg(this);
        _G.grid= _S.gridXY([dim[0],dim[1]],0.9,0.7,_G.arena={x:0,y:0});
        _G.gfx=_S.graphics();
        s=_G.grid[0][0];
        _G.CELLW=s.x2-s.x1;
        _G.CELLH=s.y2-s.y1;
        bb=_S.gridBBox(_G.arena.x,_G.arena.y,_G.grid);
        _S.drawGridLines(_G.arena.x, _G.arena.y,_G.grid,1,C_NUM,_G.gfx);
        _S.drawGridBox(bb,1,C_NUM,_G.gfx);
        _G.bg=_S.rect(_G.arena.width,_G.arena.height,false,C_NUM,1);
        _G.bg.x=_G.arena.x;
        _G.bg.y=_G.arena.y;
        this.insert(_G.bg);
        initLevel(this,dim[0],dim[1],dim[2]);
        this.insert(_G.gfx);
        initHud(this);
      },
      postUpdate(dt){
        let i=dt;
        dt=dt;
      }
    });

  }

  //9x9, 16x16,30x16
  const _$={
    assetFiles: ["clock.png","boom.ogg","expand.ogg","drop.ogg","game_over.wav","tiles.png","images/tiles.json"],
    XXassetFiles:["1.png","2.png","3.png","4.png","5.png","6.png","7.png","8.png","boom.ogg", "boom0.png","boom1.png","boom2.png","boom3.png","boom4.png","boom5.png","boom6.png", "grass.png","ground1.png","ground2.png","ground3.png","ground4.png","mine.png","rflag.png","box.png"],
    arena: {width: 920, height: 920},
    scaleToWindow:"max",
    scaleFit:"y",
    levels: {
      1: [9,9,10],
      2: [16,16,40],
      3: [30,16,99]
    },
    dimXY: null,
    //fps:30,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }
  };

  window.addEventListener("load",()=> MojoH5(_$));

})(this);

