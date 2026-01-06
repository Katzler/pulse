import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';

/**
 * Size variant for the gauge
 */
export type GaugeSize = 'small' | 'medium' | 'large';

/**
 * Props for HealthScoreGauge component
 */
export interface HealthScoreGaugeProps {
  /** Health score value (0-100) */
  score: number | null;
  /** Size variant */
  size?: GaugeSize;
  /** Whether to show classification label */
  showLabel?: boolean;
  /** Whether to show numeric value */
  showValue?: boolean;
  /** Whether to animate on load */
  animated?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * Size configurations
 */
const sizeConfig = {
  small: { width: 80, height: 50, fontSize: 16, labelSize: 10, strokeWidth: 6 },
  medium: { width: 160, height: 100, fontSize: 28, labelSize: 14, strokeWidth: 10 },
  large: { width: 240, height: 150, fontSize: 42, labelSize: 18, strokeWidth: 14 },
};

/**
 * Health classification thresholds
 */
function getHealthClassification(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score >= 70) {
    return { label: 'Healthy', color: '#22C55E', bgColor: 'bg-green-100' };
  }
  if (score >= 30) {
    return { label: 'At Risk', color: '#F59E0B', bgColor: 'bg-orange-100' };
  }
  return { label: 'Critical', color: '#EF4444', bgColor: 'bg-red-100' };
}

/**
 * Get color for a specific score value (for gradient effect)
 */
function getScoreColor(score: number): string {
  if (score >= 70) return '#22C55E';
  if (score >= 30) return '#F59E0B';
  return '#EF4444';
}

/**
 * Calculate arc path for SVG
 */
function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(' ');
}

/**
 * Convert polar coordinates to cartesian
 */
function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

/**
 * HealthScoreGauge displays a semicircle gauge showing customer health score.
 * Features color-coded zones, score value, and classification label.
 *
 * @example
 * <HealthScoreGauge score={72} size="medium" />
 *
 * @example
 * <HealthScoreGauge score={null} showLabel={false} />
 */
export function HealthScoreGauge({
  score,
  size = 'medium',
  showLabel = true,
  showValue = true,
  animated = true,
  className = '',
}: HealthScoreGaugeProps): JSX.Element {
  // Clamp score to valid range
  const clampedScore = score === null ? null : Math.max(0, Math.min(100, score));

  // Calculate initial display value
  const getInitialDisplayScore = () => {
    if (!animated) return clampedScore ?? 0;
    return 0;
  };

  const [displayScore, setDisplayScore] = useState(getInitialDisplayScore);
  const animationRef = useRef<number | null>(null);
  const startValueRef = useRef(displayScore);
  const config = sizeConfig[size];

  // Animate score on mount or change
  useEffect(() => {
    // Cancel any existing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Handle non-animated or null score
    if (!animated || clampedScore === null) {
      // Use a microtask to avoid synchronous setState in effect
      queueMicrotask(() => {
        setDisplayScore(clampedScore ?? 0);
      });
      return;
    }

    const duration = 1000;
    const startTime = Date.now();
    const startValue = startValueRef.current;
    const endValue = clampedScore;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOut;
      const roundedValue = Math.round(currentValue);

      setDisplayScore(roundedValue);
      startValueRef.current = roundedValue;

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [clampedScore, animated]);

  // Calculate dimensions
  const centerX = config.width / 2;
  const centerY = config.height - config.strokeWidth / 2;
  const radius = Math.min(config.width / 2, config.height) - config.strokeWidth;

  // Arc calculations (180 degree arc for semicircle)
  const scoreAngle = clampedScore === null ? 0 : (clampedScore / 100) * 180;
  const displayAngle = animated ? (displayScore / 100) * 180 : scoreAngle;

  const backgroundArc = describeArc(centerX, centerY, radius, 0, 180);
  const foregroundArc = displayAngle > 0 ? describeArc(centerX, centerY, radius, 0, displayAngle) : '';

  const classification = clampedScore !== null ? getHealthClassification(clampedScore) : null;
  const currentColor = getScoreColor(displayScore);

  // Null/N/A state
  if (clampedScore === null) {
    return (
      <div
        className={`flex flex-col items-center ${className}`}
        data-testid="health-score-gauge"
        role="img"
        aria-label="Health score not available"
      >
        <svg
          width={config.width}
          height={config.height}
          viewBox={`0 0 ${config.width} ${config.height}`}
        >
          {/* Background arc */}
          <path
            d={backgroundArc}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
          />
          {/* N/A text */}
          <text
            x={centerX}
            y={centerY - config.fontSize / 2}
            textAnchor="middle"
            fontSize={config.fontSize}
            fontWeight="bold"
            fill="#9CA3AF"
          >
            N/A
          </text>
        </svg>
        {showLabel && (
          <span
            className="text-gray-500 mt-1"
            style={{ fontSize: config.labelSize }}
          >
            No data
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center ${className}`}
      data-testid="health-score-gauge"
      role="img"
      aria-label={`Health score: ${clampedScore} out of 100, ${classification?.label}`}
    >
      <svg
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
      >
        {/* Background arc - gray */}
        <path
          d={backgroundArc}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
        />

        {/* Colored zones indicator (optional - subtle background) */}
        <defs>
          <linearGradient id={`gauge-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.2" />
            <stop offset="30%" stopColor="#F59E0B" stopOpacity="0.2" />
            <stop offset="70%" stopColor="#22C55E" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Foreground arc - colored based on score */}
        {foregroundArc && (
          <path
            d={foregroundArc}
            fill="none"
            stroke={currentColor}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            style={{
              transition: animated ? 'stroke 0.3s ease' : undefined,
            }}
          />
        )}

        {/* Score markers */}
        {size !== 'small' && (
          <>
            {/* 0 marker */}
            <text
              x={config.strokeWidth}
              y={centerY + config.labelSize}
              fontSize={config.labelSize * 0.8}
              fill="#9CA3AF"
            >
              0
            </text>
            {/* 100 marker */}
            <text
              x={config.width - config.strokeWidth - config.labelSize}
              y={centerY + config.labelSize}
              fontSize={config.labelSize * 0.8}
              fill="#9CA3AF"
            >
              100
            </text>
          </>
        )}

        {/* Score value */}
        {showValue && (
          <text
            x={centerX}
            y={centerY - config.fontSize / 3}
            textAnchor="middle"
            fontSize={config.fontSize}
            fontWeight="bold"
            fill={currentColor}
            style={{
              transition: animated ? 'fill 0.3s ease' : undefined,
            }}
          >
            {displayScore}
          </text>
        )}
      </svg>

      {/* Classification label */}
      {showLabel && classification && (
        <span
          className="font-medium mt-1"
          style={{
            fontSize: config.labelSize,
            color: classification.color,
            transition: animated ? 'color 0.3s ease' : undefined,
          }}
        >
          {classification.label}
        </span>
      )}

      {/* Screen reader details */}
      <span className="sr-only">
        Health score is {clampedScore} out of 100.
        This is classified as {classification?.label}.
        {clampedScore >= 70 && 'Customer is in good health.'}
        {clampedScore >= 30 && clampedScore < 70 && 'Customer needs attention.'}
        {clampedScore < 30 && 'Customer is at critical risk.'}
      </span>
    </div>
  );
}
