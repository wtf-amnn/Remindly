import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to run the seed script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  console.log('Seeding initial data if needed...');

  const { data: existingPersons } = await supabase.from('persons').select('person_id').limit(1);
  if (existingPersons && existingPersons.length > 0) {
    console.log('Database already contains records. Skipping seed.');
    return;
  }

  // Insert sample person
  const { data: person, error: personErr } = await supabase.from('persons').insert({
    full_name: 'Alex Morgan',
    gender: 'Female',
    profession: 'Software Architect',
    company: 'NovaTech',
    phone: '+14155552671',
    whatsapp_phone: '+14155552671',
    email: 'alex.morgan@example.com',
    relationship_to_me: 'close friend',
    communication_style: ['Casual & Friendly', 'Warm & Empathetic'],
    nicknames: ['Lex', 'Morgs'],
    hobbies: ['Rock Climbing', 'Sci-Fi Reading', 'Espresso Brewing'],
    likes: ['Single origin coffee', 'Clean code', 'Board games'],
    dislikes: ['Micro-management', 'Cold brew'],
    memories: [
      {
        id: 'mem-1',
        title: 'Tech Conference 2024',
        date: '2024-09-15',
        description: 'Collaborated on the keynote demo and celebrated in downtown Seattle.',
      },
    ],
    notes: ['Prefers texting over phone calls on weekdays.', 'Allergic to shellfish.'],
  }).select().single();

  if (personErr || !person) {
    console.error('Error inserting person:', personErr);
    return;
  }

  // Insert sample event
  const today = new Date();
  const eventDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3);
  const formattedDate = eventDate.toISOString().split('T')[0];

  const { data: event, error: eventErr } = await supabase.from('events').insert({
    person_id: person.person_id,
    event_name: 'Birthday',
    event_date: formattedDate,
    isRecurring: true,
  }).select().single();

  if (eventErr || !event) {
    console.error('Error inserting event:', eventErr);
    return;
  }

  // Insert sample generated wish
  const { error: wishErr } = await supabase.from('wishes').insert({
    person_id: person.person_id,
    event_id: event.event_id,
    short_wish: `Happy Birthday Alex! 🎂 Hope your year ahead is filled with great summits and perfect espresso pulls. Have an awesome day!`,
    long_wish: `Happy Birthday Alex! 🎉 Wishing you an incredible year ahead packed with thrilling rock climbs, inspiring tech breakthroughs, and countless memorable moments. Thank you for always being such a wonderful friend!`,
    mail_wish: {
      subject: `Wishing you a very Happy Birthday, Alex! 🎈`,
      body: `Hi Alex,\n\nI wanted to take a moment to wish you a very Happy Birthday! Hope you have a fantastic day celebrating with loved ones, enjoying great espresso, and taking well-deserved time to relax.\n\nCheers to another amazing year ahead!\n\nWarmly,`,
    },
    isSent: false,
  });

  if (wishErr) {
    console.error('Error inserting wish:', wishErr);
    return;
  }

  console.log('Seed completed successfully!');
}

seed().catch(console.error);
