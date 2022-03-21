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
    const TAIL={};
    function captureTail(s){
      let e= _.last(s);
      TAIL.row=e.g.row;
      TAIL.col=e.g.col;
      TAIL.x=e.x;
      TAIL.y=e.y;
      return TAIL;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
      cloneBody(scene){
        const mkOneCell=(row,col,x,y)=>{
          let s= _S.sprite("snake.png");
          _S.anchorXY(s,0.5);
          s.g.row=row;
          s.g.col=col;
          _S.scaleXY(s,this.scaleX, this.scaleY);
          s.x=x;
          s.y=y;
          return scene.insert(s);
        };
        if(this.growTime) captureTail(this.snake);
        for(let n,i=this.snake.length-1; i>0; --i){
          n=this.snake[i-1];
          this.snake[i].g.row=n.g.row;
          this.snake[i].g.col=n.g.col;
          this.snake[i].x=n.x;
          this.snake[i].y=n.y;
        }
        if(this.growTime){
          this.growTime=false;
          this.snake.push(mkOneCell(TAIL.row,TAIL.col,TAIL.x,TAIL.y));
          this.growSnake(scene);
        }
      },
      snakeEatItem(){
        let s= this.item, head=this.snake[0];
        if(s)
          return head.g.row==s.g.row && head.g.col==s.g.col;
      },
      snakeEatSelf(){
        for(let head=this.snake[0],t,i=1;i< this.snake.length;++i){
          t= this.snake[i];
          if(head.g.row==t.g.row &&
             head.g.col==t.g.col){
            _S.hide(t);
            return this.snakeBite=true;
          }
        }
      },
      snakeMoveRight(scene){
        let head=this.snake[0];
        if(head.g.col==this.COLS-1){
          head.m5.dead=true;
        }else{
          this.cloneBody(scene);
          head.g.col += 1;
          head.x += this.tileW;
          head.angle=0;
          this.snakeDir=Mojo.RIGHT;
        }
      },
      snakeMoveLeft(scene){
        let head=this.snake[0];
        if(head.g.col==0){
          head.m5.dead=true;
        }else{
          this.cloneBody(scene);
          head.g.col -= 1;
          head.x -= this.tileW;
          head.angle= 180;
          this.snakeDir=Mojo.LEFT;
        }
      },
      snakeMoveUp(scene){
        let head= this.snake[0];
        if(head.g.row==0){
          head.m5.dead=true;
        }else{
          this.cloneBody(scene);
          head.g.row -= 1;
          head.y -= this.tileH;
          head.angle=-90;
          this.snakeDir=Mojo.UP;
        }
      },
      snakeMoveDown(scene){
        let head= this.snake[0];
        if(head.g.row==_G.ROWS-1){
          head.m5.dead=true;
        }else{
          this.cloneBody(scene);
          head.g.row += 1;
          head.y += this.tileH;
          head.angle=90;
          this.snakeDir=Mojo.DOWN;
        }
      },
      Item(scene){
        let x=0,y=0,ok;
        while(!ok){
          x=_.randInt(this.COLS);
          y=_.randInt(this.ROWS);
          ok=true;
          for(let s,i=0;i<this.snake.length;++i){
            s=this.snake[i];
            if(s.g.row==y && s.g.col==x){
              ok=false;
              break;
            }
          }
        }
        let m=_S.sprite("apple_00.png"),
          g= this.grid[y][x],
          K=Mojo.scaleXY([m.width,m.height],
                         [this.tileW, this.tileH]);
        _S.scaleXY(m,K[0],K[1]);
        _V.set(m,g.x1,g.y1);
        m.g.row=y;
        m.g.col=x;
        return scene.insert(this.item=m);
      },
      growSnake(scene){
        scene.future(()=>{
          this.growTime=true;
        },Mojo.u.growthInterval);
      },
      Snake(scene,col,row){
        let o= _.fill(2,UNDEF),
          h= _S.sprite("head.png"),
          s= _S.sprite("snake.png"),
          K=Mojo.scaleXY([h.width,h.height],
                         [this.tileW, this.tileH]),
          dir=_.randItem([Mojo.UP,Mojo.LEFT,Mojo.DOWN,Mojo.RIGHT]);

        _S.anchorXY(h,0.5);
        _S.anchorXY(s,0.5);

        this.snakeMove={};
        this.snakeDir=dir;
        this.snake=o;
        this.scaleX=K[0];
        this.scaleY=K[1];
        this.snakeMove[Mojo.RIGHT]="snakeMoveRight";
        this.snakeMove[Mojo.DOWN]="snakeMoveDown";
        this.snakeMove[Mojo.LEFT]="snakeMoveLeft";
        this.snakeMove[Mojo.UP]="snakeMoveUp";

        //head
        _V.copy(h,_S.bboxCenter(this.grid[row][col]));
        _S.scaleXY(h,K[0],K[1]);
        h.g.row=row;
        h.g.col=col;
        scene.insert(o[0]=h);
        //tail
        dir==Mojo.RIGHT?(--col):dir==Mojo.LEFT?(++col):dir==Mojo.UP?(--row):dir==Mojo.DOWN?(++row):UNDEF;
        _V.copy(s,_S.bboxCenter(this.grid[row][col]));
        _S.scaleXY(s,K[0],K[1]);
        s.g.row=row;
        s.g.col=col;
        scene.insert(o[1]=s);
        //force growth for the rest of the snake
        for(let op=this.snakeMove[dir],i=2;i<Mojo.u.snakeLength;++i){
          this.growTime=true;
          this[op](scene);
        }
        this.growTime=false;
        return o;
      }
    });

  };

})(this);


