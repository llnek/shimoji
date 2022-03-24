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
  function scenes(Mojo){
    const int=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:_G,
           math:_M,
           v2:_V,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TITLE_FONT="Big Shout Bob",
      UI_FONT="Doki Lowercase",
      C_TITLE=_S.color("#fff20f"),
      C_BG=_S.color("#169706"),
      C_TEXT=_S.color("#fff20f"),
      C_GREEN=_S.color("#7da633"),
      C_ORANGE=_S.color("#f4d52b");

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    // Replace a character at index in a string
    function replaceAt(str, index, replacement) {
      if(index > str.length - 1) { return str }
      return str.substr(0, index) + replacement + str.substr(index + 1);
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function stringVal(str, index) {
	    // Get the number value at a specific index in a string (0 or 1)
	    return parseInt(str.charAt(index), 10);
    }

    class Maze{
      /**
       * @param {number} rows
       * @param {number} cols
       * @param {string} entryType "D"|"H"|"V"
      */
      constructor(rows,cols,entryType="D", options={}){
        let {bias,removeWalls,maxWallsRemove} = options;
        this.bias= bias || "";
        this.removeWalls= removeWalls || 0;
        // Maximum 300 walls can be removed
        this.maxWallsRemove= maxWallsRemove || 300;
        this.ROWS=rows;
        this.COLS=cols;
        this.matrix = [];
        this.entryNodes = this.getEntryNodes(entryType);
      }
      generate(){
        this.getMatrix(this.parseMaze(this.genNodes()));
        this.removeMazeWalls();
        return this.matrix;
      }
      genNodes(){
        //[visited, nswe]
        return _.fill(this.COLS*this.ROWS, ()=> "01111")
      }
      parseMaze(nodes){
        const positionIndex = { 'n': 1, 's': 2, 'w': 3, 'e': 4, };
        const oppositeIndex = { 'n': 2, 's': 1, 'w': 4, 'e': 3 };
        let max = 0,
          visited = 0,
          moveNodes = [],
          biasCount = 0,
          biasFactor = 3,
          last=nodes.length-1,
          pos= _.randInt(nodes.length);
        if(this.bias){
          if("H" == this.bias){
            biasFactor = (1 <= (this.COLS/100)) ? _M.ndiv(this.COLS,100) + 2 : 3
          }else if("V" == this.bias){
            biasFactor = (1 <= (this.ROWS/100)) ? _M.ndiv(this.ROWS,100) + 2 : 3
          }
        }
        // Set start node visited.
        nodes[pos] = replaceAt(nodes[pos], 0, 1);
        let next,dir,dirs;
        while(visited < last){
          ++biasCount;
          ++max;
          next = this.getNeighbours(pos);
          dirs = Object.keys(next).filter(function(key) {
            return (-1 != next[key]) && !stringVal(this[next[key]], 0);
          }, nodes);
          if(this.bias && (biasCount != biasFactor)){
            dirs = this.biasDirections(dirs);
          }else{
            biasCount = 0;
          }
          if(dirs.length){
            ++visited;
            if(dirs.length>1)
              moveNodes.push(pos);
            dir= dirs[_.randInt(dirs.length)];
            // Update current position
            nodes[pos] = replaceAt(nodes[pos], positionIndex[dir], 0);
            // Set new position
            pos = next[dir];
            // Update next position
            nodes[pos] = replaceAt(nodes[pos], oppositeIndex[dir], 0);
            nodes[pos] = replaceAt(nodes[pos], 0, 1);
          }else{
            if(!moveNodes.length){ break }
            pos= moveNodes.pop();
          }
        }
        return nodes;
      }
      getMatrix(nodes){
        // Add the complete maze in a matrix where 1 is a wall and 0 is a corridor.
        let row1="",
          row2="",
          N = this.COLS* this.ROWS;
        if(nodes.length != N){ return }
        for(let i = 0; i < N; ++i){
          row1 += row1.length==0 ? "1" : "";
          row2 += row2.length==0 ? "1" : "";
          if(stringVal(nodes[i], 1)){
            row1 += "11";
            if(stringVal(nodes[i], 4)){
              row2 += "01";
            }else{
              row2 += "00";
            }
          }else{
            let hasAbove = nodes.hasOwnProperty(i - this.COLS);
            let above = hasAbove && stringVal(nodes[i - this.COLS], 4);
            let hasNext = nodes.hasOwnProperty(i+1);
            let next = hasNext && stringVal(nodes[i+1], 1);
            if(stringVal(nodes[i], 4)){
              row1 += "01";
              row2 += "01";
            }else if(next || above){
              row1 += "01";
              row2 += "00";
            }else{
              row1 += "00";
              row2 += "00";
            }
          }
          if((i+1) % this.COLS==0){
            this.matrix.push(row1,row2);
            row1 = "";
            row2 = "";
          }
        }
        // Add closing row
        this.matrix.push("1".repeat((this.COLS * 2) + 1));
      }
      getEntryNodes(access){
        let entryNodes = {},
          y = ((this.ROWS * 2) + 1) - 2,
          x = ((this.COLS * 2) + 1) - 2;
        if("D" == access){
          entryNodes.start = { x: 1, y: 1, gate: { x: 0, y: 1 } };
          entryNodes.end = { x: x, y: y, gate: { x: x + 1, y: y } };
        }
        if("H" == access || "V" == access){
          let xy = ("H" == access) ? y : x;
          xy = ((xy - 1) / 2);
          let even = xy % 2 == 0;
          xy = even ? xy + 1 : xy;
          let start_x = ("H" == access) ? 1 : xy;
          let start_y = ("H" == access) ? xy : 1;
          let end_x = ("H" == access) ? x : (even ? start_x : start_x + 2);
          let end_y = ("H" == access) ? (even ? start_y : start_y + 2) : y;
          let startgate = ("H" == access) ? { x: 0, y: start_y } : { x: start_x, y: 0 };
          let endgate = ("H" == access) ? { x: x + 1, y: end_y } : { x: end_x, y: y + 1 };
          entryNodes.start = { x: start_x, y: start_y, gate: startgate };
          entryNodes.end = { x: end_x, y: end_y, gate: endgate };
        }
        return entryNodes;
      }
      biasDirections(dirs){
        let horizontal = dirs.indexOf("w") != -1 || dirs.indexOf("e") != -1,
          vertical = dirs.indexOf("n") != -1 || dirs.indexOf("s") != -1;
        if("H" == this.bias && horizontal){
          dirs = dirs.filter(key=> "w" == key || "e" == key);
        }else if("V" == this.bias && vertical){
          dirs = dirs.filter(key=> "n" == key || "s" == key);
        }
        return dirs;
      }
      getNeighbours(pos){
        return {
          w: (pos>0 && (pos % this.COLS) != 0) ? pos-1 : -1,
          e: ((pos+1) % this.COLS) != 0 ? pos+1 : -1,
          n: (pos - this.COLS)>=0 ? pos - this.COLS : -1,
          s: ((this.COLS* this.ROWS) > (pos + this.COLS)) ? pos + this.COLS : -1
        }
      }
      removeWall(row, index){
        // Remove wall if possible.
        const evenRow = row % 2 == 0,
          evenIndex = index % 2 == 0,
          wall = stringVal(this.matrix[row], index);
        if(!wall){ return false }
        if(!evenRow && evenIndex){
          // Uneven row and even column
          const hasTop = (row-2 > 0) && (1 == stringVal(this.matrix[row-2], index));
          const hasBottom = (row + 2 < this.matrix.length) && (1 == stringVal(this.matrix[row + 2], index));
          if(hasTop && hasBottom){
            this.matrix[row] = replaceAt(this.matrix[row], index, "0");
            return true;
          }
          if(!hasTop && hasBottom){
            const left = 1 == stringVal(this.matrix[row - 1], index - 1);
            const right = 1 == stringVal(this.matrix[row - 1], index + 1);
            if (left || right) {
              this.matrix[row] = replaceAt(this.matrix[row], index, "0");
              return true;
            }
          }else if(!hasBottom && hasTop){
            const left = 1 == stringVal(this.matrix[row + 1], index - 1);
            const right = 1 == stringVal(this.matrix[row + 1], index + 1);
            if (left || right) {
              this.matrix[row] = replaceAt(this.matrix[row], index, "0");
              return true;
            }
          }
        }else if(evenRow && !evenIndex){
          // Even row and uneven column
          const hasLeft = 1 == stringVal(this.matrix[row], index - 2);
          const hasRight = 1 == stringVal(this.matrix[row], index + 2);
          if(hasLeft && hasRight){
            this.matrix[row] = replaceAt(this.matrix[row], index, "0");
            return true;
          }
          if(!hasLeft && hasRight){
            const top = 1 == stringVal(this.matrix[row - 1], index - 1);
            const bottom = 1 == stringVal(this.matrix[row + 1], index - 1);
            if(top || bottom){
              this.matrix[row] = replaceAt(this.matrix[row], index, "0");
              return true;
            }
          }else if(!hasRight && hasLeft){
            const top = 1 == stringVal(this.matrix[row - 1], index + 1);
            const bottom = 1 == stringVal(this.matrix[row + 1], index + 1);
            if(top || bottom){
              this.matrix[row] = replaceAt(this.matrix[row], index, "0");
              return true;
            }
          }
        }
      }
      removeMazeWalls(){
        if(!this.removeWalls || !this.matrix.length){ return }
        let min = 1,
          tries = 0,
          max = this.matrix.length - 1,
          row,walls, maxTries = this.maxWallsRemove;
        while(tries < maxTries){
          ++tries;
          // Did we reached the goal
          if(this.wallsRemoved >= this.removeWalls){ break }
          // Get random row from matrix
          let y = int(_.rand() * (max - min + 1)) + min;
          y = (y == max) ? y - 1 : y;
          walls = [];
          row = this.matrix[y];
          // Get walls from random row
          for(let w,i = 0; i < row.length; i++){
            if(i == 0 || i == row.length - 1){ continue }
            if( stringVal(row, i)) walls.push(i);
          }
          // Shuffle walls randomly
          _.shuffle(walls);
          // Try breaking a wall for this row.
          for(let i = 0; i < walls.length; i++){
            if(this.removeWall(y, walls[i])){
              // Wall can be broken
              ++this.wallsRemoved;
              break;
            }
          }
        }
      }
      draw(){
        /*
        if(!this.isValidSize()){
          this.matrix = [];
          _.assert(false,'Please use smaller maze dimensions');
        }
        canvas.width = ((this.width * 2) + 1) * this.wallSize;;
        canvas.height = ((this.height * 2) + 1) * this.wallSize;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Add background
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Set maze collor
        ctx.fillStyle = this.color;
        const row_count = this.matrix.length;
        const gateEntry = getEntryNode(this.entryNodes, 'start', true);
        const gateExit = getEntryNode(this.entryNodes, 'end', true);
        for(let i = 0; i < row_count; i++){
          let row_length = this.matrix[i].length;
          for(let j = 0; j < row_length; j++){
            if(gateEntry && gateExit){
              if ((j === gateEntry.x) && (i === gateEntry.y)) {
                continue;
              }
              if ((j === gateExit.x) && (i === gateExit.y)) {
                continue;
              }
            }
            let pixel = parseInt(this.matrix[i].charAt(j), 10);
            if(pixel)
              ctx.fillRect((j * this.wallSize), (i * this.wallSize), this.wallSize, this.wallSize);
          }
        }
        */
      }
    }


    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      setup(){
        let self=this,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          initLevel(){
            let verb= Mojo.touchDevice?"Tap":"Click",
              s=_S.bmpText(`${verb} to generate maze`,UI_FONT,36*K);
            function cb(){
              _I.off(["single.tap"],cb);
              _S.remove(s);
              _.delay(0,()=> self.g.genMaze());
            }
            _V.set(s,Mojo.width/2,Mojo.height/2);
            self.insert(_S.anchorXY(s,0.5));
            _I.on(["single.tap"],cb);
          },
          genMaze(){
            let m= new Maze(20,20),
              mmap=m.generate(),
              h=mmap.length,
              g,gfx,out={}, w=mmap[0].length;
            _.assert(h==w,"bad maze matrix");
            g=_S.gridSQ(w,0.8,out);
            gfx=_S.drawGridLines(0,0,g,1,"grey");
            self.insert(gfx);
            self.insert(_S.bboxFrame(out));
            const gateEntry = m.entryNodes.start.gate;
            const gateExit = m.entryNodes.end.gate;
            g.forEach((row,y)=> row.forEach((col,x)=>{
              let skip;
              if(gateEntry && gateExit){
                if(((x == gateEntry.x) && (y == gateEntry.y)) ||
                   ((x == gateExit.x) && (y == gateExit.y))){
                  skip=true;
                }
              }
              let v= mmap[y].charAt(x)==1 ? 1 :0;
              let c=v==1?"black":"white";
              if(skip) {
                c="white";
                v=0;
              }
              let s= _S.rect(col.x2-col.x1,col.y2-col.y1,c);
              s.x=col.x1;
              s.y=col.y1;
              self.insert(s);
              col.sprite=s;
              col.value=v;
            }));
            _.inject(_G,{
              grid:g,
              maze:m
            });
          }
        });
        this.g.initLevel();
      },
      postUpdate(dt){

        dt=dt;
        //console.log("ppp");


      }
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: [],
      arena: {width:1680,height:1050},
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.run("PlayGame");
      }
    });
  });

})(this);


