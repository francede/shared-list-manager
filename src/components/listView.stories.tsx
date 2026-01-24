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

export const listView: Story = {
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
        }],
        onClick: (itemId: string) => {
            console.log(itemId + " clicked")
        },
        onDelete: (itemId: string) => {
            console.log(itemId + " deleted")
        },
        onEdit: (itemId: string, text: string) => {
            console.log(itemId + " edited to " + text)
        },
        onUndo: (itemId: string) => {
            console.log(itemId + " undone")
        },
        onDrag: (itemId, newIndex) => {
            console.log(itemId + " dragged to i: " + newIndex)
        },
    }
};
