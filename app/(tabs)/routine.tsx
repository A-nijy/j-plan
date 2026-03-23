import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { Plus, Trash2, Clock as ClockIcon } from 'lucide-react-native';
import { RoutineService } from '../../src/services/RoutineService';
import { RoutineTemplate } from '../../src/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddRoutineModal from '../../src/components/AddRoutineModal';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function RoutineScreen() {
  const insets = useSafeAreaInsets();
  const [templates, setTemplates] = useState<(RoutineTemplate & { days: number[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<(RoutineTemplate & { days: number[] }) | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const baseTemplates = await RoutineService.getTemplates();
      const enrichedTemplates = await Promise.all(
        baseTemplates.map(async (t) => {
          const configs = await RoutineService.getConfigs(t.id);
          return { ...t, days: configs.map(c => c.day_of_week) };
        })
      );
      setTemplates(enrichedTemplates);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTemplates();
    }, [fetchTemplates])
  );

  const handleDeleteTemplate = (id: string, title: string) => {
    Alert.alert(
      '루틴 삭제',
      `"${title}" 루틴을 삭제하시겠습니까? 관련 모든 요일 설정이 삭제됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: async () => {
            await RoutineService.deleteTemplate(id);
            fetchTemplates();
          }
        }
      ]
    );
  };

  const handleSaveRoutine = async (data: any) => {
    try {
      let templateId = data.id;
      if (templateId) {
        await RoutineService.updateTemplate(templateId, {
          title: data.title,
          description: data.description,
          start_time: data.start_time,
          end_time: data.end_time,
          color: data.color,
        });
      } else {
        templateId = await RoutineService.createTemplate({
          title: data.title,
          description: data.description,
          start_time: data.start_time,
          end_time: data.end_time,
          color: data.color,
        });
      }
      await RoutineService.updateConfigs(templateId, data.days);
      fetchTemplates();
    } catch (error) {
      Alert.alert('오류', '루틴 저장 중 오류가 발생했습니다.');
    }
  };

  const renderTemplateItem = ({ item }: { item: RoutineTemplate & { days: number[] } }) => (
    <TouchableOpacity 
      style={styles.templateCard} 
      onPress={() => {
        setEditingTemplate(item);
        setModalVisible(true);
      }}
    >
      <View style={[styles.colorBar, { backgroundColor: item.color }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.templateTitle}>{item.title}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={() => handleDeleteTemplate(item.id, item.title)}>
              <Trash2 size={18} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.cardDetails}>
          <View style={styles.detailItem}>
            <ClockIcon size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{item.start_time} - {item.end_time}</Text>
          </View>
        </View>

        <View style={styles.daysRow}>
          {DAY_LABELS.map((label, idx) => {
            const isActive = item.days.includes(idx);
            return (
              <View 
                key={idx} 
                style={[
                  styles.dayBadge, 
                  isActive && { backgroundColor: item.color + '30', borderColor: item.color }
                ]}
              >
                <Text style={[styles.dayBadgeText, isActive && { color: COLORS.text, fontWeight: 'bold' }]}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          renderItem={renderTemplateItem}
          contentContainerStyle={[styles.listContent, { paddingTop: SPACING.md }]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>등록된 루틴이 없습니다.</Text>
              <Text style={styles.emptySubText}>자주 반복되는 일정을 템플릿으로 만들어보세요.</Text>
            </View>
          }
        />
      )}
      
      <TouchableOpacity 
        style={[styles.fab, { bottom: insets.bottom + SPACING.lg }]}
        onPress={() => {
          setEditingTemplate(null);
          setModalVisible(true);
        }}
      >
        <Plus color="white" size={24} />
      </TouchableOpacity>

      <AddRoutineModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveRoutine}
        initialData={editingTemplate ? {
          id: editingTemplate.id,
          title: editingTemplate.title,
          description: editingTemplate.description || '',
          start_time: editingTemplate.start_time,
          end_time: editingTemplate.end_time,
          color: editingTemplate.color,
          days: editingTemplate.days
        } : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  templateCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  colorBar: {
    width: 6,
  },
  cardContent: {
    flex: 1,
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.xs,
  },
  dayBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: COLORS.background,
  },
  dayBadgeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
