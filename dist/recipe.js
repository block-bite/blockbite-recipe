var E = Object.defineProperty;
var x = (h, e, t) => e in h ? E(h, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : h[e] = t;
var b = (h, e, t) => x(h, typeof e != "symbol" ? e + "" : e, t);
const f = class f {
  constructor(e, t, r = {}) {
    if (e === "store") {
      this._isStore = !0, this._storeName = r.name || "store", this._useLocalStorage = r.localStorage || !1, this.store = this._initStore(t), this.watch = (s, a) => {
        var o;
        this._storeWatchers ?? (this._storeWatchers = {}), (o = this._storeWatchers)[s] ?? (o[s] = []), this._storeWatchers[s].push(a);
      }, f.store.set(this._storeName, this.store), f._storeInstanceMap ?? (f._storeInstanceMap = /* @__PURE__ */ new Map()), f._storeInstanceMap.set(this._storeName, this);
      return;
    }
    this.root = document.querySelector(e), this.queue = [], this.bindings = {}, this.watchers = {}, this._state = {}, this.store = new Proxy(
      {},
      {
        set: (s, a, o) => {
          var i, c;
          if (s[a] = o, !isNaN(a) || a === "length") {
            this._saveStore(s), subscribers.forEach((d) => d(s));
            const u = (i = f._storeInstanceMap) == null ? void 0 : i.get(this._storeName), l = (c = u == null ? void 0 : u._storeWatchers) == null ? void 0 : c[a];
            l && l.forEach((d) => {
              var n;
              d(o, (n = u._getRuntime) == null ? void 0 : n.call(u, document.body));
            });
          }
          return !0;
        },
        get: (s, a) => s[a]
      }
    ), setTimeout(() => this._runQueue(), 0);
  }
  text(e, t) {
    const r = this.root.querySelector(`[r-text="${e}"]`) || this.root.querySelector(`[data-r-text="${e}"]`);
    r && (r.textContent = t);
  }
  loop() {
    const e = this.root.querySelector("[r-loop]");
    if (!e) return { effect: () => {
    }, bind: {} };
    const t = e.parentElement, r = e.cloneNode(!0), s = {
      click: []
    }, a = {
      effect: (o, i = []) => {
        const c = (u) => {
          t.querySelectorAll("[data-r-loop-item]").forEach((l) => l.remove()), u.forEach((l, d) => {
            const n = r.cloneNode(!0);
            n.removeAttribute("r-loop"), n.setAttribute("data-r-loop-item", ""), n.setAttribute("data-r-item", JSON.stringify(l)), i.forEach((m) => {
              const _ = n.querySelector(`[r-text="${m}"]`);
              _ && (_.textContent = l[m]);
            }), s.click.forEach(({ selector: m, handler: _ }) => {
              n.querySelectorAll(m).forEach((g) => {
                g.addEventListener("click", () => {
                  const p = this._getRuntime(g);
                  _(d, p);
                });
              });
            }), t.appendChild(n);
          });
        };
        return o != null && o.__subscribe && o.__subscribe(c), c(o), e.remove(), a;
      },
      bind: {
        click: (o) => (i) => (console.log("✅ registered bind.click for", o), s.click.push({ selector: o, handler: i }), a)
      }
    };
    return a;
  }
  _initStore(e) {
    let t = null;
    if (this._useLocalStorage) {
      const o = localStorage.getItem(this._storeName);
      if (o)
        try {
          t = JSON.parse(o);
        } catch {
          console.warn(
            "📚 Recipe Failed to parse localStorage data for store:",
            this._storeName
          );
        }
    }
    const r = t || e, s = [], a = new Proxy([...r], {
      set: (o, i, c) => {
        var u;
        if (o[i] = c, !isNaN(i) || i === "length") {
          this._saveStore(o), s.forEach((d) => d(o));
          const l = (u = this._storeWatchers) == null ? void 0 : u[i];
          l && l.forEach((d) => {
            var n;
            d(c, (n = this._getRuntime) == null ? void 0 : n.call(this, document.body));
          });
        }
        return !0;
      },
      get: (o, i) => i === "__subscribe" ? (c) => s.push(c) : o[i]
    });
    return this._saveStore(a), a;
  }
  _saveStore(e) {
    this._useLocalStorage && localStorage.setItem(this._storeName, JSON.stringify(e));
  }
  click(e) {
    const t = this, r = (s) => (t.queue.push(() => {
      (e ? t.root.querySelectorAll(e) : [t.root]).forEach((o, i) => {
        if (!o) {
          console.warn(
            `📚 Recipe Element not found for direct selector: ${e}`
          );
          return;
        }
        o.addEventListener("click", () => {
          const c = t._getRuntime(o);
          s(i, c), r._label && t._dispatch(r._label, i, c);
        });
      });
    }), r);
    return r.label = function(s) {
      return r._label = s, r;
    }, r;
  }
  bind(e, t) {
    this.bindings[e] = (r, s) => {
      t(r, s);
    };
  }
  watch(e, t) {
    this.watchers[e] = (r, s) => {
      t(r, s);
    };
  }
  _dispatch(e, t, r) {
    this.bindings[e] && this.bindings[e](t, r);
  }
  _runQueue() {
    this.queue.forEach((e) => e()), this.queue = [];
  }
  _getRuntime(e) {
    const t = this;
    return {
      el: e,
      class: {
        add: (r) => e.classList.add(r),
        remove: (r) => e.classList.remove(r)
      },
      q(r) {
        const s = t.root || document;
        return N(s.querySelectorAll(r));
      },
      parent: {
        data: {
          set: (r, s) => {
            t.store[r] = s, t.root.setAttribute(`data-${r}`, s);
          },
          get: (r) => t.store[r]
        }
      },
      getItem() {
        const r = e.getAttribute("data-r-item");
        if (!r) {
          const s = e.closest("[data-r-item]");
          if (s)
            return JSON.parse(s.getAttribute("data-r-item"));
        }
        try {
          return JSON.parse(r);
        } catch {
          return console.warn(
            "📚 Recipe Failed to parse data-r-item attribute:",
            r
          ), null;
        }
      }
    };
  }
};
b(f, "store", /* @__PURE__ */ new Map());
let S = f;
function N(h) {
  return {
    class: {
      add: (e) => h.forEach((t) => t.classList.add(e)),
      remove: (e) => h.forEach((t) => t.classList.remove(e))
    },
    eq(e) {
      const t = h[e];
      return {
        class: {
          add: (r) => t == null ? void 0 : t.classList.add(r),
          remove: (r) => t == null ? void 0 : t.classList.remove(r)
        },
        text: (r, s) => {
          const a = (t == null ? void 0 : t.querySelector(`[r-text="${r}"]`)) || (t == null ? void 0 : t.querySelector(`[data-r-text="${r}"]`));
          a && (a.textContent = s);
        }
      };
    },
    text: (e, t) => {
      h.forEach((r) => {
        r.textContent = t;
      });
    }
  };
}
export {
  S as Recipe
};
