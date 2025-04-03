import { Recipe } from './recipe';


new Recipe({store: {flush: ['basket']}}, [
    {
      selector: '.tab',
      steps: [
        { do: 'click', then: 'tw', to: '.tab-content', add: 'hidden' },
        { then: 'tw', to: '.tab', remove: 'bg-blue-500', add: 'bg-gray-200' },
        { then: 'tw', remove: 'hidden' },
        { then: 'tw', add: 'bg-blue-500', remove: 'bg-gray-200' }
      ]
    },
    {
      selector: '.add-to-cart',
      steps: [
        {
          do: 'click',
          then: 'store',
          store: 'basket',
          action: 'add',
          value: { id: 1, name: 'Awesome Product' }
        },
        {
          script: () => {
            const count = Recipe.store.get('basket', 'length');
            console.log('script!')
            Recipe.text('count', count);
          }
        },
        { then: 'tw', to: '.toast', remove: 'hidden' },
        { then: 'text', to: '.toast .message', text: 'Added "Awesome Product" to cart!' },
        { wait: 40 },
        { then: 'tw', to: '.toast', add: 'hidden' },
      ]
    },
    {
      selector: '.bookmark',
      steps: [
        {
          do: 'click',
          actions: [
            {
                then: 'store',
                store: 'bookmarks',
                action: 'toggle',
                value: Recipe.data.get()
            },
            { 
                then: 'tw', 
                to: '.toast', 
                toggle: 'hidden' 
            },
          ]
        },
        {
            do: 'mouseover',
            actions: [
              { 
                  then: 'tw', 
                  to: '.toast', 
                  toggle: 'ring-4 scale-75' 
              },
            ]
          },
         { then: 'tw', to: '.bookmark', add: 'text-yellow-500' }
      ]
    }
  ]);
  