import pkg from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const { PrismaClient } = pkg

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log(' Seeding database...')

  // ── 1. Menu categories ───────────────────────────────────────
  console.log('Creating menu categories...')
  const starters  = await prisma.menuCategory.upsert({
    where:  { id: 'cat-starters' },
    update: {},
    create: { id: 'cat-starters', name: 'Starters',  sort_order: 1 },
  })
  const mains = await prisma.menuCategory.upsert({
    where:  { id: 'cat-mains' },
    update: {},
    create: { id: 'cat-mains',    name: 'Mains',     sort_order: 2 },
  })
  const desserts = await prisma.menuCategory.upsert({
    where:  { id: 'cat-desserts' },
    update: {},
    create: { id: 'cat-desserts', name: 'Desserts',  sort_order: 3 },
  })
  const drinks = await prisma.menuCategory.upsert({
    where:  { id: 'cat-drinks' },
    update: {},
    create: { id: 'cat-drinks',   name: 'Drinks',    sort_order: 4 },
  })

  // ── 2. Menu items ─────────────────────────────────────────────
  console.log('Creating menu items...')
  const menuItems = [
    // Starters
    {
      id: 'item-calamari',
      category_id:  starters.id,
      name:         'Grilled Calamari',
      description:  'Tender calamari grilled with lemon herb dressing',
      price:        850,
      dietary_tags: ['gluten_free'],
    },
    {
      id: 'item-bruschetta',
      category_id:  starters.id,
      name:         'Bruschetta',
      description:  'Toasted bread with fresh tomato, basil and olive oil',
      price:        650,
      dietary_tags: ['vegetarian'],
    },
    {
      id: 'item-soup',
      category_id:  starters.id,
      name:         'Soup of the Day',
      description:  'Ask your waiter for today\'s selection',
      price:        550,
      dietary_tags: ['vegetarian'],
    },
    // Mains
    {
      id: 'item-tilapia',
      category_id:  mains.id,
      name:         'Grilled Tilapia',
      description:  'Fresh tilapia fillet with coconut rice and seasonal vegetables',
      price:        1800,
      dietary_tags: ['gluten_free'],
    },
    {
      id: 'item-beef',
      category_id:  mains.id,
      name:         'Beef Tenderloin',
      description:  'Pan-seared beef tenderloin with mushroom sauce and fries',
      price:        2400,
      dietary_tags: [],
    },
    {
      id: 'item-pasta',
      category_id:  mains.id,
      name:         'Pasta Arrabbiata',
      description:  'Penne pasta in spicy tomato sauce with olives and parmesan',
      price:        1200,
      dietary_tags: ['vegetarian', 'spicy'],
    },
    {
      id: 'item-tikka',
      category_id:  mains.id,
      name:         'Chicken Tikka',
      description:  'Marinated chicken tikka served with naan and mint chutney',
      price:        1600,
      dietary_tags: ['spicy'],
    },
    // Desserts
    {
      id: 'item-lavacake',
      category_id:  desserts.id,
      name:         'Chocolate Lava Cake',
      description:  'Warm chocolate cake with a molten centre, served with vanilla ice cream',
      price:        750,
      dietary_tags: ['vegetarian'],
    },
    {
      id: 'item-sorbet',
      category_id:  desserts.id,
      name:         'Mango Sorbet',
      description:  'Fresh seasonal mango sorbet — light and refreshing',
      price:        550,
      dietary_tags: ['vegetarian', 'gluten_free'],
    },
    // Drinks
    {
      id: 'item-passion',
      category_id:  drinks.id,
      name:         'Fresh Passion Juice',
      description:  'Cold-pressed fresh passion fruit juice',
      price:        350,
      dietary_tags: ['vegetarian', 'gluten_free'],
    },
    {
      id: 'item-dawa',
      category_id:  drinks.id,
      name:         'Dawa Cocktail',
      description:  'Classic Kenyan cocktail — vodka, lime, honey and ice',
      price:        750,
      dietary_tags: [],
    },
  ]

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where:  { id: item.id },
      update: {},
      create: item,
    })
  }

  // ── 3. Restaurant tables ──────────────────────────────────────
  console.log('Creating restaurant tables...')
  for (let i = 1; i <= 12; i++) {
    await prisma.restaurantTable.upsert({
      where:  { table_number: i },
      update: {},
      create: {
        table_number: i,
        qr_code_url:  `https://royalshaza.co.ke/menu?table=${i}`,
        status:       'free',
        capacity:     4,
      },
    })
  }

  // ── 4. Default manager account ────────────────────────────────
  console.log('Creating default manager account...')
  const password_hash = await bcrypt.hash('Manager2026!', 12)
  await prisma.user.upsert({
    where:  { email: 'admin@royalshaza.ke' },
    update: {},
    create: {
      name:          'Hotel Manager',
      email:         'admin@royalshaza.ke',
      password_hash,
      role:          'manager',
    },
  })

  console.log(' Seeding complete!')
  console.log('   4 menu categories')
  console.log('   11 menu items')
  console.log('   12 restaurant tables')
  console.log('   1 default manager account')
  console.log('')
  console.log(' Default manager login:')
  console.log('   Email:    admin@royalshaza.ke')
  console.log('   Password: Manager2026!')
}

main()
  .catch((e) => {
    console.error(' Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })