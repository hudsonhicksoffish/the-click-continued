import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from './Header';
import { GameProvider } from '../contexts/GameContext';

describe('Header', () => {
  it('renders the header with logo and navigation buttons', () => {
    render(
      <GameProvider>
        <Header />
      </GameProvider>
    );

    // Check for text elements
    expect(screen.getByText('THE')).toBeInTheDocument();
    expect(screen.getByText('CLICK')).toBeInTheDocument();

    // Check for the pixelated X by looking at its container's role
    const pixelatedXContainer = document.querySelector('.flex.items-center div.inline-block');
    expect(pixelatedXContainer).toBeInTheDocument();

    // Check for aria labels of buttons
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    expect(screen.getByLabelText('How to Play')).toBeInTheDocument();
    expect(screen.getByLabelText('User Profile')).toBeInTheDocument();
  });
});