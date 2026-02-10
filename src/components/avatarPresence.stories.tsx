import type { Meta, StoryObj } from '@storybook/nextjs';
import ItemSpinner from './itemSpinner';
import AvatarPresence from './avatarPresence';

const meta = {
  title: 'AvatarPresence',
  component: AvatarPresence,
  parameters: {
    layout: 'centered',
  },

} satisfies Meta<typeof AvatarPresence>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AvatarPresenceTest: Story = {
  args: {
    avatars: [
      {avatar: {color: "#FF0000", initial: "Fx"}, user: "userF@mail.com"},
      {avatar: {color: "#FFFF00", initial: "Fx"}, user: "userF@mail.com"},
      {avatar: {color: "#FF3333", initial: "Fx"}, user: "userawddwadsddddafcacF@mail.com"},
    ]
  },
};
