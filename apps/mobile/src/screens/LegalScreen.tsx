import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { STORES_API_URL } from '../config/api';

const POLICIES = [
  { key: 'privacy_policy', title: 'Privacy Policy' },
  { key: 'terms_conditions', title: 'Terms & Conditions' },
  { key: 'cancellation_refund', title: 'Cancellation & Refund' },
];

export default function LegalScreen() {
  const [selectedPolicy, setSelectedPolicy] = useState('privacy_policy');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${STORES_API_URL}/legal/${selectedPolicy}`)
      .then((r) => r.json())
      .then((res) => setData(res))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [selectedPolicy]);

  const version = data?.activeVersion?.version || data?.document?.current_version || '1.0';
  const effectiveDate = data?.activeVersion?.created_at
    ? new Date(data.activeVersion.created_at).toLocaleDateString()
    : 'January 1, 2026';
  const content = data?.activeVersion?.content || 'Loading policy terms...';

  return (
    <View style={styles.container}>
      {/* Policy Selector Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {POLICIES.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.tab, selectedPolicy === p.key && styles.activeTab]}
              onPress={() => setSelectedPolicy(p.key)}
            >
              <Text style={[styles.tabText, selectedPolicy === p.key && styles.activeTabText]}>{p.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <ScrollView style={styles.scroll}>
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.policyTitle}>
                {POLICIES.find((p) => p.key === selectedPolicy)?.title}
              </Text>
              <View style={styles.versionBadge}>
                <Text style={styles.versionText}>v{version}</Text>
              </View>
            </View>

            <Text style={styles.dateStamp}>Effective Date: {effectiveDate}</Text>

            <View style={styles.contentBox}>
              <Text style={styles.bodyText}>{content}</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  tabContainer: { backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tabsScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9' },
  activeTab: { backgroundColor: '#4f46e5' },
  tabText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  activeTabText: { color: '#ffffff', fontWeight: 'bold' },
  scroll: { padding: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  policyTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', flex: 1 },
  versionBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  versionText: { color: '#15803d', fontWeight: 'bold', fontSize: 12 },
  dateStamp: { fontSize: 12, color: '#64748b', marginTop: 6, marginBottom: 16 },
  contentBox: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  bodyText: { fontSize: 13, color: '#334155', lineHeight: 22 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

