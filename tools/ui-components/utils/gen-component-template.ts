// component.tsx
export const component = (name: string): string => `
import React from 'react';

import { ${name}Props } from './types';

export const ${name} = (props: ${name}Props):JSX.Element => {
  return <div {...props}>Hello, I am a ${name} component</div>;
};
`;

// types.ts
export const type = (name: string): string => `
export interface ${name}Props {
  className?: string
}
`;

// component.test.tsx
export const test = (name: string): string => `
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ${name} } from '.';

describe('<${name} />', () => {
  it('should render ${name} correctly', () => {
    render<${name}>Test</${name}>;
    expect(screen.getByText('Test')).toBeInTheDocument();
});
`;

// component.stories.tsx
export const story = (name: string): string => `
import React from 'react';
import { Story } from '@storybook/react';
import { ${name}, ${name}Props } from '.';

const story = {
  title: 'Example/${name}',
  component: ${name},
  parameters: {
    controls: {
      include: ['className']
    }
  },
  argType: {
    className: { control: { type: 'text' } },
  }
};

const Template: Story<${name}Props> = args => {
  return <${name} {...args} />;
};

export const Default = Template.bind({});
Default.args = {
  // default props go here
};

export default story;
`;

// index.ts
export const barrel = (name: string, kebabCasedName: string): string => `
export { ${name} } from './${kebabCasedName}';
export type { ${name}Props } from './types';
`;
