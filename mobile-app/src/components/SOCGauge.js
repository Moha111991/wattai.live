import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

/**
 * SOC-Anzeige als kreisförmiges Gauge
 */
export default function SOCGauge({ 
  soc = 0, 
  title = 'SOC', 
  size = 150,
  color = '#4CAF50',
  showPercentage = true 
}) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(soc, 0), 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Farbe basierend auf SOC
  const getColor = () => {
    if (progress >= 80) return '#4CAF50'; // Grün
    if (progress >= 50) return '#FFC107'; // Gelb
    if (progress >= 20) return '#FF9800'; // Orange
    return '#F44336'; // Rot
  };

  const gaugeColor = color || getColor();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.gaugeContainer}>
        <Svg width={size} height={size}>
          {/* Hintergrund-Kreis */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#2a2a2a"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Fortschritts-Kreis */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={gaugeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.textContainer}>
          <Text style={styles.percentage}>{Math.round(progress)}</Text>
          {showPercentage && <Text style={styles.percentSign}>%</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    margin: 10,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  gaugeContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  percentage: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  percentSign: {
    color: '#888',
    fontSize: 20,
    marginLeft: 2,
  },
});
