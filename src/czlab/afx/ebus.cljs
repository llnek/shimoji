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

(ns czlab.shimoji.afx.ebus

  (:require [clojure.string :as cs]
            [czlab.shimoji.afx.core
             :as c :refer [in? raise! debug*
                           do-with cc+ if-some+ let->nil]]))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(def ^:private _SEED (atom 0))
(defn- next-seq [] (swap! _SEED inc))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defprotocol EventBus
  "Topic based pub-sub event bus."
  (match? [_ topic] "True if topic is registered.")
  (unsub [_ subid] "Drop subscription.")
  (finz [_] "Clean up.")
  (sub [_ topic listener] "Subscribe to this topic.")
  (pub [_ topic msg] "Publish a message on this topic."))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn event-bus

  ([]
   (event-bus nil))

  ([options]
   (letfn
     [(mk-sub [impl topic cb]
        (let []
          {:topic topic
           :action cb
           :id (str "s#" (next-sid))}))
      (run [async? subcs topic msg]
        (let [data {:topic topic :msg msg}]
          (doseq [[_ z] subcs
                  :let [{:keys [action]
                         expected :topic} z]]
            (if (= expected topic)
              (action expected topic msg)))))]
     (let [impl (atom (merge {:subcs {}
                              :topics {} :async? false} options))]
       (reify EventBus
         (sub [bus topic listener]
           (let [{:keys [id] :as sub}
                 (mk-sub impl topic listener)]
             (swap! impl
                    #(-> (update-in %1
                                    [:topics topic]
                                    assoc id sub)
                         (update-in [:subcs] assoc id sub))) id))
         (pub [bus topic msg]
           (let [{:keys [topics]} @impl
                 cbs (get topics topic)]
             (if-not (empty? cbs)
               (run false cbs topic msg)) bus))
         (unsub [bus subid]
           (let [sub ((:subcs @impl) subid)
                 {:keys [action topic]} sub]
             (when sub
               ;(if (:async? @impl) (a/close! action))
               (swap! impl
                      #(-> (update-in %1
                                      [:topics topic]
                                      dissoc subid)
                           (update-in [:subcs] dissoc subid)))) bus))
         (match? [bus topic]
           (contains? (get @impl :topics) topic))
         (finz [bus]
           (let [{:keys [async? subcs]} @impl]
             (c/assoc!! impl :topics {} :subcs {}) bus)))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(def ^:private re-space #"\s+")
(def ^:private re-dot #"\.")
(def ^:private re-slash #"/")

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn tibrv-bus

  "A Publish Subscribe event manager whereby
  a more advanced matching scheme is used -
  such as wild-card matches."

  ([]
   (tibrv-bus nil))

  ([options]
   (letfn
     [(split [topic sep]
        (filterv #(if (pos? (count %)) %)
                 (cs/split topic
                           (if (=  "." sep) re-dot re-slash))))
      (mk-sub [impl topic cb]
        (let []
          {:topic topic
           :action cb
           :id (str "s#" (next-id))}))
      ;"So that tokens are lined up in nested levels.
      ;e.g. tokens = [a b c] result = [:levels a :levels b :levels c]."
      (fmt-path [tokens]
        (into [] (interleave (repeat :levels) tokens)))
      (run [async? subcs topic msg]
        (let [data {:topic topic :msg msg}]
          (doseq [[_ z] subcs
                  :let [{expected :topic
                         :keys [action]} z]]
            (action expected topic msg))))
      (walk [async? branch pathTokens topic msg tst]
        (c/let->nil
          [{:keys [levels subcs]} branch
           [p & more] pathTokens
           cur (levels p)
           s1 (levels "*")
           s1c (:levels s1)
           s2 (levels "**")]
          (when s2
            (if tst
              (swap! tst inc)
              (run async? (:subcs s2) topic msg)))
          (if s1
            (cond
              (and (empty? more)
                   (empty? s1c))
              (if tst
                (swap! tst inc)
                (run async? (:subcs s1) topic msg))
              (and (not-empty s1c)
                   (not-empty more))
              (walk async? s1 more topic msg tst)))
          (when cur
            (if (not-empty more)
              (walk async? cur more topic msg tst)
              (if tst
                (swap! tst inc)
                (run async? (:subcs cur) topic msg))))))]
     (let [impl (atom (merge {:delimiter "."
                              :async? false
                              :bufsz 16
                              :levels {} :subcs {}} options))]
       (reify EventBus
         (sub [bus topic listener]
           (let [{:keys [async? delimiter]} @impl
                 {:keys [id] :as sub}
                 (mk-sub impl topic listener)
                 path (fmt-path (split topic delimiter))]
             (swap! impl
                    (c/fn_1
                      (-> (update-in ____1
                                     path
                                     #(update-in %
                                                 [:subcs]
                                                 assoc id sub))
                          (update-in [:subcs] assoc id sub)))) id))
         (pub [bus topic msg]
           (let [{:keys [async?
                         delimiter] :as B} @impl]
             (c/if-some+
               [ts (split topic delimiter)]
               (walk async? B ts topic msg nil)) bus))
         (unsub [bus subid]
           (if-some [sub ((:subcs @impl) subid)]
             (let [{:keys [async? delimiter]} @impl
                   {:keys [action topic]} sub
                   path (fmt-path (split topic delimiter))]
               ;(if async? (a/close! action))
               (swap! impl
                      (c/fn_1
                        (-> (update-in ____1
                                       path
                                       #(update-in %
                                                   [:subcs]
                                                   dissoc subid))
                            (update-in [:subcs]
                                       dissoc subid)))))) bus)
         (match? [_ topic]
           (let [z (atom 0)
                 {:keys [async?
                         delimiter] :as B} @impl]
             (c/if-some+
               [ts (split topic delimiter)]
               (walk async? B ts topic nil z))
             (pos? @z)))
         (finz [me]
           (let [{:keys [async? subcs]} @impl]
             (c/assoc!! impl :levels {} :subcs {}) me)))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;EOF

