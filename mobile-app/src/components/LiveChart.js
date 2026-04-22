import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

/**
 * Live-Verlaufsdiagramm für SOC-Werte
 */
export default function LiveChart({ 
  data = [], 
  title = 'Verlauf',
  color = '#4CAF50',
  maxDataPoints = 20 
}) {
  // Daten aufbereiten
  const chartData = {
    labels: data.map((_, index) => index % 5 === 0 ? `${index}s` : ''),
    datasets: [{
      data: data.length > 0 ? data : [0],
      color: (opacity = 1) => color,
      strokeWidth: 2,
    }],
  };

  const chartConfig = {
    backgroundColor: '#1a1a1a',
    backgroundGradientFrom: '#1a1a1a',
    backgroundGradientTo: '#2a2a2a',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '3',
      strokeWidth: '1',
      stroke: color,
    },
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {data.length > 0 ? (
        <LineChart
          data={chartData}
          width={screenWidth - 40}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>Keine Daten verfügbar</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chart: {
    borderRadius: 16,
  },
  noDataContainer: {
    height: 200,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    color: '#888',
    fontSize: 16,
  },
});
