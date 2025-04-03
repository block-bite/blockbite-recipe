export class Recipe {
  constructor(selector) {
    this.root = document.querySelector(selector);
    this.queue = [];
    this.bindings = {};
    this.watchers = {};
    this._state = {};

    // Reactive store
    this.store = new Proxy(
      {},
      {
        set: (obj, key, value) => {
          obj[key] = value;
          if (this.watchers[key]) {
            const runtime = this._getRuntime(this.root);
            this.watchers[key](value, runtime);
          }
          return true;
        },
        get: (obj, key) => obj[key],
      }
    );

    // Run setup after DOM is ready
    setTimeout(() => this._runQueue(), 0);
  }

  click(selector) {
    const ctx = this;

    const wrapper = (handler) => {
      ctx.queue.push(() => {
        const elements = ctx.root.querySelectorAll(selector);
        elements.forEach((el, index) => {
          el.addEventListener("click", () => {
            const R = ctx._getRuntime(el);
            handler(index, R); // Always pass index, R
            if (wrapper._label) {
              ctx._dispatch(wrapper._label, index, R);
            }
          });
        });
      });
      return wrapper;
    };

    wrapper.label = function (labelName) {
      wrapper._label = labelName;
      return wrapper;
    };

    return wrapper;
  }

  bind(label, handler) {
    this.bindings[label] = (payload, R) => {
      handler(payload, R);
    };
  }

  watch(key, handler) {
    this.watchers[key] = (value, R) => {
      handler(value, R);
    };
  }

  _dispatch(label, payload, R) {
    if (this.bindings[label]) {
      this.bindings[label](payload, R);
    }
  }

  _runQueue() {
    this.queue.forEach((fn) => fn());
    this.queue = [];
  }

  _getRuntime(el) {
    const ctx = this;
    return {
      el,
      class: {
        add: (cls) => el.classList.add(cls),
        remove: (cls) => el.classList.remove(cls),
      },
      q(selector) {
        return wrap(ctx.root.querySelectorAll(selector));
      },
      parent: {
        data: {
          set: (key, value) => {
            ctx.store[key] = value;
            ctx.root.setAttribute(`data-${key}`, value); // ✨ update DOM attribute
          },
          get: (key) => ctx.store[key],
        },
      },
    };
  }
}

// Utility for working with multiple DOM elements
function wrap(elements) {
  return {
    class: {
      add: (cls) => elements.forEach((el) => el.classList.add(cls)),
      remove: (cls) => elements.forEach((el) => el.classList.remove(cls)),
    },
    eq(i) {
      const el = elements[i];
      return {
        class: {
          add: (cls) => el?.classList.add(cls),
          remove: (cls) => el?.classList.remove(cls),
        },
      };
    },
  };
}
