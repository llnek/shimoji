;(function(window){
  "use strict";

  window["io.czlab.snake.models"]=function(Mojo){
    let _S=Mojo.Sprites;
    let _G=Mojo.Game;

    _G.snakeMoveRight=function(scene){
      let s= _G.snake;
      let head=_G.snake[0];
      let z=_G.snake.length;
      let last=z-1;
      for(let n,i=last;i>0;--i){
        n=s[i-1];
        s[i].mojoh5.row=n.mojoh5.row;
        s[i].mojoh5.col=n.mojoh5.col;
        s[i].x=n.x;
        s[i].y=n.y;
      }
      head.mojoh5.col += 1;
      head.x= head.x + _G.tileX;
      _G.snakeDir=Mojo.RIGHT;
    };

    _G.snakeMoveLeft=function(scene){
      let s= _G.snake;
      let head=_G.snake[0];
      let z=_G.snake.length;
      let last=z-1;
      for(let n,i=last;i>0;--i){
        n=s[i-1];
        s[i].mojoh5.row=n.mojoh5.row;
        s[i].mojoh5.col=n.mojoh5.col;
        s[i].x=n.x;
        s[i].y=n.y;
      }
      head.mojoh5.col -= 1;
      head.x= head.x - _G.tileX;
      _G.snakeDir=Mojo.LEFT;
    };

    _G.snakeMoveUp=function(scene){
      let s= _G.snake;
      let head=_G.snake[0];
      let z=_G.snake.length;
      let last=z-1;
      for(let n,i=last;i>0;--i){
        n=s[i-1];
        s[i].mojoh5.row=n.mojoh5.row;
        s[i].mojoh5.col=n.mojoh5.col;
        s[i].x=n.x;
        s[i].y=n.y;
      }
      head.mojoh5.row -= 1;
      head.y= head.y - _G.tileY;
      _G.snakeDir=Mojo.UP;
    };

    _G.snakeMoveDown=function(scene){
      let s= _G.snake;
      let head=_G.snake[0];
      let z=_G.snake.length;
      let last=z-1;
      for(let n,i=last;i>0;--i){
        n=s[i-1];
        s[i].mojoh5.row=n.mojoh5.row;
        s[i].mojoh5.col=n.mojoh5.col;
        s[i].x=n.x;
        s[i].y=n.y;
      }
      head.mojoh5.row += 1;
      head.y= head.y + _G.tileY;
      _G.snakeDir=Mojo.DOWN;
    };

    _G.growSnake=function(scene){
      let n=_G.snake.length;
      let last=_G.snake[n-1];
      let last2=_G.snake[n-2];
      let t= _S.sprite("snake.png");
      t.scale.x=_G.scaleX;
      t.scale.y=_G.scaleY;
      scene.insert(t);

      if(last.mojoh5.col===last2.mojoh5.col){
        t.mojoh5.col=last.mojoh5.col;
        if(last2.mojoh5.row>last.mojoh5.row){
          //grow up
          t.mojoh5.row=last.mojoh5.row-1;
        }else{
          //grow down
          t.mojoh5.row=last.mojoh5.row+1;
        }
      }
      else
      if(last.mojoh5.row===last2.mojoh5.row){
        t.mojoh5.row=last.mojoh5.row;
        if(last2.mojoh5.col>last.mojoh5.col){
          //grow left
          t.mojoh5.col=last.mojoh5.col-1;
        }else{
          //grow right
          t.mojoh5.col=last.mojoh5.col+1;
        }
      }
      let g=_G.grid[t.mojoh5.row][t.mojoh5.col];
      t.x=g.x1;
      t.y=g.y1;
      _G.snake.push(t);
    };

    _G.Snake=function(scene,row,col,dir=Mojo.RIGHT){
      let o= _G.snake=[null,null];
      let h= _S.sprite("head.png");
      let s= _S.sprite("snake.png");
      let K=Mojo.scaleXY([h.width,h.height],[_G.tileX, _G.tileY]);

      let g= _G.grid[row][col];
      _G.snakeDir=dir;
      _G.scaleX=K[0];
      _G.scaleY=K[1];

      o[0]=h;
      h.scale.x=K[0];
      h.scale.y=K[1];
      h.x=g.x1;
      h.y=g.y1;
      h.mojoh5.row=row;
      h.mojoh5.col=col;
      scene.insert(h);

      switch(dir){
        case Mojo.RIGHT:
          --col;
          //g= _G.grid[row][col-1];
          break;
        case Mojo.LEFT:
          ++col;
          //g=_G.grid[row][col+1];
          break;
        case Mojo.UP:
          --row;
          //g=_G.grid[row-1][col];
          break;
        case Mojo.DOWN:
          ++row;
          //g=_G.grid[row+1][col];
          break;
      }
      g=_G.grid[row][col];
      o[1]=s;
      s.mojoh5.row=row;
      s.mojoh5.col=col;
      s.scale.x=K[0];
      s.scale.y=K[1];
      s.x=g.x1;
      s.y=g.y1;
      scene.insert(s);

      for(let i=2;i<8;++i)
        _G.growSnake(scene);

      return o;
    };

  };

})(this);
