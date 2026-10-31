import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { STORES_API_URL } from '../config/api';

export default function ContactScreen() {
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${STORES_API_URL}/settings/contact`)
      .then((r) => r.json())
      .then((data) => setContact(data))
      .catch((e) => console.error('Failed to load contact info', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const handlePhone = () => {
    if (contact?.phone) Linking.openURL(`tel:${contact.phone}`);
  };

  const handleEmail = () => {
    if (contact?.email) Linking.openURL(`mailto:${contact.email}`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Get In Touch</Text>
        <Text style={styles.heroSubtitle}>We are here to assist with orders, tracking, and inquiries.</Text>
      </View>

      <View style={styles.content}>
        {/* Direct Contact Cards */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Direct Support</Text>

          <TouchableOpacity style={styles.contactRow} onPress={handlePhone}>
            <View style={styles.iconCircle}><Text style={styles.icon}>📞</Text></View>
            <View style={styles.contactText}>
              <Text style={styles.label}>Phone Support</Text>
              <Text style={styles.value}>{contact?.phone || '+1 (800) 555-0199'}</Text>
            </View>
            <Text style={styles.action}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
            <View style={styles.iconCircle}><Text style={styles.icon}>✉️</Text></View>
            <View style={styles.contactText}>
              <Text style={styles.label}>Email Helpdesk</Text>
              <Text style={styles.value}>{contact?.email || 'support@jequex.com'}</Text>
            </View>
            <Text style={styles.action}>Email</Text>
          </TouchableOpacity>
        </View>

        {/* Physical Office Address */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Headquarters & Returns</Text>
          <View style={styles.contactRow}>
            <View style={styles.iconCircle}><Text style={styles.icon}>📍</Text></View>
            <View style={styles.contactText}>
              <Text style={styles.label}>Corporate Address</Text>
              <Text style={styles.value}>{contact?.address || '123 Commerce Boulevard, Suite 500'}</Text>
              <Text style={styles.subValue}>
                {contact?.city || 'San Francisco'}, {contact?.state || 'CA'} {contact?.postal_code || contact?.postalCode || '94105'}, {contact?.country || 'United States'}
              </Text>
            </View>
          </View>
        </View>

        {/* Operating Hours */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Operating Hours</Text>
          <View style={styles.hoursRow}>
            <Text style={styles.hoursLabel}>Business Hours:</Text>
            <Text style={styles.hoursValue}>{contact?.business_hours || contact?.businessHours || 'Mon - Fri: 9:00 AM - 6:00 PM EST'}</Text>
          </View>
          <View style={styles.hoursRow}>
            <Text style={styles.hoursLabel}>Customer Care:</Text>
            <Text style={styles.hoursValue}>{contact?.support_hours || contact?.supportHours || '24/7 Priority Support'}</Text>
          </View>
        </View>

        {/* Social Channels */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Follow & Connect</Text>
          <View style={styles.socialRow}>
            {contact?.social_facebook && (
              <TouchableOpacity onPress={() => Linking.openURL(contact.social_facebook)} style={styles.socialChip}>
                <Text style={styles.socialText}>Facebook</Text>
              </TouchableOpacity>
            )}
            {contact?.social_twitter && (
              <TouchableOpacity onPress={() => Linking.openURL(contact.social_twitter)} style={styles.socialChip}>
                <Text style={styles.socialText}>Twitter / X</Text>
              </TouchableOpacity>
            )}
            {contact?.social_instagram && (
              <TouchableOpacity onPress={() => Linking.openURL(contact.social_instagram)} style={styles.socialChip}>
                <Text style={styles.socialText}>Instagram</Text>
              </TouchableOpacity>
            )}
            {contact?.social_linkedin && (
              <TouchableOpacity onPress={() => Linking.openURL(contact.social_linkedin)} style={styles.socialChip}>
                <Text style={styles.socialText}>LinkedIn</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  hero: { backgroundColor: '#0f172a', padding: 24, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  heroSubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  content: { padding: 16 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', color: '#475569', letterSpacing: 0.5, marginBottom: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  iconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  icon: { fontSize: 18 },
  contactText: { flex: 1 },
  label: { fontSize: 11, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' },
  value: { fontSize: 14, color: '#0f172a', fontWeight: '600', marginTop: 1 },
  subValue: { fontSize: 12, color: '#64748b', marginTop: 2 },
  action: { fontSize: 13, color: '#4f46e5', fontWeight: 'bold' },
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  hoursLabel: { fontSize: 13, color: '#64748b' },
  hoursValue: { fontSize: 13, color: '#0f172a', fontWeight: '600' },
  socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  socialChip: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  socialText: { fontSize: 12, color: '#4f46e5', fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

