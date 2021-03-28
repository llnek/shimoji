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
           ute:_,is,EventBus}=Mojo;

    const CARD_SUITS=(function(obj){
      obj[DIAMONDS]="Diamonds";
      obj[CLUBS]="Clubs";
      obj[HEARTS]="Hearts";
      obj[SPADES]="Spades";
      return obj;
    })({});

    function flipExposed(){
      _G.model.getExposed().forEach(c=>{
        if(c){
          c.m5.showFrame(1);
          _I.makeDrag(c);
        }
      });
    }

    function dropDrawCard(c){
      EventBus.pub(["flip.draw",c.parent]);
    }

    function dropCard(c){
      let {row,col}=c.g;
      _G.model.delCardAt(row,col);
      _S.remove(c);
    }

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
        if(s===dc){
          dropDrawCard(dc);
          dropCard(found);
        }else if(found===dc){
          dropDrawCard(dc);
          dropCard(s);
        }else{
          dropCard(found);
          dropCard(s);
        }
        flipExposed();
      }else{
        s.x=s.g.x;
        s.y=s.g.y;
      }
    }

    /** Create a card */
    function Card(suit,value){
      _.assert(value >= MIN_VALUE &&
               value <= MAX_VALUE, `Bad Value ${value}`);
      const symbol = value===10?"10":SYMBOLS[value];
      const cs=CARD_SUITS[suit];
      const s= _S.sprite(_S.frameImages([`${Mojo.u.stockPile}.png`,
                                         `card${cs}${symbol}.png`]));
      //scale the card,make it nice and even
      if(!_G.iconSize){
        let w,h,K=Mojo.getScaleFactor();
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
    Card.getSingleDeckSize=function(){ return 4 * MAX_VALUE }

    const SUITS = [DIAMONDS, CLUBS, HEARTS, SPADES];
    class PyramidSolitaire{
      constructor(scene,numPeaks){
        this.numPeaks=numPeaks;
        this.scene=scene;
        // for draw cards
        this.stockPile=[];
        this.drawer=null;
        // for the game board
        this.boardWidths=[];//ints
        this.board=[];//[][]
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
          this._initPeak(left,numRows,deck,p===lastPeak);
        }
      }
      getCards(row){
        if(this.validRow(row)) return this.board[row]
      }
      setDrawCard(c=null){ this.drawer= c }
      getDrawCard(){ return this.drawer }
      setRowWidth(row, w){ this.boardWidths[row]=w }
      _allocateModel(rows, cols){
        this.board=[];
        this.boardWidths= _.fill(rows,0);
        for(let r=0;r<rows;++r)
          this.board[r]=_.fill(cols,null);
      }
      checkCoordinate(row, card){
        return this.validRow(row) && this.validCol(card)
      }
      validCol(c){
        return this.board &&
               this.board[0] &&
               c >= 0 && c < this.board[0].length
      }
      validRow(r){
        return this.board && r >= 0 && r < this.board.length
      }
      lastRowIndex(){
        return this.board ? this.board.length-1 : -1
      }
      getRowWidth(row){
        return (this.boardWidths && this.validRow(row)) ? this.boardWidths[row] : -1
      }
      assertState(cond, msg){ _.assert(cond,msg) }
      assertArg(cond, msg){ _.assert(cond,msg) }
      getCardSet(){ return new Set(getSingleDeck()) }
      checkRule2(a, b){
        return a && b && (a.g.value + b.g.value) === MAX_VALUE
      }
      checkRule1(a){
        return a && a.g.value === MAX_VALUE
      }
      checkRules(a,b){
        //2 kings or a+b=13
        return (a.g.value + b.g.value) === MAX_VALUE ||
               (a.g.value===b.g.value && a.g.value===MAX_VALUE)
      }
      delCardAt(row, card){
        if(this.board)
          this.board[row][card] = null
      }
      setCardAt(row, card, c){
        if(this.board){
          this.board[row][card] = c
          c.g.row=row;
          c.g.col=card;
        }
      }
      getSingleDeck(){
        const deck = [];
        SUITS.forEach(k=>{
          for(let i=MIN_VALUE;
              i<=MAX_VALUE; ++i) deck.push(Card(k, i)) });
        return deck;
      }
      _initPeak(left, size, input, calcRowWidth){
        for(let rmost,i=0; i<size; ++i){
          rmost=left+i;
          for(let c,j=left; j<=rmost; ++j){
            c=this.getCardAt(i,j);
            if(c){continue} // card overlapped
            c= input.length===0 ? null : input.shift();
            this.assertArg(c, "invalid deck");
            this.setCardAt(i,j, c);
          }
          if(calcRowWidth)
            this.setRowWidth(i, rmost+1);
        }
      }
      startGame(deck1, numRows=7, numDraw=1){
        //pre-conditions
        this.assertArg(numRows >= 0, "Rows in pyramid < 0.");
        this.assertArg(numDraw >= 0, "Draw cards < 0.");
        this.assertArg(deck1, "Deck is null.");
        let deck=_.shuffle(deck1);
        let origDeckSize= deck.length;
        //what remains goes to the stockPile
        this._initBoard(deck, numRows);
        this.drawer = null;
        this.stockPile = deck;
        console.log(`using ${origDeckSize-deck.length} cards for the pyramid(s).`);
        //initialize draw card
        if(this.stockPile.length>0)
          this.setDrawCard(this.stockPile.shift());
        //console.log("game started - ok.");
        // force a game over test
        //int sz=deck.size() - 2; for (int i=0; i < sz; ++i) { deck.remove(0); }
      }
      isPyramidEmpty(){
        for(let r,i=0; i<this.getNumRows(); ++i){
          r=this.getCards(i);
          for(let j=0; j<r.length; ++j){
            if(r[j])
              return false
          }
        }
        return true;
      }
      remove2(row1, card1, row2, card2){
        this.assertArg(this.checkCoordinate(row1, card1), "Invalid card position.");
        this.assertArg(this.checkCoordinate(row2, card2), "Invalid card position.");
        this.assertArg(!(row1 == row2 && card1 == card2), "Can't choose same card.");
        //check if the cards are exposed
        if(this.isCardExposed(row1, card1) &&
           this.isCardExposed(row2, card2)){
          let c1 = this.getCardAt(row1,card1);
          let c2 = this.getCardAt(row2,card2);
          if(this.checkRule(c1,c2)){
            //console.log("move ok");
            this.delCardAt(row1,card1);
            this.delCardAt(row2,card2);
            return;
          }
        }
        this.assertArg(false, "Bad move");
      }
      remove1(row, card){
        this.assertArg(checkCoordinate(row, card), "Invalid card position.");
        if(this.isCardExposed(row, card)){
          let c = this.getCardAt(row,card);
          if(this.checkRule(c)){
            //console.log("move ok");
            this.delCardAt(row,card);
            return;
          }
        }
        this.assertArg(false, "Bad move");
      }
      isCardExposed(row, card){
        if(this.checkCoordinate(row,card) &&
           this.someCardAt(row,card)){
          let below = row + 1;
          let left = card;
          let right = card + 1;
          //last row is always exposed, quick exit
          return row === this.lastRowIndex() ||
                 (this.checkCoordinate(below,right) &&
                  this.noCardAt(below,left) &&
                  this.noCardAt(below,right));
        }
        return false;
      }
      removeUsingDraw(drawIndex, row, card){
        this.assertArg(this.checkCoordinate(row, card), "Invalid card position.");
        this.assertArg(this.checkDrawPos(drawIndex), "Invalid draw position.");
        let d = this.getDrawCard(drawIndex);
        this.assertArg(d, "Bad draw index " + drawIndex);
        if(this.isCardExposed(row, card)){
          let c = this.getCardAt(row,card);
          if(this.checkRule(c,d)){
            //console.log("move ok");
            this.delCardAt(row,card);
            this.discardDraw(drawIndex);
            return;
          }
        }
        this.assertArg(false, "Bad draw move");
      }
      discardDraw(){
        if(this.stockPile.length>0)
          this.setDrawCard(this.stockPile.shift());
        return this.getDrawCard();
      }
      getNumRows(){
        // how many rows in the pyramid
        return !this.board ? -1 : this.board.length
      }
      getNumDraw(){ return 1 }
      isGameOver(){
        this.assertState(this.board, "Game is not running.");
        // game is over if all cards are gone in the pyramid, or
        // game can't continue - stuck
        return this.isPyramidEmpty() || this.isGameStuck()
      }
      getExposed(){
        let remains = [];
        for(let r,i=0; i<this.getNumRows(); ++i){
          r = this.getCards(i);
          for(let j=0; j<r.length; ++j){
            if(this.isCardExposed(i, j))
              remains.push(r[j]);
          }
        }
        return remains;
      }
      isGameStuck(){
        // if stockPile is not empty, then game can always continue
        if(this.stockPile.length>0){ return false }
        // get all exposed cards and then check them
        let remains=this.getExposed();
        if(remains.length===0){
          // note: this should never happen actually
          // no cards to play with, can't continue
          return true;
        }
        //look for kings
        for(let c,i=0;i<remains.length;++i){
          c=remains[i];
          if(this.checkRule1(c)){
            // king exposed, so game can continue
            return false;
          }
        }
        // collect all cards and see any valid combos
        let dc= this.getDrawCard();
        remains.push(dc);
        // scan...
        let cards = remains;
        for(let ci,i=0; i<cards.length; ++i){
          ci = cards[i];
          for(let cj,j = i+1; j<cards.length; ++j){
            cj = cards[j];
            if(this.checkRule2(ci, cj)){
              // combo found, so not stuck
              return false;
            }
          }
        }
        return true;
      }
      getScore(){
        this.assertState(this.board, "Game is not running.");
        let score = 0;
        for(let r, i = 0; i < this.getNumRows(); ++i){
          r = this.getCards(i);
          for(let c, j = 0; j < r.length; ++j){
            c = r[j];
            if(c)
              score += c.value;
          }
        }
        return score;
      }
      someCardAt(row, card){
        return !!this.getCardAt(row, card)
      }
      noCardAt(row, card){
        return !this.someCardAt(row, card)
      }
      getCardAt(row, card){
        this.assertState(this.board, "Game is not running.");
        this.assertArg(this.checkCoordinate(row, card), "Invalid card position.");
        return this.board[row][card];
      }
    }

    class OnePeak extends PyramidSolitaire{
      constructor(scene) {
        super(scene,1);
      }
      getDeck(){
        return this.getSingleDeck();
      }
    }

    class TriPeak extends PyramidSolitaire{
      constructor(scene){
        super(scene,3);
      }
      getDeck(){
        //want 2 decks
        return this.getSingleDeck().concat(this.getSingleDeck());
      }
    }

    _.inject(_G,{
      Card,
      OnePeak,
      TriPeak
    });

  };

})(this);

