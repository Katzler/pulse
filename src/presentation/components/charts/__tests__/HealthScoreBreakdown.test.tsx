import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { HealthScoreBreakdownDTO } from '@application/dtos';

import { HealthScoreBreakdown } from '../HealthScoreBreakdown';

const mockBreakdown: HealthScoreBreakdownDTO = {
  totalScore: 75,
  activityScore: 30,
  loginRecencyScore: 20,
  channelAdoptionScore: 15,
  accountTypeScore: 5,
  mrrScore: 5,
  sentimentAdjustment: 0,
};

describe('HealthScoreBreakdown', () => {
  describe('rendering', () => {
    it('renders the breakdown container', () => {
      render(<HealthScoreBreakdown breakdown={mockBreakdown} />);

      expect(screen.getByTestId('health-score-breakdown')).toBeInTheDocument();
    });

    it('renders all five health factors', () => {
      render(<HealthScoreBreakdown breakdown={mockBreakdown} />);

      expect(screen.getByTestId('factor-activityScore')).toBeInTheDocument();
      expect(screen.getByTestId('factor-loginRecencyScore')).toBeInTheDocument();
      expect(screen.getByTestId('factor-channelAdoptionScore')).toBeInTheDocument();
      expect(screen.getByTestId('factor-accountTypeScore')).toBeInTheDocument();
      expect(screen.getByTestId('factor-mrrScore')).toBeInTheDocument();
    });

    it('displays factor labels', () => {
      render(<HealthScoreBreakdown breakdown={mockBreakdown} />);

      expect(screen.getByText('Activity Status')).toBeInTheDocument();
      expect(screen.getByText('Login Recency')).toBeInTheDocument();
      expect(screen.getByText('Channel Adoption')).toBeInTheDocument();
      expect(screen.getByText('Account Type')).toBeInTheDocument();
      expect(screen.getByText('MRR Value')).toBeInTheDocument();
    });

    it('displays factor scores', () => {
      render(<HealthScoreBreakdown breakdown={mockBreakdown} />);

      expect(screen.getByTestId('score-activityScore')).toHaveTextContent('30');
      expect(screen.getByTestId('score-loginRecencyScore')).toHaveTextContent('20');
      expect(screen.getByTestId('score-channelAdoptionScore')).toHaveTextContent('15');
      expect(screen.getByTestId('score-accountTypeScore')).toHaveTextContent('5');
      expect(screen.getByTestId('score-mrrScore')).toHaveTextContent('5');
    });

    it('displays total score', () => {
      render(<HealthScoreBreakdown breakdown={mockBreakdown} />);

      expect(screen.getByTestId('total-health-score')).toHaveTextContent('75');
    });

    it('renders factor legend', () => {
      render(<HealthScoreBreakdown breakdown={mockBreakdown} />);

      expect(screen.getByTestId('factor-legend')).toBeInTheDocument();
    });
  });

  describe('health classifications', () => {
    it('shows Healthy label for score >= 70', () => {
      render(<HealthScoreBreakdown breakdown={{ ...mockBreakdown, totalScore: 75 }} />);

      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    it('shows At Risk label for score 30-69', () => {
      render(<HealthScoreBreakdown breakdown={{ ...mockBreakdown, totalScore: 50 }} />);

      expect(screen.getByText('At Risk')).toBeInTheDocument();
    });

    it('shows Critical label for score < 30', () => {
      render(<HealthScoreBreakdown breakdown={{ ...mockBreakdown, totalScore: 20 }} />);

      expect(screen.getByText('Critical')).toBeInTheDocument();
    });

    it('shows boundary case at 70 as Healthy', () => {
      render(<HealthScoreBreakdown breakdown={{ ...mockBreakdown, totalScore: 70 }} />);

      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    it('shows boundary case at 30 as At Risk', () => {
      render(<HealthScoreBreakdown breakdown={{ ...mockBreakdown, totalScore: 30 }} />);

      expect(screen.getByText('At Risk')).toBeInTheDocument();
    });

    it('shows boundary case at 29 as Critical', () => {
      render(<HealthScoreBreakdown breakdown={{ ...mockBreakdown, totalScore: 29 }} />);

      expect(screen.getByText('Critical')).toBeInTheDocument();
    });
  });

  describe('progress bars', () => {
    it('renders progress bars with correct aria attributes', () => {
      render(<HealthScoreBreakdown breakdown={mockBreakdown} />);

      const progressBars = screen.getAllByRole('progressbar');
      // 5 factor bars + 1 total bar = 6
      expect(progressBars.length).toBe(6);
    });

    it('has correct aria-label for activity score bar', () => {
      render(<HealthScoreBreakdown breakdown={mockBreakdown} />);

      const activityBar = screen.getByRole('progressbar', {
        name: /activity status: 30 out of 30/i,
      });
      expect(activityBar).toBeInTheDocument();
    });

    it('has correct aria-label for total score bar', () => {
      render(<HealthScoreBreakdown breakdown={mockBreakdown} />);

      const totalBar = screen.getByRole('progressbar', {
        name: /total health score: 75 out of 100/i,
      });
      expect(totalBar).toBeInTheDocument();
    });
  });

  describe('descriptions', () => {
    it('does not show descriptions by default', () => {
      render(<HealthScoreBreakdown breakdown={mockBreakdown} />);

      expect(
        screen.queryByText(/based on customer active\/inactive status/i)
      ).not.toBeInTheDocument();
    });

    it('shows descriptions when showDescriptions is true', () => {
      render(<HealthScoreBreakdown breakdown={mockBreakdown} showDescriptions />);

      expect(
        screen.getByText(/based on customer active\/inactive status/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/based on days since last login/i)).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles zero scores', () => {
      const zeroBreakdown: HealthScoreBreakdownDTO = {
        totalScore: 0,
        activityScore: 0,
        loginRecencyScore: 0,
        channelAdoptionScore: 0,
        accountTypeScore: 0,
        mrrScore: 0,
        sentimentAdjustment: 0,
      };

      render(<HealthScoreBreakdown breakdown={zeroBreakdown} />);

      expect(screen.getByTestId('total-health-score')).toHaveTextContent('0');
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });

    it('handles maximum scores', () => {
      const maxBreakdown: HealthScoreBreakdownDTO = {
        totalScore: 100,
        activityScore: 30,
        loginRecencyScore: 25,
        channelAdoptionScore: 20,
        accountTypeScore: 15,
        mrrScore: 10,
        sentimentAdjustment: 0,
      };

      render(<HealthScoreBreakdown breakdown={maxBreakdown} />);

      expect(screen.getByTestId('total-health-score')).toHaveTextContent('100');
      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessible region role', () => {
      render(<HealthScoreBreakdown breakdown={mockBreakdown} />);

      expect(
        screen.getByRole('region', { name: /health score breakdown/i })
      ).toBeInTheDocument();
    });

    it('has screen reader summary', () => {
      render(<HealthScoreBreakdown breakdown={mockBreakdown} />);

      // Find status with the sr-only class (hidden from visual but accessible to SR)
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent(/total score 75 out of 100/i);
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      render(
        <HealthScoreBreakdown breakdown={mockBreakdown} className="custom-breakdown" />
      );

      expect(screen.getByTestId('health-score-breakdown')).toHaveClass(
        'custom-breakdown'
      );
    });
  });

  describe('legend', () => {
    it('shows max points for each factor', () => {
      render(<HealthScoreBreakdown breakdown={mockBreakdown} />);

      const legend = screen.getByTestId('factor-legend');
      expect(legend).toHaveTextContent('30pts');
      expect(legend).toHaveTextContent('25pts');
      expect(legend).toHaveTextContent('20pts');
      expect(legend).toHaveTextContent('15pts');
      expect(legend).toHaveTextContent('10pts');
    });
  });
});
