import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { Plus, Trash2, Clock as ClockIcon } from 'lucide-react-native';
import { RoutineService } from '../../src/services/RoutineService';
import { RoutineTemplate } from '../../src/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddRoutineModal from '../../src/components/AddRoutineModal';
import SwipeableRow from '../../src/components/common/SwipeableRow';
import OnboardingTooltip from '../../src/components/common/OnboardingTooltip';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function RoutineScreen() {
  const insets = useSafeAreaInsets();
  const [templates, setTemplates] = useState<(RoutineTemplate & { days: number[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<(RoutineTemplate & { days: number[] }) | null>(null);
  const [selectedFilterDay, setSelectedFilterDay] = useState<number>(-1); // -1 for All
  const [showTooltip, setShowTooltip] = useState(false);

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
      
      // Sort chronologically by start_time
      enrichedTemplates.sort((a, b) => a.start_time.localeCompare(b.start_time));
      
      setTemplates(enrichedTemplates);
      
      // Handle tooltip
      if (enrichedTemplates.length > 0) {
        const seen = await AsyncStorage.getItem('tooltip_seen_swipe');
        if (!seen) setShowTooltip(true);
      }
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

  const filteredTemplates = selectedFilterDay === -1 
    ? templates 
    : templates.filter(t => t.days.includes(selectedFilterDay));

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
    <>
      <SwipeableRow
        onDelete={() => handleDeleteTemplate(item.id, item.title)}
      >
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => {
            setEditingTemplate(item);
            setModalVisible(true);
          }}
          style={[styles.templateCard, { marginBottom: 0 }]}
        >
          <View style={[styles.colorBar, { backgroundColor: item.color }]} />
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.templateTitle}>{item.title}</Text>
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
      </SwipeableRow>
      <View style={{ height: SPACING.md }} />
    </>
  );

  return (
    <View style={styles.container}>
      <OnboardingTooltip 
        type="swipe" 
        visible={showTooltip} 
        onClose={() => setShowTooltip(false)} 
      />
      <View style={styles.filterBar}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity 
            style={[styles.filterBtn, selectedFilterDay === -1 && styles.filterBtnActive]}
            onPress={() => setSelectedFilterDay(-1)}
          >
            <Text style={[styles.filterBtnText, selectedFilterDay === -1 && styles.filterBtnTextActive]}>전체</Text>
          </TouchableOpacity>
          {DAY_LABELS.map((label, idx) => (
            <TouchableOpacity 
              key={idx}
              style={[styles.filterBtn, selectedFilterDay === idx && styles.filterBtnActive]}
              onPress={() => setSelectedFilterDay(idx)}
            >
              <Text style={[styles.filterBtnText, selectedFilterDay === idx && styles.filterBtnTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={filteredTemplates}
          keyExtractor={(item) => item.id}
          renderItem={renderTemplateItem}
          contentContainerStyle={[styles.listContent, { paddingTop: SPACING.md }]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {selectedFilterDay === -1 ? '등록된 루틴이 없습니다.' : `${DAY_LABELS[selectedFilterDay]}요일 루틴이 없습니다.`}
              </Text>
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
  },
  colorBar: {
    width: 6,
    borderTopLeftRadius: BORDER_RADIUS.md - 1,
    borderBottomLeftRadius: BORDER_RADIUS.md - 1,
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
  filterBar: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.xs, // Add padding for symmetry
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterScrollContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterBtnText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterBtnTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
});
