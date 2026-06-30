import { Icon as IconifyIcon } from '@iconify/react';
import type { ComponentProps } from 'react';

type IconifyProps = ComponentProps<typeof IconifyIcon>;

export interface IconProps extends Omit<IconifyProps, 'icon'> {
  name: string;
}

/**
 * Iconify wrapper. Only `solar:` prefixed icons are recommended per design system.
 */
export function Icon({ name, width = 20, height = 20, ...rest }: IconProps) {
  return <IconifyIcon icon={name} width={width} height={height} {...rest} />;
}
