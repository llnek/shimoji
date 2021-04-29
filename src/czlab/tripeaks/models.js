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

;(function(global){

  global["io/czlab/tripeaks/models"]=function(Mojo){
    const SYMBOLS = "?A23456789TJQK";
    const MAX_VALUE = 13;
    const MIN_VALUE = 1;
    const DIAMONDS=1;
    const CLUBS=2;
    const HEARTS=3;
    const SPADES=4;
    const JOKER=5;
    const MFL=Math.floor;
    const {Sprites:_S,
           Input:_I,
           Game:_G,
           ute:_,is}=Mojo;

    const SUITS = [DIAMONDS, CLUBS, HEARTS, SPADES];
    const CARD_SUITS=(function(obj){
      obj[DIAMONDS]="Diamonds";
      obj[CLUBS]="Clubs";
      obj[HEARTS]="Hearts";
      obj[SPADES]="Spades";
      return obj;
    })({});

    /** @ignore */
    function flipExposed(){
      _G.model.getExposed().forEach(c=>{
        if(c){
          c.m5.showFrame(1);
          _I.makeDrag(c);
        }
      });
    }

    /** @ignore */
    function dropDrawCard(c){
      Mojo.emit(["flip.draw",c.parent]); }

    /** @ignore */
    function dropCard(c){
      let {row,col}=c.g;
      _S.remove(c);
      _G.model.delCardAt(row,col); }

    /** @ignore */
    function _checkDropped(s){
      let found,
          es=_G.model.getExposed(),
          dc=_G.model.getDrawCard();
      es.push(dc);
      for(let c,i=0;i<es.length;++i){
        c=es[i];
        if(s !== c &&
           Mojo.mouse.hitTest(c) &&
           _G.model.checkRules(s,c)){
          found=c;
          break;
        }
      }
      if(found){
        _G.score += s.g.value+ found.g.value;
        if(found===dc){
          dropDrawCard(dc);
          dropCard(s);
        }else if(s===dc){
          dropDrawCard(dc);
          dropCard(found);
        }else{
          dropCard(found);
          dropCard(s);
        }
        flipExposed();
      }else{
        //move card back
        s.x=s.g.x;
        s.y=s.g.y;
      }
    }

    /** Create a card */
    function Card(suit,value){
      _.assert(value >= MIN_VALUE &&
               value <= MAX_VALUE, `Bad Value ${value}`);
      const symbol = value===10?"10":SYMBOLS[value];
      let K=Mojo.getScaleFactor();
      const cs=CARD_SUITS[suit];
      const s= _S.spriteFrom(`${Mojo.u.stockPile}.png`,`card${cs}${symbol}.png`);
      //scale the card,make it nice and even
      if(!_G.iconSize){
        let w,h;
        _S.scaleXY(s,K,K);
        w=MFL(s.width);
        h=MFL(s.height);
        if(!_.isEven(w))--w;
        if(!_.isEven(h))--h;
        _G.iconSize=[w,h];
      }
      s.g.value=value;
      s.g.suit=suit;
      s.g.symbol=symbol;
      s.height=_G.iconSize[1];
      s.width=_G.iconSize[0];
      s.m5.onDragDropped=()=>{
        _checkDropped(s)
      };
      return s;
    }

    /** @ignore */
    Card.getSingleDeckSize=function(){
      return 4 * MAX_VALUE
    }

    /** @class */
    class PyramidSolitaire{
      constructor(scene,numPeaks){
        this.numPeaks=numPeaks;
        this.scene=scene;
        // for draw cards
        this.stockPile=[];
        this.drawer=null;
        // for the game board
        this.board=[];//[][]
        this.boardWidths=[];//ints
      }
      /**
       * Initial internal data structures for the model.
       * @param deck
       * @param numRows
       */
      _initBoard(deck, numRows){
        this._allocateModel(numRows, numRows*this.numPeaks);
        const overlap= MFL(Math.ceil(numRows * 0.5));
        const shift= numRows-overlap;
        const lastPeak=this.numPeaks-1;
        let left= 0;
        for(let p=0; p < this.numPeaks; ++p){
          if(p>0){ left += shift }
          this._initPeak(left,numRows,deck,p===lastPeak); } }
      /** @ignore */
      getCards(row){
        if(this.validRow(row)) return this.board[row] }
      /** @ignore */
      setDrawCard(c=null){ this.drawer= c }
      /** @ignore */
      getDrawCard(){
        return this.drawer }
      /** @ignore */
      setRowWidth(row, w){
        this.boardWidths[row]=w }
      /** @ignore */
      _allocateModel(rows, cols){
        this.board=[];
        this.boardWidths= _.fill(rows,0);
        for(let r=0;r<rows;++r)
          this.board[r]=_.fill(cols,null); }
      /** @ignore */
      checkCoord(row, card){
        return this.validRow(row) && this.validCol(card) }
      /** @ignore */
      validCol(c){
        return this.board &&
               this.board[0] &&
               c >= 0 && c < this.board[0].length }
      /** @ignore */
      validRow(r){
        return this.board && r >= 0 && r < this.board.length }
      /** @ignore */
      lastRowIndex(){
        return this.board ? this.board.length-1 : -1 }
      /** @ignore */
      getRowWidth(row){
        return (this.boardWidths && this.validRow(row)) ? this.boardWidths[row] : -1 }
      /** @ignore */
      assertState(cond, msg){ _.assert(cond,msg) }
      /** @ignore */
      assertArg(cond, msg){ _.assert(cond,msg) }
      /** @ignore */
      getCardSet(){ return new Set(getSingleDeck()) }
      /** @ignore */
      checkRule2(a, b){
        return a && b && (a.g.value + b.g.value) === MAX_VALUE }
      /** @ignore */
      checkRule1(a){
        return a && a.g.value === MAX_VALUE }
      /** @ignore */
      checkRules(a,b){
        //2 kings or a+b=13
        return (a.g.value + b.g.value) === MAX_VALUE ||
               (a.g.value===b.g.value && a.g.value===MAX_VALUE) }
      /** @ignore */
      delCardAt(row, card){
        if(this.board)
          this.board[row][card] = null }
      /** @ignore */
      setCardAt(row, card, c){
        if(this.board){
          c.g.row=row;
          c.g.col=card;
          this.board[row][card] = c } }
      /** @ignore */
      getSingleDeck(){
        const deck = [];
        SUITS.forEach(k=>{
          for(let i=MIN_VALUE;
              i<=MAX_VALUE; ++i) deck.push(Card(k, i)) });
        return deck;
      }
      /** @ignore */
      _initPeak(left, size, input, calcRowWidth){
        for(let rmost,i=0; i<size; ++i){
          rmost=left+i;
          for(let c,j=left; j<=rmost; ++j){
            c=this.getCardAt(i,j);
            if(c){continue} // card overlapped
            if(input.length>0)c=input.shift();
            this.assertArg(c, "invalid deck");
            this.setCardAt(i,j, c); }
          if(calcRowWidth)
            this.setRowWidth(i, rmost+1); } }
      /** @ignore */
      startGame(deck1, numRows=7, numDraw=1){
        this.assertArg(numRows >= 0, "Rows in pyramid < 0.");
        this.assertArg(numDraw >= 0, "Draw cards < 0.");
        this.assertArg(deck1, "Deck is null.");
        let deck=_.shuffle(deck1);
        let orig= deck.length;
        //remains goes to the stockPile
        this._initBoard(deck, numRows);
        this.drawer = null;
        this.stockPile = deck;
        _.log(`using ${orig-deck.length} cards for the peaks`);
        //initialize draw card
        if(this.stockPile.length>0)
          this.setDrawCard(this.stockPile.shift()); }
      /** @ignore */
      isPeakEmpty(){
        for(let r,i=0; i<this.getNumRows(); ++i){
          r=this.getCards(i);
          for(let j=0; j<r.length; ++j)
            if(r[j])
              return false
        }
        return true;
      }
      /** @ignore */
      isCardExposed(row, card){
        if(this.checkCoord(row,card) &&
           this.someCardAt(row,card)){
          let below = row + 1;
          let left = card;
          let right = card + 1;
          //last row is always exposed, quick exit
          return row === this.lastRowIndex() ||
                 (this.checkCoord(below,right) &&
                  this.noCardAt(below,left) && this.noCardAt(below,right)); }
        return false;
      }
      /** @ignore */
      discardDraw(){
        this.drawer=null;
        if(this.stockPile.length>0)
          this.setDrawCard(this.stockPile.shift());
        return this.drawer;
      }
      /** @ignore */
      getNumRows(){
        // how many rows in the pyramid
        return !this.board ? -1 : this.board.length }
      /** @ignore */
      getNumDraw(){ return 1 }
      /** @ignore */
      isGameOver(){
        this.assertState(this.board, "Game is not running.");
        // game is over if all cards are gone in the pyramid, or
        // game can't continue - stuck
        return this.isPeakEmpty() || this.isGameStuck() }
      /** @ignore */
      getExposed(){
        let remains = [];
        for(let r,i=0; i<this.getNumRows(); ++i){
          r = this.getCards(i);
          for(let j=0; j<r.length; ++j)
            if(this.isCardExposed(i, j))
              remains.push(r[j]);
        }
        return remains;
      }
      /** @ignore */
      isPileEmpty(){
        return this.stockPile.length===0 }
      /** @ignore */
      isGameStuck(){
        // if stockPile is not empty, then game can always continue
        if(this.stockPile.length>0){ return false }
        // get all exposed cards and then check them
        let c,remains=this.getExposed();
        if(remains.length===0){
          // note: this should never happen actually
          // no cards to play with, can't continue
          return true;
        }
        // collect all cards and see any valid combos
        c=this.getDrawCard();
        if(c)remains.push(c);
        for(let ci,i=0; i<remains.length; ++i){
          ci = remains[i];
          for(let cj,j = i+1; j<remains.length; ++j){
            cj = remains[j];
            if(this.checkRules(ci, cj)){
              // combo found, so not stuck
              return false;
            }
          }
        }
        return true;
      }
      /** @ignore */
      someCardAt(row, card){
        return !!this.getCardAt(row, card) }
      /** @ignore */
      noCardAt(row, card){
        return !this.someCardAt(row, card) }
      /** @ignore */
      getCardAt(row, card){
        this.assertState(this.board, "Game is not running.");
        this.assertArg(this.checkCoord(row, card), "Invalid card position.");
        return this.board[row][card];
      }
    }

    /** @class */
    class OnePeak extends PyramidSolitaire{
      constructor(scene) {
        super(scene,1);
      }
      getDeck(){
        return this.getSingleDeck(); }
    }

    /** @ignore */
    class TriPeak extends PyramidSolitaire{
      constructor(scene){
        super(scene,3);
      }
      getDeck(){
        //want 2 decks
        return this.getSingleDeck().concat(this.getSingleDeck()); }
    }

    _.inject(_G,{
      Card,
      OnePeak,
      TriPeak
    });

  };

})(this);

