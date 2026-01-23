import type { Meta, StoryObj } from '@storybook/nextjs';
import ItemSpinner from './itemSpinner';

const meta = {
  title: 'ItemSpinner',
  component: ItemSpinner,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    spinningState: { control: "radio", options: ["spinning", "done", "gone"] },
  },
} satisfies Meta<typeof ItemSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const itemSpinner: Story = {
  args: {
    spinningState: "spinning",
  },
};
