import React, { memo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";

export interface CuraLoadingAnimationProps {
  /** Logo size in pixels (default: 160) */
  size?: number;
  /** Optional loading text displayed below logo (default: "Loading...") */
  text?: string;
  /** Whether to show the loading text (default: true) */
  showText?: boolean;
  /** Fullscreen mode with clean white background (default: true) */
  fullScreen?: boolean;
  /** Custom background color (default: "#FFFFFF") */
  backgroundColor?: string;
  /** Custom style for the wrapper */
  style?: any;
}

// ── Exact SVG Path Definitions for CURA Shield Logo ───────────────────────────

/**
 * Continuous centerline travel path of the ribbon shield:
 * Starts at the top-right tip, sweeps clockwise along the top curve to the left,
 * flows down the left flank, and curves around to the bottom-right tip.
 */
const RIBBON_DRAW_PATH =
  "M 355 20 C 369.2 21.7, 410.0 23.3, 440 30 C 470.0 36.7, 504.2 46.7, 535 60 " +
  "C 565.8 73.3, 601.2 90.8, 625 110 C 648.8 129.2, 669.2 154.2, 678 175 " +
  "C 686.8 195.8, 687.7 220.8, 678 235 C 668.3 249.2, 646.3 260.8, 620 260 " +
  "C 593.7 259.2, 556.7 245.0, 520 230 C 483.3 215.0, 441.7 190.8, 400 170 " +
  "C 358.3 149.2, 309.2 112.5, 270 105 C 230.8 97.5, 194.2 109.2, 165 125 " +
  "C 135.8 140.8, 113.8 169.2, 95 200 C 76.2 230.8, 58.2 273.3, 52 310 " +
  "C 45.8 346.7, 50.3 385.0, 58 420 C 65.7 455.0, 79.0 488.3, 98 520 " +
  "C 117.0 551.7, 142.5 582.5, 172 610 C 201.5 637.5, 237.8 664.7, 275 685 " +
  "C 312.2 705.3, 356.2 727.8, 395 732 C 433.8 736.2, 472.2 725.0, 508 710 " +
  "C 543.8 695.0, 583.0 667.0, 610 642 C 637.0 617.0, 659.7 588.3, 670 560 " +
  "C 680.3 531.7, 680.3 492.8, 672 472 C 663.7 451.2, 641.2 435.7, 620 435 " +
  "C 598.8 434.3, 566.7 450.5, 545 468 C 523.3 485.5, 499.2 528.0, 490 540";

/**
 * Top ribbon wing and fold contour.
 */
const PATH_TOP_RIBBON =
  "M 385 16 C 390.8 16.0, 442.2 24.3, 490 41 C 537.8 57.7, 582.0 82.8, 620 116 " +
  "C 658.0 149.2, 689.8 190.5, 706 237 C 714.2 260.5, 715.0 274.5, 708 285 " +
  "C 701.0 295.5, 687.0 299.8, 671 297 C 655.0 294.2, 637.0 284.3, 622 268 " +
  "C 607.0 251.7, 595.0 229.0, 588 202 C 581.0 175.0, 579.0 143.7, 579 110 " +
  "C 579 76.3, 581.0 40.2, 585 18 C 572.0 18.0, 520.0 23.0, 460 35 " +
  "C 400.0 47.0, 332.0 66.0, 280 92 C 298.0 70.0, 338.0 38.0, 385 16 Z";

/**
 * Main C-shield outer ribbon body contour.
 */
const PATH_MAIN_SHIELD =
  "M 202 145 C 160.0 167.0, 118.0 206.0, 85 258 C 52.0 310.0, 44.0 368.0, 44 425 " +
  "C 44.0 482.0, 56.0 538.0, 88 592 C 120.0 646.0, 172.0 698.0, 240 735 " +
  "C 308.0 772.0, 392.0 782.0, 470 765 C 548.0 748.0, 620.0 704.0, 675 640 " +
  "C 682.0 632.0, 681.0 622.0, 672 616 C 663.0 610.0, 646.0 610.0, 630 616 " +
  "C 580.0 655.0, 515.0 682.0, 445 690 C 375.0 698.0, 300.0 687.0, 240 650 " +
  "C 180.0 613.0, 135.0 550.0, 115 480 C 95.0 410.0, 100.0 330.0, 125 260 " +
  "C 150.0 190.0, 195.0 140.0, 248 108 C 235.0 118.0, 218.0 131.0, 202 145 Z";

/**
 * Bottom-right ribbon loop with inner teardrop cutout.
 */
const PATH_BOTTOM_LOOP =
  "M 623 409 C 648.0 415.0, 674.0 435.0, 688 465 C 702.0 495.0, 704.0 535.0, 688 572 " +
  "C 672.0 609.0, 638.0 643.0, 595 660 C 552.0 677.0, 500.0 677.0, 455 658 " +
  "C 440.0 652.0, 436.0 640.0, 444 632 C 452.0 624.0, 468.0 622.0, 485 627 " +
  "C 518.0 638.0, 555.0 637.0, 585 622 C 615.0 607.0, 638.0 578.0, 646 545 " +
  "C 654.0 512.0, 647.0 475.0, 627 452 C 612.0 435.0, 592.0 428.0, 572 432 " +
  "C 552.0 436.0, 532.0 451.0, 515 472 C 500.0 490.0, 492.0 512.0, 490 535 " +
  "C 488.0 545.0, 480.0 550.0, 472 546 C 464.0 542.0, 462.0 530.0, 466 518 " +
  "C 472.0 490.0, 486.0 462.0, 508 440 C 530.0 418.0, 560.0 405.0, 592 405 " +
  "C 602.0 405.0, 613.0 406.0, 623 409 Z " +
  // Inner teardrop hole cutout (evenodd rule)
  "M 619 470 C 622.0 471.0, 624.0 476.0, 623 496 C 614.0 516.0, 599.0 536.0, 565 567 " +
  "C 534.0 588.0, 531.0 587.0, 584 503 C 604.0 480.0, 618.0 471.0, 619 470 Z";

/**
 * Exact medical "+" cross at the center of the shield (center: 370, 364),
 * identical in proportions and corner-radius to the CURA app logo.
 */
const PATH_PLUS_CROSS =
  "M 341 233 H 399 A 12 12 0 0 1 411 245 V 311 A 12 12 0 0 0 423 323 H 494 " +
  "A 12 12 0 0 1 506 335 V 393 A 12 12 0 0 1 494 405 H 423 A 12 12 0 0 0 411 417 " +
  "V 483 A 12 12 0 0 1 399 495 H 341 A 12 12 0 0 1 329 483 V 417 A 12 12 0 0 0 317 405 " +
  "H 246 A 12 12 0 0 1 234 393 V 335 A 12 12 0 0 1 246 323 H 317 A 12 12 0 0 0 329 311 " +
  "V 245 A 12 12 0 0 1 341 233 Z";

/**
 * Production-ready CURA Loading Page Animation Component
 *
 * Recreates the authentic light-blue ribbon-style "C" shield with:
 * 1. Trim-path continuous stroke drawing animation for the outer ribbon (from top-right tip
 *    clockwise around to bottom-right tip, holds ~0.5s, then retracts/fades and loops).
 * 2. Unaltered continuous rotating spinner animation for the medical "+" cross (1.8s linear infinite).
 * 3. 60fps smooth CSS keyframes, zero heavy external animation dependencies.
 * 4. Responsive ~160px size on clean white background with optional "Loading..." text below.
 */
export const CuraLoadingAnimation = memo(function CuraLoadingAnimation({
  size = 160,
  text = "Loading...",
  showText = true,
  fullScreen = true,
  backgroundColor = "#FFFFFF",
  style,
}: CuraLoadingAnimationProps) {
  // Web / Browser implementation with hardware-accelerated CSS animations
  if (Platform.OS === "web") {
    return (
      <div
        style={{
          width: fullScreen ? "100%" : "auto",
          height: fullScreen ? "100%" : "auto",
          minHeight: fullScreen ? ("100dvh" as any) : "auto",
          backgroundColor,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          boxSizing: "border-box",
          ...(style || {}),
        }}
      >
        <style>{`
          /* 1) Medical "+" Cross continuous 360-degree rotation (unaltered 1.8s linear) */
          @keyframes curaPlusSpin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          /* 2) Ribbon stroke-drawing trim-path animation (2.5s cycle)
             - 0% - 62% (~1.55s): Draws smoothly from top-right tip clockwise to bottom-right
             - 62% - 82% (~0.5s): Holds fully formed shield
             - 82% - 100% (~0.45s): Smoothly retracts / fades out before restarting loop
          */
          @keyframes curaRibbonDrawMask {
            0% {
              stroke-dashoffset: 1;
              opacity: 1;
            }
            62% {
              stroke-dashoffset: 0;
              opacity: 1;
            }
            82% {
              stroke-dashoffset: 0;
              opacity: 1;
            }
            96%, 100% {
              stroke-dashoffset: 0;
              opacity: 0;
            }
          }

          /* 3) Luminous liquid accent stroke following ribbon centerline */
          @keyframes curaRibbonAccentFlow {
            0% {
              stroke-dashoffset: 1;
              opacity: 0;
            }
            8% {
              opacity: 1;
            }
            62% {
              stroke-dashoffset: 0;
              opacity: 0.9;
            }
            82% {
              stroke-dashoffset: 0;
              opacity: 0.85;
            }
            96%, 100% {
              stroke-dashoffset: 0;
              opacity: 0;
            }
          }

          /* 4) Subtle breathing pulse for loading text */
          @keyframes curaTextPulse {
            0%, 100% {
              opacity: 0.55;
              transform: scale(0.99);
            }
            50% {
              opacity: 0.95;
              transform: scale(1.01);
            }
          }

          .cura-loading-svg {
            display: block;
            overflow: visible;
            filter: drop-shadow(0 6px 14px rgba(2, 132, 199, 0.16));
            will-change: transform;
          }

          .cura-plus-cross-web {
            transform-origin: 370px 364px;
            animation: curaPlusSpin 1.8s linear infinite;
            will-change: transform;
          }

          .cura-draw-mask-path {
            stroke-dasharray: 1;
            stroke-dashoffset: 1;
            animation: curaRibbonDrawMask 2.5s cubic-bezier(0.42, 0, 0.25, 1) infinite;
            will-change: stroke-dashoffset, opacity;
          }

          .cura-accent-flow-path {
            stroke-dasharray: 1;
            stroke-dashoffset: 1;
            animation: curaRibbonAccentFlow 2.5s cubic-bezier(0.42, 0, 0.25, 1) infinite;
            will-change: stroke-dashoffset, opacity;
          }

          .cura-loading-label {
            margin-top: 22px;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 2.2px;
            text-transform: uppercase;
            color: #4B9ECB;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Plus Jakarta Sans", Outfit, sans-serif;
            animation: curaTextPulse 2.5s ease-in-out infinite;
            user-select: none;
          }
        `}</style>

        {/* Inline SVG Logo recreating ribbon-style shield and rotating plus cross */}
        <svg
          className="cura-loading-svg"
          width={size}
          height={size}
          viewBox="0 0 760 760"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Top Ribbon & Fold Linear Gradient */}
            <linearGradient id="curaRibbonGradTop" x1="350" y1="20" x2="680" y2="240" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#BAE6FD" />
              <stop offset="35%" stopColor="#7BC0DF" />
              <stop offset="75%" stopColor="#5EACD2" />
              <stop offset="100%" stopColor="#4294BF" />
            </linearGradient>

            {/* Main C-Shield Body Linear Gradient */}
            <linearGradient id="curaRibbonGradMain" x1="100" y1="100" x2="400" y2="740" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#BAE6FD" />
              <stop offset="25%" stopColor="#7ABFE0" />
              <stop offset="55%" stopColor="#5EA8CF" />
              <stop offset="85%" stopColor="#4BA2CD" />
              <stop offset="100%" stopColor="#3B8CB6" />
            </linearGradient>

            {/* Bottom-Right Curl & Loop Linear Gradient */}
            <linearGradient id="curaRibbonGradBottom" x1="500" y1="450" x2="680" y2="650" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#BAE6FD" />
              <stop offset="40%" stopColor="#7ABFE0" />
              <stop offset="80%" stopColor="#5FADD3" />
              <stop offset="100%" stopColor="#4899C4" />
            </linearGradient>

            {/* Medical Plus Sign Gradient */}
            <linearGradient id="curaPlusGrad" x1="234" y1="232" x2="506" y2="494" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8AD2F5" />
              <stop offset="50%" stopColor="#7ABFE0" />
              <stop offset="100%" stopColor="#6CB6DC" />
            </linearGradient>

            {/* Soft Leading Flow Gradient along Centerline */}
            <linearGradient id="curaLeadingFlowGrad" x1="355" y1="20" x2="395" y2="732" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.95" />
              <stop offset="25%" stopColor="#BAE6FD" stopOpacity="0.85" />
              <stop offset="65%" stopColor="#7DD3FC" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.65" />
            </linearGradient>

            {/* SVG Mask: Controls progressive stroke-drawing of the ribbon */}
            <mask id="curaRibbonDrawMask" maskUnits="userSpaceOnUse" x="-50" y="-50" width="860" height="860">
              <path
                d={RIBBON_DRAW_PATH}
                fill="none"
                stroke="white"
                strokeWidth="140"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="1"
                className="cura-draw-mask-path"
              />
            </mask>
          </defs>

          {/* Group 1: Shaded Ribbon Outer Shape, dynamically revealed by stroke mask */}
          <g mask="url(#curaRibbonDrawMask)">
            {/* Main C-Shield Body */}
            <path d={PATH_MAIN_SHIELD} fill="url(#curaRibbonGradMain)" />

            {/* Top Ribbon Wing & Fold */}
            <path d={PATH_TOP_RIBBON} fill="url(#curaRibbonGradTop)" />

            {/* Bottom-Right Curl & Loop (with inner teardrop cutout) */}
            <path d={PATH_BOTTOM_LOOP} fill="url(#curaRibbonGradBottom)" fillRule="evenodd" />
          </g>

          {/* Group 2: Flowing Soft Spine Accent Stroke (gives the glowing train/flow effect) */}
          <path
            d={RIBBON_DRAW_PATH}
            fill="none"
            stroke="url(#curaLeadingFlowGrad)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="1"
            className="cura-accent-flow-path"
            style={{ mixBlendMode: "overlay", pointerEvents: "none" }}
          />

          {/* Group 3: Medical "+" Cross with Continuous 1.8s Linear Spin */}
          <g className="cura-plus-cross-web">
            <path d={PATH_PLUS_CROSS} fill="url(#curaPlusGrad)" />
          </g>
        </svg>

        {/* Optional "Loading..." text below */}
        {showText && <div className="cura-loading-label">{text}</div>}
      </div>
    );
  }

  // React Native Native fallback container
  return (
    <View
      style={[
        fullScreen && styles.fullScreenContainer,
        { backgroundColor },
        styles.centerContainer,
        style,
      ]}
    >
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        {/* Render fallback or web-compatible markup */}
        <Text style={{ color: "#4B9ECB", fontWeight: "600" }}>{text}</Text>
      </View>
    </View>
  );
});

export default CuraLoadingAnimation;

const styles = StyleSheet.create({
  fullScreenContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    zIndex: 9999,
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});
