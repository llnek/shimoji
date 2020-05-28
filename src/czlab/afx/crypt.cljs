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

(ns czlab.shimoji.afx.crypt

  (:require [clojure.string :as cs]
            [czlab.shimoji.afx.core
             :as c :refer [n# nzero? abs* estr? nestr? zero??]]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(def ^:private VISCHS (str " @N/\\Ri2}aP`(xeT4F3mt;8~%r0v:L5$+Z{'V)\"CKIc>z.*"
                           "fJEwSU7juYg<klO&1?[h9=n,yoQGsW]BMHpXb6A|D#q^_d!-"))
(def ^:private VISCHS-LEN  (n# VISCHS))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn- calc-delta

  "Find the offset."
  [shift]

  (mod (abs* shift) VISCHS-LEN))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn- charat

  "Get the char at the index."

  ([pos]
   (charat pos VISCHS))

  ([pos string_]
   (.charAt string_ pos)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn- getch

  "Index for this char."
  [ch]

  (loop [pos 0]
    (if (>= pos VISCHS-LEN)
      -1
      (if (= ch (charat pos)) pos (recur (+ 1 pos))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn- rotr

  "Rotate right."
  [delta cpos]

  (let [pos (+ cpos delta)]
    (charat (if (>= pos VISCHS-LEN) (- pos VISCHS-LEN) pos))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn- rotl

  "Rotate left."
  [delta cpos]

  (let [pos (- cpos delta)]
    (charat (if (< pos 0) (+ VISCHS-LEN pos) pos))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn encrypt

  "Encrypt source by shifts."
  [src shift]
  {:pre [(string? src)]}

  (if (zero?? shift)
    src
    (let [f' (fn [shift delta cpos] (if (neg? shift)
                                      (rotr delta cpos)
                                      (rotl delta cpos)))
          out #js []
          d (calc-delta shift)]
      (doseq [c src
              :let [p (getch c)]]
        (.push out (if (< p 0) c (f' shift d p)))) (cs/join "" out))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn decrypt

  "Decrypt text by shifts."
  [cipherText shift]
  {:pre [(string? cipherText)]}

  (if (zero?? shift)
    cipherText
    (let [f' (fn [shift delta cpos] (if (neg? shift)
                                      (rotl delta cpos)
                                      (rotr delta cpos)))
          out #js []
          d (calc-delta shift)]
      (doseq [c cipherText
              :let [p (getch c)]]
        (.push out (if (< p 0) c (f' shift d p)))) (cs/join "" out))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;EOF

