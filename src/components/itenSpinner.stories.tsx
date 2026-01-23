import type { Meta, StoryObj } from '@storybook/nextjs';

import { fn } from 'storybook/test';
import ItemSpinner from './itemSpinner';


const meta = {
  title: 'ItemSpinner',
  component: ItemSpinner,
  parameters: {
    layout: 'centered',
  },
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    spinningState: { control: "radio", options: ["spinning", "done", "gone"] },
  },
} satisfies Meta<typeof ItemSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Spinner: Story = {
  args: {
    spinningState: "spinning",
  },
};
