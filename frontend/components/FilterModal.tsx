import { useMemo } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  sources: string[];
  selectedSources: string[];
  onChangeSelectedSources: (sources: string[]) => void;
}

export function FilterModal({
  visible,
  onClose,
  sources,
  selectedSources,
  onChangeSelectedSources,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const hasActive = selectedSources.length > 0;

  const toggleSource = (src: string) => {
    if (selectedSources.includes(src)) {
      onChangeSelectedSources(selectedSources.filter((s) => s !== src));
    } else {
      onChangeSelectedSources([...selectedSources, src]);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => onChangeSelectedSources([])}
            disabled={!hasActive}
            hitSlop={10}
          >
            <Text style={[styles.headerClear, !hasActive && styles.headerClearDisabled]}>
              Clear
            </Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filters</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Text style={styles.headerDone}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Source</Text>

          {sources.map((src) => (
            <Row
              key={src}
              label={src}
              selected={selectedSources.includes(src)}
              onPress={() => toggleSource(src)}
              styles={styles}
              accent={colors.primary}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

interface RowProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  accent: string;
}

function Row({ label, selected, onPress, styles, accent }: RowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={[styles.checkbox, selected && { backgroundColor: accent, borderColor: accent }]}>
        {selected ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.card,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: c.textPrimary,
    },
    headerClear: {
      fontSize: 15,
      color: c.textSecondary,
    },
    headerClearDisabled: {
      opacity: 0.4,
    },
    headerDone: {
      fontSize: 15,
      fontWeight: '600',
      color: c.primary,
    },
    content: {
      paddingVertical: 8,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textSecondary,
      letterSpacing: 0.8,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.card,
    },
    rowLabel: {
      fontSize: 16,
      color: c.textPrimary,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
