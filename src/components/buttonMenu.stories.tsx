import type { Meta, StoryObj } from '@storybook/nextjs';
import ButtonMenu from './buttonMenu';
import React from 'react';

const meta = {
  title: 'ButtonMenu',
  component: ButtonMenu,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    text: {control: "text"},

  },
} satisfies Meta<typeof ButtonMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ButtonMenuTest: Story = {
  args: {
    open: true,
    text: "anon.myous@email.email.com",
    onClose: () => {},
    buttons: [
        {
            text: "Settings",
            icon: "Settings",
            href: "#"
        },
        {
            text: "Log Out",
            icon: "logout",
            onClick: () => {}
        }
    ]
  },
  render: (args) => {
    const [open, setOpen] = React.useState(true);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    return (
      <div style={{ position: "relative"}}>
        <button ref={buttonRef} style={{}} onClick={() => setOpen((o) => !o)}>
          Open menu
        </button>

        <ButtonMenu
          {...args} open={open} onClose={() => {setOpen(false)}}
        />
      </div>
    );
  },
};

export const ButtonMenuNoButtons: Story = {
  args: {
    open: true,
    text: "anon.myous@email.email.com",
    onClose: () => {},
  },
  render: (args) => {
    const [open, setOpen] = React.useState(true);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    return (
      <div style={{ position: "relative"}}>
        <button ref={buttonRef} style={{}} onClick={() => setOpen((o) => !o)}>
          Open menu
        </button>

        <ButtonMenu
          {...args} open={open} onClose={() => {setOpen(false)}}
        />
      </div>
    );
  },
};
