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

(ns czlab.shimoji.afx.core

  (:require-macros [czlab.shimoji.afx.core
                    :as c :refer [n# _1 cc+ in? atom?
                                  fn_1 fn_2 fn_*
                                  if-func do-with defmonad]])

  (:require [clojure.string :as cs]
            [clojure.set :as cst]
            [goog.string :as gs]
            [oops.core :as oc]
            [goog.crypt.base64 :as b64]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(def POS-INF js/Number.POSITIVE_INFINITY)
(def NEG-INF js/Number.NEGATIVE_INFINITY)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn abs*
  [n]
  (js/Math.abs n))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn sqrt*
  [n]
  (js/Math.sqrt n))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn sqr*
  [n]
  (* n n))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn raise!

  "Throw exception."
  [& args]

  (throw (js/Error. (cs/join "" args))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(def fn-undef (constantly js/undefined))
(def fn-false (constantly false))
(def fn-true (constantly true))
(def fn-nil (constantly nil))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn repeat-str

  "Repeat str n times."
  [times s]

  (gs/repeat s times))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn zero??

  "Safe test zero?"
  [n]

  (and (number? n) (zero? n)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn pos??

  "Safe test pos?"
  [n]

  (and (number? n) (pos? n)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn neg??

  "Safe test neg?"
  [n]

  (and (number? n) (neg? n)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn flip

  "Invert number if not zero."
  [x]

  (if (number? x)
    (if (zero? x) 0 (/ 1 x)) 0))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn nneg?

  "Not neg?"
  [x]

  (not (neg?? x)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn num??

  "If n is not a number, return other."
  [n other]

  (if (number? n) n other))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn sign??

  "Sign of number."
  [n]

  (cond (zero?? n) 0 (pos?? n) 1 :t -1))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn nestr?

  "Non empty string?"
  [s]

  (and (string? s) (not-empty s)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn estr?

  "Empty string?"
  [s]

  (not (nestr? s)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn nichts?

  "Object is null or undefined?"
  [obj]

  (or (undefined? obj) (nil? obj)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn esc-xml

  "Escape XML special chars."
  [s]

  (loop [i 0
         SZ (n# s)
         ret (c/tvec*)]
    (if (>= i SZ)
      (cs/join "" (c/ps! ret))
      (let [c (nth s i)]
        (recur (+ 1 i) SZ (conj! ret
                                 (condp = c
                                   "&" "&amp;"
                                   ">" "&gt;"
                                   "<" "&lt;"
                                   "\"" "&quot;"
                                   "'" "&apos;" c)))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn split-seq

  "Split collection into 2 parts"
  [coll cnt]

  (if (< cnt (n# coll))
    (vector (take cnt coll)
            (drop cnt coll))
    (vector (cc+ [] coll) [])))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn percent

  "Calculate percentage."
  [numerator denominator]

  (* 100.0 (/ numerator denominator)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn n->fixed

  "Print number to n decimals."

  ([n]
   (n->fixed n 2))

  ([n digits]
   (c/call-js! (js/Number. n) "toFixed" (num?? digits 2))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn split-str

  "Split string into n chars each."
  [n string]

  (map #(cs/join "" %) (partition-all n string)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn compare-asc*

  "Generic compare function."
  [f]

  (fn_2 (cond (< (f ____1) (f ____2)) -1
              (> (f ____1) (f ____2)) 1 :t 0)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn compare-des*

  "Generic compare function."
  [f]

  (fn_2 (cond (< (f ____1) (f ____2)) 1
              (> (f ____1) (f ____2)) -1 :t 0)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn- xxx-by

  "Used by min-by & max-by - internal."
  [cb coll]

  (if (not-empty coll)
    (reduce cb (_1 coll) (rest coll)) js/undefined))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn min-by

  "Find item with minimum value as defined by the function."
  [f coll]

  (xxx-by #(if (< (f %1) (f %2)) %1 %2) coll))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn max-by

  "Find item with maximum value as defined by the function."
  [f coll]

  (xxx-by #(if (< (f %1) (f %2)) %2 %1) coll))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn rand-range

  "Pick a random number between 2 limits."
  [from to]

  (js/Math.floor (+ from (* (rand) (+ 1 (- to from))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn is-ssl?

  "Browser url is secured?"
  []

  (and js/window
       js/window.location
       (in? js/window.location.protocol "https")))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn get-websock-protocol

  "Websocket protocol prefix."
  []

  (if (is-ssl?) "wss://" "ws://"))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn fmt-url

  "Format URL based on the current web address host."
  [scheme uri]

  (if (and js/window
           js/window.location)
      (str scheme js/window.location.host uri) ""))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn s->js

  "String to jsobj."
  [s]
  {:pre [(string? s)]}

  (js/JSON.parse s))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn s->clj

  "String to cljobj."
  [s]

  (js->clj (s->js s)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn s->n

  "String to number."
  [s]

  (gs/toNumber s))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn jsonize

  "To json string."
  [obj]

  (condp = obj
    js/undefined nil
    nil "null"
    (js/JSON.stringify (if (or (array? obj)
                               (object? obj)) obj (clj->js obj)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn fill-array

  "JS-array with filled with value."
  [value len]

  (do-with [out #js[]]
    (dotimes [_ len] (.push out value))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn copy-array

  "Copy data into another JS-array."
  [src des]
  {:pre [(= (n# src)(n# des))
         (and (array? src)(array? des))]}

  (dotimes [n (n# src)]
    (aset des n (nth src n))) des)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn is-mobile?

  "client a device?"
  [navigator]

  (if navigator
    (-> #"(?i)Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini"
        (re-matches (c/get-js navigator "userAgent")))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn is-safari?

  "client Safari?"
  [navigator]

  (if navigator
    (and (re-matches #"Apple Computer"
                     (c/get-js navigator "vendor"))
         (re-matches #"Safari"
                     (c/get-js navigator "userAgent")))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn pde

  "Prevent default propagation of this event."
  [e]

  (if-func [f (c/get-js e "preventDefault")]
    (c/call-js! e "preventDefault")
    (c/set-js! e "returnValue" false)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn clamp

  "Clamp value between 2 limits."
  [low high v]

  (if (< v low)
    low
    (if (> v high) high v)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn rand-sign
  []
  (if (zero? (rem (js/Math.floor (rand 10)) 2)) -1 1))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn crand

  "choose item from array."
  [coll]

  (let [sz (n# coll)]
    (condp = sz
      0 js/undefined
      1 (_1 coll)
      (nth coll (js/Math.floor (* (rand) sz))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn prand

  "choose percentage in step of 10."
  []

  (crand [0.1 0.9 0.3 0.7 0.6 0.5 0.4 0.8 0.2]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn basic-auth-header

  "Format input into HTTP Basic Authentication."
  [user pwd]

  ["Authorization" (str "Basic "
                        (b64/encodeString (str "" user ":" pwd) true))])

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn assign

  "Copy js properties from other objects."
  [des & more]

  (doseq [m more]
    (js/Object.assign des m)) des)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn merge+

  "Merge (deep) of clojure data."
  [a b & more]

  (loop [[z & M] (seq b)
         tmp (c/tmap* a)]
    (if (nil? z)
      (c/ps! tmp)
      (let [[k vb] z
            va (get a k)]
        (recur M
               (assoc! tmp
                       k
                       (if-not (in? a k)
                         vb
                         (cond (and (map? vb)
                                    (map? va))
                               (merge+ va vb)
                               (and (set? vb)
                                    (set? va))
                               (cst/union va vb) :t vb))))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;testing
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(def ^:private t-bad "FAILED")
(def ^:private t-ok "PASSED")
(defn ensure-test

  "Assert condition."
  [cnd msg]

  (str (try (if cnd t-ok t-bad)
            (catch js/Error e t-bad)) ": " msg))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn ensure-test-thrown

  "Assert exception is thrown."
  [expected error msg]

  (str (if (nichts? error)
         t-bad
         (cond (string? expected)
               (if (or (= expected "any")
                       (= expected error)) t-ok t-bad)
               (instance? expected error)
               t-ok
               :t
               t-bad)) ": " msg))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn runtest

  "Run a test group, returning the summary."

  ([test]
   (runtest test nil))

  ([test title]
   {:pre [(fn? test)]}
   (let [f #(cs/starts-with? % "P")
         mark (system-time)
         results (test)
         sum (n# results)
         ok (n# (filter f results))
         diff (- (system-time) mark)
         perc (int (* 100 (/ ok sum)))]
     (cs/join "\n"
              [(repeat-str 78 "+")
               (or title "test")
               (js/Date.)
               (repeat-str 78 "+")
               (cs/join "\n" results)
               (repeat-str 78 "=")
               (cs/join "" ["Passed: " ok "/" sum " [" perc  "%]"])
               (str "Failed: " (- sum ok))
               (cs/join "" ["cpu-time: " diff "ms"])]))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;monads
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defmonad m-identity

  "Monad describing plain computations. This monad does in fact nothing
  at all. It is useful for testing, for combination with monad
  transformers, and for code that is parameterized with a monad."

  (vector :unit identity
          :bind (fn [mv mf] (mf mv))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defmonad m-maybe

  "Monad describing computations with possible failures. Failure is
  represented by nil, any other value is considered valid. As soon as
  a step returns nil, the whole computation will yield nil as well."

  (vector :unit identity
          :bind (fn [mv mf] (if-not (nichts? mv) (mf mv)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defmonad m-list

  "Monad describing multi-valued computations, i.e. computations
  that can yield multiple values. Any object implementing the seq
  protocol can be used as a monadic value."

  (vector :unit (fn_1 (vector ____1))
          :zero []
          :plus (fn_* (flatten ____xs))
          :bind (fn [mv mf] (flatten (map mf mv)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defmonad m-state

  "Monad describing stateful computations. The monadic values have the
  structure (fn [old-state] [result new-state])."

  (vector :unit (fn [v]
                  (fn [s] [v s]))
          :bind (fn [mv mf]
                  (fn [s]
                    (let [[v s'] (mv s)] ((mf v) s'))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defmonad m-continuation

  "Monad describing computations in continuation-passing style. The monadic
  values are functions that are called with a single argument representing
  the continuation of the computation, to which they pass their result."

  (vector :unit (fn [v]
                  (fn [cont] (cont v)))
          :bind (fn [mv mf]
                  (fn [cont]
                    (mv (fn [v] ((mf v) cont)))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn run-cont [cont] (cont identity))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn set-js!!

  "Set many jsobj prop."
  [node & more]

  (doseq [[k v] (partition 2 more)] (c/set-js! node k v)) node)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;in memory store
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn new-memset

  "New in-memory object store. Object must be an atom."

  ([]
   (new-memset 10))

  ([batch]
   (atom {:batch (num?? batch 10) :size 0 :next 0 :slots #js[]})))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn count-set

  "Count items."
  [s]

  (:next @s))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn nth-set

  "nth item in set."
  [s n]

  (if (< n (:next @s)) (nth (:slots @s) n)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn each-set

  "Run function on set items."
  [s cb]

  (let [{:keys [next slots]} @s]
    (dotimes [i next] (cb (nth slots i) i))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn add->set!

  "Add item to set."
  [store obj]
  {:pre [(atom? obj)]}

  (do-with [obj]
    (swap! store
           (fn [{:keys [next size
                        batch slots] :as root}]
             (let [g #(do (c/nloop batch (.push slots nil))
                          (+ size batch))
                   next1 (+ 1 next)
                   size' (if (< next size) size (g))]
               (swap! obj assoc :____slot next)
               (aset slots next obj)
               (assoc root :next next1 :size size'))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn drop->set!

  "Free object from store."
  [store obj]

  (if (atom? obj)
    (swap! store
           (fn [{:keys [next slots] :as root}]
             (let [next1 (- next 1)
                   tail (aget slots next1)
                   slot' (:____slot @tail)
                   epos' (:____slot @obj)]
               ;move the tail to old slot
               (aset slots next1 nil)
               (aset slots epos' tail)
               (swap! tail assoc :____slot epos')
               (swap! obj dissoc :____slot)
               (merge root {:next next1}))))) store)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;EOF

