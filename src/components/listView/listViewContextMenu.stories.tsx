import type { Meta, StoryObj } from '@storybook/nextjs';
import { ListViewContextMenu } from './listView';

const meta = {
  title: 'List View',
  component: ListViewContextMenu,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ListViewContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ContextMenu: Story = {
    args: {
        contextButtons: [
            {
                icon: "edit",
                onClick: () => {}
            },
            {
                icon: "delete",
                onClick: () => {}
            },
            {
                icon: "undo",
                onClick: () => {}
            }
        ],
        onOutsideClick: () => {}
    }
};
