declare module "@blockbite/recipe" {
  export class Recipe {
    constructor(
      selectorOrStore: string,
      dataOrSetup?: any,
      options?: {
        name?: string;
        localStorage?: boolean;
      }
    );

    static store: Map<string, any>;
    static fromJSON(config: any): void;

    text(key: string, value: string): void;
    loop(): {
      effect(store: any, keys?: string[]): any;
      click(selector: string): (handler: (index: number, el: any) => void) => any;
    };
    click(selector?: string): (handler: (el: any, index: number) => void) => this;
    mouseover(selector?: string): (handler: (el: any, index: number) => void) => this;
    mouseout(selector?: string): (handler: (el: any, index: number) => void) => this;

    watch(key: string, handler: (value: any, runtime: any) => void): void;

    // internal, but usable
    _getRuntime(el: HTMLElement): {
      el: HTMLElement;
      class: {
        add: (cls: string) => void;
        remove: (cls: string) => void;
      };
      q: (selector: string) => any;
      data: {
        set: (key: string, value: any) => void;
        get: (key: string) => any;
        watch: (key: string) => (fn: (value: any) => void) => void;
      };
      parent: (
        selector?: string
      ) => {
        data: {
          set: (key: string, value: any) => void;
          get: (key: string) => any;
          watch: (key: string) => (fn: (value: any) => void) => void;
        };
      };
      getItem: () => any;
    };
  }

  export const $r: {
    q: (selector: string) => any;
    getItem: () => any;
  };
}
