import type { Preview } from '@storybook/nextjs'
import '../src/app/globals.css';
import React from 'react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for all components',
      defaultValue: 'light-theme',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light-theme', title: 'Light' },
          { value: 'dark-theme', title: 'Dark' },
        ],
      },
    }
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme
      const ref = React.useRef<HTMLDivElement>(null);

      React.useEffect(() => {
        const el = ref.current;
        if (!el) return;

        el.classList.add('theme-transition');

        const timeout = setTimeout(() => {
          el.classList.remove('theme-transition');
        }, 250);

        return () => clearTimeout(timeout);
      }, [theme]);

      return (
      <div className={theme} ref={ref}>
        <Story/>
      </div>
    )}
  ]
};

export default preview;