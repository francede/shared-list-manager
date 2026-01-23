import type { Meta, StoryObj } from '@storybook/nextjs';
import Spinner from './spinner';

const meta = {
  title: 'Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const spinner: Story = {
};
