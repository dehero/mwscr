import { useLocation } from '@solidjs/router';
import type { Component } from 'solid-js';
import type { SiteRoute } from '../../../core/entities/site-route.js';
import type { ButtonProps } from '../Button/Button.js';
import { Button } from '../Button/Button.js';

export interface RouteButtonProps extends Omit<ButtonProps, 'href' | 'children' | 'active'> {
  route: SiteRoute;
}

export const RouteButton: Component<RouteButtonProps> = (props) => {
  const location = useLocation();

  return (
    <Button href={props.route.path} active={location.pathname === props.route.path}>
      {props.route.info.label}
    </Button>
  );
};
