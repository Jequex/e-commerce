import { db } from '../config/database';
import { permissions, roles, rolePermissions } from '../schema/store';

/**
 * Seed script for initial roles and permissions setup
 * Run this after database migrations
 */

const seedPermissions = [
  // Store permissions
  { name: 'View Stores', slug: 'stores.view', description: 'Can view store information', resource: 'stores', action: 'view' },
  { name: 'Create Stores', slug: 'stores.create', description: 'Can create new stores', resource: 'stores', action: 'create' },
  { name: 'Update Stores', slug: 'stores.update', description: 'Can update store information', resource: 'stores', action: 'update' },
  { name: 'Delete Stores', slug: 'stores.delete', description: 'Can delete stores', resource: 'stores', action: 'delete' },
  { name: 'Manage Store Staff', slug: 'stores.manage_staff', description: 'Can add/remove store staff', resource: 'stores', action: 'manage_staff' },
  
  // Product permissions
  { name: 'View Products', slug: 'products.view', description: 'Can view products', resource: 'products', action: 'view' },
  { name: 'Create Products', slug: 'products.create', description: 'Can create products', resource: 'products', action: 'create' },
  { name: 'Update Products', slug: 'products.update', description: 'Can update products', resource: 'products', action: 'update' },
  { name: 'Delete Products', slug: 'products.delete', description: 'Can delete products', resource: 'products', action: 'delete' },
  { name: 'Manage Inventory', slug: 'products.manage_inventory', description: 'Can manage product inventory', resource: 'products', action: 'manage_inventory' },
  
  // Order permissions
  { name: 'View Orders', slug: 'orders.view', description: 'Can view orders', resource: 'orders', action: 'view' },
  { name: 'Create Orders', slug: 'orders.create', description: 'Can create orders', resource: 'orders', action: 'create' },
  { name: 'Update Orders', slug: 'orders.update', description: 'Can update order status', resource: 'orders', action: 'update' },
  { name: 'Cancel Orders', slug: 'orders.cancel', description: 'Can cancel orders', resource: 'orders', action: 'cancel' },
  { name: 'Refund Orders', slug: 'orders.refund', description: 'Can process refunds', resource: 'orders', action: 'refund' },
  
  // Customer permissions
  { name: 'View Customers', slug: 'customers.view', description: 'Can view customer information', resource: 'customers', action: 'view' },
  { name: 'Manage Customers', slug: 'customers.manage', description: 'Can manage customer accounts', resource: 'customers', action: 'manage' },
  
  // Analytics permissions
  { name: 'View Analytics', slug: 'analytics.view', description: 'Can view store analytics', resource: 'analytics', action: 'view' },
  { name: 'Export Reports', slug: 'analytics.export', description: 'Can export analytics reports', resource: 'analytics', action: 'export' },
  
  // Settings permissions
  { name: 'Manage Settings', slug: 'settings.manage', description: 'Can manage store settings', resource: 'settings', action: 'manage' },
  { name: 'Manage Roles', slug: 'roles.manage', description: 'Can manage roles and permissions', resource: 'roles', action: 'manage' },
];

const seedRoles = [
  { 
    name: 'Store Owner', 
    slug: 'store_owner', 
    description: 'Full access to store management', 
    isSystemRole: true 
  },
  { 
    name: 'Store Manager', 
    slug: 'store_manager', 
    description: 'Can manage store operations', 
    isSystemRole: true 
  },
  { 
    name: 'Sales Associate', 
    slug: 'sales_associate', 
    description: 'Can handle sales and customer interactions', 
    isSystemRole: true 
  },
  { 
    name: 'Inventory Manager', 
    slug: 'inventory_manager', 
    description: 'Can manage product inventory', 
    isSystemRole: true 
  },
  { 
    name: 'Customer Support', 
    slug: 'customer_support', 
    description: 'Can assist customers and view orders', 
    isSystemRole: true 
  },
];

const rolePermissionMapping: Record<string, string[]> = {
  'store_owner': [
    'stores.view', 'stores.create', 'stores.update', 'stores.delete', 'stores.manage_staff',
    'products.view', 'products.create', 'products.update', 'products.delete', 'products.manage_inventory',
    'orders.view', 'orders.create', 'orders.update', 'orders.cancel', 'orders.refund',
    'customers.view', 'customers.manage',
    'analytics.view', 'analytics.export',
    'settings.manage', 'roles.manage'
  ],
  'store_manager': [
    'stores.view', 'stores.update', 'stores.manage_staff',
    'products.view', 'products.create', 'products.update', 'products.manage_inventory',
    'orders.view', 'orders.update', 'orders.cancel',
    'customers.view', 'customers.manage',
    'analytics.view', 'analytics.export'
  ],
  'sales_associate': [
    'stores.view',
    'products.view',
    'orders.view', 'orders.create', 'orders.update',
    'customers.view'
  ],
  'inventory_manager': [
    'stores.view',
    'products.view', 'products.create', 'products.update', 'products.manage_inventory',
    'analytics.view'
  ],
  'customer_support': [
    'stores.view',
    'products.view',
    'orders.view', 'orders.update',
    'customers.view', 'customers.manage'
  ]
};

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // 1. Insert permissions
    console.log('📝 Inserting permissions...');
    const insertedPermissions = await db.insert(permissions)
      .values(seedPermissions)
      .onConflictDoNothing()
      .returning();
    console.log(`✅ Inserted ${insertedPermissions.length} permissions`);

    // 2. Insert roles
    console.log('👥 Inserting roles...');
    const insertedRoles = await db.insert(roles)
      .values(seedRoles)
      .onConflictDoNothing()
      .returning();
    console.log(`✅ Inserted ${insertedRoles.length} roles`);

    // 3. Create permission lookup map
    const allPermissions = await db.select().from(permissions);
    const permissionMap = new Map(allPermissions.map(p => [p.slug, p.id]));

    // 4. Create role lookup map
    const allRoles = await db.select().from(roles);
    const roleMap = new Map(allRoles.map(r => [r.slug, r.id]));

    // 5. Assign permissions to roles
    console.log('🔗 Assigning permissions to roles...');
    let assignmentCount = 0;
    
    for (const [roleSlug, permissionSlugs] of Object.entries(rolePermissionMapping)) {
      const roleId = roleMap.get(roleSlug);
      if (!roleId) {
        console.warn(`⚠️  Role not found: ${roleSlug}`);
        continue;
      }

      for (const permissionSlug of permissionSlugs) {
        const permissionId = permissionMap.get(permissionSlug);
        if (!permissionId) {
          console.warn(`⚠️  Permission not found: ${permissionSlug}`);
          continue;
        }

        await db.insert(rolePermissions)
          .values({ roleId, permissionId })
          .onConflictDoNothing();
        assignmentCount++;
      }
    }
    console.log(`✅ Created ${assignmentCount} role-permission assignments`);

    console.log('✨ Database seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
