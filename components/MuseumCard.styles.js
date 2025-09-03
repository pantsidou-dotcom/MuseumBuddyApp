import { StyleSheet } from 'react-native';

/**
 * Styles for MuseumCard component.
 * Using React Native's StyleSheet for cross-platform compatibility.
 */
export const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Quicksand',
  },
});
