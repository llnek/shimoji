;; Licensed under the Apache License, Version 2.0 (the "License");
;; you may not use this file except in compliance with the License.
;; You may obtain a copy of the License at
;;
;;     http://www.apache.org/licenses/LICENSE-2.0
;;
;; Unless required by applicable law or agreed to in writing, software
;; distributed under the License is distributed on an "AS IS" BASIS,
;; WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
;; See the License for the specific language governing permissions and
;; limitations under the License.
;;
;; Copyright © 2013-2020, Kenneth Leung. All rights reserved.

(ns czlab.shimoji.afx.algos

  (:require [czlab.shimoji.afx.core
             :as c :refer [n# _1 _2 POS-INF NEG-INF]]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defrecord Snapshot
  [cur other state last-best-move])

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(declare nega)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn- nega*

  "The core of the nega max algo."
  [board game depth level alpha beta]

  (let [{:keys [make-move! undo-move!
                best-move!
                next-moves switch-play!]} board
        [m1 & _ :as tries] (next-moves game)]
    (if (= level depth)
      (best-move! game m1))
    (loop [n 0
           SZ (n# tries)
           brk? false
           v' NEG-INF
           move' m1
           a' alpha b' beta]
      (if (or brk?
              (>= n SZ))
        [v' game]
        (let [move (nth tries n)]
          (make-move! game move)
          (switch-play! game)
          (let [[rc _] (nega board
                             game
                             depth
                             (- level 1)
                             (- b') (- a'))
                rc (- rc)
                n' (+ 1 n)
                v'' (max v' rc)]
            (switch-play! game)
            (undo-move! game move)
            ;;check
            (if (< a' rc)
              (do (if (= level depth)
                    (best-move! game move))
                  (recur n'
                         SZ
                         (or (>= rc b') brk?) v'' move rc b'))
              (recur n' SZ brk? v'' move' a' b'))))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn- nega

  "Entry point of the nega max algo."
  [{:keys [is-over?
           eval-score] :as board} game depth level alpha beta]

  (if (or (zero? level)
          (is-over? game))
    [(eval-score game) game]
    (nega* board game depth level alpha beta)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn negamax

  "Run the algo nega-max, returning the next best move."
  [board depth state player]

  (let [{:keys [sync-state!]} board
        game (sync-state! state player)]
    (:last-best-move @(_2 (nega board
                                game
                                depth
                                depth
                                NEG-INF POS-INF)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;EOF

