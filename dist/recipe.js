var q = Object.defineProperty;
var p = (n, o, s) => o in n ? q(n, o, { enumerable: !0, configurable: !0, writable: !0, value: s }) : n[o] = s;
var S = (n, o, s) => p(n, typeof o != "symbol" ? o + "" : o, s);
const g = class g {
  constructor(o, s, r = {}) {
    if (o === "store") {
      this._isStore = !0, this._storeName = r.name || "store", this._useLocalStorage = r.localStorage || !1, this.store = this._initStore(s), this.watch = (t, e) => {
        var a;
        this._storeWatchers ?? (this._storeWatchers = {}), (a = this._storeWatchers)[t] ?? (a[t] = []), this._storeWatchers[t].push(e);
      }, g.store.set(this._storeName, this.store), g._storeInstanceMap ?? (g._storeInstanceMap = /* @__PURE__ */ new Map()), g._storeInstanceMap.set(this._storeName, this);
      return;
    }
    this.root = document.querySelector(o), this.queue = [], this.watchers = {}, this._state = {}, this._stateWatchers = {}, this.store = new Proxy(
      {},
      {
        set: (t, e, a) => {
          var i, c;
          if (t[e] = a, !isNaN(e) || e === "length") {
            this._saveStore(t), subscribers.forEach((f) => f(t));
            const h = (i = g._storeInstanceMap) == null ? void 0 : i.get(this._storeName), d = (c = h == null ? void 0 : h._storeWatchers) == null ? void 0 : c[e];
            d && d.forEach((f) => {
              var u;
              f(a, (u = h._getRuntime) == null ? void 0 : u.call(h, document.body));
            });
          }
          return !0;
        },
        get: (t, e) => t[e]
      }
    ), setTimeout(() => this._runQueue(), 0);
  }
  text(o, s) {
    const r = this.root.querySelector(`[r-text="${o}"]`) || this.root.querySelector(`[data-r-text="${o}"]`);
    r && (r.textContent = s);
  }
  loop() {
    const o = this.root.querySelector("[r-loop]");
    if (!o) return { effect: () => {
    }, click: () => {
    } };
    const s = o.parentElement, r = o.cloneNode(!0), t = [], e = {
      effect: (a, i = []) => {
        const c = (h) => {
          s.querySelectorAll("[data-r-loop-item]").forEach((d) => d.remove()), h.forEach((d, f) => {
            const u = r.cloneNode(!0);
            u.removeAttribute("r-loop"), u.setAttribute("data-r-loop-item", ""), u.setAttribute("data-r-item", JSON.stringify(d)), i.forEach((_) => {
              const m = u.querySelector(`[r-text="${_}"]`);
              m && (m.textContent = d[_]);
            }), t.forEach(({ selector: _, handler: m }) => {
              u.querySelectorAll(_).forEach((E) => {
                E.addEventListener("click", () => {
                  const w = this._getRuntime(E);
                  m(f, w);
                });
              });
            }), s.appendChild(u);
          });
        };
        return a != null && a.__subscribe && a.__subscribe(c), c(a), o.remove(), e;
      },
      click: (a) => (i) => (t.push({ selector: a, handler: i }), e)
    };
    return e;
  }
  _initStore(o) {
    let s = null;
    if (this._useLocalStorage) {
      const a = localStorage.getItem(this._storeName);
      if (a)
        try {
          s = JSON.parse(a);
        } catch {
          console.warn(
            "📚 Recipe Failed to parse localStorage for store:",
            this._storeName
          );
        }
    }
    const r = s || o, t = [], e = new Proxy([...r], {
      set: (a, i, c) => {
        var h;
        if (a[i] = c, !isNaN(i) || i === "length") {
          this._saveStore(a), t.forEach((f) => f(a));
          const d = (h = this._storeWatchers) == null ? void 0 : h[i];
          d && d.forEach((f) => {
            var u;
            f(c, (u = this._getRuntime) == null ? void 0 : u.call(this, document.body));
          });
        }
        return !0;
      },
      get: (a, i) => i === "__subscribe" ? (c) => t.push(c) : a[i]
    });
    return this._saveStore(e), e;
  }
  _saveStore(o) {
    this._useLocalStorage && localStorage.setItem(this._storeName, JSON.stringify(o));
  }
  bindMouseEvent(o) {
    const s = this;
    return (r) => (s.queue.push(() => {
      (o ? s.root.querySelectorAll(o) : [s.root]).forEach((e, a) => {
        if (!e) {
          console.warn(`📚 Recipe Element not found: ${o}`);
          return;
        }
        e.addEventListener("click", () => {
          const i = s._getRuntime(e);
          r(i, a);
        });
      });
    }), s);
  }
  click(o) {
    return this.bindMouseEvent(o);
  }
  mouseover(o) {
    return this.bindMouseEvent(o);
  }
  mouseout(o) {
    return this.bindMouseEvent(o);
  }
  watch(o, s) {
    this.watchers[o] = (r, t) => s(r, t);
  }
  _runQueue() {
    this.queue.forEach((o) => o()), this.queue = [];
  }
  _getRuntime(o) {
    const s = this;
    return {
      el: o,
      class: {
        add: (r) => o.classList.add(r),
        remove: (r) => o.classList.remove(r)
      },
      q(r) {
        const t = s.root || document;
        return b(t.querySelectorAll(r), s);
      },
      data: {
        set: (r, t) => {
          var e;
          s._state[r] = t, o == null || o.setAttribute(`data-${r}`, t), (e = s._stateWatchers) != null && e[r] && s._stateWatchers[r].forEach((a) => a(t));
        },
        get: (r) => s._state[r],
        watch: (r) => (t) => {
          var e;
          s._stateWatchers ?? (s._stateWatchers = {}), (e = s._stateWatchers)[r] ?? (e[r] = []), s._stateWatchers[r].push(t);
        }
      },
      parent(r) {
        const t = r ? o.closest(r) : o.parentElement;
        return {
          data: {
            set: (e, a) => {
              var i;
              s._state[e] = a, t == null || t.setAttribute(`data-${e}`, a), (i = s._stateWatchers) != null && i[e] && s._stateWatchers[e].forEach((c) => c(a));
            },
            get: (e) => s._state[e],
            watch: (e) => (a) => {
              var i;
              s._stateWatchers ?? (s._stateWatchers = {}), (i = s._stateWatchers)[e] ?? (i[e] = []), s._stateWatchers[e].push(a);
            }
          }
        };
      },
      getItem() {
        var t;
        const r = o.getAttribute("data-r-item") || ((t = o.closest("[data-r-item]")) == null ? void 0 : t.getAttribute("data-r-item"));
        try {
          return r ? JSON.parse(r) : null;
        } catch {
          return console.warn("📚 Recipe Failed to parse data-r-item:", r), null;
        }
      }
    };
  }
};
S(g, "store", /* @__PURE__ */ new Map());
let l = g;
const A = {};
function b(n, o) {
  const s = (o == null ? void 0 : o._stateWatchers) ?? A;
  return {
    class: {
      add(r) {
        return n.forEach((t) => t.classList.add(r)), this;
      },
      remove(r) {
        return n.forEach((t) => t.classList.remove(r)), this;
      },
      toggle(r) {
        return n.forEach((t) => t.classList.toggle(r)), this;
      }
    },
    data: {
      set(r, t) {
        return n.forEach((e) => {
          e.setAttribute(`data-${r}`, t), s != null && s[r] && s[r].forEach((a) => a(t));
        }), this;
      },
      get(r) {
        var t;
        return (t = n[0]) == null ? void 0 : t.getAttribute(`data-${r}`);
      },
      watch(r) {
        return (t) => {
          s[r] ?? (s[r] = []), s[r].push(t);
        };
      }
    },
    click(r) {
      return n.forEach(
        (t) => t.addEventListener("click", (e) => r(e, t))
      ), this;
    },
    mouseover(r) {
      return n.forEach(
        (t) => t.addEventListener("mouseover", (e) => r(e, t))
      ), this;
    },
    mouseout(r) {
      return n.forEach(
        (t) => t.addEventListener("mouseout", (e) => r(e, t))
      ), this;
    },
    eq(r) {
      const t = n[r];
      return {
        el: t,
        class: {
          add: (e) => (t == null || t.classList.add(e), this),
          remove: (e) => (t == null || t.classList.remove(e), this),
          toggle: (e) => (t == null || t.classList.toggle(e), this)
        },
        text(e, a) {
          const i = (t == null ? void 0 : t.querySelector(`[r-text="${e}"]`)) || (t == null ? void 0 : t.querySelector(`[data-r-text="${e}"]`));
          i && (i.textContent = a);
        },
        data: {
          set: (e, a) => (t == null || t.setAttribute(`data-${e}`, a), s != null && s[e] && s[e].forEach((i) => i(a)), this),
          get: (e) => t == null ? void 0 : t.getAttribute(`data-${e}`),
          watch: (e) => (a) => {
            s[e] ?? (s[e] = []), s[e].push(a);
          }
        }
      };
    },
    text(r, t) {
      n.forEach((e) => {
        if (e.getAttribute("r-text") === r || e.getAttribute("data-r-text") === r) {
          e.textContent = t;
          return;
        }
        const a = e.querySelector(`[r-text="${r}"]`) || e.querySelector(`[data-r-text="${r}"]`);
        a && (a.textContent = t);
      });
    }
  };
}
const L = {
  q(n) {
    return b(document.querySelectorAll(n));
  },
  getItem() {
    return null;
  }
};
typeof window < "u" && (window.Recipe = l, window.$r = L);
export {
  l as Recipe
};
