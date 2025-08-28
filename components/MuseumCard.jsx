import React from 'react';
import { View, Text } from 'react-native';
import { formatMuseum } from '../lib/museums';
import { styles } from './MuseumCard.styles';

/**
 * Presentation component that displays museum information.
 * Uses React Native primitives so it can be ported to React Native without changes.
 */
export default function MuseumCard({ museum }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{formatMuseum(museum)}</Text>
    </View>
  );
}
