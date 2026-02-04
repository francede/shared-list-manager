import type { Meta, StoryObj } from '@storybook/nextjs';
import Toggle from './toggle';

const meta = {
  title: 'Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    toggled: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div style={{
        width: "200px", 
        height: "100px", 
        backgroundColor: "var(--primary-bg)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"}}>
        <Story/>
      </div>
    )
  ]
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ToggleTest: Story = {
  args: {
    toggled: false,
    iconOn: "light_mode",
    iconOff: "dark_mode",
    onToggle: () => {}
  },
};
