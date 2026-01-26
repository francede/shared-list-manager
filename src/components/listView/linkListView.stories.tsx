import type { Meta, StoryObj } from '@storybook/nextjs';
import { LinkListView } from './listView';

const meta = {
  title: 'List View',
  component: LinkListView,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof LinkListView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const linkListView: Story = {
    args: {
        list: [{
            text: "google",
            href: "https://google.com"
        }],
    }
};
