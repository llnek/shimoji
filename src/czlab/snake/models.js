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

  window["io.czlab.snake.models"]=function(Mojo){
    const {Sprites:_S,
           Game:_G,
           v2:_V,
           ute:_,is}=Mojo;

    /** @ignore */
    _G.snakeEatItem=function(){
      let s= _G.item;
      let head=_G.snake[0];
      if(s){
        if(head.g.row===s.g.row &&
           head.g.col===s.g.col)
          return true;
      }
      return false;
    }

    /** @ignore */
    _G.snakeEatSelf=function(){
      let s= _G.snake;
      let head=s[0];
      let z=s.length;
      for(let t,i=1;i<z;++i){
        t=s[i];
        if(head.g.row===t.g.row &&
          head.g.col===t.g.col){
          t.visible=false;
          return _G.snakeBite=true;
        }
      }
      return false;
    }

    /** @ignore */
    _G.snakeMoveRight=function(scene){
      let s= _G.snake;
      let head=s[0];
      let z=s.length;
      let last=z-1;
      if(head.g.col===_G.COLS-1){
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

    /** @ignore */
    _G.snakeMoveLeft=function(scene){
      let s= _G.snake;
      let head=s[0];
      let z=s.length;
      let last=z-1;
      if(head.g.col===0){
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

    /** @ignore */
    _G.snakeMoveUp=function(scene){
      let s= _G.snake;
      let head=s[0];
      let z=s.length;
      let last=z-1;
      if(head.g.row===0){
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

    /** @ignore */
    _G.snakeMoveDown=function(scene){
      let s= _G.snake;
      let head=s[0];
      let z=s.length;
      let last=z-1;
      if(head.g.row===_G.ROWS-1){
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

    /** @ignore */
    _G.growSnake=function(scene){
      let n=_G.snake.length;
      let last=_G.snake[n-1];
      let last2=_G.snake[n-2];
      let t= _S.sprite("snake.png");
      _S.centerAnchor(t);
      _S.scaleXY(t,_G.scaleX, _G.scaleY);
      if(last.g.col===last2.g.col){
        t.g.col=last.g.col;
        if(last2.g.row>last.g.row){
          //grow up
          t.g.row=last.g.row-1;
        }else{
          //grow down
          t.g.row=last.g.row+1;
        }
      }
      else
      if(last.g.row===last2.g.row){
        t.g.row=last.g.row;
        if(last2.g.col>last.g.col){
          //grow left
          t.g.col=last.g.col-1;
        }else{
          //grow right
          t.g.col=last.g.col+1;
        }
      }
      let g=_G.grid[t.g.row][t.g.col];
      let ok=true;
      if(t.g.row<0||t.g.col<0||
         t.g.row>=_G.ROWS||t.g.col>=_G.COLS){
        _G.snake[0].m5.dead=true;
        _.clear(_G.timerid);
        _G.timerid=-1;
        ok=false;
      }else{
        _V.copy(t,_S.bboxCenter(g));
        scene.insert(t);
        _G.snake.push(t);
      }
      return ok;
    };

    /** @ignore */
    _G.Item=function(scene){
      let x=0,y=0,ok;
      while(true){
        x=_.randInt(_G.COLS);
        y=_.randInt(_G.ROWS);
        ok=true;
        for(let s,i=0;i<_G.snake.length;++i){
          s=_G.snake[i];
          if(s.g.row===y && s.g.col===x){
            ok=false;
            break;
          }
        }
        if(ok){break}
      }
      let m=_S.sprite("apple_00.png");
      let K=Mojo.scaleXY([m.width,m.height],
                         [_G.tileW, _G.tileH]);
      let g= _G.grid[y][x];
      _S.scaleXY(m,K[0],K[1]);
      _V.set(m,g.x1,g.y1);
      m.g.row=y;
      m.g.col=x;
      scene.insert(_G.item=m);
    };

    /** @ignore */
    _G.Snake=function(scene,col,row,dir=Mojo.RIGHT){
      let o= _G.snake=[null,null];
      let h= _S.sprite("head.png");
      let s= _S.sprite("snake.png");
      let K=Mojo.scaleXY([h.width,h.height],
                         [_G.tileW, _G.tileH]);
      let g= _G.grid[row][col];

      _S.centerAnchor(h);
      _S.centerAnchor(s);

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

