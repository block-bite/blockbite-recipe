export class Recipe {
  constructor(config = {}, scenarios = []) {
    this.state = {};
    this.scenarios = scenarios;
    this.config = config;

    if (config?.store?.flush?.length) {
      config.store.flush.forEach(key => localStorage.removeItem(key));
    }

    this.bindAllFromSelectors();
    this.bindAllFromDataAttribute();
  }

  bindAllFromSelectors() {
    this.scenarios.forEach(({ selector, steps }) => {
      document.querySelectorAll(selector).forEach((el) => {
        this.bindScenario(el, steps);
      });
    });
  }

  bindAllFromDataAttribute() {
    document.querySelectorAll('[data-recipe]').forEach((el) => {
      try {
        const steps = JSON.parse(el.getAttribute('data-recipe'));
        this.bindScenario(el, steps);
      } catch (e) {
        // silently ignore
      }
    });
  }

  bindScenario(el, steps) {
    steps.forEach((step) => {
      if (!step.do) return;
      const actions = step.actions || [step];
      el.addEventListener(step.do, () => {
        console.log(`[Recipe] '${step.do}' triggered on`, el);
        this.runSteps(el, actions);
      });
      
    });
  }

  async runSteps(el, steps) {
    for (const step of steps) {
      if (step.wait) {
        await this.wait(step.wait);
      } else if (step.script) {
        await this.runScript(step.script);
      } else if (step.then) {
        await this.runAction(el, step);
        if (step.id && step.value !== undefined) {
          this.state[step.id] = step.value;
          Recipe.text(step.id, step.value);
        }
      }
    }
  }

  async runScript(refOrFn) {
    if (typeof refOrFn === 'function') {
      await refOrFn(this.state, localStorage);
    } else if (typeof refOrFn === 'string' && window.scriptHandlers?.[refOrFn]) {
      await window.scriptHandlers[refOrFn](this.state, localStorage);
    }

    Object.entries(this.state).forEach(([id, value]) => {
      Recipe.text(id, value);
    });
  }

  async runAction(el, step) {
    let target = el;
    if (step.to) {
      target = el.querySelector(step.to) || document.querySelector(step.to);
    } else if (el.dataset.target) {
      target = document.querySelector(el.dataset.target);
    }

    switch (step.then) {
      case 'tw':
        if (step.toggle) target?.classList.toggle(...step.toggle.split(' '));
        if (step.add) target?.classList.add(...step.add.split(' '));
        if (step.remove) target?.classList.remove(...step.remove.split(' '));
        if (step.tw) target?.classList.add(...step.tw.split(' '));
        break;

      case 'store':
        Recipe.store.set(step.store, step.action, step.value);
        break;

      case 'text':
        if (step.text) target.textContent = step.text;
        break;
    }

    if (step.id && step.value !== undefined) {
      this.state[step.id] = step.value;
      Recipe.text(step.id, step.value);
    }
  }

  wait(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  static text(id, value) {
    document.querySelectorAll(`[data-recipe\\.get="${id}"]`).forEach((el) => {
      el.textContent = value;
    });
  }

  static store = {
    get(key, prop) {
      try {
        const data = JSON.parse(localStorage.getItem(key)) || [];
        return prop !== undefined ? data?.[prop] : data;
      } catch (e) {
        console.warn(`Recipe.store.get(${key}) failed`, e);
        return undefined;
      }
    },

    set(key, action, item) {
      let value = [];
      try {
        value = JSON.parse(localStorage.getItem(key)) || [];
      } catch (e) {}

      switch (action) {
        case 'add':
          value.push(item);
          break;
        case 'delete':
          value = value.filter(p => p.id !== item.id);
          break;
        case 'update':
          value = value.map(p => (p.id === item.id ? item : p));
          break;
        case 'toggle': {
          const index = value.findIndex(p => p.id === item.id);
          if (index > -1) {
            value.splice(index, 1);
          } else {
            value.push(item);
          }
          break;
        }
      }

      localStorage.setItem(key, JSON.stringify(value));
    },

    delete(key) {
      localStorage.removeItem(key);
    }
  };

  static data = {
    get(ref) {
      if (ref) {
        const el = document.querySelector(`[data-recipe.get="${ref}"]`);
        return el?.textContent;
      }
      return this?.textContent || '';
    }
  };
}

window.Recipe = Recipe;