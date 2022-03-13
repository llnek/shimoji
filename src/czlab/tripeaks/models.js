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

;(function(global,UNDEF){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  global["io/czlab/tripeaks/models"]=function(Mojo){

    //Ace = 1, K = 13
    const MAX_VALUE = 13,
      MIN_VALUE = 1,
      DIAMONDS=1,
      CLUBS=2,
      HEARTS=3,
      SPADES=4,
      JOKER=5,
      SYMBOLS = "?A23456789TJQK";

    const int=Math.floor;
    const {Sprites:_S,
           Input:_I,
           Game:_G,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const SUITS = [DIAMONDS, CLUBS, HEARTS, SPADES];
    const CARD_SUITS=(function(obj){
      obj[DIAMONDS]="Diamonds";
      obj[CLUBS]="Clubs";
      obj[HEARTS]="Hearts";
      obj[SPADES]="Spades";
      return obj;
    })({});

    /**Reveal the card and make it draggable */
    function flipExposed(){
      _G.model.getExposed().forEach(c=>{
        if(c){
          _I.makeDrag(c);
          c.m5.showFrame(1);
        }
      })
    }

    /**A card has been dropped */
    const dropDrawCard=(c)=> Mojo.emit(["flip.draw",c.parent]);

    /**Get rid of this card */
    function snuffOut(c){
      const {row,col}=c.g;
      _S.remove(c);
      _G.model.delCardAt(row,col)
    }

    /**Rules to decide how many points to be added */
    function _calcScore(a,b){
      let bonus=0,n=10,x=1;
      if(a.g.value==13 && b.g.value==13){
        n=100;
        x *= 5;
      }
      if(b.g.suit==a.g.suit){
        x *=3;
      }
      if(a.g.row==0){
        bonus=5000;
        _G.peaks +=1;
      }
      _G.score += n*x + bonus;
    }

    /**/
    function _checkDropped(s){
      let found,
        es=_G.model.getExposed(),
        dc=_G.model.getDrawCard();
      if(dc)
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
        _calcScore(s,found);
        if(found===dc){
          dropDrawCard(dc);
          snuffOut(s);
        }else if(s===dc){
          dropDrawCard(dc);
          snuffOut(found);
        }else{
          snuffOut(found);
          snuffOut(s);
        }
        flipExposed();
        Mojo.sound("slide.mp3").play();
      }else{
        //move card back
        _V.copy(s,s.g);
        Mojo.sound("error.mp3").play();
      }
    }

    /**Create a Card object */
    function Card(suit,value){
      _.assert(value >= MIN_VALUE &&
               value <= MAX_VALUE, `Bad Value ${value}`);
      const symbol = value==10?"10":SYMBOLS[value],
        K=Mojo.getScaleFactor(),
        cs=CARD_SUITS[suit],
        s= _S.spriteFrom(`${Mojo.u.stockPile}.png`,
                         `card${cs}${symbol}.png`); //front and back
      //scale the card,make it nice and even
      if(!_G.iconSize){
        let w,h;
        _S.scaleXY(s,K,K);
        w=int(s.width);
        h=int(s.height);
        if(!_.isEven(w))--w;
        if(!_.isEven(h))--h;
        _G.iconSize=[w,h];
      }
      s.g.value=value;
      s.g.suit=suit;
      s.g.symbol=symbol;
      s.m5.onDragDropped=()=>_checkDropped(s);
      return _S.sizeXY(s, _G.iconSize[0], _G.iconSize[1]);
    }

    /**/
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
        //each row has a different column count (int)
        this.boardWidths=[];
      }

      /**Initial internal data structures for the model.
       * @param deck
       * @param numRows
       */
      _initBoard(deck, numRows){
        this._allocateModel(numRows, numRows*this.numPeaks);
        const overlap= int(Math.ceil(numRows * 0.5));
        const shift= numRows-overlap;
        const lastPeak=this.numPeaks-1;
        for(let left=0, p=0; p < this.numPeaks; ++p){
          if(p>0){ left += shift }
          this._initPeak(left,numRows,deck,p==lastPeak)
        }
      }

      /**/
      getCards(row){
        if(this.validRow(row)) return this.board[row]
      }

      /**/
      setDrawCard(c){ this.drawer= c }

      /**/
      getDrawCard(){ return this.drawer }

      /**/
      setRowWidth(row, w){ this.boardWidths[row]=w }

      /**/
      _allocateModel(rows, cols){
        this.board=[];
        this.boardWidths= _.fill(rows,0);
        for(let r=0;r<rows;++r)
          this.board[r]=_.fill(cols,null)
      }

      /**/
      validXY(row, card){
        return this.validRow(row) && this.validCol(card)
      }

      /**/
      validCol(c){
        return this.board &&
               this.board[0] &&
               c >= 0 && c < this.board[0].length
      }

      /**/
      validRow(r){
        return this.board && r >= 0 && r < this.board.length
      }

      /**/
      lastRowIndex(){
        return this.board ? this.board.length-1 : -1
      }

      /**/
      getRowWidth(row){
        return (this.boardWidths && this.validRow(row)) ? this.boardWidths[row] : -1
      }

      /**/
      assertState(cond, msg){ _.assert(cond,msg) }
      /**/
      assertArg(cond, msg){ _.assert(cond,msg) }

      /**/
      getCardSet(){ return new Set(getSingleDeck()) }

      /**Adding the 2 cards equals 13 */
      checkRule2(a, b){
        return a && b && (a.g.value + b.g.value) == MAX_VALUE
      }

      /**The card is a King */
      checkRule1(a){
        return a && a.g.value == MAX_VALUE
      }

      /**/
      checkRules(a,b){
        //2 kings or a+b=13
        return (a.g.value + b.g.value) == MAX_VALUE ||
               (a.g.value===b.g.value && a.g.value==MAX_VALUE)
      }

      /**/
      delCardAt(row, card){
        if(this.board)
          this.board[row][card] = null
      }

      /**/
      setCardAt(row, card, c){
        if(this.board){
          c.g.row=row;
          c.g.col=card;
          this.board[row][card] = c
        }
      }

      /**/
      getSingleDeck(){
        const deck = [];
        SUITS.forEach(k=>{
          for(let i=MIN_VALUE;
              i<=MAX_VALUE; ++i) deck.push(Card(k, i)) });
        return deck;
      }

      /**Create a peak */
      _initPeak(left, size, input, calcRowWidth){
        for(let rmost,i=0; i<size; ++i){
          rmost=left+i;
          for(let c,j=left; j<=rmost; ++j){
            c=this.getCardAt(i,j);
            if(c){continue} // card overlapped
            if(input.length>0)c=input.shift();
            this.assertArg(c, "invalid deck");
            this.setCardAt(i,j, c)
          }
          if(calcRowWidth)
            this.setRowWidth(i, rmost+1)
        }
      }

      /**/
      startGame(deck1, numRows=7, numDraw=1){
        this.assertArg(numRows >= 0, "Rows in pyramid < 0");
        this.assertArg(numDraw >= 0, "Draw cards < 0");
        this.assertArg(deck1, "Deck is null");
        let deck=_.shuffle(deck1);
        let orig= deck.length;
        //remains goes to the stockPile
        this._initBoard(deck, numRows);
        this.drawer = null;
        this.stockPile = deck;
        _.log(`using ${orig-deck.length} cards for the peaks`);
        //initialize draw card
        if(this.stockPile.length>0)
          this.setDrawCard(this.stockPile.shift())
      }

      /**Are we all done? */
      isPeakEmpty(){
        for(let r,i=0; i<this.getNumRows(); ++i){
          r=this.getCards(i);
          for(let j=0; j<r.length; ++j)
            if(r[j])
              return false
        }
        return true;
      }

      /**/
      isCardExposed(row, card){
        let rc;
        if(this.validXY(row,card) &&
           this.someCardAt(row,card)){
          let below = row + 1;
          let left = card;
          let right = card + 1;
          //last row is always exposed, quick exit
          rc= row == this.lastRowIndex() ||
              (this.validXY(below,right) &&
               this.noCardAt(below,left) && this.noCardAt(below,right))
        }
        return rc;
      }

      /**Maybe get a new draw card */
      discardDraw(){
        let c;
        if(this.stockPile.length>0)
          c=this.stockPile.shift();
        this.setDrawCard(c);
        return this.getDrawCard();
      }

      /**/
      getNumRows(){
        // how many rows in the pyramid
        return this.board ? this.board.length : -1
      }

      /**/
      getExposed(){
        const remains = [];
        for(let r,i=0; i<this.getNumRows(); ++i){
          r = this.getCards(i);
          for(let j=0; j<r.length; ++j)
            if(this.isCardExposed(i, j))
              remains.push(r[j]);
        }
        return remains;
      }

      /**/
      isPileEmpty(){
        return this.stockPile.length==0
      }

      /**/
      isGameStuck(){
        //if stockPile is not empty, then game can always continue
        if(this.stockPile.length>0){
          return false
        }
        //get all exposed cards and then check them
        let c,remains=this.getExposed();
        if(remains.length==0){
          // note: this should never happen actually
          // no cards to play with, can't continue
          return true
        }
        //collect all cards and see any valid combos
        c=this.getDrawCard();
        if(c)
          remains.push(c);
        //check them
        for(let ci,i=0; i<remains.length; ++i){
          ci = remains[i];
          for(let cj,j = i+1; j<remains.length; ++j){
            cj = remains[j];
            if(this.checkRules(ci, cj)){
              return false // combo found, so not stuck
            }
          }
        }
        return true;
      }

      /**/
      someCardAt(row, card){
        return !!this.getCardAt(row, card)
      }

      /**/
      noCardAt(row, card){
        return !this.someCardAt(row, card)
      }

      /**/
      getCardAt(row, card){
        this.assertArg(this.validXY(row, card), "Invalid card position.");
        return this.board[row][card];
      }
    }

    /** @class */
    class OnePeak extends PyramidSolitaire{
      constructor(scene){
        super(scene,1)
      }
      getDeck(){
        return this.getSingleDeck()
      }
    }

    /** @class */
    class TriPeak extends PyramidSolitaire{
      constructor(scene){
        super(scene,3)
      }
      getDeck(){
        return this.getSingleDeck().concat(this.getSingleDeck())
      }
    }

    _.inject(_G,{
      Card,
      OnePeak,
      TriPeak
    });

  };

})(this);

