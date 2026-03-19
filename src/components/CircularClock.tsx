import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../constants/theme';

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
}

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  const d = [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'L', x, y,
    'Z',
  ].join(' ');
  return d;
};

export const CircularClock: React.FC<CircularClockProps> = ({ data = [] }) => {
  const hourToAngle = (hour: number) => (hour / 24) * 360;

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        <G>
          {/* Background Circle */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill={COLORS.surface}
            stroke={COLORS.border}
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
                  stroke={COLORS.border}
                  strokeWidth={i % 6 === 0 ? "2" : "1"}
                />
                {i % 3 === 0 && (
                  <SvgText
                    x={textPos.x}
                    y={textPos.y + 5}
                    fill={COLORS.textSecondary}
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
            return (
              <Path
                key={index}
                d={describeArc(CENTER, CENTER, RADIUS - 5, startAngle, endAngle)}
                fill={item.color}
                opacity={0.7}
              />
            );
          })}

          {/* Center decorative circle */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={10}
            fill={COLORS.surface}
            stroke={COLORS.border}
            strokeWidth="2"
          />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZE / 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
});
