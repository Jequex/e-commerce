import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Required Fields', 'Please complete all required fields.');
      return;
    }

    if (!acceptedLegal) {
      Alert.alert(
        'Legal Acceptance Required',
        'You must accept the Terms & Conditions and Privacy Policy (v1.0) to create an account.'
      );
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName,
        lastName,
        email,
        password,
        acceptedLegal: true,
        termsVersion: '1.0',
        privacyVersion: '1.0',
      });
      Alert.alert('Success', 'Account created successfully! Your legal acceptance has been logged.');
      navigation.navigate('Home');
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Jequex for exclusive deals and order tracking</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="John"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Doe"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="john.doe@example.com"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Minimum 8 characters"
          />
        </View>

        {/* Legal Policy Acceptance Checkbox */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAcceptedLegal(!acceptedLegal)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, acceptedLegal && styles.checkboxActive]}>
            {acceptedLegal && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxText}>
            I have read and agree to the{' '}
            <Text style={styles.legalLink} onPress={() => navigation.navigate('Legal')}>
              Terms & Conditions
            </Text>{' '}
            (v1.0),{' '}
            <Text style={styles.legalLink} onPress={() => navigation.navigate('Legal')}>
              Privacy Policy
            </Text>
            , and Cancellation & Refund Policy.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Agree & Create Account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 24 },
  header: { marginBottom: 28, marginTop: 10 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  form: { gap: 16 },
  inputGroup: {},
  label: { fontSize: 12, fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', marginBottom: 6 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginVertical: 8 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  checkmark: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  checkboxText: { flex: 1, fontSize: 12, color: '#475569', lineHeight: 18 },
  legalLink: { color: '#4f46e5', fontWeight: 'bold' },
  button: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  linkButton: { alignItems: 'center', paddingVertical: 12 },
  linkText: { color: '#4f46e5', fontSize: 13, fontWeight: '500' },
});

