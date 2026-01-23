import type { Meta, StoryObj } from '@storybook/nextjs';
import ListView from './listView';

const meta = {
  title: 'List View',
  component: ListView,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ListView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NonDraggable: Story = {
    args: {
        list: [{
            id: "1001",
            text: "Test 1",
            checked: false,
        },
        {
            id: "1002",
            text: "Test 2",
            checked: false,
            highlight: true
        },
        {
            id: "1003",
            text: "Test 3",
            checked: true,
        },
        {
            id: "1004",
            text: "Test 4",
            checked: true,
            highlight: true
        }],
        onClick: (itemId: string) => {},
        onDelete: (itemId: string) => {},
        onEdit: (itemId: string) => {},
        onUndo: (itemId: string) => {},
    }
};
