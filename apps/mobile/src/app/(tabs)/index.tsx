import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { Categories } from '@/components/home/Categories';
import { DealsSection } from '@/components/home/DealsSection';
import { RecentlyViewed } from '@/components/home/RecentlyViewed';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <HeroSection />
      <Categories />
      <FeaturedProducts />
      <DealsSection />
      <RecentlyViewed />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});