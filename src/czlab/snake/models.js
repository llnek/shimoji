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

;(function(window,UNDEF){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  window["io.czlab.snake.models"]=function(Mojo){
    const {Sprites:_S,
           Game:_G,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _G.snakeEatItem=function(){
      let head, s= _G.item;
      if(s){
        head=_G.snake[0];
        return head.g.row==s.g.row && head.g.col==s.g.col;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _G.snakeEatSelf=function(){
      let s= _G.snake;
      for(let head=s[0],t,i=1;i<s.length;++i){
        t=s[i];
        if(head.g.row==t.g.row &&
           head.g.col==t.g.col){
          _S.hide(t);
          return _G.snakeBite=true;
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _G.snakeMoveRight=function(scene){
      let s= _G.snake,
        head=s[0], last=s.length-1;
      if(head.g.col==_G.COLS-1){
        head.m5.dead=true;
        return false;
      }
      for(let n,i=last;i>0;--i){
        n=s[i-1];
        s[i].g.row=n.g.row;
        s[i].g.col=n.g.col;
        s[i].x=n.x;
        s[i].y=n.y;
      }
      head.g.col += 1;
      head.x += _G.tileW;
      head.angle=0;
      return _G.snakeDir=Mojo.RIGHT;
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _G.snakeMoveLeft=function(scene){
      let s= _G.snake,
        head=s[0], last=s.length-1;
      if(head.g.col==0){
        head.m5.dead=true;
        return false;
      }
      for(let n,i=last;i>0;--i){
        n=s[i-1];
        s[i].g.row=n.g.row;
        s[i].g.col=n.g.col;
        s[i].x=n.x;
        s[i].y=n.y;
      }
      head.g.col -= 1;
      head.x -= _G.tileW;
      head.angle= 180;
      return _G.snakeDir=Mojo.LEFT;
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _G.snakeMoveUp=function(scene){
      let s= _G.snake,
        head=s[0], last=s.length-1;
      if(head.g.row==0){
        head.m5.dead=true;
        return false;
      }
      for(let n,i=last;i>0;--i){
        n=s[i-1];
        s[i].g.row=n.g.row;
        s[i].g.col=n.g.col;
        s[i].x=n.x;
        s[i].y=n.y;
      }
      head.g.row -= 1;
      head.y -= _G.tileH;
      head.angle=-90;
      return _G.snakeDir=Mojo.UP;
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _G.snakeMoveDown=function(scene){
      let s= _G.snake,
        head=s[0], last=s.length-1;
      if(head.g.row==_G.ROWS-1){
        head.m5.dead=true;
        return false;
      }
      for(let n,i=last;i>0;--i){
        n=s[i-1];
        s[i].g.row=n.g.row;
        s[i].g.col=n.g.col;
        s[i].x=n.x;
        s[i].y=n.y;
      }
      head.g.row += 1;
      head.y += _G.tileH;
      head.angle=90;
      return _G.snakeDir=Mojo.DOWN;
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _G.growSnake=function(scene){
      let n=_G.snake.length,
        last=_G.snake[n-1],
        last2=_G.snake[n-2],
        g,t, col=last.g.col, row=last.g.row;
      if(last.g.col==last2.g.col){
        //-1 grow up 1 down
        row += (last2.g.row>last.g.row?-1:1)
      }else if(last.g.row==last2.g.row){
        //-1 grow left 1 right
        col += (last2.g.col>last.g.col?-1:1)
      }
      if(row<0||col<0|| row>=_G.ROWS||col>=_G.COLS){
        _G.snake[0].m5.dead=true;
        _.clear(_G.timerid);
        _G.timerid=UNDEF;
      }else{
        t= _S.sprite("snake.png");
        t.g.row=row;
        t.g.col=col;
        _S.anchorXY(t,0.5);
        _S.scaleXY(t,_G.scaleX, _G.scaleY);
        g=_G.grid[t.g.row][t.g.col];
        _V.copy(t,_S.bboxCenter(g));
        _G.snake.push( scene.insert(t));
      }
      return !!t;
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _G.Item=function(scene){
      let x=0,y=0,ok;
      while(!ok){
        x=_.randInt(_G.COLS);
        y=_.randInt(_G.ROWS);
        ok=true;
        for(let s,i=0;i<_G.snake.length;++i){
          s=_G.snake[i];
          if(s.g.row==y && s.g.col==x){
            ok=false;
            break;
          }
        }
      }
      let m=_S.sprite("apple_00.png"),
        g= _G.grid[y][x],
        K=Mojo.scaleXY([m.width,m.height],
                       [_G.tileW, _G.tileH]);
      _S.scaleXY(m,K[0],K[1]);
      _V.set(m,g.x1,g.y1);
      m.g.row=y;
      m.g.col=x;
      return scene.insert(_G.item=m);
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _G.Snake=function(scene,col,row,dir=Mojo.RIGHT){
      let o= _G.snake=_.fill(2,UNDEF),
        h= _S.sprite("head.png"),
        s= _S.sprite("snake.png"),
        g= _G.grid[row][col],
        K=Mojo.scaleXY([h.width,h.height],
                       [_G.tileW, _G.tileH]);

      _S.anchorXY(h,0.5);
      _S.anchorXY(s,0.5);

      _G.snakeDir=dir;
      _G.scaleX=K[0];
      _G.scaleY=K[1];

      o[0]=h;
      _S.scaleXY(h,K[0],K[1]);
      _V.copy(h,_S.bboxCenter(g));
      h.g.row=row;
      h.g.col=col;
      scene.insert(h);

      switch(dir){
        case Mojo.RIGHT:
          --col;
          break;
        case Mojo.LEFT:
          ++col;
          break;
        case Mojo.UP:
          --row;
          break;
        case Mojo.DOWN:
          ++row;
          break;
      }
      g=_G.grid[row][col];
      o[1]=s;
      s.g.row=row;
      s.g.col=col;
      _S.scaleXY(s,K[0],K[1]);
      _V.copy(s,_S.bboxCenter(g));
      scene.insert(s);

      //grow the rest of the snake
      for(let i=2;i<Mojo.u.snakeLength;++i){
        _G.growSnake(scene)
      }

      return o;
    };

  };

})(this);

