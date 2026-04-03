import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const SIZE = width * 0.8;
const RADIUS = SIZE / 2 - 20;
const CENTER = SIZE / 2;

interface ArcData {
  startHour: number;
  endHour: number;
  color: string;
  label: string;
}

interface CircularClockProps {
  data?: ArcData[];
  progress?: number;
}

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  let diff = endAngle - startAngle;
  if (diff < 0) diff += 360;
  
  const start = polarToCartesian(x, y, radius, startAngle);
  const end = polarToCartesian(x, y, radius, endAngle);
  
  const largeArcFlag = diff > 180 ? '1' : '0';
  
  const d = [
    'M', x, y,
    'L', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y,
    'Z',
  ].join(' ');
  return d;
};

export const CircularClock: React.FC<CircularClockProps> = ({ data = [], progress = 0 }) => {
  const { colors } = useTheme();
  const hourToAngle = (hour: number) => (hour / 24) * 360;
  const INNER_CIRCLE_RADIUS = 35;

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.surface,
        shadowColor: colors.text
      }
    ]}>
      <Svg width={SIZE} height={SIZE}>
        <G>
          {/* Background Circle */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill={colors.surface}
            stroke={colors.border}
            strokeWidth="1"
          />
          
          {/* Hour Markers */}
          {[...Array(24)].map((_, i) => {
            const angle = hourToAngle(i);
            const p1 = polarToCartesian(CENTER, CENTER, RADIUS, angle);
            const p2 = polarToCartesian(CENTER, CENTER, RADIUS - 10, angle);
            const textPos = polarToCartesian(CENTER, CENTER, RADIUS + 15, angle);
            
            return (
              <G key={i}>
                <Path
                  d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                  stroke={colors.border}
                  strokeWidth={i % 6 === 0 ? "2" : "1"}
                />
                {i % 3 === 0 && (
                  <SvgText
                    x={textPos.x}
                    y={textPos.y + 5}
                    fill={colors.textSecondary}
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {i === 0 ? '24' : i}
                  </SvgText>
                )}
              </G>
            );
          })}

          {/* Schedule Arcs */}
          {data.map((item, index) => {
            const startAngle = hourToAngle(item.startHour);
            const endAngle = hourToAngle(item.endHour);
            const diff = (item.endHour - item.startHour + 24) % 24;

            const getLabelInfo = () => {
              const middleHour = (item.startHour + (diff / 2)) % 24;
              const middleAngle = hourToAngle(middleHour);
              const textRadius = (INNER_CIRCLE_RADIUS + RADIUS) / 2 + 5;
              const pos = polarToCartesian(CENTER, CENTER, textRadius, middleAngle);
              
              const charsPerLine = Math.floor(diff * 3.2); 
              let lines: string[] = [];
              const label = item.label;

              if (diff >= 1.5 && label.length > charsPerLine) {
                lines.push(label.substring(0, charsPerLine));
                const secondLine = label.substring(charsPerLine);
                lines.push(secondLine.length > charsPerLine ? secondLine.substring(0, Math.max(0, charsPerLine - 1)) + '..' : secondLine);
              } else {
                lines.push(label.length > charsPerLine ? label.substring(0, Math.max(0, charsPerLine - 1)) + '..' : label);
              }
              
              return { pos, lines, visible: diff >= 0.6 };
            };

            const labelInfo = getLabelInfo();

            if (diff >= 23.99) {
              return (
                <G key={index}>
                  <Circle
                    cx={CENTER}
                    cy={CENTER}
                    r={RADIUS - 5}
                    fill={item.color}
                    opacity={0.7}
                  />
                  <SvgText
                    x={CENTER}
                    y={CENTER - RADIUS / 2}
                    fill="#000000"
                    fontSize="11"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {item.label}
                  </SvgText>
                </G>
              );
            }

            return (
              <G key={index}>
                <Path
                  d={describeArc(CENTER, CENTER, RADIUS - 5, startAngle, endAngle)}
                  fill={item.color}
                  opacity={0.7}
                />
                {labelInfo.visible && labelInfo.lines.map((line, lIdx) => (
                  <SvgText
                    key={lIdx}
                    x={labelInfo.pos.x}
                    y={labelInfo.pos.y + (lIdx * 10) - (labelInfo.lines.length > 1 ? 2 : -4)}
                    fill="#000000"
                    fontSize="9"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {line}
                  </SvgText>
                ))}
              </G>
            );
          })}

          {/* Center progress circle */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={INNER_CIRCLE_RADIUS}
            fill={colors.surface}
            stroke={colors.border}
            strokeWidth="1"
          />
          
          <SvgText
            x={CENTER}
            y={CENTER + 6}
            fill={colors.primary}
            fontSize="18"
            fontWeight="bold"
            textAnchor="middle"
          >
            {`${progress}%`}
          </SvgText>
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZE / 2,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
});
